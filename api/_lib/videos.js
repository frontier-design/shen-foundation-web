export const MAX_VIDEO_BYTES = 20 * 1024 * 1024

export const VIDEO_PATH = /^videos\/[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{8}\/\d{2,4}x\d{2,4}\.(mp4|webm)$/

export const CONTENT_TYPES = { mp4: 'video/mp4', webm: 'video/webm' }

export function videoContentType(pathname) {
  const match = String(pathname || '').match(VIDEO_PATH)
  return match ? CONTENT_TYPES[match[1]] : null
}
