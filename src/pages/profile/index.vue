<template>
  <view class="profile-page">
    <AppNavBar title="我的" :showBack="false">
      <template #right>
        <u-icon name="setting" size="20" class="cr-icon" @click="goToSettings" />
      </template>
    </AppNavBar>

    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-avatar">
        <u-avatar 
          :src="userInfo.avatar || '/static/images/default-avatar.png'" 
          size="60"
          mode="circle"
        ></u-avatar>
      </view>
      
      <view class="user-info">
        <text class="user-name">{{ userInfo.nickname || '阅记用户' }}</text>
        <text class="user-desc">让阅读更有价值</text>
      </view>
      
      <view class="user-actions">
        <u-icon name="arrow-right" size="16" color="#666" @click="goToProfile"></u-icon>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-section">
      <view class="stats-grid">
        <view class="stat-item" @click="goToBooks">
          <text class="stat-number">{{ stats.bookCount || 0 }}</text>
          <text class="stat-label">本书籍</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goToNotes">
          <text class="stat-number">{{ stats.noteCount || 0 }}</text>
          <text class="stat-label">条笔记</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goToMindmaps">
          <text class="stat-number">{{ stats.mindmapCount || 0 }}</text>
          <text class="stat-label">个思维导图</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <text class="group-title">数据管理</text>
        
        <view class="menu-item" @click="goToSync">
          <u-icon name="reload" size="20" color="#00a82d"></u-icon>
          <text class="menu-text">数据同步</text>
          <view class="menu-extra">
            <text class="extra-text">{{ lastSyncTime || '从未同步' }}</text>
            <u-icon name="arrow-right" size="14" color="#ccc"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToExport">
          <u-icon name="download" size="20" color="#00a82d"></u-icon>
          <text class="menu-text">数据导出</text>
          <view class="menu-extra">
            <u-icon name="arrow-right" size="14" color="#ccc"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToImport">
          <u-icon name="upload" size="20" color="#00a82d"></u-icon>
          <text class="menu-text">数据导入</text>
          <view class="menu-extra">
            <u-icon name="arrow-right" size="14" color="#ccc"></u-icon>
          </view>
        </view>
      </view>

      <view class="menu-group">
        <text class="group-title">个人设置</text>
        
        <view class="menu-item" @click="goToSettings">
          <u-icon name="setting" size="20" color="#00a82d"></u-icon>
          <text class="menu-text">设置</text>
          <view class="menu-extra">
            <u-icon name="arrow-right" size="14" color="#ccc"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToFeedback">
          <u-icon name="chat" size="20" color="#00a82d"></u-icon>
          <text class="menu-text">意见反馈</text>
          <view class="menu-extra">
            <u-icon name="arrow-right" size="14" color="#ccc"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToAbout">
          <u-icon name="info-circle" size="20" color="#00a82d"></u-icon>
          <text class="menu-text">关于阅记</text>
          <view class="menu-extra">
            <text class="extra-text">v{{ version }}</text>
            <u-icon name="arrow-right" size="14" color="#ccc"></u-icon>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <u-button 
        type="error" 
        text="退出登录"
        shape="round"
        :plain="true"
        @click="logout"
      ></u-button>
    </view>

    <!-- 加载提示 -->
    <u-loading-page :loading="pageLoading" bg-color="#f5f7fa" />
    <TabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/modules/user'
import { useBookStore } from '@/stores/modules/book'
import { useNoteStore } from '@/stores/modules/note'
import { useMindmapStore } from '@/stores/modules/mindmap'
import { safeHideTabBar } from '@/utils/tabbar'
import AppNavBar from '@/components/common/AppNavBar.vue'
import TabBar from '@/components/common/TabBar.vue'

// 类型定义
interface UserInfo {
  id?: number
  nickname?: string
  avatar?: string
  phone?: string
}

interface Stats {
  bookCount: number
  noteCount: number
  mindmapCount: number
}

// Store
const userStore = useUserStore()
const bookStore = useBookStore()
const noteStore = useNoteStore()
const mindmapStore = useMindmapStore()

// 响应式数据
const pageLoading = ref(false)
const userInfo = ref<UserInfo>({})
const stats = reactive<Stats>({
  bookCount: 0,
  noteCount: 0,
  mindmapCount: 0
})
const lastSyncTime = ref('')
const version = ref('1.0.0')

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 生命周期
onMounted(async () => {
  await loadUserData()
})

onShow(async () => {
  // 🔧 修复：使用统一的TabBar工具函数
  safeHideTabBar()
  // 页面显示时刷新数据
  if (isLoggedIn.value) {
    await loadUserStats()
  }
})

