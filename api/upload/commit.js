import { head } from '@vercel/blob'
import { applyVideo, describe, parseDestination } from '../_lib/destinations.js'
import { GitHubError, readFile, writeFile } from '../_lib/github.js'
import { fail, guard, json, readJson } from '../_lib/http.js'
import { parseVideoUrl } from '../_lib/videos.js'

const ATTEMPTS = 4

const exists = (url) => head(url).then(() => true, () => false)

export async function POST(request) {
  const denied = guard(request)
  if (denied) return denied
  const body = await readJson(request)
  const destination = parseDestination(body?.destination)
  if (!destination) return fail('Unknown destination')
  const video = parseVideoUrl(body?.url)
  if (!video) return fail('Not a video from the upload store')
  const [full, card] = await Promise.all([exists(video.url), exists(video.cardUrl)])
  if (!full || !card) return fail('The upload did not finish. Please try again.')

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const file = await readFile(destination.file)
      const next = applyVideo(destination, file.data, video.url, body.caption)
      const label = describe(destination, file.data)
      const ending = file.text.endsWith('\n') ? '\n' : ''
      const result = await writeFile(destination.file, {
        text: JSON.stringify(next, null, 2) + ending,
        sha: file.sha,
        message: `Add video to ${label} (via upload page)`,
      })
      return json({ ok: true, label, commit: result.commit?.sha })
    } catch (error) {
      const conflict = error instanceof GitHubError && (error.status === 409 || error.status === 422)
      if (conflict && attempt < ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
        continue
      }
      console.error(error)
      if (error instanceof GitHubError) {
        return fail(
          error.status === 404
            ? 'This item no longer exists in the CMS. Reload the page.'
            : 'Could not save to the CMS. The video is uploaded; please try again.',
          502,
        )
      }
      return fail(error.message, 409)
    }
  }
}
