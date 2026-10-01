# Shen Foundation Web

## Previewing and publishing content

The site has two branches:

- **`preview`**: the working branch. Pages CMS edits it, and Vercel deploys it to the preview site: https://shen-foundation-web-git-preview-frontier-design.vercel.app/
- **`main`**: the live site, https://shen-foundation-web.vercel.app

The preview site shows a "Preview" badge in the corner and is hidden from search engines. The live site has neither.

### Editors

1. Open [Pages CMS](https://app.pagescms.org) and check that the branch picker shows **`preview`**. Pages CMS can remember the last branch you used, so check every time; edits saved on `main` skip the preview step.
2. Edit content. Every save becomes a commit on `preview`.
3. Wait about a minute, then check your changes on the preview site: https://shen-foundation-web-git-preview-frontier-design.vercel.app/
4. When everything looks right, click **Publish to live site** in the Pages CMS sidebar and confirm.
5. The live site updates about a minute later.

Publish sends *everything* currently on `preview` live at once, including other people's unfinished edits. Check with anyone else who is editing before you publish.

### Developers

- Pull `preview` before starting work; editors commit to it through Pages CMS.
- Commit code to `preview`, or to a feature branch that you merge into `preview`. Vercel builds a preview deployment for each branch.
- Changes reach `main` only through **Publish to live site**. Never commit or push to `main` directly.
- `.github/workflows/publish.yml` merges `preview` into `main` and pushes. If there's a merge conflict it fails without pushing; resolve the conflict on `preview`, then publish again.
- `.github/workflows/sync-preview.yml` copies anything pushed to `main` directly (for example, a Pages CMS edit accidentally saved on `main`) back into `preview`, so the branches don't drift. If that merge conflicts, it fails without pushing; merge `main` into `preview` by hand. Its own pushes and Publish's use `GITHUB_TOKEN`, which doesn't trigger workflows, so the two can't loop.
- Preview builds are detected from Vercel's `VERCEL_GIT_COMMIT_REF` / `VERCEL_ENV` in `vite.config.js`. They add the noindex tag and the preview badge.
