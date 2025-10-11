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
import { logger, createContext } from '@/utils'

const userStore = useUserStore()

onLaunch(() => {
  const ctx = createContext()
  logger.info(ctx, '[App] 应用启动')
  // 应用启动时的初始化逻辑
  initApp()
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
@import '@/uni.scss';
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
</style>
