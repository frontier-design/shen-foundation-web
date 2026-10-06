#!/usr/bin/env node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const MEDIA = path.join(ROOT, 'public/media')
const MANIFEST = path.join(HERE, 'manifest.json')
const EXCLUDE = path.join(HERE, 'exclude.json')

const SETTINGS = {
  maxEdge: 3200,
  jpegQuality: 90,
  webpQuality: 90,
  minSaving: 0.1,
  videoWarnMB: 20,
  videoStrongWarnMB: 50,
}

const KEEP_TAGS = [
  'EXIF:Copyright',
  'EXIF:Artist',
  'IPTC:CopyrightNotice',
  'IPTC:Credit',
  'IPTC:By-line',
  'XMP-dc:Rights',
  'XMP-dc:Creator',
  'XMP-photoshop:Credit',
]

const OXIPNG = {
  version: '10.2.1',
  assets: {
    'darwin-arm64': { name: 'aarch64-apple-darwin', sha256: '7039fcfc78e8aa1ed2b57d848057a0296f082e92b3e1807ac65402d10d926764' },
    'darwin-x64': { name: 'x86_64-apple-darwin', sha256: '111883bbe42b25e01cb1ca41f39f8094e4830b173f0e42be342ecc4ca48f3131' },
    'linux-x64': { name: 'x86_64-unknown-linux-gnu', sha256: '46e3c4beb9aae57290ad809dd3374b07153579d3322a3778c53900633618b7c6' },
    'linux-arm64': { name: 'aarch64-unknown-linux-gnu', sha256: 'f51bb7c9836202da52a8181549641940662aa87ec2e3ae68115d822d893015b3' },
  },
}

const { values: opts } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    check: { type: 'boolean', default: false },
    json: { type: 'string' },
    help: { type: 'boolean', default: false },
  },
})
if (opts.help) {
  process.stdout.write(`Optimize images in public/media.

Usage: npm run optimize-images [-- --dry-run] [-- --json report.json]
       npm run optimize-images -- --check   (list images/videos not processed yet; exit 3 if any)

Resizes images over ${SETTINGS.maxEdge}px, re-encodes JPEG at q${SETTINGS.jpegQuality} (4:4:4),
WebP only when resizing, PNG losslessly with oxipng, and removes metadata except colour
profiles and ${KEEP_TAGS.join(', ')}. A file is only re-encoded when it was resized or
gets at least ${SETTINGS.minSaving * 100}% smaller; otherwise only its metadata is cleaned
(pixel-exact). Files listed in exclude.json are never touched. Processed files are recorded
in manifest.json and never processed again.

Videos (MP4, WebM) are never re-encoded or modified: only their width, height and duration
are recorded, and videos over ${SETTINGS.videoWarnMB} MB get a size warning.
`)
  process.exit(0)
}

const PROCESSABLE = /\.(jpe?g|png|webp)$/i
const VIDEO = /\.(mp4|webm)$/i
const OTHER_VIDEO = /\.(mov|m4v|avi|wmv|flv|mpe?g|ogv|mkv|ts|3gp|3g2)$/i

function readJson(file, fallback) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback
}

function globToRegex(pattern) {
  const p = pattern.startsWith('/') ? pattern : `/${pattern}`
  const re = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*').replace(/\?/g, '[^/]')
  return new RegExp(`^${re}$`)
}

const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : [])
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')
const rel = (file) => '/' + path.relative(path.join(ROOT, 'public'), file).split(path.sep).join('/')

if (opts.check) {
  const manifest = readJson(MANIFEST, { files: {} })
  const excludes = (readJson(EXCLUDE, { exclude: [] }).exclude || []).map(globToRegex)
  const done = new Set(Object.values(manifest.files).map((e) => e.sha256))
  const pending = []
  const failed = []
  for (const file of walk(MEDIA).filter((f) => PROCESSABLE.test(f) || VIDEO.test(f)).sort()) {
    const p = rel(file)
    if (excludes.some((re) => re.test(p))) continue
    const sha = sha256(fs.readFileSync(file))
    if (done.has(sha)) continue
    if (manifest.failed?.[p]?.sha256 === sha) failed.push(`${p} (${manifest.failed[p].note})`)
    else pending.push(p)
  }
  if (failed.length) console.log(`Could not be optimized (published as they are):\n  ${failed.join('\n  ')}`)
  if (pending.length) {
    console.log(`Not optimized yet:\n  ${pending.join('\n  ')}`)
    process.exit(3)
  }
  console.log('All images and videos are processed.')
  process.exit(0)
}

