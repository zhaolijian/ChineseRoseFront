<template>
  <view class="profile-page">
    <!-- 头部区域 -->
    <view class="profile-header">
      <view class="user-info">
        <!-- 用户头像 -->
        <view class="avatar-wrapper">
          <u-avatar 
            :src="userAvatar" 
            size="64"
            mode="aspectFill"
          ></u-avatar>
        </view>
        
        <!-- 用户信息 -->
        <view class="user-details">
          <text class="user-name">{{ userName }}</text>
          <text class="user-motto">阅有所记，学有所成</text>
        </view>
      </view>
      
      <!-- 徽章区域 -->
      <view class="badges">
        <view class="badge badge--premium">
          <text class="badge-icon">👑</text>
          <text class="badge-text">高级用户</text>
        </view>
        <view class="badge badge--streak">
          <text class="badge-icon">🔥</text>
          <text class="badge-text">连续使用 15 天</text>
        </view>
      </view>
    </view>

    <!-- 数据统计卡片 -->
    <view class="stats-section">
      <view class="section-card">
        <view class="card-header">
          <text class="card-title">我的阅读数据</text>
        </view>
        
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-number">{{ bookCount }}</text>
            <text class="stat-label">本书籍</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-number">{{ noteCount }}</text>
            <text class="stat-label">条笔记</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-number">{{ mindmapCount }}</text>
            <text class="stat-label">个导图</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 设置选项组 -->
    <view class="settings-section">
      <view class="section-card">
        <text class="section-title">设置与帮助</text>
        
        <view class="settings-list">
          <view class="setting-item" @click="goToNotificationSettings">
            <view class="setting-left">
              <u-icon name="bell" size="20" color="#666"></u-icon>
              <text class="setting-text">通知设置</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          
          <view class="setting-item" @click="goToShareSettings">
            <view class="setting-left">
              <u-icon name="share-square" size="20" color="#666"></u-icon>
              <text class="setting-text">分享设置</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          
          <view class="setting-item" @click="goToFeedback">
            <view class="setting-left">
              <u-icon name="question-circle" size="20" color="#666"></u-icon>
              <text class="setting-text">帮助与反馈</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          
          <view class="setting-item" @click="goToAbout">
            <view class="setting-left">
              <u-icon name="info-circle" size="20" color="#666"></u-icon>
              <text class="setting-text">关于阅记</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <view class="section-card">
        <view class="logout-button" @click="handleLogout">
          <text class="logout-text">退出登录</text>
        </view>
      </view>
    </view>
    <TabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/modules/user'
import { getUserStats } from '@/api/modules/auth'
import { safeHideTabBar } from '@/utils/tabbar'
import TabBar from '@/components/common/TabBar.vue'

// Store
const userStore = useUserStore()

// 响应式数据
const bookCount = ref(12)  // Figma设计稿显示的数据
const noteCount = ref(156) // Figma设计稿显示的数据
const mindmapCount = ref(8) // Figma设计稿显示的数据

// 计算属性
const userName = computed(() => userStore.userNickname || '阅记用户')
const userAvatar = computed(() => userStore.userAvatar || '/static/images/default-avatar.png')

// 主色
const primaryColor = '#00a82d'

// 生命周期
onMounted(async () => {
  await loadUserStats()
  safeHideTabBar()
})

onShow(async () => {
  await loadUserStats()
  safeHideTabBar()
})

// 方法
const loadUserStats = async () => {
  try {
    const stats = await getUserStats()
    bookCount.value = stats.bookCount
    noteCount.value = stats.noteCount
    mindmapCount.value = stats.mindmapCount
  } catch (error) {
    console.error('加载用户统计失败:', error)
    // 加载失败时使用默认数据
    bookCount.value = 0
    noteCount.value = 0
    mindmapCount.value = 0
  }
}

