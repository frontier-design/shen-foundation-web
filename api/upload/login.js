import { fail, guard, json, readJson } from '../_lib/http.js'
import { checkPassword, isConfigured, sessionCookie } from '../_lib/session.js'

export async function POST(request) {
  const denied = guard(request, { auth: false })
  if (denied) return denied
  if (!isConfigured()) return fail('The upload page is not set up yet.', 500)
  const body = await readJson(request)
  if (!checkPassword(body?.password)) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return fail('Wrong password.', 401)
  }
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie() })
}