const require = createRequire(import.meta.url)
let sharp
try {
  sharp = require('sharp')
} catch {
  console.error('Dependencies missing. Run once:\n  npm --prefix scripts/optimize-images ci')
  process.exit(1)
}
sharp.cache(false)
const EXIFTOOL = path.join(path.dirname(require.resolve('exiftool-vendored.pl/package.json')), 'bin', 'exiftool')

const kb = (n) => `${Math.round(n / 1024)} KB`
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optimize-images-'))
process.on('exit', () => fs.rmSync(tmpDir, { recursive: true, force: true }))

function exiftool(args) {
  return execFileSync('perl', [EXIFTOOL, '-q', '-q', '-m', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 })
}

async function ensureOxipng() {
  const key = `${process.platform}-${process.arch}`
  const asset = OXIPNG.assets[key]
  if (!asset) throw new Error(`no pinned oxipng build for ${key}`)
  const dir = path.join(HERE, '.bin', `oxipng-${OXIPNG.version}-${asset.name}`)
  const bin = path.join(dir, 'oxipng')
  if (fs.existsSync(bin)) return bin
  const file = `oxipng-${OXIPNG.version}-${asset.name}.tar.gz`
  const url = `https://github.com/shssoichiro/oxipng/releases/download/v${OXIPNG.version}/${file}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`downloading ${url} failed: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (sha256(buf) !== asset.sha256) throw new Error(`checksum mismatch for ${file}; refusing to use it`)
  fs.mkdirSync(dir, { recursive: true })
  const archive = path.join(tmpDir, file)
  fs.writeFileSync(archive, buf)
  execFileSync('tar', ['-xzf', archive, '-C', dir, '--strip-components=1'])
  fs.chmodSync(bin, 0o755)
  return bin
}

async function pixels(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { hash: sha256(data), width: info.width, height: info.height }
}

async function samePixels(a, b) {
  const [x, y] = await Promise.all([pixels(a), pixels(b)])
  return x.width === y.width && x.height === y.height && x.hash === y.hash
}

const COPY_TAGS = ['IPTC:CodedCharacterSet', ...KEEP_TAGS]

function keepTagsArgs(source) {
  return ['-tagsFromFile', source, ...COPY_TAGS.map((t) => `-${t}`)]
}

function cleanMetadataInPlace(file) {
  exiftool(['-overwrite_original', '-all=', '-tagsFromFile', '@', '-ICC_Profile', '-EXIF:Orientation', '-JFIF:all', '-Adobe:all', ...COPY_TAGS.map((t) => `-${t}`), file])
}

function copyKeepTags(source, target) {
  exiftool(['-overwrite_original', ...keepTagsArgs(source), target])
}

function tagSummary(file) {
  const out = JSON.parse(exiftool(['-j', '-G1', '-a', ...KEEP_TAGS.map((t) => `-${t}`), file]))[0] || {}
  delete out.SourceFile
  return out
}

