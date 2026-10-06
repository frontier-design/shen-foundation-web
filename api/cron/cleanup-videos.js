import { del, list } from '@vercel/blob'
import { KEEP_DAYS, planCleanup, referencedFolders } from '../_lib/cleanup.js'
import { fail, hasBearer, json } from '../_lib/http.js'

// Logs what would be deleted without deleting anything. Switch to false once a
// dry run's log looks right.
const DRY_RUN = true

const megabytes = (bytes) => `${(bytes / 1_000_000).toFixed(1)} MB`

async function listVideos() {
  const blobs = []
  let cursor
  do {
    const page = await list({ prefix: 'videos/', limit: 1000, cursor })
    blobs.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return blobs
}

// Weekly (vercel.json "crons"): deletes uploaded videos that no content on main
// or preview has used for KEEP_DAYS days.
export async function GET(request) {
  if (!hasBearer(request, process.env.CRON_SECRET)) return fail('Unauthorized', 401)
  const now = Date.now()
  try {
    const [blobs, referenced] = await Promise.all([listVideos(), referencedFolders(now)])
    const plan = planCleanup(blobs, referenced.folders, now)
    const blocked = referenced.incomplete.length > 0
    const deleting = !DRY_RUN && !blocked && plan.remove.length > 0
    const summary = {
      dryRun: DRY_RUN,
      blocked: blocked ? `GitHub didn't return the content diff of ${referenced.incomplete.join(', ')}; nothing deleted` : null,
      keepDays: KEEP_DAYS,
      commitsChecked: referenced.commits,
      used: plan.used.length,
      recentlyUnused: plan.recent.map((folder) => folder.name),
      [deleting ? 'deleted' : 'wouldDelete']: plan.remove.map((folder) => `${folder.name} (${megabytes(folder.size)})`),
      freed: megabytes(plan.remove.reduce((total, folder) => total + folder.size, 0)),
    }
    console.log(`[cleanup-videos] ${JSON.stringify(summary)}`)
    if (deleting) {
      const urls = plan.remove.flatMap((folder) => folder.blobs.map((blob) => blob.url))
      for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100))
    }
    return json(summary)
  } catch (error) {
    console.error('[cleanup-videos] aborted, nothing deleted:', error)
    return fail('Cleanup failed; nothing was deleted.', 500)
  }
}
