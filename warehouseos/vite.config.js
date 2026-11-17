import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages + HashRouter compatible build.
// `base: './'` makes every emitted asset URL relative to index.html, so the
// build works whether it is served from the repository root, a project
// sub-path (https://user.github.io/<repo>/), or a custom domain.
// HashRouter guarantees that refreshing any deep link never returns a 404,
// because the browser always loads index.html and the route lives after `#`.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
})
