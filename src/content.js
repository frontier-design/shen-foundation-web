import site from '../content/site.json'

const pageModules = import.meta.glob('../content/pages/*.json', {
  eager: true,
  import: 'default',
})

const exhibitionModules = import.meta.glob('../content/exhibitions/*.json', {
  eager: true,
  import: 'default',
})

export { site }

export const pages = Object.values(pageModules)

export const exhibitions = Object.values(exhibitionModules)

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
  return item?.slug || slugify(item?.title)
}

export function getExhibition(slug) {
  return exhibitions.find((item) => exhibitionSlug(item) === slug) || null
}
