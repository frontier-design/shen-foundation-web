export const MAX_FULL_BYTES = 20 * 1024 * 1024
export const MAX_CARD_BYTES = 8 * 1024 * 1024

const ID = '[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{8}'
const FULL_PATH = new RegExp(`^videos/(${ID})/(\\d{2,4})x(\\d{2,4})\\.mp4$`)
const CARD_PATH = new RegExp(`^videos/(${ID})/card\\.mp4$`)

export function videoPathKind(pathname) {
  if (FULL_PATH.test(pathname)) return 'full'
  if (CARD_PATH.test(pathname)) return 'card'
  return null
}

export function storeHost() {
  const storeId = (process.env.BLOB_READ_WRITE_TOKEN || '').split('_')[3]
  return storeId ? `${storeId.toLowerCase()}.public.blob.vercel-storage.com` : null
}

export function parseVideoUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }
  const host = storeHost()
  if (!host || url.protocol !== 'https:' || url.host !== host || url.search || url.hash) return null
  const match = url.pathname.slice(1).match(FULL_PATH)
  if (!match) return null
  return {
    url: url.href,
    cardUrl: new URL('card.mp4', url).href,
    id: match[1],
    width: Number(match[2]),
    height: Number(match[3]),
  }
}
