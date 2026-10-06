import { randomInt } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { put } from '@vercel/blob/client'
import { ContentError, applyVideo, describe, resolveFile, resolveSpot, spotName, withStatus } from '../../api/_lib/destinations.js'
import { BRANCH, readFile, updateFile } from '../../api/_lib/github.js'
import { SMALL_SPOT_VIDEO_BYTES, parseVideoPath } from '../../api/_lib/videos.js'
import { EditorError, megabytes } from './errors.mjs'
import { download, parseLink } from './links.mjs'
import { probeVideo } from './probe.mjs'

const GENERIC = 'Something went wrong on our side, not with your video. Try again in a few minutes; if it keeps failing, tell the web team.'
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

const when = () =>
  new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })

// Heavier videos play on heroes, galleries and event pages; small spots show
// their image instead (see src/videos.js).
function sizeNote(target, bytes) {
  if (bytes <= SMALL_SPOT_VIDEO_BYTES) return ''
  if (target.cards === 'only') return " Because it's over 20 MB it won't play here: small spots like this show the image instead. Add a version under 20 MB to see it move."
  if (target.cards === 'also') return ' Because it\'s over 20 MB it shows as the image on cards; a version under 20 MB loads more smoothly and also plays there.'
  return ' A version under 20 MB would load more smoothly.'
}

const randomId = () => Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')

function summary(lines) {
  console.log(lines.join('\n'))
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
}

async function uploadToken(pathname) {
  const response = await fetch(process.env.VIDEO_TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.VIDEO_JOB_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ pathname }),
  })
  if (!response.ok) throw new Error(`Upload token request failed: ${response.status} ${await response.text().catch(() => '')}`)
  return (await response.json()).clientToken
}

async function main() {
  const payload = JSON.parse(process.env.PAYLOAD || '{}')
  const inputs = payload.inputs || {}
  const editor = payload.triggeredBy || {}
  const author = editor.email ? { name: editor.name || editor.email, email: editor.email } : undefined
  const file = resolveFile(payload.context?.path)

  if (!file) throw new Error(`Not a content file with video spots: ${payload.context?.path}`)
  if (payload.repository?.ref !== BRANCH) {
    throw new Error(`Run from branch "${payload.repository?.ref}"; videos are only added on ${BRANCH}.`)
  }

  const writeStatus = (message) =>
    updateFile(file.file, (data) => withStatus(data, message), { message: `Update video status of ${file.file} (via Pages CMS)`, author })

  try {
    const target = resolveSpot(file, String(inputs.spot || ''))
    const options = { caption: inputs.caption, person: inputs.person }
    describe(target, (await readFile(file.file)).data, options)
    const link = parseLink(inputs.link)
    console.log(`Downloading from ${link.provider}…`)
    const buffer = await download(link)
    const video = await probeVideo(buffer)
    console.log(`${video.container}, ${video.codec}, ${video.width}×${video.height}, ${video.duration.toFixed(1)} s, ${megabytes(buffer.length)}`)

    const pathname = `videos/${file.slug.slice(0, 40).replace(/-+$/, '')}-${randomId()}/${video.width}x${video.height}-${buffer.length}.${video.ext}`
    if (parseVideoPath(pathname)?.contentType !== video.contentType) throw new Error(`Bad video path ${pathname}`)
    const blob = await put(pathname, buffer, {
      access: 'public',
      token: await uploadToken(pathname),
      contentType: video.contentType,
      multipart: buffer.length > SMALL_SPOT_VIDEO_BYTES,
    })
    console.log(`Uploaded ${blob.url}`)

    options.url = blob.url
    let label = ''
    await updateFile(
      file.file,
      (data) => {
        const status = `✓ Video added to ${spotName(target, data, options)} (${megabytes(buffer.length)}). It will appear on the preview site in about a minute.${sizeNote(target, buffer.length)} (${when()})`
        return withStatus(applyVideo(target, data, options), status)
      },
      {
        message: (data) => {
          label = describe(target, data, options)
          return `Add video to ${label} (via Pages CMS)`
        },
        author,
      },
    )
    summary([`### ✓ Video added`, '', `- ${label}`, `- ${blob.url}`, `- ${video.width}×${video.height}, ${megabytes(buffer.length)}, ${video.codec}`])
  } catch (error) {
    const editorFacing = error instanceof EditorError || error instanceof ContentError
    const message = editorFacing ? error.message : GENERIC
    if (!editorFacing) console.error(error)
    summary([`### ✗ Video not added`, '', message, ...(editorFacing ? [] : ['', '```', String(error?.stack || error), '```'])])
    await writeStatus(`✗ ${message} (${when()})`).catch((statusError) => console.error('Could not write the video status:', statusError))
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  summary(['### ✗ Video job failed before it could start', '', String(error?.message || error)])
  process.exitCode = 1
})
