import path from 'node:path'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

const isH5 = !process.env.UNI_PLATFORM || process.env.UNI_PLATFORM === 'h5'

const alias: Record<string, string> = {}
const wxsStubPlugin = () => ({
  name: 'uni-wxs-stub',
  enforce: 'pre',
  transform(code: string, id: string) {
    if (id.endsWith('.wxs')) {
      return { code: 'export default {}', map: null }
    }
  }
})


if (isH5) {
  alias.vue = path.resolve(__dirname, 'src/shims/vue.ts')
  alias['vue/package.json'] = '@dcloudio/uni-h5-vue/package.json'
}

alias['@vue/shared$'] = path.resolve(__dirname, 'src/shims/vue-shared.ts')
alias['@vue/shared/package.json'] = path.resolve(__dirname, 'node_modules/@vue/shared/package.json')

export default defineConfig({
  plugins: [
    uni(),
    wxsStubPlugin()
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
    target: 'es2015'
  },
  optimizeDeps: {
    include: [],
    exclude: isH5 ? ['vue'] : []
  },
  // 由 @dcloudio/vite-plugin-uni 负责注入运行时平台常量，无需自定义 define
})
