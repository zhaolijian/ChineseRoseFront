import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
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
    outDir: 'dist'
    // ⚠️ 关键修复：完全移除 rollupOptions.output.manualChunks
    // uni-app H5 模式下不能将 vue/pinia 分离为独立 chunk
  },
  define: {
    __UNI_PLATFORM__: JSON.stringify(process.env.UNI_PLATFORM || 'h5')
  }
})