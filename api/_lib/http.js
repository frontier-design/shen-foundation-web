import { isAuthed } from './session.js'

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })
}

export const fail = (message, status = 400) => json({ error: message }, status)

export function sameOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function guard(request, { auth = true } = {}) {
  if (request.method !== 'GET' && !sameOrigin(request)) return fail('Forbidden', 403)
  if (auth && !isAuthed(request)) return fail('Please log in again.', 401)
  return null
}

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
