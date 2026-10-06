import { createHash, timingSafeEqual } from 'node:crypto'

const digest = (value) => createHash('sha256').update(String(value)).digest()

// True when the request carries "Authorization: Bearer <secret>" (timing-safe).
export function hasBearer(request, secret) {
  const header = request.headers.get('authorization') || ''
  return Boolean(secret) && timingSafeEqual(digest(header), digest(`Bearer ${secret}`))
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })
}

export const fail = (message, status = 400) => json({ error: message }, status)

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
