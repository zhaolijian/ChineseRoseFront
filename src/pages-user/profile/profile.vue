<template>
  <view class="profile-page cr-page-bg">
    <!-- 用户信息头部 -->
    <view class="profile-header">
      <view class="user-info">
        <view class="avatar-section">
          <u-avatar 
            :src="userAvatar" 
            size="80"
            mode="aspectFill"
          ></u-avatar>
          <view class="edit-avatar" @click="changeAvatar">
            <u-icon name="camera" size="16" color="#fff"></u-icon>
          </view>
        </view>
        
        <view class="user-details">
          <text class="user-name">{{ userNickname }}</text>
          <text v-if="userInfo?.phone" class="user-phone">{{ formatPhone(userInfo.phone) }}</text>
          <text class="join-date">加入于 {{ formatJoinDate(userInfo?.createdAt) }}</text>
        </view>
      </view>
    </view>

    <!-- 统计数据独立卡片 -->
    <view class="stats-card cr-card cr-card--padded">
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-number text-primary">{{ bookCount }}</text>
          <text class="stat-label text-sub">本书籍</text>
        </view>
        <view class="stat-item">
          <text class="stat-number text-primary">{{ noteCount }}</text>
          <text class="stat-label text-sub">条笔记</text>
        </view>
        <view class="stat-item">
          <text class="stat-number text-primary">{{ readingDays }}</text>
          <text class="stat-label text-sub">天阅读</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group cr-card">
        <view class="menu-item" @click="goToReadingGoals">
          <view class="menu-left">
            <u-icon name="calendar" size="20" :color="primaryColor"></u-icon>
            <text class="menu-text text-main">阅读目标</text>
          </view>
          <view class="menu-right">
            <text class="menu-desc text-sub">设置年度目标</text>
            <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToReadingStats">
          <view class="menu-left">
            <u-icon name="chart-pie" size="20" :color="primaryColor"></u-icon>
            <text class="menu-text text-main">阅读统计</text>
          </view>
          <view class="menu-right">
            <text class="menu-desc text-sub">查看详细数据</text>
            <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToExport">
          <view class="menu-left">
            <u-icon name="download" size="20" :color="primaryColor"></u-icon>
            <text class="menu-text text-main">数据导出</text>
          </view>
          <view class="menu-right">
            <text class="menu-desc text-sub">导出笔记数据</text>
            <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToMyBooks">
          <view class="menu-left">
            <u-icon name="book" size="20" :color="primaryColor"></u-icon>
            <text class="menu-text text-main">我的书籍</text>
          </view>
          <view class="menu-right">
            <u-badge :value="bookCount" :max="99" type="primary"></u-badge>
            <u-icon name="arrow-right" size="16" color="#ccc" style="margin-left: 8px;"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToMyNotes">
          <view class="menu-left">
            <u-icon name="edit-pen" size="20" :color="primaryColor"></u-icon>
            <text class="menu-text text-main">我的笔记</text>
          </view>
          <view class="menu-right">
            <u-badge :value="noteCount" :max="99" type="primary"></u-badge>
            <u-icon name="arrow-right" size="16" color="#ccc" style="margin-left: 8px;"></u-icon>
          </view>
        </view>
      </view>

      <view class="menu-group cr-card">
        <view class="menu-item" @click="goToSettings">
          <view class="menu-left">
            <u-icon name="setting" size="20" color="#666"></u-icon>
            <text class="menu-text text-main">设置</text>
          </view>
          <view class="menu-right">
            <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToAbout">
          <view class="menu-left">
            <u-icon name="info-circle" size="20" color="#666"></u-icon>
            <text class="menu-text text-main">关于我们</text>
          </view>
          <view class="menu-right">
            <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
          </view>
        </view>
        
        <view class="menu-item" @click="goToFeedback">
          <view class="menu-left">
            <u-icon name="chat" size="20" color="#666"></u-icon>
            <text class="menu-text text-main">意见反馈</text>
          </view>
          <view class="menu-right">
            <u-icon name="arrow-right" size="16" color="#ccc"></u-icon>
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <u-button 
        text="退出登录"
        type="error"
        :custom-style="logoutButtonStyle"
        @click="handleLogout"
      ></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/modules/user'
import { useBookStore } from '@/stores/modules/book'

// Store
const userStore = useUserStore()
const bookStore = useBookStore()

// 响应式数据
const bookCount = ref(0)
const noteCount = ref(0)
const readingDays = ref(0)

