import { MAX_VIDEO_BYTES } from '../../api/_lib/videos.js'
import { EditorError, megabytes } from './errors.mjs'

const EXPORT_ADVICE = 'please export a version under 20 MB and try again.'
const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com', 'drive.usercontent.google.com'])
const DRIVE_ID = /^[\w-]{10,}$/

const tooBig = (bytes) =>
  new EditorError(bytes ? `This video is ${megabytes(bytes)}; ${EXPORT_ADVICE}` : `This video is over 20 MB; ${EXPORT_ADVICE}`)

// Turns a pasted share link into { provider, id?, url } or throws an EditorError.
export function parseLink(raw) {
  const text = String(raw || '').trim()
  if (!text) throw new EditorError('Paste a Google Drive or Dropbox link to the video file and try again.')
  let url
  try {
    url = new URL(text)
  } catch {
    throw new EditorError("That doesn't look like a link. Copy the share link from Google Drive or Dropbox and paste all of it.")
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const path = url.pathname

  if (DRIVE_HOSTS.has(host)) {
    if (/\/folders\//.test(path)) throw new EditorError("That's a folder link, not a file. Open the video itself in Google Drive, click Share → Copy link, and paste that.")
    if (/^\/(document|spreadsheets|presentation|forms|drawings)\//.test(path)) {
      throw new EditorError("That's a Google Docs, Sheets or Slides link, not a video file. Share the video file itself.")
    }
    const id = path.match(/\/file\/(?:u\/\d+\/)?d\/([\w-]+)/)?.[1] || url.searchParams.get('id')
    if (!id || !DRIVE_ID.test(id)) {
      throw new EditorError("That Google Drive link doesn't point to a file. Open the video in Google Drive, click Share → Copy link, and paste that.")
    }
    return { provider: 'drive', id }
  }

  if (host === 'dropbox.com' || host === 'dl.dropboxusercontent.com') {
    if (/^\/(scl\/fo|sh)\//.test(path)) throw new EditorError("That's a folder link, not a file. In Dropbox, share the video file itself and paste that link.")
    if (/^\/t\//.test(path)) throw new EditorError("That's a Dropbox Transfer link. In Dropbox, share the video file itself (Share → Copy link) and paste that link.")
    if (host === 'dropbox.com' && !/^\/(scl\/fi|s)\//.test(path)) {
      throw new EditorError("That Dropbox link doesn't point to a shared file. In Dropbox, click Share → Copy link on the video and paste that.")
    }
    const download = new URL(url)
    download.searchParams.delete('raw')
    download.searchParams.set('dl', '1')
    return { provider: 'dropbox', url: download.href }
  }

  throw new EditorError('Only Google Drive and Dropbox links work here. Put the video in Google Drive or Dropbox, share it, and paste that link.')
}

async function readCapped(response) {
  const length = Number(response.headers.get('content-length'))
  if (length > MAX_VIDEO_BYTES) {
    await response.body?.cancel()
    throw tooBig(length)
  }
  const chunks = []
  let total = 0
  for await (const chunk of response.body) {
    total += chunk.length
    if (total > MAX_VIDEO_BYTES) throw tooBig(length || null)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

const isHtml = (response) => /text\/html/i.test(response.headers.get('content-type') || '')

const DRIVE_SIZE = /\((\d+(?:\.\d+)?)\s?([KMG])B?\)/
const UNITS = { K: 1e3, M: 1e6, G: 1e9 }

function driveForm(html) {
  const form = html.match(/(<form\b[^>]*\bid="download-form"[^>]*>)([\s\S]*?)<\/form>/i)
  const action = form?.[1].match(/\baction="([^"]+)"/)?.[1]
  if (!action) return null
  const url = new URL(action.replace(/&amp;/g, '&'))
  for (const input of form[2].matchAll(/<input[^>]*type="hidden"[^>]*>/gi)) {
    const name = input[0].match(/name="([^"]+)"/)?.[1]
    const value = input[0].match(/value="([^"]*)"/)?.[1] ?? ''
    if (name) url.searchParams.set(name, value.replace(/&amp;/g, '&'))
  }
  return url.href
}

const notShared = () =>
  new EditorError("This Google Drive link isn't shared publicly. In Google Drive, click Share, set General access to \"Anyone with the link\", and try again.")

async function downloadDrive(id) {
  let response = await fetch(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`)
  if (response.status === 404) {
    throw new EditorError("This Google Drive file can't be found. It may have been deleted, or it isn't shared publicly (Share → \"Anyone with the link\").")
  }
  if (response.status === 401 || response.status === 403 || /accounts\.google\.com/.test(response.url)) throw notShared()
  if (!response.ok) throw new Error(`Google Drive responded ${response.status}`)
  if (isHtml(response)) {
    const html = await response.text()
    if (/quota|too many users/i.test(html)) {
      throw new EditorError('Google Drive is limiting downloads of this file right now. Try again in a few hours, or share it from Dropbox instead.')
    }
    const size = html.match(DRIVE_SIZE)
    if (size && Number(size[1]) * UNITS[size[2]] > MAX_VIDEO_BYTES) throw tooBig(Number(size[1]) * UNITS[size[2]])
    const next = driveForm(html)
    if (!next) throw notShared()
    response = await fetch(next)
    if (!response.ok || isHtml(response)) throw notShared()
  }
  return readCapped(response)
}

async function downloadDropbox(url) {
  const response = await fetch(url)
  if (response.status === 404 || response.status === 410) {
    throw new EditorError("This Dropbox link doesn't work any more. It may have been deleted or switched off. Copy a fresh link from Dropbox and try again.")
  }
  if (response.status === 401 || response.status === 403 || (response.ok && isHtml(response))) {
    throw new EditorError("This Dropbox link doesn't lead to a file anyone can download: it may be private, need a password, or point to a deleted file. In Dropbox, click Share → Copy link on the video (anyone with the link, no password) and try again.")
  }
  if (!response.ok) throw new Error(`Dropbox responded ${response.status}`)
  return readCapped(response)
}

export function download(link) {
  return link.provider === 'drive' ? downloadDrive(link.id) : downloadDropbox(link.url)
}
