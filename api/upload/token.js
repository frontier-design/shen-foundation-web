import { handleUpload } from '@vercel/blob/client'
import { fail, guard, json, readJson } from '../_lib/http.js'
import { MAX_CARD_BYTES, MAX_FULL_BYTES, videoPathKind } from '../_lib/videos.js'

const ONE_YEAR = 365 * 24 * 60 * 60

export async function POST(request) {
  const denied = guard(request)
  if (denied) return denied
  const body = await readJson(request)
  if (body?.type !== 'blob.generate-client-token') return fail('Unsupported request')
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        const kind = videoPathKind(pathname)
        if (!kind) throw new Error('Invalid video file name')
        return {
          allowedContentTypes: ['video/mp4'],
          maximumSizeInBytes: kind === 'full' ? MAX_FULL_BYTES : MAX_CARD_BYTES,
          validUntil: Date.now() + 15 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: ONE_YEAR,
        }
      },
    })
    return json(result)
  } catch (error) {
    console.error(error)
    return fail(error.message)
  }
}
