import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import legacy from '@vitejs/plugin-legacy'

/** Dev-only：WebDAV 反向代理，绕过浏览器 CORS */
const webdavProxy = (): Plugin => ({
  name: 'webdav-proxy',
  configureServer(server) {
    server.middlewares.use('/__webdav', async (req, res) => {
      const targetUrl = req.headers['x-webdav-url'] as string | undefined
      if (!targetUrl) {
        res.statusCode = 400
        res.end('Missing x-webdav-url header')
        return
      }
      try {
        const url = new URL(targetUrl)
        const mod = url.protocol === 'https:' ? await import('node:https') : await import('node:http')
        const fwdHeaders: Record<string, string> = {}
        for (const [k, v] of Object.entries(req.headers)) {
          if (['x-webdav-url', 'host', 'origin', 'referer', 'connection'].includes(k)) continue
          if (typeof v === 'string') fwdHeaders[k] = v
        }
        fwdHeaders.host = url.host
        const proxyReq = mod.request(url, { method: req.method, headers: fwdHeaders }, proxyRes => {
          // 剥离 WWW-Authenticate 防止浏览器弹出原生认证对话框
          const respHeaders = { ...proxyRes.headers }
          delete respHeaders['www-authenticate']
          res.writeHead(proxyRes.statusCode!, respHeaders)
          proxyRes.pipe(res)
        })
        proxyReq.on('error', () => {
          res.statusCode = 502
          res.end('Proxy error')
        })
        req.pipe(proxyReq)
      } catch {
        res.statusCode = 500
        res.end('Internal proxy error')
      }
    })
  }
})

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'docs'
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          comments: false
        }
      }
    }),
    legacy({
      targets: ['Chrome >= 51', 'Android >= 7'],
      modernPolyfills: true
    }),
    webdavProxy()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