async function processFile(file, oxipng) {
  const original = fs.readFileSync(file)
  const meta = await sharp(original).metadata()
  const long = Math.max(meta.width, meta.height)
  const resize = long > SETTINGS.maxEdge
  const ext = path.extname(file)
  const candidate = path.join(tmpDir, `candidate${ext}`)
  let action
  let pipeline = sharp(original, { failOn: 'error' }).rotate()
  if (resize) pipeline = pipeline.resize({ width: SETTINGS.maxEdge, height: SETTINGS.maxEdge, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
  pipeline = pipeline.keepIccProfile()

  if (meta.format === 'jpeg') {
    const buf = await pipeline.jpeg({ quality: SETTINGS.jpegQuality, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }).toBuffer()
    if (resize || buf.length <= original.length * (1 - SETTINGS.minSaving)) {
      fs.writeFileSync(candidate, buf)
      copyKeepTags(file, candidate)
      action = resize ? 'resized' : 'recompressed'
    }
  } else if (meta.format === 'webp' && resize) {
    fs.writeFileSync(candidate, await pipeline.webp({ quality: SETTINGS.webpQuality, effort: 6 }).toBuffer())
    copyKeepTags(file, candidate)
    action = 'resized'
  } else if (meta.format === 'png') {
    const source = path.join(tmpDir, 'source.png')
    if (resize) fs.writeFileSync(source, await pipeline.png({ compressionLevel: 9, palette: false }).toBuffer())
    else fs.writeFileSync(source, original)
    execFileSync(oxipng, ['-q', '-o', '4', '--strip', 'safe', '--out', candidate, source])
    copyKeepTags(file, candidate)
    if (!resize && !(await samePixels(original, candidate))) throw new Error('oxipng output differs in pixels; left untouched')
    action = resize ? 'resized' : 'lossless'
  }

  if (!action) {
    fs.writeFileSync(candidate, original)
    cleanMetadataInPlace(candidate)
    if (!(await samePixels(original, candidate))) throw new Error('metadata cleanup changed pixels; left untouched')
    action = 'metadata'
  }

  const out = fs.readFileSync(candidate)
  if (out.equals(original)) return { action: 'unchanged', before: original.length, after: original.length, width: meta.width, height: meta.height, sha: sha256(original) }
  if (action === 'lossless' && out.length > original.length) {
    return { action: 'unchanged', note: 'oxipng output was larger; kept as is', before: original.length, after: original.length, width: meta.width, height: meta.height, sha: sha256(original) }
  }
  const final = fs.readFileSync(candidate)
  const outMeta = await sharp(final).metadata()
  if (!outMeta.width || outMeta.format !== meta.format) throw new Error(`output check failed (${outMeta.format})`)
  if (meta.icc && !(outMeta.icc && Buffer.compare(meta.icc, outMeta.icc) === 0)) throw new Error('colour profile would change; left untouched')
  const before = tagSummary(file)
  const after = tagSummary(candidate)
  const noIptc = meta.format !== 'jpeg'
  const lost = Object.keys(before).filter((k) => !(k in after) && !(noIptc && k.startsWith('IPTC:')))
  if (lost.length) throw new Error(`would lose kept tags: ${lost.join(', ')}`)
  if (!opts['dry-run']) {
    const staging = `${file}.optimizing`
    fs.writeFileSync(staging, final)
    fs.renameSync(staging, file)
  }
  const note = noIptc && Object.keys(before).some((k) => k.startsWith('IPTC:')) ? `${meta.format.toUpperCase()} cannot store IPTC; IPTC fields dropped, EXIF/XMP kept` : undefined
  return { action, note, before: original.length, after: final.length, width: outMeta.width, height: outMeta.height, sha: sha256(final) }
}

function probeVideo(file) {
  const tags = JSON.parse(exiftool(['-j', '-n', '-ImageWidth', '-ImageHeight', '-Rotation', '-Duration', file]))[0] || {}
  const { ImageWidth: w, ImageHeight: h, Rotation: rotation = 0, Duration: duration } = tags
  if (!(w > 0 && h > 0)) throw new Error('could not read the video size; is the file a valid MP4/WebM?')
  const turned = Math.abs(rotation) % 180 === 90
  return { width: turned ? h : w, height: turned ? w : h, duration: duration > 0 ? Math.round(duration * 10) / 10 : undefined }
}

function videoSizeNote(bytes) {
  if (bytes > SETTINGS.videoStrongWarnMB * 1024 * 1024) return { level: 'strong', text: `${mb(bytes)}: over ${SETTINGS.videoStrongWarnMB} MB. Every visitor downloads this and it stays in git history forever. Add videos with "Add video" in Pages CMS instead (they are stored in Vercel Blob, not git).` }
  if (bytes > SETTINGS.videoWarnMB * 1024 * 1024) return { level: 'warn', text: `${mb(bytes)}: over the recommended ${SETTINGS.videoWarnMB} MB. Consider exporting a shorter clip or at a lower bitrate.` }
  return null
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|heic|heif|tiff?|bmp|svg)$/i
const READABLE = /^[a-z0-9]+(-[a-z0-9]+)*$/

const manifest = readJson(MANIFEST, { files: {} })
manifest.failed = {}
manifest.settings = { ...SETTINGS, keepTags: KEEP_TAGS, oxipng: OXIPNG.version }
const excludeConfig = readJson(EXCLUDE, { exclude: [] })
const excludes = (excludeConfig.exclude || []).map(globToRegex)
const files = walk(MEDIA).filter((f) => IMAGE_EXT.test(f) || VIDEO.test(f) || OTHER_VIDEO.test(f)).sort()
const known = new Map(Object.entries(manifest.files).map(([p, e]) => [e.sha256, p]))

let oxipng = null
const report = []
const nameWarnings = []
const videoWarnings = []
for (const file of files) {
  const p = rel(file)
  const segments = p.replace(/^\/media\//, '').split('/')
  const bad = segments.filter((s, i) => !READABLE.test(i === segments.length - 1 ? s.replace(/\.[^.]+$/, '') : s) || (i === segments.length - 1 && s !== s.toLowerCase()))
  if (bad.length) nameWarnings.push(p)
  if (excludes.some((re) => re.test(p))) {
    report.push({ path: p, action: 'excluded' })
    continue
  }
  const sha = sha256(fs.readFileSync(file))
  if (manifest.files[p]?.sha256 === sha) {
    report.push({ path: p, action: 'skipped', note: 'already optimized' })
    continue
  }
  const previous = known.get(sha)
  if (previous && previous !== p) {
    manifest.files[p] = { ...manifest.files[previous] }
    report.push({ path: p, action: 'skipped', note: `already optimized as ${previous}` })
    continue
  }
  const ext = path.extname(file).toLowerCase()
  if (VIDEO.test(ext)) {
    try {
      const size = fs.statSync(file).size
      const v = probeVideo(file)
      const warning = videoSizeNote(size)
      if (warning) videoWarnings.push({ path: p, ...warning })
      manifest.files[p] = { sha256: sha, action: 'video', bytesBefore: size, bytesAfter: size, width: v.width, height: v.height, ...(v.duration ? { duration: v.duration } : {}) }
      known.set(sha, p)
      report.push({ path: p, action: 'video', before: size, after: size, width: v.width, height: v.height, note: [`${v.width}×${v.height}${v.duration ? `, ${v.duration}s` : ''}`, warning?.text].filter(Boolean).join('; ') })
    } catch (e) {
      manifest.failed[p] = { sha256: sha, note: e.message }
      report.push({ path: p, action: 'error', note: e.message })
    }
    continue
  }
  if (OTHER_VIDEO.test(ext)) {
    report.push({ path: p, action: 'unsupported', note: 'not all browsers can play this format; export as MP4 (H.264) and upload that instead' })
    continue
  }
  if (!/\.(jpe?g|png|webp)$/.test(ext)) {
    report.push({ path: p, action: 'unsupported', note: /\.(heic|heif|tiff?|bmp)$/.test(ext) ? 'browsers cannot display this format; convert to JPEG before uploading' : 'format is not optimized' })
    continue
  }
  try {
    if (ext === '.png' && !oxipng) oxipng = await ensureOxipng()
    const r = await processFile(file, oxipng)
    manifest.files[p] = { sha256: r.sha, action: r.action, bytesBefore: r.before, bytesAfter: r.after, width: r.width, height: r.height }
    known.set(r.sha, p)
    report.push({ path: p, ...r })
  } catch (e) {
    manifest.failed[p] = { sha256: sha, note: e.message }
    report.push({ path: p, action: 'error', note: e.message })
  }
}
const present = new Set(files.map(rel))
for (const p of Object.keys(manifest.files)) if (!present.has(p)) delete manifest.files[p]
manifest.files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)))
if (!Object.keys(manifest.failed).length) delete manifest.failed

