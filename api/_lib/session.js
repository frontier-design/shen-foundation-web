import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE = 'upload_session'
const PATH = '/api/upload'
const MAX_AGE = 30 * 24 * 60 * 60

export const isConfigured = () =>
  Boolean(process.env.UPLOAD_PASSWORD && process.env.UPLOAD_SESSION_SECRET)

const sign = (value) =>
  createHmac('sha256', `${process.env.UPLOAD_SESSION_SECRET}\n${process.env.UPLOAD_PASSWORD}`)
    .update(value)
    .digest('base64url')

const digest = (value) => createHash('sha256').update(String(value)).digest()

const safeEqual = (a, b) => timingSafeEqual(digest(a), digest(b))

export function checkPassword(password) {
  return isConfigured() && typeof password === 'string' && safeEqual(password, process.env.UPLOAD_PASSWORD)
}

export function sessionCookie() {
  const expires = String(Date.now() + MAX_AGE * 1000)
  return `${COOKIE}=${expires}.${sign(expires)}; Max-Age=${MAX_AGE}; Path=${PATH}; HttpOnly; Secure; SameSite=Strict`
}

export const clearedCookie = () => `${COOKIE}=; Max-Age=0; Path=${PATH}; HttpOnly; Secure; SameSite=Strict`

export function isAuthed(request) {
  if (!isConfigured()) return false
  const cookies = request.headers.get('cookie') || ''
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
  if (!match) return false
  const [expires, signature] = match[1].split('.')
  if (!expires || !signature || !(Number(expires) > Date.now())) return false
  return safeEqual(signature, sign(expires))
}
