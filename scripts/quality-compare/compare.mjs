#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const DEFAULTS = JSON.parse(fs.readFileSync(path.join(HERE, 'defaults.json'), 'utf8'))

const HELP = `Generate an image quality comparison page.

Usage:
  npm run quality-compare [-- options]

Options:
  --image <spec>       Image to compare; repeat for several. A path under public/
                       (e.g. /media/foo.jpg) or any file path, optionally followed
                       by crop centres as fractions: "/media/foo.jpg@0.3,0.2;0.7,0.8".
                       Without crops, a busiest and a smoothest area are picked.
                       Default: the five images in defaults.json.
  --config <file>      JSON file with { images: [{ src, label, crops: [{ name, x, y }] }] }
                       and optionally formats / qualities / widths / master.
  --formats <list>     Delivered formats (avif, webp, jpeg). Default: ${DEFAULTS.formats.join(',')}
  --qualities <list>   Delivered qualities 1-100. Default: ${DEFAULTS.qualities.join(',')}
  --widths <list>      Delivered widths in px. Default: ${DEFAULTS.widths.join(',')}
  --master-max <px>    Longest edge of the stored master. Default: ${DEFAULTS.master.maxEdge}
  --master-quality <q> JPEG quality of the stored master. Default: ${DEFAULTS.master.jpegQuality}
  --out <dir>          Output folder. Default: .quality-compare
  --no-open            Don't open the page when done.
  --help               Show this help.
`

const { values: opts } = parseArgs({
  allowNegative: true,
  options: {
    image: { type: 'string', multiple: true },
    config: { type: 'string' },
    formats: { type: 'string' },
    qualities: { type: 'string' },
    widths: { type: 'string' },
    'master-max': { type: 'string' },
    'master-quality': { type: 'string' },
    out: { type: 'string', default: '.quality-compare' },
    open: { type: 'boolean', default: true },
    help: { type: 'boolean', default: false },
  },
})
if (opts.help) {
  process.stdout.write(HELP)
  process.exit(0)
}

let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  console.error('sharp is not installed for this script. Run once:\n  npm --prefix scripts/quality-compare ci')
  process.exit(1)
}
sharp.cache(false)

const fail = (msg) => {
  console.error(`quality-compare: ${msg}`)
  process.exit(1)
}
const list = (value, fallback, parse = (x) => x) => (value ? value.split(',').map((s) => parse(s.trim())).filter((x) => x !== '' && !Number.isNaN(x)) : fallback)
const config = opts.config ? JSON.parse(fs.readFileSync(path.resolve(opts.config), 'utf8')) : {}

const formats = list(opts.formats, config.formats || DEFAULTS.formats)
const qualities = list(opts.qualities, config.qualities || DEFAULTS.qualities, Number)
const widths = list(opts.widths, config.widths || DEFAULTS.widths, Number).sort((a, b) => a - b)
const master = {
  ...DEFAULTS.master,
  ...config.master,
  ...(opts['master-max'] ? { maxEdge: Number(opts['master-max']) } : {}),
  ...(opts['master-quality'] ? { jpegQuality: Number(opts['master-quality']) } : {}),
}
for (const f of formats) if (!['avif', 'webp', 'jpeg'].includes(f)) fail(`unknown format "${f}"`)
for (const q of qualities) if (!(q >= 1 && q <= 100)) fail(`quality must be 1-100, got ${q}`)
if (!widths.length || widths.some((w) => !(w > 0))) fail('widths must be positive numbers')

function parseSpec(spec) {
  const [src, cropPart] = spec.split('@')
  const crops = cropPart
    ? cropPart.split(';').map((pair, i) => {
        const [x, y] = pair.split(',').map(Number)
        if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) fail(`crop "${pair}" in "${spec}" must be two fractions between 0 and 1`)
        return { name: `Crop ${i + 1}`, x, y }
      })
    : null
  return { src, label: path.basename(src), crops }
}

