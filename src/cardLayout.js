import { mediaUrl } from './content.js'
import { dimensions } from './images.js'
import { blobVideo } from './videos.js'

// Card grids (two columns, left/right): each image keeps its own shape, but
// - never taller than TALLEST (cropped to it, keeping the focus point);
// - two cards side by side never end at (nearly) the same height: if their
//   heights are within MIN_DIFFERENCE, one of them (alternating sides row by
//   row) is cropped shorter.
// `items` are { image, video } (media links); returns one aspect ratio each.
const TALLEST = 1
const WIDEST = 2.4
const MIN_DIFFERENCE = 0.15
const FALLBACK = 4 / 3

const shapeOf = (item) => {
  const video = blobVideo(item?.video)
  const size = video || dimensions(mediaUrl(item?.image))
  const ratio = size?.width && size?.height ? size.width / size.height : FALLBACK
  return Math.min(WIDEST, Math.max(TALLEST, ratio))
}

export function naturalRatios(items) {
  const ratios = items.map(shapeOf)
  for (let left = 0, row = 0; left + 1 < ratios.length; left += 2, row += 1) {
    const right = left + 1
    const heightLeft = 1 / ratios[left]
    const heightRight = 1 / ratios[right]
    if (Math.abs(heightLeft - heightRight) / Math.max(heightLeft, heightRight) >= MIN_DIFFERENCE) continue
    const [shorten, keep] = row % 2 === 0 ? [right, left] : [left, right]
    const shorter = ratios[keep] * (1 + MIN_DIFFERENCE + 0.1)
    ratios[shorten] = shorter <= WIDEST ? shorter : Math.max(TALLEST, ratios[keep] / (1 + MIN_DIFFERENCE + 0.1))
  }
  return ratios.map((ratio) => Number(ratio.toFixed(4)))
}
