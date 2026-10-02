export const IMAGE_WIDTHS = [640, 960, 1280, 1920]
export const IMAGE_QUALITY = 80

export const SIZES = {
  fullBleed: 'max(100vw, 150vh)',
  halfTall: '(max-width: 1024px) max(100vw, 75vh), max(50vw, 150vh)',
  card: '(max-width: 768px) 100vw, 55vw',
}

const ENABLED = import.meta.env.VITE_IMAGE_CDN === true
const OPTIMIZABLE = /^\/media\/[^?#]+\.(jpe?g|png|webp|avif)$/i

function optimizable(src) {
  return ENABLED && typeof src === 'string' && OPTIMIZABLE.test(src)
}

export function imageUrl(src, width = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]) {
  if (!optimizable(src)) return src
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${IMAGE_QUALITY}`
}

export function imageSrcSet(src) {
  if (!optimizable(src)) return undefined
  return IMAGE_WIDTHS.map((w) => `${imageUrl(src, w)} ${w}w`).join(', ')
}

export function imageProps(src, sizes) {
  if (!optimizable(src)) return { src }
  return { src: imageUrl(src), srcSet: imageSrcSet(src), sizes }
}
