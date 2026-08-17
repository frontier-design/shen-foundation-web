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
