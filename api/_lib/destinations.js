const HOME = 'content/pages/home.json'
const ABOUT = 'content/pages/about.json'
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_CAPTION = 300

const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const refSlug = (value) => slugify(String(value || '').split('/').pop().replace(/\.json$/, ''))
const fileSlug = (path) => path.split('/').pop().replace(/\.json$/, '')
const docName = (doc) => [doc.title, doc.subtitle].filter(Boolean).join(' — ')

export function parseDestination(id) {
  const [kind, key = '', check = ''] = String(id || '').split(':')
  const doc = (folder) => (SLUG.test(key) ? `content/${folder}/${key}.json` : null)
  const make = (file, rest) => (file ? { id, kind, file, ...rest } : null)
  switch (kind) {
    case 'home-callout':
      return make(HOME, { path: ['callout', 'imageVideo'] })
    case 'about-hero':
      return make(ABOUT, { path: ['heroVideo'] })
    case 'about-person': {
      const index = Number(key)
      if (!Number.isInteger(index) || index < 0) return null
      return make(ABOUT, {
        path: ['people', index, 'photoVideo'],
        matches: (data) => slugify(data.people?.[index]?.name) === check,
      })
    }
    case 'exhibition-hero':
      return make(doc('exhibitions'), { path: ['heroVideo'] })
    case 'exhibition-gallery':
      return make(doc('exhibitions'), { append: 'gallery' })
    case 'event':
      return make(doc('events'), { path: ['imageVideo'] })
    case 'artist':
      return make(doc('artists'), { path: ['thumbnailVideo'] })
    default:
      return null
  }
}

export function describe(destination, data) {
  switch (destination.kind) {
    case 'home-callout':
      return 'Homepage callout'
    case 'about-hero':
      return 'About page hero'
    case 'about-person':
      return `About page, ${data.people?.[destination.path[1]]?.name || 'person'}`
    case 'exhibition-hero':
      return `${docName(data)} hero`
    case 'exhibition-gallery':
      return `${docName(data)} gallery`
    case 'event':
      return `${data.title || 'Event'} background`
    case 'artist':
      return `${data.title || 'Artist'} thumbnail`
    default:
      return destination.id
  }
}

export function applyVideo(destination, data, url, caption = '') {
  if (destination.matches && !destination.matches(data)) {
    throw new Error('This item changed in the CMS. Reload the page and pick it again.')
  }
  if (destination.append) {
    const list = Array.isArray(data[destination.append]) ? data[destination.append] : []
    const item = { type: 'video', video: url, caption: String(caption).trim().slice(0, MAX_CAPTION) }
    return { ...data, [destination.append]: [...list, item] }
  }
  const next = structuredClone(data)
  let node = next
  destination.path.slice(0, -1).forEach((key) => {
    if (node[key] == null || typeof node[key] !== 'object') {
      if (typeof key === 'number') throw new Error('This item no longer exists. Reload the page.')
      node[key] = {}
    }
    node = node[key]
  })
  node[destination.path.at(-1)] = url
  return next
}

const currentValue = (data, path) => path.reduce((node, key) => node?.[key], data)

export function buildDestinations(files) {
  const home = files.get(HOME) || {}
  const about = files.get(ABOUT) || {}
  const docs = (folder) =>
    [...files]
      .filter(([path]) => path.startsWith(`content/${folder}/`))
      .map(([path, data]) => ({ slug: fileSlug(path), data }))
      .sort((a, b) => docName(a.data).localeCompare(docName(b.data)))

  const exhibitions = docs('exhibitions')
  const events = docs('events')
  const inCarousel = new Set((home.heroSlides || []).map(refSlug))

  const featureName = () => {
    const feature = home.callout?.feature
    const ref = refSlug(feature?.[feature?.type])
    const pool = feature?.type === 'event' ? events : exhibitions
    const match = pool.find(
      ({ slug, data }) => slug === ref || slugify(feature?.type === 'event' ? data.title : data.subtitle) === ref,
    )
    return match ? docName(match.data) : null
  }

  const item = (id, label, data, name, extra = {}) => {
    const destination = parseDestination(id)
    return {
      id,
      label,
      name,
      replaces: destination.path ? Boolean(currentValue(data, destination.path)) : false,
      ...extra,
    }
  }

  return [
    {
      group: 'Homepage',
      items: [
        item('home-callout', 'Homepage callout', home, 'home-callout', {
          note: featureName() ? `Currently featuring ${featureName()}` : undefined,
        }),
      ],
    },
    {
      group: 'Exhibitions',
      items: exhibitions.flatMap(({ slug, data }) => [
        item(`exhibition-hero:${slug}`, `${docName(data)}: hero video`, data, slug, {
          note: inCarousel.has(slug) || inCarousel.has(slugify(data.subtitle))
            ? 'Also plays in the homepage carousel'
            : undefined,
        }),
        item(`exhibition-gallery:${slug}`, `${docName(data)}: add to gallery`, data, slug, { caption: true }),
      ]),
    },
    {
      group: 'Events',
      items: events.map(({ slug, data }) =>
        item(`event:${slug}`, `${data.title || slug}: background video`, data, slug),
      ),
    },
    {
      group: 'Artists',
      items: docs('artists').map(({ slug, data }) =>
        item(`artist:${slug}`, `${data.title || slug}: thumbnail video`, data, slug),
      ),
    },
    {
      group: 'About page',
      items: [
        item('about-hero', 'About page: hero video', about, 'about'),
        ...(about.people || []).map((person, index) =>
          item(
            `about-person:${index}:${slugify(person.name)}`,
            `About page: ${person.name || `person ${index + 1}`} photo video`,
            about,
            `about-${slugify(person.name) || index + 1}`,
          ),
        ),
      ],
    },
  ].filter((group) => group.items.length > 0)
}
