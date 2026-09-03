import site from '../content/site.json'

const pageModules = import.meta.glob('../content/pages/*.json', {
  eager: true,
  import: 'default',
})

const exhibitionModules = import.meta.glob('../content/exhibitions/*.json', {
  eager: true,
  import: 'default',
})

const eventModules = import.meta.glob('../content/events/*.json', {
  eager: true,
  import: 'default',
})

const artistModules = import.meta.glob('../content/artists/*.json', {
  eager: true,
  import: 'default',
})

export { site }

function withSlug(modules) {
  return Object.entries(modules).map(([path, doc]) => ({
    ...doc,
    __slug: path.split('/').pop().replace(/\.json$/, ''),
  }))
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function parseDate(value) {
  if (!value || typeof value !== 'string') return null
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return { year: +m[1], month: +m[2] - 1, day: +m[3] }
}

export function formatDateRange(start, end) {
  const s = parseDate(start)
  if (!s) return ''
  const startDay = String(s.day).padStart(2, '0')
  const e = parseDate(end)
  if (!e) return `${startDay} ${MONTHS_SHORT[s.month]} ${s.year}`
  const endDay = String(e.day).padStart(2, '0')
  return `${startDay} ${MONTHS_SHORT[s.month]} – ${endDay} ${MONTHS_SHORT[e.month]} ${e.year}`
}

function withDisplayDate(item) {
  return {
    ...item,
    captionDate: formatDateRange(item.startDate, item.endDate) || item.captionDate || '',
  }
}

export const pages = withSlug(pageModules)

export const exhibitions = withSlug(exhibitionModules).map(withDisplayDate)

export const events = withSlug(eventModules).map(withDisplayDate)

export const artists = withSlug(artistModules)

export function getPage(slug) {
  return pages.find((page) => page.__slug === slug)
}

export function mediaUrl(value) {
  if (!value) return null
  if (typeof value === 'string') {
    if (value.startsWith('/') || value.startsWith('http')) return value
    return `/${value}`
  }
  if (typeof value === 'object') {
    return mediaUrl(value.url || value.path || value.src)
  }
  return null
}

export function mediaList(value) {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return list.map(mediaUrl).filter(Boolean)
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isExhibition(item) {
  return Boolean(item?.subtitle)
}

export function accentImage(item) {
  return mediaUrl(item?.accentImage || item?.heroImage || item?.image)
}

export function exhibitionSlug(item) {
  return item?.slug || item?.__slug || slugify(item?.subtitle)
}

export function getExhibition(slug) {
  return exhibitions.find((item) => exhibitionSlug(item) === slug) || null
}

export function exhibitionEndDate(item) {
  const machine = parseDate(item?.endDate) || parseDate(item?.startDate)
  if (machine) return new Date(machine.year, machine.month, machine.day).getTime()
  const s = item?.captionDate || ''
  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  }
  const matches = [...s.matchAll(/(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})/g)]
  const last = matches[matches.length - 1]
  if (!last) return Number.POSITIVE_INFINITY
  const [, day, mon, year] = last
  const m = months[mon.toLowerCase()]
  return m == null ? Number.POSITIVE_INFINITY : new Date(+year, m, +day).getTime()
}

function exhibitionToCard(item) {
  return {
    image: item.heroImage,
    accentImage: item.heroImage,
    title: item.title,
    subtitle: item.subtitle,
    slug: item.slug,
    status: item.status || 'ongoing',
    captionLabel: item.captionLabel,
    captionDate: item.captionDate,
    captionLocation: item.captionLocation,
  }
}

export function exhibitionCards() {
  return [...exhibitions]
    .sort((a, b) => exhibitionEndDate(a) - exhibitionEndDate(b))
    .map(exhibitionToCard)
}

export function eventSlug(item) {
  return item?.slug || item?.__slug || slugify(item?.title)
}

export function getEvent(slug) {
  return events.find((item) => eventSlug(item) === slug) || null
}

function eventToCard(item) {
  return {
    image: item.image,
    accentImage: item.image,
    title: item.title,
    slug: item.slug,
    status: item.status || 'ongoing',
    captionLabel: item.captionLabel,
    captionDate: item.captionDate,
    captionLocation: item.captionLocation,
  }
}

export function eventCards() {
  return [...events]
    .sort((a, b) => exhibitionEndDate(a) - exhibitionEndDate(b))
    .map(eventToCard)
}

export function artistSlug(item) {
  return item?.slug || item?.__slug || slugify(item?.title)
}

export function getArtist(slug) {
  return artists.find((item) => artistSlug(item) === slug) || null
}

export function orderedArtists(order = []) {
  const bySlug = new Map(artists.map((a) => [artistSlug(a), a]))
  const seen = new Set()
  const result = []
  for (const row of order) {
    const slug = refSlug(row?.artist)
    const doc = slug && bySlug.get(slug)
    if (doc && !seen.has(slug)) {
      result.push(doc)
      seen.add(slug)
    }
  }
  for (const a of artists) {
    if (!seen.has(artistSlug(a))) result.push(a)
  }
  return result
}

export function artistExhibitions(artist) {
  const name = slugify(artist?.title)
  if (!name) return []
  return exhibitions
    .filter((ex) => slugify(ex.title) === name)
    .sort((a, b) => exhibitionEndDate(a) - exhibitionEndDate(b))
}

function refSlug(v) {
  if (!v) return null
  const s = typeof v === 'string' ? v : v.path || v.value || ''
  return s.replace(/^.*\//, '').replace(/\.json$/, '') || null
}

function refType(row) {
  if (row.type === 'exhibition' || row.type === 'event') return row.type
  if (refSlug(row.exhibition)) return 'exhibition'
  if (refSlug(row.event)) return 'event'
  return null
}

export function homeCallout(callout) {
  if (!callout?.enabled) return null
  const feature = callout.feature || callout
  if (refType(feature) === 'event') {
    const ev = refSlug(feature.event)
    const doc = ev && getEvent(ev)
    if (!doc) return null
    return {
      ...eventToCard(doc),
      image: callout.image || doc.image,
      link: `/events/${eventSlug(doc)}`,
    }
  }
  const ex = refSlug(feature.exhibition)
  const doc = ex && getExhibition(ex)
  if (!doc) return null
  return {
    ...exhibitionToCard(doc),
    image: callout.image || doc.heroImage,
    link: `/exhibitions/${exhibitionSlug(doc)}`,
  }
}

export function homeGridCards(grid = []) {
  return grid
    .map((row) => {
      if (refType(row) === 'event') {
        const ev = refSlug(row.event)
        const doc = ev && getEvent(ev)
        return doc ? eventToCard(doc) : null
      }
      const ex = refSlug(row.exhibition)
      const doc = ex && getExhibition(ex)
      return doc ? exhibitionToCard(doc) : null
    })
    .filter(Boolean)
}
