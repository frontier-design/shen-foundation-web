import { contentPatches, contentTexts, recentContentCommits } from './github.js'

export const KEEP_DAYS = 30
const BRANCHES = ['main', 'preview']
const PARALLEL = 8
const FOLDER = /videos\/([a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{8})\//g

export const folderOf = (pathname) => pathname.split('/')[1]

const foldersIn = (text) => [...String(text).matchAll(FOLDER)].map((match) => match[1])

// Video folders mentioned in content on main or preview now, or in any content
// change on either branch in the last KEEP_DAYS days.
export async function referencedFolders(now) {
  const since = new Date(now - KEEP_DAYS * 24 * 60 * 60 * 1000)
  const folders = new Set()
  const add = (text) => foldersIn(text).forEach((folder) => folders.add(folder))
  const shas = new Set()
  for (const branch of BRANCHES) {
    ;(await contentTexts(branch)).forEach(add)
    ;(await recentContentCommits(branch, since)).forEach((sha) => shas.add(sha))
  }
  const incomplete = []
  const queue = [...shas]
  const worker = async () => {
    for (let sha = queue.shift(); sha; sha = queue.shift()) {
      const { patches, complete } = await contentPatches(sha)
      patches.forEach(add)
      if (!complete) incomplete.push(sha)
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker))
  return { folders, incomplete, commits: shas.size }
}

// Groups blobs by video folder; a folder is removed only when nothing references
// it and its newest file is at least KEEP_DAYS days old.
export function planCleanup(blobs, referenced, now) {
  const cutoff = now - KEEP_DAYS * 24 * 60 * 60 * 1000
  const folders = new Map()
  for (const blob of blobs) {
    const name = folderOf(blob.pathname)
    const folder = folders.get(name) || { name, blobs: [], size: 0, newest: 0 }
    folder.blobs.push(blob)
    folder.size += blob.size
    folder.newest = Math.max(folder.newest, new Date(blob.uploadedAt).getTime())
    folders.set(name, folder)
  }
  const plan = { used: [], recent: [], remove: [] }
  for (const folder of folders.values()) {
    if (referenced.has(folder.name)) plan.used.push(folder)
    else if (folder.newest > cutoff) plan.recent.push(folder)
    else plan.remove.push(folder)
  }
  return plan
}
