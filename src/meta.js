// Page titles, descriptions and share images, shared by the app (document
// title) and the build (static HTML per route for crawlers, sitemap). Pure:
// it takes plain content objects, so it runs in the browser and in Node.
import { slugify } from './slug.js'

export const SITE_NAME = 'Shen Foundation'
export const SITE_URL = 'https://www.theshenfoundation.org'

const DESCRIPTION_LENGTH = 160

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' }

export function plainText(value) {
  return String(value || '')
    .replace(/<(br\s*\/?|\/(p|li|h[1-6]|blockquote|pre|td|th|tr))>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
      if (code[0] === '#') {
        const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
        return Number.isFinite(n) ? String.fromCodePoint(n) : match
      }
      return ENTITIES[code.toLowerCase()] ?? match
    })
    .replace(/\s+/g, ' ')
    .trim()
}

function excerpt(value) {
  const text = plainText(value)
  if (text.length <= DESCRIPTION_LENGTH) return text
  const cut = text.slice(0, DESCRIPTION_LENGTH - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s]+$/, '')}…`
}

const docSlug = (item, nameField) => item?.slug || item?.__slug || slugify(item?.[nameField])
const refSlug = (value) => {
  const s = typeof value === 'string' ? value : value?.path || value?.value || ''
  return slugify(s.replace(/^.*\//, '').replace(/\.json$/, ''))
}
const media = (value) => (typeof value === 'string' && value.startsWith('/media/') ? value : null)
const title = (...parts) => [...parts.filter(Boolean), SITE_NAME].join(' | ')

function defaultImage(data) {
  const home = data.pages?.home || {}
  for (const row of home.heroSlides || []) {
    const ex = data.exhibitions.find((item) => docSlug(item, 'subtitle') === refSlug(row?.exhibition ?? row))
    if (media(ex?.heroImage)) return ex.heroImage
  }
  const withImage = data.exhibitions.find((item) => media(item.heroImage))
  return withImage?.heroImage || null
}

// data = { pages: { home, about, site, … }, exhibitions, events, artists },
// each item carrying `__slug` (its file name).
export function routeMeta(pathname, data) {
  const path = pathname.replace(/\/+$/, '') || '/'
  const site = data.pages?.site || {}
  const fallback = { description: excerpt(site.menuDescription), image: defaultImage(data) }
  const page = (meta) => ({
    path,
    title: meta.title,
    description: meta.description || fallback.description,
    image: media(meta.image) || fallback.image,
  })

  if (path === '/') return page({ title: SITE_NAME })
  if (path === '/about') {
    const about = data.pages?.about || {}
    return page({ title: title('About'), description: excerpt(about.heroBody), image: about.heroImage })
  }
  if (path === '/exhibitions') return page({ title: title('Exhibitions & Projects') })
  if (path === '/events') return page({ title: title('Events') })
  if (path === '/artists') return page({ title: title('Artists') })

  const [, section, slug] = path.match(/^\/(exhibitions|events|artists)\/([a-z0-9-]+)$/) || []
  if (section === 'exhibitions') {
    const item = data.exhibitions.find((ex) => docSlug(ex, 'subtitle') === slug)
    if (item) return page({ title: title([item.title, item.subtitle].filter(Boolean).join(' — ')), description: excerpt(item.body), image: item.heroImage })
  }
  if (section === 'events') {
    const item = data.events.find((ev) => docSlug(ev, 'title') === slug)
    const body = item?.body || (item?.sections || []).map((s) => s?.body).find((b) => plainText(b))
    if (item) return page({ title: title(item.title), description: excerpt(body), image: item.image })
  }
  if (section === 'artists') {
    const item = data.artists.find((ar) => docSlug(ar, 'title') === slug)
    if (item) return page({ title: title(item.title), description: excerpt(item.bio), image: item.thumbnail })
  }
  return null
}

export function siteRoutes(data) {
  return [
    '/',
    '/about',
    '/exhibitions',
    '/events',
    '/artists',
    ...data.exhibitions.map((item) => `/exhibitions/${docSlug(item, 'subtitle')}`),
    ...data.events.map((item) => `/events/${docSlug(item, 'title')}`),
    ...data.artists.map((item) => `/artists/${docSlug(item, 'title')}`),
  ]
}

export const shareImageUrl = (image) =>
  image ? `${SITE_URL}/_vercel/image?url=${encodeURIComponent(image)}&w=1280&q=80` : null
