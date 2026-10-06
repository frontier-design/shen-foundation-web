import { backgroundPlayerUrl } from './embedUrl.js'

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
  transition: 'opacity 0.6s ease',
}

// Adds a muted looping YouTube/Vimeo player to `container`, sized to cover it.
// It stays invisible until the provider reports that it's playing, so the image
// underneath shows until then (and for good if the video can't play).
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
    const playing = youtube
      ? (data?.event === 'onStateChange' && data.info === 1) || (data?.event === 'infoDelivery' && data.info?.playerState === 1)
      : ['play', 'playProgress', 'timeupdate'].includes(data?.event)
    if (playing && !shown) {
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
