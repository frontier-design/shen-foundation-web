import data from '../scripts/optimize-images/embeds.json'
import { parseEmbed, embedKey } from './embedUrl.js'

// The parsed link plus the thumbnail, title and size fetched for it, or null.
export function embedInfo(value) {
  const embed = parseEmbed(value)
  if (!embed) return null
  const entry = data.embeds[embedKey(embed)] || {}
  const width = entry.width || 16
  const height = entry.height || 9
  return { embed, thumbnail: entry.thumbnail || null, title: entry.title || '', width, height, ratio: width / height }
}
