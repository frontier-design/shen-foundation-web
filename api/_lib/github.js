const REPO = 'frontier-design/shen-foundation-web'
export const BRANCH = 'preview'
const CONTENT_FILE = /^content\/(exhibitions|events|artists|pages)\/[a-z0-9-]+\.json$/
const ATTEMPTS = 4

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
      'User-Agent': 'shen-foundation-videos',
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

export async function readFile(path) {
  if (!CONTENT_FILE.test(path)) throw new GitHubError(400, 'Not a content file')
  const file = await github(`/contents/${path}?ref=${BRANCH}`)
  const text = decode(file.content)
  return { sha: file.sha, text, data: JSON.parse(text) }
}

export function writeFile(path, { text, sha, message, author }) {
  return github(`/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(text, 'utf8').toString('base64'),
      sha,
      branch: BRANCH,
      ...(author ? { author } : {}),
    }),
  })
}

// Read-modify-write of one content file on preview, retried when someone else
// saved it in between. `change(data)` returns the new data and may throw;
// `message` may be a function of the current data.
export async function updateFile(path, change, { message, author }) {
  for (let attempt = 1; ; attempt++) {
    const file = await readFile(path)
    const text = JSON.stringify(change(file.data), null, 2) + (file.text.endsWith('\n') ? '\n' : '')
    const summary = typeof message === 'function' ? message(file.data) : message
    try {
      return await writeFile(path, { text, sha: file.sha, message: summary, author })
    } catch (error) {
      const conflict = error instanceof GitHubError && (error.status === 409 || error.status === 422)
      if (!conflict || attempt >= ATTEMPTS) throw error
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
    }
  }
}
