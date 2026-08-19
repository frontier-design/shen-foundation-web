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

export { site }

export const pages = Object.values(pageModules)

export const exhibitions = Object.values(exhibitionModules)

export const events = Object.values(eventModules)

export function getPage(slug) {
  return pages.find((page) => page.slug === slug)
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

export function exhibitionSlug(item) {
  return item?.slug || slugify(item?.subtitle)
}

export function getExhibition(slug) {
  return exhibitions.find((item) => exhibitionSlug(item) === slug) || null
}

export function exhibitionEndDate(item) {
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
  return item?.slug || slugify(item?.title)
}

export function getEvent(slug) {
  return events.find((item) => eventSlug(item) === slug) || null
}

function eventToCard(item) {
  return {
    image: item.image,
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

function refSlug(v) {
  if (!v) return null
  const s = typeof v === 'string' ? v : v.path || v.value || ''
  return s.replace(/^.*\//, '').replace(/\.json$/, '') || null
}

export function homeGridCards(grid = []) {
  return grid
    .map((row) => {
      const ex = refSlug(row.exhibition)
      if (ex) {
        const doc = getExhibition(ex)
        return doc ? exhibitionToCard(doc) : null
      }
      const ev = refSlug(row.event)
      if (ev) {
        const doc = getEvent(ev)
        return doc ? eventToCard(doc) : null
      }
      return null
    })
    .filter(Boolean)
}
