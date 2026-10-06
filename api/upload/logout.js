import { guard, json } from '../_lib/http.js'
import { clearedCookie } from '../_lib/session.js'

export function POST(request) {
  const denied = guard(request, { auth: false })
  if (denied) return denied
  return json({ ok: true }, 200, { 'Set-Cookie': clearedCookie() })
}
