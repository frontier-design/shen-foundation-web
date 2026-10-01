# Shen Foundation Web

## Previewing and publishing content

The site has two branches:

- **`preview`**: the working branch. Pages CMS edits it, and Vercel deploys it to the preview site: `<PREVIEW_URL>`
- **`main`**: the live site, https://shen-foundation-web.vercel.app

The preview site shows a "Preview" badge in the corner and is hidden from search engines. The live site has neither.

### Editors

1. Edit content in [Pages CMS](https://app.pagescms.org). It opens on `preview`, and every save becomes a commit there.
2. Wait about a minute, then check your changes on the preview site: `<PREVIEW_URL>`
3. When everything looks right, click **Publish to live site** in the Pages CMS sidebar and confirm.
4. The live site updates about a minute later.

Publish makes *everything* currently on `preview` live, including other editors' unpublished changes.

### Developers

- Commit code to `preview`, or to a feature branch that you merge into `preview`. Vercel builds a preview deployment for each branch.
- Changes reach `main` only through **Publish to live site**. Never commit or push to `main` directly.
- `.github/workflows/publish.yml` merges `preview` into `main` and pushes. If there's a merge conflict it fails without pushing; resolve the conflict on `preview`, then publish again.
- `.github/workflows/sync-preview.yml` merges `main` back into `preview` whenever someone pushes to `main` directly, so the branches don't drift. Its own pushes (and Publish's) use `GITHUB_TOKEN`, which doesn't trigger workflows, so the two can't loop.
- Preview builds are detected from Vercel's `VERCEL_GIT_COMMIT_REF` / `VERCEL_ENV` in `vite.config.js`. They add the noindex tag and the preview badge.
