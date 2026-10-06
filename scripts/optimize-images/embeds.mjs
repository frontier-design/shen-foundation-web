#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { parseEmbed, embedKey, embedPageUrl } from '../../src/embedUrl.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const CONTENT = path.join(ROOT, 'content')
const THUMBS = path.join(ROOT, 'public/media/embeds')
const DATA = path.join(HERE, 'embeds.json')

const { values: opts } = parseArgs({ options: { check: { type: 'boolean', default: false }, help: { type: 'boolean', default: false } } })
if (opts.help) {
  process.stdout.write(`Fetch thumbnails for YouTube/Vimeo links in content/.

Usage: node scripts/optimize-images/embeds.mjs            (fetch missing thumbnails)
       node scripts/optimize-images/embeds.mjs --check    (exit 3 if any link has no entry yet)

Every "url" or "…Video" field in content/**/*.json holding a YouTube or Vimeo link gets its thumbnail, title and
aspect ratio from the provider's oEmbed API. Thumbnails are saved to public/media/embeds/ and
recorded in embeds.json, so visitors' browsers never contact YouTube or Vimeo before they press play.
Links that fail are recorded with the error and retried on the next run.
`)
  process.exit(0)
}

const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : [])

function findUrls(node, out) {
  if (Array.isArray(node)) node.forEach((n) => findUrls(n, out))
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if ((k === 'url' || k.endsWith('Video')) && typeof v === 'string') {
        const embed = parseEmbed(v)
        if (embed) out.set(embedKey(embed), embed)
      } else findUrls(v, out)
    }
  }
  return out
}

const referenced = new Map()
for (const file of walk(CONTENT).filter((f) => f.endsWith('.json'))) {
  try {
    findUrls(JSON.parse(fs.readFileSync(file, 'utf8')), referenced)
  } catch (e) {
    console.log(`Skipping ${path.relative(ROOT, file)}: ${e.message}`)
  }
}

const data = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf8')) : { embeds: {} }

if (opts.check) {
  const missing = [...referenced.keys()].filter((k) => !data.embeds[k])
  const failed = [...referenced.keys()].filter((k) => data.embeds[k]?.error)
  if (failed.length) console.log(`No thumbnail (shown with a plain placeholder):\n  ${failed.map((k) => `${embedPageUrl(referenced.get(k))} (${data.embeds[k].error})`).join('\n  ')}`)
  if (missing.length) {
    console.log(`Not fetched yet:\n  ${missing.map((k) => embedPageUrl(referenced.get(k))).join('\n  ')}`)
    process.exit(3)
  }
  console.log('All video links have thumbnails.')
  process.exit(0)
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'shen-foundation-web thumbnail fetcher' } })
  if (!res.ok) throw new Error(`${new URL(url).hostname} answered ${res.status}${res.status === 401 || res.status === 403 || res.status === 404 ? ' (private, deleted or embedding disabled?)' : ''}`)
  return res.json()
}

async function getImage(urls) {
  for (const url of urls) {
    const res = await fetch(url)
    if (!res.ok) continue
    const type = res.headers.get('content-type') || ''
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('jpeg') || type.includes('jpg') ? 'jpg' : null
    if (!ext) continue
    return { buffer: Buffer.from(await res.arrayBuffer()), ext }
  }
  throw new Error('no thumbnail image available')
}

async function fetchEmbed(embed) {
  const page = embedPageUrl(embed)
  if (embed.provider === 'youtube') {
    const o = await getJson(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(page)}`)
    const base = `https://i.ytimg.com/vi/${embed.id}`
    const image = await getImage([`${base}/maxresdefault.jpg`, `${base}/hq720.jpg`, `${base}/sddefault.jpg`, o.thumbnail_url].filter(Boolean))
    return { o, image }
  }
  const o = await getJson(`https://vimeo.com/api/oembed.json?width=1920&url=${encodeURIComponent(page)}`)
  const image = await getImage([o.thumbnail_url].filter(Boolean))
  return { o, image }
}

const report = []
for (const [key, embed] of referenced) {
  if (data.embeds[key] && !data.embeds[key].error) continue
  try {
    const { o, image } = await fetchEmbed(embed)
    const name = `${embed.provider}-${createHash('sha256').update(key).digest('hex').slice(0, 12)}.${image.ext}`
    fs.mkdirSync(THUMBS, { recursive: true })
    fs.writeFileSync(path.join(THUMBS, name), image.buffer)
    data.embeds[key] = { url: embedPageUrl(embed), title: o.title || '', width: o.width || 16, height: o.height || 9, thumbnail: `/media/embeds/${name}` }
    report.push(`fetched   ${embedPageUrl(embed)}  "${o.title || ''}" ${o.width}×${o.height}`)
  } catch (e) {
    data.embeds[key] = { url: embedPageUrl(embed), error: e.message }
    report.push(`error     ${embedPageUrl(embed)}  (${e.message})`)
    if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Video thumbnail not fetched::${embedPageUrl(embed)}: ${e.message}. The video still plays; it shows a plain placeholder until you add a thumbnail in Pages CMS.`)
  }
}

for (const [key, entry] of Object.entries(data.embeds)) {
  if (referenced.has(key)) continue
  if (entry.thumbnail) fs.rmSync(path.join(ROOT, 'public', entry.thumbnail), { force: true })
  delete data.embeds[key]
  report.push(`removed   ${entry.url}`)
}

data.embeds = Object.fromEntries(Object.entries(data.embeds).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n')
console.log(report.length ? report.join('\n') : `Nothing to do (${referenced.size} video links).`)
if (process.env.GITHUB_STEP_SUMMARY && report.length) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Video thumbnails\n\n${report.map((r) => `- ${r}`).join('\n')}\n\n`)
