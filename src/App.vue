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

const userStore = useUserStore()

onLaunch(() => {
  console.log('App Launch')
  // 应用启动时的初始化逻辑
  initApp()
})

onShow(() => {
  console.log('App Show')
  // 应用显示时的逻辑
})

onHide(() => {
  console.log('App Hide')
  // 应用隐藏时的逻辑
})

const initApp = async () => {
  try {
    // 获取系统信息
    const systemInfo = await uni.getSystemInfo()
    console.log('系统信息:', systemInfo)
    
    // 🔧 修复：初始化用户信息（使用await确保完成）
    await userStore.initUserInfo()
    const isLoggedIn = await userStore.checkLoginStatus()
    console.log('用户登录状态:', isLoggedIn)
    
    // 初始化其他必要的服务
    // TODO: 初始化推送、统计等服务
  } catch (error) {
    console.error('应用初始化失败:', error)
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
