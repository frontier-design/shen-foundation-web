export class ContentError extends Error {}

export const STATUS_FIELD = 'videoStatus'
const MAX_CAPTION = 300

const SPOTS = {
  exhibitions: {
    hero: { path: ['heroVideo'], label: 'hero', cards: 'also' },
    gallery: { append: 'gallery', label: 'gallery' },
  },
  events: { background: { path: ['imageVideo'], label: 'background', cards: 'also' } },
  artists: { thumbnail: { path: ['thumbnailVideo'], label: 'thumbnail', cards: 'also' } },
  home: { callout: { path: ['callout', 'imageVideo'], label: 'homepage callout' } },
  about: {
    hero: { path: ['heroVideo'], label: 'hero' },
    person: { person: true, label: 'photo', cards: 'only' },
  },
}

const FILE = /^content\/(?:(exhibitions|events|artists)\/([a-z0-9]+(?:-[a-z0-9]+)*)|pages\/(home|about))\.json$/

const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// The content file a video can be added to, or null.
export function resolveFile(file) {
  const match = String(file || '').match(FILE)
  if (!match) return null
  const type = match[1] || match[3]
  return { file, type, slug: match[2] || match[3] }
}

export function resolveSpot(target, spot) {
  const config = SPOTS[target.type][spot]
  if (!config) throw new ContentError('Choose where the video should go ("Which spot?") and try again.')
  return { ...target, spot, ...config }
}

function personIndex(data, name) {
  if (!String(name || '').trim()) {
    throw new ContentError("Type the person's name (as in their Name field) and try again.")
  }
  const index = (data.people || []).findIndex((person) => slugify(person?.name) === slugify(name))
  if (index < 0) {
    throw new ContentError(`There's no person called "${String(name).trim()}" on the About page. Check the spelling against their Name field and try again.`)
  }
  return index
}

export function spotName(target, data, { person } = {}) {
  return target.person ? `${data.people[personIndex(data, person)].name}'s photo` : `the ${target.label}`
}

export function describe(target, data, { person } = {}) {
  if (target.type === 'home') return 'Homepage callout'
  if (target.type === 'about') {
    return target.person ? `About page, ${data.people?.[personIndex(data, person)]?.name} photo` : 'About page hero'
  }
  const name = [data.title, data.subtitle].filter(Boolean).join(' — ') || target.slug
  return `${name} ${target.label}`
}

export function applyVideo(target, data, { url, caption = '', person } = {}) {
  if (target.append) {
    const list = Array.isArray(data[target.append]) ? data[target.append] : []
    const item = { type: 'video', video: url, caption: String(caption || '').trim().slice(0, MAX_CAPTION) }
    return { ...data, [target.append]: [...list, item] }
  }
  const path = target.person ? ['people', personIndex(data, person), 'photoVideo'] : target.path
  const next = structuredClone(data)
  let node = next
  path.slice(0, -1).forEach((key) => {
    if (node[key] == null || typeof node[key] !== 'object') node[key] = {}
    node = node[key]
  })
  node[path.at(-1)] = url
  return next
}

export const withStatus = (data, message) => ({ ...data, [STATUS_FIELD]: message })
