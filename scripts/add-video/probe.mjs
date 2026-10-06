import { ALL_FORMATS, BufferSource, Input } from 'mediabunny'
import { EditorError } from './errors.mjs'

const EXPORT = 'Please export it as MP4 (H.264) and try again.'
const BROWSER_SAFE_H264 = new Set(['42', '4d', '64'])

const unplayable = (detail) => new EditorError(`${detail} ${EXPORT}`)

// Reads the container, codec and size without decoding. Accepts only what all
// browsers play: MP4 with 8-bit 4:2:0 H.264, or WebM with VP8 or 8-bit VP9.
export async function probeVideo(buffer) {
  const input = new Input({ source: new BufferSource(buffer), formats: ALL_FORMATS })
  let format
  try {
    format = await input.getFormat()
  } catch {
    throw unplayable("This file isn't a video we can read.")
  }
  const track = await input.getPrimaryVideoTrack()
  if (!track) throw unplayable('This file has no picture in it.')
  const codec = (await track.getCodecParameterString()) || ''
  const duration = await input.computeDuration()

  let ext = null
  if (format.mimeType === 'video/mp4' && track.codec === 'avc' && BROWSER_SAFE_H264.has(codec.slice(5, 7).toLowerCase())) ext = 'mp4'
  if (format.mimeType === 'video/webm' && (track.codec === 'vp8' || (track.codec === 'vp9' && codec.startsWith('vp09.00.')))) ext = 'webm'

  if (!ext) {
    if (format.mimeType === 'video/quicktime') throw unplayable("This is a .mov file, which won't play in all browsers.")
    if (track.codec === 'hevc') throw unplayable("This video is HEVC (H.265), which won't play in all browsers.")
    throw unplayable("This video's format won't play in all browsers.")
  }
  if (!(duration > 0)) throw unplayable('This video seems to be empty.')

  const width = Math.round(track.displayWidth)
  const height = Math.round(track.displayHeight)
  if (width < 10 || height < 10 || width > 9999 || height > 9999) throw unplayable(`This video's size (${width}×${height}) isn't supported.`)

  return { ext, contentType: ext === 'mp4' ? 'video/mp4' : 'video/webm', width, height, duration, codec, container: format.name }
}
