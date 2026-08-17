import site from '../content/site.json'

const pageModules = import.meta.glob('../content/pages/*.json', {
  eager: true,
  import: 'default',
})

export { site }

export const pages = Object.values(pageModules)

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
