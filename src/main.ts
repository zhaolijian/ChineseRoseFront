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
      color: {
        primary: '#00a82d',
        success: '#16a34a',
        warning: '#f59e0b',
        error: '#dc2626',
        info: '#0ea5e9'
      }
    })
  }
  
  return {
    app
  }
}
