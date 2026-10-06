import { createHash, timingSafeEqual } from 'node:crypto'
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client'
import { fail, json, readJson } from '../_lib/http.js'
import { parseVideoPath } from '../_lib/videos.js'

const ONE_YEAR = 365 * 24 * 60 * 60
const digest = (value) => createHash('sha256').update(String(value)).digest()

function authorized(request) {
  const secret = process.env.VIDEO_JOB_SECRET
  const header = request.headers.get('authorization') || ''
  return Boolean(secret) && timingSafeEqual(digest(header), digest(`Bearer ${secret}`))
}

export async function POST(request) {
  if (!authorized(request)) return fail('Unauthorized', 401)
  const body = await readJson(request)
  const video = parseVideoPath(body?.pathname)
  if (!video) return fail('Invalid video path')
  try {
    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname: body.pathname,
      allowedContentTypes: [video.contentType],
      maximumSizeInBytes: video.size,
      validUntil: Date.now() + 30 * 60 * 1000,
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: ONE_YEAR,
    })
    return json({ clientToken, contentType: video.contentType })
  } catch (error) {
    console.error(error)
    return fail('Could not create an upload token', 500)
  }
}
