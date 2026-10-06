const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const VIMEO_ID = /^\d+$/
const VIMEO_HASH = /^[0-9a-f]{6,}$/i

const youtubeId = (value) => (YOUTUBE_ID.test(value || '') ? value : null)

// Parses a YouTube or Vimeo link (or a pasted embed code containing one) into
// { provider, id, hash? }, or null.
export function parseEmbed(value) {
  const found = String(value || '').match(/https?:\/\/[^\s"'<>]+/)
  if (!found) return null
  let url
  try {
    url = new URL(found[0].replace(/&amp;/g, '&'))
  } catch {
    return null
  }
  const host = url.hostname.replace(/^(www|m)\./, '')
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') {
    const id = youtubeId(parts[0])
    return id ? { provider: 'youtube', id } : null
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
    const id =
      parts[0] === 'watch'
        ? youtubeId(url.searchParams.get('v'))
        : ['shorts', 'embed', 'live', 'v'].includes(parts[0])
          ? youtubeId(parts[1])
          : null
    return id ? { provider: 'youtube', id } : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const after = parts.indexOf('video')
    const index = after >= 0 && VIMEO_ID.test(parts[after + 1] || '') ? after + 1 : parts.findIndex((p) => VIMEO_ID.test(p))
    if (index < 0) return null
    const hash = [parts[index + 1], url.searchParams.get('h')].find((h) => VIMEO_HASH.test(h || ''))
    return { provider: 'vimeo', id: parts[index], ...(hash ? { hash } : {}) }
  }
  return null
}

export function embedKey(embed) {
  return [embed.provider, embed.id, embed.hash].filter(Boolean).join(':')
}

export function embedPageUrl(embed) {
  return embed.provider === 'youtube'
    ? `https://www.youtube.com/watch?v=${embed.id}`
    : `https://vimeo.com/${embed.id}${embed.hash ? `/${embed.hash}` : ''}`
}

export function embedPlayerUrl(embed) {
  return embed.provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${embed.id}?autoplay=1&rel=0&playsinline=1`
    : `https://player.vimeo.com/video/${embed.id}?autoplay=1&dnt=1${embed.hash ? `&h=${embed.hash}` : ''}`
}

// Muted, looping, chrome-less player for background use. Vimeo hides its
// controls in background mode only on paid plans.
export function backgroundPlayerUrl(embed, origin) {
  if (embed.provider === 'youtube') {
    const params = new URLSearchParams({ autoplay: '1', mute: '1', loop: '1', playlist: embed.id, controls: '0', playsinline: '1', rel: '0', disablekb: '1', iv_load_policy: '3', enablejsapi: '1', ...(origin ? { origin } : {}) })
    return `https://www.youtube-nocookie.com/embed/${embed.id}?${params}`
  }
  const params = new URLSearchParams({ background: '1', autoplay: '1', muted: '1', loop: '1', dnt: '1', api: '1', ...(embed.hash ? { h: embed.hash } : {}) })
  return `https://player.vimeo.com/video/${embed.id}?${params}`
}
