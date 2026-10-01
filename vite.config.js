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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), noindex()],
  define: {
    'import.meta.env.VITE_PREVIEW': JSON.stringify(isPreview),
  },
})
