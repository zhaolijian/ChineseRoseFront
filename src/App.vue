<template>
  <view class="app">
    <!-- 主要内容区域 -->
    <view class="app-content">
      <!-- 这里会渲染页面内容 -->
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/modules/user'
import { logger, createContext, autoLoginInDev } from '@/utils'
import { getCurrentInstance } from 'vue'

const userStore = useUserStore()

onLaunch(async () => {
  const ctx = createContext()
  logger.info(ctx, '[App] 应用启动')

  // #ifdef H5
  // H5 环境下动态加载 uview-plus（此时 uni 对象已就绪）
  try {
    const instance = getCurrentInstance()
    const uViewModule = await import('uview-plus')
    if (instance && instance.appContext.app) {
      instance.appContext.app.use(uViewModule.default)
      logger.info(ctx, '[App] uview-plus 加载成功')

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
    }
  } catch (error) {
    logger.error(ctx, '[App] uview-plus 加载失败', error)
  }

  // H5 开发环境自动登录
  await autoLoginInDev()
  // #endif

  // 应用启动时的初始化逻辑
  await initApp()
})

onShow(() => {
  const ctx = createContext()
  logger.info(ctx, '[App] 应用显示')
  // 应用显示时的逻辑
})

onHide(() => {
  const ctx = createContext()
  logger.info(ctx, '[App] 应用隐藏')
  // 应用隐藏时的逻辑
})

const initApp = async () => {
  const ctx = createContext()

  try {
    logger.debug(ctx, '[initApp] 开始初始化应用')

    // 获取系统信息
    const systemInfo = await uni.getSystemInfo()
    logger.debug(ctx, '[initApp] 系统信息', {
      platform: systemInfo.platform,
      version: systemInfo.version,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight
    })

    // ADR-007: 只从本地存储读取token，不发送网络请求验证，不跳转
    // 二元登录状态设计：有token = 已登录，无token = 未登录
    await userStore.initUserInfo()
    logger.info(ctx, '[initApp] 用户登录状态（本地检查）', { isLoggedIn: userStore.isLoggedIn })

    logger.info(ctx, '[initApp] 应用初始化完成')
  } catch (error) {
    logger.error(ctx, '[initApp] 应用初始化失败', error)
  }
}
</script>

<style lang="scss">
/* 引入项目设计令牌（已包含 uView 主题配置） */
@import '@/styles/iconfont-local.css';    /* 本地 @font-face（唯一） */
@import '@/styles/iconfont-mapping.css';  /* 仅图标类映射 */
@import '@/uni.scss';
@import '@/styles/overrides/popup.scss';
/* H5平台样式修复 */
@import '@/styles/h5-override.scss';

.app {
  min-height: 100vh;
  background-color: var(--cr-color-bg);
}

.app-content {
  min-height: 100vh;
}

// 全局样式重置
page {
  background-color: var(--cr-color-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

// 通用样式类
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.flex {
  display: flex;
}

.flex-column {
  flex-direction: column;
}

.justify-center {
  justify-content: center;
}

.align-center {
  align-items: center;
}

.flex-1 {
  flex: 1;
}

/* ==================== 图标系统修复 ==================== */
/*
 * 问题：uView Plus 图标组件 + iconfont-mapping.css 导致双份图标
 * 原因：u-icon 组件自带图标渲染 + iconfont 的 ::before 伪元素 = 双份显示
 * 解决：禁用 uView 组件的 ::before，保留组件自身的图标渲染
 */
.u-icon:before,
.u-icon__icon:before {
  content: none !important;
  display: none !important;
}

/* 如需手动使用 iconfont 类，请不要套用 u-icon 组件 */
/* 正确用法：<text class="iconfont uicon-search"></text> */

</style>
