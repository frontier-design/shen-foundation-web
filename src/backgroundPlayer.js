import { backgroundPlayerUrl } from './embedUrl.js'

// YouTube shows its title, or a pause icon after a restart, over the first seconds.
const YOUTUBE_REVEAL_AFTER = 4.5
// Seek back this far before the end, before YouTube's end screen can appear.
const YOUTUBE_LOOP_MARGIN = 0.5
const FADE = 0.6

const FRAME_STYLE = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 'max(100cqw, calc(100cqh * var(--ratio)))',
  height: 'max(100cqh, calc(100cqw / var(--ratio)))',
  transform: 'translate(-50%, -50%)',
  border: '0',
  pointerEvents: 'none',
  opacity: '0',
  transition: `opacity ${FADE}s ease`,
}

// Adds a muted looping YouTube/Vimeo player to `container`, sized to cover it.
// It stays invisible until the provider reports that it's playing, so the image
// underneath shows until then, and for good if the video can't play. YouTube
// overlays its title at the start and a pause icon after every restart, so
// YouTube videos fade back to the image around each loop until those are gone.
export function createBackgroundPlayer(container, info, { autoplay = true } = {}) {
  const { embed, ratio } = info
  const youtube = embed.provider === 'youtube'
  const iframe = document.createElement('iframe')
  iframe.src = backgroundPlayerUrl(embed, window.location.origin)
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture'
  iframe.referrerPolicy = 'strict-origin-when-cross-origin'
  iframe.tabIndex = -1
  iframe.title = info.title || 'Background video'
  iframe.setAttribute('aria-hidden', 'true')
  Object.assign(iframe.style, FRAME_STYLE)
  iframe.style.setProperty('--ratio', String(ratio))
  Object.assign(container.style, { containerType: 'size', overflow: 'hidden' })

  let wanted = autoplay
  let shown = false
  let duration = 0
  let time = 0
  let state = -1
  let looping = false

  const hide = () => {
    shown = false
    iframe.style.opacity = '0'
  }

  const post = (message) => iframe.contentWindow?.postMessage(JSON.stringify(message), '*')
  const command = (name) =>
    youtube ? post({ event: 'command', func: name === 'play' ? 'playVideo' : 'pauseVideo', args: '' }) : post({ method: name })

  const onMessage = (e) => {
    if (e.source !== iframe.contentWindow) return
    let data = e.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        return
      }
    }
    if (!youtube && data?.event === 'ready') {
      listen()
      return
    }
    let playing
    if (youtube) {
      const info = (data?.event === 'infoDelivery' || data?.event === 'initialDelivery') && data.info ? data.info : {}
      if (data?.event === 'onStateChange') state = data.info
      if (typeof info.playerState === 'number') state = info.playerState
      if (info.duration) duration = info.duration
      if (typeof info.currentTime === 'number') time = info.currentTime
      const ending = state === 0 || (duration > YOUTUBE_REVEAL_AFTER * 2 && time > duration - YOUTUBE_LOOP_MARGIN - FADE)
      if (ending && shown) hide()
      if (!looping && (state === 0 || (duration > YOUTUBE_REVEAL_AFTER * 2 && time > duration - YOUTUBE_LOOP_MARGIN))) {
        looping = true
        time = 0
        post({ event: 'command', func: 'seekTo', args: [0, true] })
      } else if (looping && time < 1) looping = false
      playing = state === 1 && time >= Math.min(YOUTUBE_REVEAL_AFTER, duration / 2 || YOUTUBE_REVEAL_AFTER)
    } else playing = ['play', 'playProgress', 'timeupdate'].includes(data?.event)
    if (playing && !shown && !looping) {
      shown = true
      iframe.style.opacity = '1'
    }
    if (playing && !wanted) command('pause')
  }

  const listen = () => {
    if (youtube) post({ event: 'listening', id: 1, channel: 'widget' })
    else for (const value of ['play', 'playProgress', 'timeupdate']) post({ method: 'addEventListener', value })
    command(wanted ? 'play' : 'pause')
  }

  window.addEventListener('message', onMessage)
  iframe.addEventListener('load', listen)
  container.appendChild(iframe)

  return {
    play() {
      wanted = true
      command('play')
    },
    pause() {
      wanted = false
      command('pause')
    },
    destroy() {
      window.removeEventListener('message', onMessage)
      iframe.remove()
    },
  }
}
