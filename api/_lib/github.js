const REPO = 'frontier-design/shen-foundation-web'
export const BRANCH = 'preview'
const CONTENT_FILE = /^content\/(exhibitions|events|artists|pages)\/[a-z0-9-]+\.json$/

export class GitHubError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function github(path, init = {}) {
  const token = process.env.GITHUB_CONTENT_TOKEN
  if (!token) throw new GitHubError(500, 'GITHUB_CONTENT_TOKEN is not set')
  const response = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'shen-foundation-upload',
      ...init.headers,
    },
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new GitHubError(response.status, `GitHub ${response.status}: ${detail.slice(0, 300)}`)
  }
  return response.json()
}

const decode = (base64) => Buffer.from(base64, 'base64').toString('utf8')

export async function readContent() {
  const tree = await github(`/git/trees/${BRANCH}?recursive=1`)
  const files = tree.tree.filter((entry) => entry.type === 'blob' && CONTENT_FILE.test(entry.path))
  const entries = await Promise.all(
    files.map(async ({ path, sha }) => {
      const blob = await github(`/git/blobs/${sha}`)
      try {
        return [path, JSON.parse(decode(blob.content))]
      } catch {
        return null
      }
    }),
  )
  return new Map(entries.filter(Boolean))
}

export async function readFile(path) {
  if (!CONTENT_FILE.test(path)) throw new GitHubError(400, 'Not a content file')
  const file = await github(`/contents/${path}?ref=${BRANCH}`)
  const text = decode(file.content)
  return { sha: file.sha, text, data: JSON.parse(text) }
}

export function writeFile(path, { text, sha, message }) {
  return github(`/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(text, 'utf8').toString('base64'),
      sha,
      branch: BRANCH,
    }),
  })
}