// 计算属性
const userInfo = computed(() => userStore.userInfo)
const userNickname = computed(() => userStore.userNickname)
const userAvatar = computed(() => userStore.userAvatar)

// 样式和常量
const primaryColor = '#00a82d'

const logoutButtonStyle = {
  backgroundColor: '#fff',
  color: '#ff6b6b',
  border: '1px solid #ff6b6b',
  borderRadius: '8px',
  height: '44px'
}

// 生命周期
onMounted(async () => {
  await loadUserStats()
})

onShow(async () => {
  await loadUserStats()
})

// 方法
const loadUserStats = async () => {
  try {
    // TODO: 实现获取用户统计数据的API
    // const stats = await userStore.fetchUserStats()
    // bookCount.value = stats.bookCount
    // noteCount.value = stats.noteCount
    // readingDays.value = stats.readingDays
    
    // 临时使用store中的数据
    bookCount.value = bookStore.bookCount
    noteCount.value = 0 // TODO: 从note store获取
    readingDays.value = 30 // 临时数据
  } catch (error) {
    console.error('加载用户统计失败:', error)
  }
}

const changeAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: async (res) => {
      try {
        // TODO: 实现头像上传
        // const avatarUrl = await uploadAvatar(res.tempFilePaths[0])
        // await userStore.updateUserInfo({ avatar: avatarUrl })
        
        uni.showToast({
          title: '功能开发中',
          icon: 'none'
        })
      } catch (error) {
        console.error('头像上传失败:', error)
        uni.showToast({
          title: '上传失败',
          icon: 'error'
        })
      }
    }
  })
}

const goToReadingGoals = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToReadingStats = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToExport = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToSettings = () => {
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

const goToFeedback = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToMyBooks = () => {
  uni.switchTab({
    url: '/pages/index/index'
  })
}

const goToMyNotes = () => {
  uni.switchTab({
    url: '/pages/notes/index'
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

const formatPhone = (phone?: string): string => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const formatJoinDate = (dateStr?: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.profile-page {
  min-height: 100vh;
}

// 翡翠绿色头部渐变 - 与设计稿一致
.profile-header {
  background: linear-gradient(135deg, var(--cr-color-primary-600) 0%, var(--cr-color-primary-700) 100%);
  padding: 80rpx 48rpx 60rpx;
  color: #fff;
  position: relative;
  
  .user-info {
    display: flex;
    align-items: center;
    
    .avatar-section {
      position: relative;
      margin-right: 40rpx;
      
      .edit-avatar {
        position: absolute;
        bottom: -8rpx;
        right: -8rpx;
        width: 48rpx;
        height: 48rpx;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    .user-details {
      flex: 1;
      
      .user-name {
        display: block;
        font-size: 44rpx;
        font-weight: 600;
        margin-bottom: 12rpx;
        line-height: 1.2;
      }
      
      .user-phone {
        display: block;
        font-size: 28rpx;
        opacity: 0.8;
        margin-bottom: 8rpx;
      }
      
      .join-date {
        font-size: 24rpx;
        opacity: 0.7;
      }
    }
  }
}

// 独立统计数据卡片
.stats-card {
  margin: 24rpx;
  
  .stats-grid {
    display: flex;
    justify-content: space-around;
    
    .stat-item {
      text-align: center;
      
      .stat-number {
        display: block;
        font-size: var(--cr-font-title);
        font-weight: 600;
        margin-bottom: 8rpx;
        line-height: 1.2;
      }
      
      .stat-label {
        font-size: var(--cr-font-caption);
      }
    }
  }
}

.menu-section {
  padding: 0 24rpx;
  
  .menu-group {
    margin-bottom: 32rpx;
    overflow: hidden;
    
    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32rpx 40rpx;
      border-bottom: 1rpx solid var(--cr-color-divider);
      transition: background-color 0.2s;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:active {
        background-color: var(--cr-color-primary-50);
      }
      
      .menu-left {
        display: flex;
        align-items: center;
        
        .menu-text {
          font-size: var(--cr-font-body);
          margin-left: 24rpx;
        }
      }
      
      .menu-right {
        display: flex;
        align-items: center;
        
        .menu-desc {
          font-size: var(--cr-font-caption);
          margin-right: 16rpx;
        }
      }
    }
  }
}

.logout-section {
  padding: 32rpx 24rpx;
}

/* 微信小程序特定样式 */
/* #ifdef MP-WEIXIN */
.profile-header {
  padding-top: calc(40px + var(--status-bar-height));
}
/* #endif */
</style>