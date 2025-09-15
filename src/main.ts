import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import uView from 'uview-plus'

export function createApp() {
  const app = createSSRApp(App)
  
  // 状态管理
  app.use(createPinia())
  
  // UI组件库
  app.use(uView)
  // 配置 uView 主题主色，确保运行时颜色一致
  // @ts-ignore
  if ((uni as any).$u && (uni as any).$u.setConfig) {
    // @ts-ignore
    (uni as any).$u.setConfig({
      color: { primary: '#059669' }
    })
  }
  
  return {
    app
  }
}
