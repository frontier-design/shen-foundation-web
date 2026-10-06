import { GRID } from './grid/config.js'

const BLOB_VIDEO = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/videos\/[a-z0-9-]+\/(\d+)x(\d+)\.(mp4|webm)$/
const PHONE_LIMIT = 2

// A video uploaded by "Add video": { src, width, height } from its URL, or null.
export function blobVideo(value) {
  const match = typeof value === 'string' ? value.trim().match(BLOB_VIDEO) : null
  return match ? { src: match[0], width: Number(match[1]), height: Number(match[2]) } : null
}

const watched = new Map()
let observer = null

// Plays the watched videos that are on screen (on phones only the two most
// visible ones) and pauses the rest, also while the tab is hidden.
function update() {
  const limit = window.matchMedia(GRID.MEDIA_MOBILE).matches ? PHONE_LIMIT : Infinity
  const ranked = [...watched].filter(([, ratio]) => ratio > 0).sort((a, b) => b[1] - a[1])
  const playing = new Set(document.hidden ? [] : ranked.slice(0, limit).map(([video]) => video))
  for (const video of watched.keys()) {
    if (playing.has(video)) {
      if (video.paused) video.play().catch(() => {})
    } else if (!video.paused) video.pause()
  }
}

export function watchVideo(video) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (watched.has(entry.target)) {
            watched.set(entry.target, entry.isIntersecting ? Math.max(entry.intersectionRatio, 0.01) : 0)
          }
        }
        update()
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    )
    document.addEventListener('visibilitychange', update)
  }
  watched.set(video, 0)
  observer.observe(video)
  return () => {
    observer.unobserve(video)
    watched.delete(video)
    video.pause()
    update()
  }
}

const PLAYER_STYLE = {
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  opacity: '0',
  pointerEvents: 'none',
  transition: 'opacity 0.6s ease',
}

// A muted looping video added to `container` over its image. It stays invisible
// (and is skipped by the nav colour sampling) until it is actually playing.
export function createVideoPlayer(container, src) {
  const video = document.createElement('video')
  Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' })
  video.setAttribute('muted', '')
  video.setAttribute('playsinline', '')
  video.setAttribute('aria-hidden', 'true')
  video.disablePictureInPicture = true
  Object.assign(video.style, PLAYER_STYLE)
  video.addEventListener('playing', () => {
    video.style.opacity = '1'
    video.style.pointerEvents = 'auto'
  })
  video.src = src
  container.appendChild(video)
  video.play().catch(() => {})
  return {
    play() {
      video.play().catch(() => {})
    },
    pause() {
      video.pause()
    },
    destroy() {
      video.pause()
      video.removeAttribute('src')
      video.load()
      video.remove()
    },
  }
}