// 设置相关方法
const goToNotificationSettings = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToShareSettings = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToFeedback = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToAbout = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await userStore.logout()
          
          uni.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/login'
            })
          }, 1500)
        } catch (error) {
          console.error('退出登录失败:', error)
          uni.showToast({
            title: '退出失败',
            icon: 'error'
          })
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';
@import '@/styles/design-tokens.scss';
@import '@/styles/effects.scss';
@import '@/styles/profile-tokens.scss';

.profile-page {
  min-height: 100vh;
  background-color: map-get($profile-bg, page);
  padding-bottom: calc(160rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

// 头部区域
.profile-header {
  background: map-get($cr-colors, primary);
  padding: map-get($profile-spacing, header-padding-top) 32rpx map-get($profile-spacing, header-padding-bottom);
  color: #fff;
  
  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;
    
    .avatar-wrapper {
      margin-right: 24rpx;
    }
    
    .user-details {
      flex: 1;
      
      .user-name {
        display: block;
        font-size: map-get($cr-font-size, xl);
        font-weight: map-get($cr-font-weight, bold);
        margin-bottom: 8rpx;
      }
      
      .user-motto {
        display: block;
        font-size: map-get($cr-font-size, sm);
        opacity: 0.9;
      }
    }
  }
  
  // 徽章区域
  .badges {
    display: flex;
    gap: 16rpx;
    
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8rpx;
      padding: 8rpx 16rpx;
      border-radius: map-get($cr-radius, full);
      font-size: map-get($cr-font-size, sm);
      
      &--premium {
        background: map-get(map-get($profile-badges, premium), background);
        color: map-get(map-get($profile-badges, premium), color);
      }
      
      &--streak {
        background: map-get(map-get($profile-badges, streak), background);
        color: map-get(map-get($profile-badges, streak), color);
      }
      
      .badge-icon {
        font-size: 16rpx;
      }
      
      .badge-text {
        font-weight: map-get($cr-font-weight, medium);
      }
    }
  }
}

// 通用卡片样式
.section-card {
  background: map-get($profile-card, background);
  border: map-get($profile-card, border);
  border-radius: map-get($profile-card, border-radius);
  padding: map-get($profile-card, padding);
  
  /* #ifndef MP */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* #endif */
  
  /* #ifdef MP */
  // 小程序降级：纯白背景
  background: rgba(255, 255, 255, 0.95);
  /* #endif */
}

// 数据统计部分
.stats-section {
  padding: 0 24rpx;
  margin-top: map-get($profile-spacing, section-gap);
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 32rpx;
    
    .card-title {
      font-size: map-get($cr-font-size, md);
      font-weight: map-get($cr-font-weight, semibold);
      color: map-get($cr-colors, text-primary);
    }
  }
  
  .stats-grid {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .stat-item {
      flex: 1;
      text-align: center;
      
      .stat-number {
        display: block;
        font-size: map-get($profile-stats, number-size);
        font-weight: map-get($cr-font-weight, bold);
        color: map-get($cr-colors, text-primary);
        margin-bottom: 8rpx;
      }
      
      .stat-label {
        display: block;
        font-size: map-get($profile-stats, label-size);
        color: map-get($cr-colors, text-secondary);
      }
    }
    
    .stat-divider {
      width: 1rpx;
      height: 40rpx;
      background-color: map-get($profile-stats, divider-color);
    }
  }
}

// 设置部分
.settings-section {
  padding: 0 24rpx;
  margin-top: map-get($profile-spacing, section-gap);
  
  .section-title {
    display: block;
    font-size: map-get($cr-font-size, md);
    font-weight: map-get($cr-font-weight, semibold);
    color: map-get($cr-colors, text-primary);
    margin-bottom: 24rpx;
  }
  
  .settings-list {
    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20rpx 0;
      
      &:not(:last-child) {
        border-bottom: 1rpx solid map-get($cr-colors, border-light);
      }
      
      &:active {
        background-color: map-get($profile-settings, hover-bg);
        margin: 0 -32rpx;
        padding-left: 32rpx;
        padding-right: 32rpx;
      }
      
      .setting-left {
        display: flex;
        align-items: center;
        gap: 16rpx;
        
        .setting-text {
          font-size: map-get($cr-font-size, base);
          color: map-get($cr-colors, text-primary);
        }
      }
    }
  }
}

// 退出登录部分
.logout-section {
  padding: 0 24rpx;
  margin-top: map-get($profile-spacing, section-gap);
  margin-bottom: 48rpx;
  
  .logout-button {
    text-align: center;
    padding: 24rpx 0;
    border-top: 1rpx solid map-get($cr-colors, border-light);
    
    &:active {
      opacity: 0.7;
    }
    
    .logout-text {
      font-size: map-get($cr-font-size, md);
      font-weight: map-get($cr-font-weight, medium);
      color: #ff4d4f;
    }
  }
}

/* 微信小程序特定样式 */
/* #ifdef MP-WEIXIN */
.profile-header {
  padding-top: calc(map-get($profile-spacing, header-padding-top) + var(--status-bar-height));
}
/* #endif */
</style>
