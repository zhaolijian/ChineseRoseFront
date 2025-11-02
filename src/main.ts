import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'

// 仅在非 H5 环境导入 uview-plus（H5 环境在 App.vue 的 onLaunch 中动态导入）
// #ifndef H5
import uView from 'uview-plus'
// #endif

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

  // UI组件库（仅在非 H5 环境加载）
  // #ifndef H5
  app.use(uView)
  // 配置 uView 主题
  if ((uni as any).$u && (uni as any).$u.setConfig) {
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
  // #endif
  // H5 环境下 uview-plus 在 App.vue 的 onLaunch 中动态加载

  // 开发环境：添加全局错误钩子，捕获所有错误
  if (import.meta.env.DEV) {
    // Vue 组件错误
    app.config.errorHandler = (err, instance, info) => {
      console.error('[VueError]', err, info, instance);
    };

    // 浏览器错误
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (e) => {
        console.error('[WindowError]', e.error || e.message || e);
      });
      window.addEventListener('unhandledrejection', (e) => {
        console.error('[PromiseRejection]', e.reason || e);
      });
      console.info('[Debug] Global error handlers installed');
    }
  }

  return {
    app
  }
}