// 方法
const loadUserData = async () => {
  try {
    pageLoading.value = true
    
    // 检查登录状态
    if (!isLoggedIn.value) {
      uni.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    // 加载用户信息
    userInfo.value = userStore.userInfo
    
    // 加载统计数据
    await loadUserStats()
    
    // 加载最后同步时间
    loadLastSyncTime()
  } catch (error) {
    console.error('加载用户数据失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    pageLoading.value = false
  }
}

const loadUserStats = async () => {
  try {
    // TODO: 实现统计数据加载
    // const statsResult = await Promise.all([
    //   bookStore.getUserBookCount(),
    //   noteStore.getUserNoteCount(),
    //   mindmapStore.getUserMindmapCount()
    // ])
    
    // 模拟数据
    Object.assign(stats, {
      bookCount: 3,
      noteCount: 15,
      mindmapCount: 2
    })
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadLastSyncTime = () => {
  // TODO: 从本地存储或服务器获取最后同步时间
  const lastSync = uni.getStorageSync('lastSyncTime')
  if (lastSync) {
    const date = new Date(lastSync)
    lastSyncTime.value = date.toLocaleDateString('zh-CN')
  }
}

const goToProfile = () => {
  uni.navigateTo({
    url: '/pages-profile/edit/edit'
  })
}

const goToBooks = () => {
  uni.switchTab({
    url: '/pages/index/index'
  })
}

const goToNotes = () => {
  uni.switchTab({
    url: '/pages/notes/index'
  })
}

const goToMindmaps = () => {
  uni.switchTab({
    url: '/pages/mindmap/index'
  })
}

const goToSync = () => {
  uni.navigateTo({
    url: '/pages-profile/sync/sync'
  })
}

const goToExport = () => {
  uni.navigateTo({
    url: '/pages-profile/export/export'
  })
}

const goToImport = () => {
  uni.navigateTo({
    url: '/pages-profile/import/import'
  })
}

const goToSettings = () => {
  uni.navigateTo({
    url: '/pages-profile/settings/settings'
  })
}

const goToFeedback = () => {
  uni.navigateTo({
    url: '/pages-profile/feedback/feedback'
  })
}

const goToAbout = () => {
  uni.navigateTo({
    url: '/pages-profile/about/about'
  })
}

const logout = () => {
  uni.showModal({
    title: '确认退出',
    content: '退出登录后需要重新登录才能使用完整功能',
    success: (res) => {
      if (res.confirm) {
        performLogout()
      }
    }
  })
}

const performLogout = async () => {
  try {
    // 清除用户数据
    await userStore.logout()
    
    // 跳转到登录页
    uni.navigateTo({
      url: '/pages/login/login'
    })
    
    uni.showToast({
      title: '已退出登录',
      icon: 'success'
    })
  } catch (error) {
    console.error('退出登录失败:', error)
    uni.showToast({
      title: '退出失败',
      icon: 'error'
    })
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.custom-navbar {
  background: linear-gradient(135deg, #00a82d 0%, #357ABD 100%);
  padding-top: var(--status-bar-height);
  
  .navbar-content {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    
    .navbar-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
    }
    
    .navbar-actions {
      display: flex;
      align-items: center;
    }
  }
}

.user-card {
  background: #fff;
  margin: 16px;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .user-avatar {
    margin-right: 16px;
  }
  
  .user-info {
    flex: 1;
    
    .user-name {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      line-height: 1.4;
      margin-bottom: 4px;
    }
    
    .user-desc {
      font-size: 14px;
      color: #999;
    }
  }
  
  .user-actions {
    padding: 8px;
  }
}

.stats-section {
  background: #fff;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: flex;
  align-items: center;
  
  .stat-item {
    flex: 1;
    text-align: center;
    
    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #00a82d;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
    }
  }
  
  .stat-divider {
    width: 1px;
    height: 30px;
    background: #f0f0f0;
    margin: 0 20px;
  }
}

.menu-section {
  padding: 0 16px 20px;
  
  .menu-group {
    background: #fff;
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .group-title {
      display: block;
      padding: 16px 20px 8px;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f8f9fa;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:active {
        background: #f8f9fa;
      }
      
      .menu-text {
        flex: 1;
        font-size: 15px;
        color: #333;
        margin-left: 12px;
      }
      
      .menu-extra {
        display: flex;
        align-items: center;
        
        .extra-text {
          font-size: 13px;
          color: #999;
          margin-right: 4px;
        }
      }
    }
  }
}

.logout-section {
  padding: 20px 16px 40px;
}

/* 微信小程序特定样式 */
/* #ifdef MP-WEIXIN */
.custom-navbar {
  padding-top: 20px;
}
/* #endif */

/* H5特定样式 */
/* #ifdef H5 */
.custom-navbar {
  padding-top: 0;
}
/* #endif */
</style>
