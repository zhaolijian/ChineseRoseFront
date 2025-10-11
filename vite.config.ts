import path from 'node:path'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

const isH5 = !process.env.UNI_PLATFORM || process.env.UNI_PLATFORM === 'h5'

const alias: Record<string, string> = {}

if (isH5) {
  alias.vue = path.resolve(__dirname, 'src/shims/vue.ts')
  alias['vue/package.json'] = '@dcloudio/uni-h5-vue/package.json'
}

export default defineConfig({
  plugins: [
    uni()
    // WXS 文件由 uni-app 框架自动处理，无需额外插件
  ],
  resolve: {
    alias
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    minify: 'terser',
    sourcemap: false,
    outDir: 'dist',
    // ⚠️ 关键修复：完全移除 rollupOptions.output.manualChunks
    // uni-app H5 模式下不能将 vue/pinia 分离为独立 chunk
    target: 'es2015'
  },
  optimizeDeps: {
    include: isH5 ? ['@dcloudio/uni-h5-vue'] : [],
    exclude: isH5 ? ['vue'] : []
  },
  define: {
    __UNI_PLATFORM__: JSON.stringify(process.env.UNI_PLATFORM || 'h5')
  }
})
