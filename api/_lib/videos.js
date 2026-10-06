export const MAX_VIDEO_BYTES = 100 * 1024 * 1024
export const SMALL_SPOT_VIDEO_BYTES = 20 * 1024 * 1024

export const VIDEO_PATH = /^videos\/[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{8}\/\d{2,4}x\d{2,4}-(\d{1,9})\.(mp4|webm)$/

export const CONTENT_TYPES = { mp4: 'video/mp4', webm: 'video/webm' }

// { contentType, size } from videos/<name>-<random8>/<W>x<H>-<bytes>.<ext>, or null.
export function parseVideoPath(pathname) {
  const match = String(pathname || '').match(VIDEO_PATH)
  if (!match) return null
  const size = Number(match[1])
  return size > 0 && size <= MAX_VIDEO_BYTES ? { contentType: CONTENT_TYPES[match[2]], size } : null
}