if (!opts['dry-run']) {
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
}

const changed = report.filter((r) => ['resized', 'recompressed', 'lossless', 'metadata'].includes(r.action))
const saved = changed.reduce((s, r) => s + (r.before - r.after), 0)
const lines = report.map((r) => `${r.action.padEnd(12)} ${r.before != null ? `${kb(r.before).padStart(8)} -> ${kb(r.after).padStart(8)}` : ''.padEnd(20)}  ${r.path}${r.note ? `  (${r.note})` : ''}`)
console.log(lines.join('\n'))
const videos = report.filter((r) => r.action === 'video')
console.log(`\n${opts['dry-run'] ? '[dry run] ' : ''}${changed.length} changed, ${kb(saved)} saved, ${videos.length} new videos recorded, ${report.filter((r) => r.action === 'error').length} errors`)
for (const w of videoWarnings) {
  console.log(`\n${w.level === 'strong' ? 'VERY LARGE VIDEO' : 'Large video'}: ${w.path}\n  ${w.text}`)
  if (process.env.GITHUB_ACTIONS) console.log(`::warning title=${w.level === 'strong' ? 'Very large video' : 'Large video'}::${w.path} is ${w.text}`)
}
if (nameWarnings.length) console.log(`\nNames that aren't lowercase and hyphenated (not renamed automatically):\n  ${nameWarnings.join('\n  ')}`)

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = report.filter((r) => r.action !== 'skipped').map((r) => `| \`${r.path}\` | ${r.action} | ${r.before != null ? `${kb(r.before)} → ${kb(r.after)}` : ''} | ${r.note || ''} |`)
  const sizeWarnings = videoWarnings.map((w) => `- ${w.level === 'strong' ? '**Very large video**' : '**Large video**'} \`${w.path}\`: ${w.text}`)
  const md = [`### Image optimization`, '', `${changed.length} changed, ${kb(saved)} saved, ${videos.length} new videos recorded.`, '', ...(sizeWarnings.length ? [...sizeWarnings, ''] : []), rows.length ? ['| File | Action | Size | Note |', '|---|---|---|---|', ...rows].join('\n') : 'Nothing to do.', nameWarnings.length ? `\n**Names that aren't lowercase and hyphenated:** ${nameWarnings.map((n) => `\`${n}\``).join(', ')}` : ''].join('\n')
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n')
}
if (opts.json) fs.writeFileSync(path.resolve(opts.json), JSON.stringify({ report, nameWarnings, videoWarnings }, null, 2))
process.exitCode = report.some((r) => r.action === 'error') ? 1 : 0
