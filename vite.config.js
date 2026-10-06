import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isPreview =
  process.env.VERCEL_GIT_COMMIT_REF === 'preview' || process.env.VERCEL_ENV === 'preview'

const noindex = () => ({
  name: 'preview-noindex',
  transformIndexHtml: () =>
    isPreview
      ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' }]
      : [],
})

const SKIPPED_HEADERS = new Set(['connection', 'content-length', 'transfer-encoding', 'keep-alive'])

const apiDev = () => ({
  name: 'api-dev',
  configureServer(server) {
    const env = ['.env', '.env.local']
      .filter((name) => existsSync(name))
      .reduce((all, name) => ({ ...all, ...parseEnv(readFileSync(name, 'utf8')) }), {})
    Object.keys(env).forEach((key) => {
      process.env[key] ??= env[key]
    })
    server.middlewares.use(async (req, res, next) => {
      const { pathname } = new URL(req.url, 'http://localhost')
      if (!/^\/api\/[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(pathname)) return next()
      const file = `${pathname}.js`
      if (!existsSync(fileURLToPath(new URL(`.${file}`, import.meta.url)))) return next()
      try {
        const handler = (await server.ssrLoadModule(file))[req.method]
        if (!handler) {
          res.statusCode = 405
          return res.end()
        }
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const headers = Object.entries(req.headers).filter(([key]) => !SKIPPED_HEADERS.has(key))
        const response = await handler(
          new Request(new URL(req.url, `http://${req.headers.host}`), {
            method: req.method,
            headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          }),
        )
        res.statusCode = response.status
        response.headers.forEach((value, key) => {
          if (key !== 'set-cookie') res.setHeader(key, value)
        })
        const cookies = response.headers.getSetCookie()
        if (cookies.length) res.setHeader('set-cookie', cookies)
        res.end(Buffer.from(await response.arrayBuffer()))
      } catch (error) {
        next(error)
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), noindex(), apiDev()],
  define: {
    'import.meta.env.VITE_PREVIEW': JSON.stringify(isPreview),
    'import.meta.env.VITE_IMAGE_CDN': JSON.stringify(process.env.VERCEL === '1'),
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        upload: fileURLToPath(new URL('upload.html', import.meta.url)),
      },
    },
  },
})
