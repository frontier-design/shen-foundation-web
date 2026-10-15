// Build step: writes dist/<route>/index.html for every page with its own
// title, description, canonical URL and share image (crawlers and link
// previews don't run the app), plus robots.txt and, in production, sitemap.xml.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { routeMeta, shareImageUrl, siteRoutes, SITE_NAME, SITE_URL } from '../../src/meta.js'

const readFolder = (dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ ...JSON.parse(readFileSync(join(dir, file), 'utf8')), __slug: basename(file, '.json') }))

const escape = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function headTags(meta) {
  const url = `${SITE_URL}${meta.path === '/' ? '/' : meta.path}`
  const image = shareImageUrl(meta.image)
  const tags = [
    `<title>${escape(meta.title)}</title>`,
    meta.description && `<meta name="description" content="${escape(meta.description)}" />`,
    `<link rel="canonical" href="${escape(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escape(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    meta.description && `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    image && `<meta property="og:image" content="${escape(image)}" />`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escape(meta.title)}" />`,
    meta.description && `<meta name="twitter:description" content="${escape(meta.description)}" />`,
    image && `<meta name="twitter:image" content="${escape(image)}" />`,
  ]
  return tags.filter(Boolean).join('\n  ')
}

export default function pageMeta({ isPreview }) {
  let outDir
  let root
  return {
    name: 'page-meta',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const content = join(root, 'content')
      const data = {
        pages: Object.fromEntries(readFolder(join(content, 'pages')).map((page) => [page.__slug, page])),
        exhibitions: readFolder(join(content, 'exhibitions')),
        events: readFolder(join(content, 'events')),
        artists: readFolder(join(content, 'artists')),
      }
      const template = readFileSync(join(outDir, 'index.html'), 'utf8')
      const routes = siteRoutes(data)

      for (const route of routes) {
        const meta = routeMeta(route, data)
        if (!meta) continue
        const html = template.replace(/<title>[^<]*<\/title>/, headTags(meta))
        const file = route === '/' ? join(outDir, 'index.html') : join(outDir, route.slice(1), 'index.html')
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, html)
      }

      writeFileSync(
        join(outDir, 'robots.txt'),
        isPreview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      )
      if (!isPreview) {
        const urls = routes.map((route) => `  <url><loc>${escape(`${SITE_URL}${route}`)}</loc></url>`).join('\n')
        writeFileSync(
          join(outDir, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        )
      }
    },
  }
}
