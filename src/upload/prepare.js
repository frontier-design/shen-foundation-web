export const MAX_BYTES = 20 * 1024 * 1024

export function inspectVideo(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    const done = (callback) => (value) => {
      URL.revokeObjectURL(url)
      video.removeAttribute('src')
      callback(value)
    }
    video.preload = 'metadata'
    video.muted = true
    video.onloadedmetadata = done(() =>
      video.videoWidth
        ? resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration })
        : reject(new Error('This file has no picture.')),
    )
    video.onerror = done(() => reject(new Error('This browser cannot read this video file.')))
    video.src = url
  })
}

export async function prepareVideos(file, info) {
  if (file.type !== 'video/mp4') throw new Error('For now the file has to be an MP4.')
  if (file.size > MAX_BYTES) throw new Error('For now the file has to be under 20 MB.')
  return { width: info.width, height: info.height, full: file, card: file }
}
