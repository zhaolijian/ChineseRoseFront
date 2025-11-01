import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import uView from 'uview-plus'

export function createApp() {
  const app = createSSRApp(App)
  
  // 状态管理
  const pinia = createPinia()
  app.use(pinia)
  // 暴露全局 pinia，需等待小程序 App 实例就绪
  const resolveApp = () => {
    if (typeof getApp !== 'function') {
      return null
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 微信小程序 getApp 支持 allowDefault 参数
    return getApp({ allowDefault: true }) as Record<string, unknown> | null
  }
  const runtimeApp = resolveApp()
  if (runtimeApp) {
    runtimeApp.$pinia = pinia
  } else {
    app.mixin({
      onLaunch() {
        const launchedApp = resolveApp()
        if (launchedApp) {
          launchedApp.$pinia = pinia
        }
      }
    })
  }
  app.config.globalProperties.$pinia = pinia
  if (typeof uni !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (uni as any).$pinia = pinia
  }
  
  // UI组件库
  app.use(uView)
  // 配置 uView 主题主色，确保运行时颜色一致
  // @ts-ignore
  if ((uni as any).$u && (uni as any).$u.setConfig) {
    // @ts-ignore
    (uni as any).$u.setConfig({
      config: {
        iconUrl: '/static/iconfont/iconfont.ttf',
        loadFontOnce: true,
        customIcons: {
          'chart-line': '\ue68e',
          book: '\ue60a',
          more: '\ue63e',
          file: '\ue663'
        }
      },
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
