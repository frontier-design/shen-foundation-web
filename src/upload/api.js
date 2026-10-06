import { upload } from '@vercel/blob/client'

const MULTIPART_FROM = 8 * 1024 * 1024
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(path, body) {
  const response = await fetch(`/api/upload/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, data.error || 'Something went wrong. Please try again.')
  return data
}

export const fetchDestinations = () => request('destinations')
export const login = (password) => request('login', { password })
export const logout = () => request('logout', {})
export const saveVideo = (destination, url, caption) => request('commit', { destination, url, caption })

const randomId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => ALPHABET[byte % ALPHABET.length]).join('')

export function videoPaths(name, width, height) {
  const base = (name || 'video').slice(0, 40).replace(/-+$/, '') || 'video'
  const folder = `videos/${base}-${randomId()}`
  return { full: `${folder}/${width}x${height}.mp4`, card: `${folder}/card.mp4` }
}

export function uploadVideo(pathname, body, onProgress) {
  return upload(pathname, body, {
    access: 'public',
    handleUploadUrl: '/api/upload/token',
    contentType: 'video/mp4',
    multipart: body.size > MULTIPART_FROM,
    onUploadProgress: ({ loaded }) => onProgress(loaded),
  })
}