function resolveSource(src) {
  const inPublic = path.join(ROOT, 'public', src.replace(/^\/+/, ''))
  if (fs.existsSync(inPublic)) return inPublic
  const direct = path.resolve(src)
  if (fs.existsSync(direct)) return direct
  fail(`image not found: ${src} (looked in public/ and relative to the current folder)`)
}

async function autoCrops(file) {
  const N = 8
  const S = 256
  const { data } = await sharp(file).rotate().greyscale().resize(S, S, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
  const tile = S / N
  const tiles = []
  for (let ty = 0; ty < N; ty++) {
    for (let tx = 0; tx < N; tx++) {
      let sum = 0
      let sq = 0
      for (let y = ty * tile; y < (ty + 1) * tile; y++) {
        for (let x = tx * tile; x < (tx + 1) * tile; x++) {
          const v = data[y * S + x]
          sum += v
          sq += v * v
        }
      }
      const n = tile * tile
      const mean = sum / n
      tiles.push({ x: (tx + 0.5) / N, y: (ty + 0.5) / N, mean, sd: Math.sqrt(Math.max(0, sq / n - mean * mean)) })
    }
  }
  const busiest = tiles.reduce((a, b) => (b.sd > a.sd ? b : a))
  const smooth = tiles.filter((t) => t.mean > 20 && t.mean < 235)
  const smoothest = (smooth.length ? smooth : tiles).reduce((a, b) => (b.sd < a.sd ? b : a))
  return [
    { name: 'Detail (auto: busiest area)', x: busiest.x, y: busiest.y },
    { name: 'Tones (auto: smoothest area)', x: smoothest.x, y: smoothest.y },
  ]
}

async function makeMaster(file, meta) {
  const long = Math.max(meta.width, meta.height)
  const resize = long > master.maxEdge
  let img = sharp(file).rotate()
  if (resize) img = img.resize({ width: master.maxEdge, height: master.maxEdge, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
  img = img.keepIccProfile()
  let out
  let settings
  if (meta.format === 'jpeg') {
    out = await img.jpeg({ quality: master.jpegQuality, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toBuffer()
    settings = `JPEG q${master.jpegQuality} 4:4:4 mozjpeg progressive, ≤${master.maxEdge}px`
  } else if (meta.format === 'png') {
    out = await img.png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10, palette: false }).toBuffer()
    settings = `PNG lossless${resize ? `, resized ≤${master.maxEdge}px` : ''}`
  } else if (meta.format === 'webp' && resize) {
    out = await img.webp({ quality: master.jpegQuality, effort: 6 }).toBuffer()
    settings = `WebP q${master.jpegQuality}, resized ≤${master.maxEdge}px`
  } else {
    return { same: true, settings: 'unchanged (format is only re-encoded when resizing)' }
  }
  const origBytes = fs.statSync(file).size
  if (!resize && out.length >= origBytes * (1 - master.keepIfSavingBelow)) {
    return { same: true, settings: `unchanged — re-encoding (${Math.round(out.length / 1024)} KB) was not ≥${Math.round(master.keepIfSavingBelow * 100)}% smaller, so the original is kept` }
  }
  return { same: false, buf: out, settings }
}

function encode(input, fmt, q, width) {
  const base = sharp(input).resize({ width, withoutEnlargement: true, kernel: 'lanczos3' }).keepIccProfile()
  if (fmt === 'avif') return base.avif({ quality: q, effort: 4, chromaSubsampling: '4:4:4' }).toBuffer()
  if (fmt === 'webp') return base.webp({ quality: q, effort: 4 }).toBuffer()
  return base.jpeg({ quality: q, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toBuffer()
}

const specs = opts.image?.length ? opts.image.map(parseSpec) : config.images || DEFAULTS.images
const OUT = path.resolve(ROOT, opts.out)
if (OUT === ROOT || OUT.startsWith(path.join(ROOT, 'public')) || OUT.startsWith(path.join(ROOT, 'src'))) fail(`refusing to write into ${path.relative(ROOT, OUT) || '.'}; choose a separate output folder`)
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const kb = (n) => `${Math.round(n / 1024)} KB`
const usedSlugs = new Set()
const slugFor = (src) => {
  const base = path.basename(src).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image'
  let slug = base
  for (let i = 2; usedSlugs.has(slug); i++) slug = `${base}-${i}`
  usedSlugs.add(slug)
  return slug
}

const images = []
let total = 0
for (const spec of specs) {
  const file = resolveSource(spec.src)
  const meta = await sharp(file).metadata()
  const slug = slugFor(spec.src)
  const dir = path.join(OUT, slug)
  fs.mkdirSync(dir, { recursive: true })
  const ext = path.extname(file).toLowerCase()
  const origName = `${slug}/original${ext}`
  fs.copyFileSync(file, path.join(OUT, origName))
  const origBytes = fs.statSync(file).size
  total += origBytes

  const m = await makeMaster(file, meta)
  const masterInput = m.same ? file : m.buf
  let masterName = origName
  if (!m.same) {
    masterName = `${slug}/master.${meta.format === 'jpeg' ? 'jpg' : meta.format}`
    fs.writeFileSync(path.join(OUT, masterName), m.buf)
    total += m.buf.length
  }
  const mMeta = await sharp(masterInput).metadata()

  const variants = []
  for (const fmt of formats) {
    for (const w of widths) {
      const width = Math.min(w, mMeta.width)
      for (const q of qualities) {
        const buf = await encode(masterInput, fmt, q, width)
        const vm = await sharp(buf).metadata()
        const name = `${slug}/${fmt}-${w}-q${q}.${fmt === 'jpeg' ? 'jpg' : fmt}`
        fs.writeFileSync(path.join(OUT, name), buf)
        total += buf.length
        variants.push({ fmt, w, q, file: name, bytes: buf.length, width: vm.width, height: vm.height, capped: width < w, sha256: createHash('sha256').update(buf).digest('hex') })
      }
    }
  }

  images.push({
    src: spec.src,
    label: spec.label || path.basename(spec.src),
    crops: spec.crops?.length ? spec.crops : await autoCrops(file),
    original: { file: origName, bytes: origBytes, width: meta.width, height: meta.height, format: meta.format },
    master: { file: masterName, bytes: m.same ? origBytes : m.buf.length, width: mMeta.width, height: mMeta.height, settings: m.settings, same: m.same, sha256: m.same ? null : createHash('sha256').update(m.buf).digest('hex') },
    variants,
  })
  console.log(`${slug.padEnd(28)} original ${kb(origBytes).padStart(8)} · master ${kb(m.same ? origBytes : m.buf.length).padStart(8)}${m.same ? ' (kept)' : ''} · ${variants.length} variants`)
}

const version = JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules/sharp/package.json'), 'utf8')).version
const page = {
  generatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  formats,
  widths,
  qualities,
  settingsNote: `Master: JPEG q${master.jpegQuality} 4:4:4, longest edge ≤${master.maxEdge}px; PNG lossless; WebP only re-encoded when resizing; the original is kept unless resized or ≥${Math.round(master.keepIfSavingBelow * 100)}% smaller. Delivered: ${formats.map((f) => f.toUpperCase()).join(', ')} at q${qualities.join('/')}, ${widths.map((w) => `${w}w`).join(' / ')}. Encoded with sharp ${version} (AVIF effort 4, 4:4:4; WebP effort 4, 4:2:0; JPEG mozjpeg 4:4:4).`,
  images,
}
const template = fs.readFileSync(path.join(HERE, 'template.html'), 'utf8')
const json = JSON.stringify(page).replace(/</g, '\\u003c')
fs.writeFileSync(path.join(OUT, 'index.html'), template.replace('/*__PAGE__*/null', () => json))
fs.writeFileSync(path.join(OUT, 'page.json'), JSON.stringify(page, null, 1))

const index = path.join(OUT, 'index.html')
console.log(`\nWrote ${path.relative(ROOT, index)} (${(total / 1048576).toFixed(1)} MB of images)`)
if (opts.open) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', index] : [index]
  spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => console.log(`Open ${index} in a browser.`)).unref()
}
