<template>
  <view class="mindmap-page">
    <AppNavBar title="思维导图" :showBack="false">
      <template #right>
        <u-icon name="search" size="20" class="cr-icon" @click="goToSearch" />
        <u-icon name="plus-circle" size="20" class="cr-icon" @click="goToCreateMindmap" style="margin-left: 16rpx;" />
      </template>
    </AppNavBar>

    <!-- 视图切换 -->
    <view class="view-switcher">
      <u-tabs 
        :list="viewTabs" 
        v-model="activeView" 
        @click="onViewChange"
        lineWidth="30"
        lineHeight="3"
        :activeStyle="{ color: '#059669', fontWeight: 'bold' }"
      ></u-tabs>
    </view>

    <!-- 思维导图列表 -->
    <PageContainer>
    <view class="mindmap-content">
      <view v-if="loading && mindmaps.length === 0">
        <LoadingSkeleton :rows="4" />
      </view>
      <view v-else-if="mindmaps.length === 0" class="empty-state">
        <EmptyState icon="data" title="还没有思维导图" actionText="创建第一个思维导图" @action="goToCreateMindmap" />
      </view>

      <!-- 网格视图 -->
      <view v-else-if="activeView === 0" class="mindmap-grid">
        <view 
          v-for="(mindmap, idx) in mindmaps" 
          :key="mindmap.id || ('mmg-'+idx)" 
          class="mindmap-card cr-card"
          @click="goToMindmapDetail(mindmap)"
        >
          <view class="mindmap-preview">
            <u-image 
              :src="mindmap.thumbnail || '/static/images/mindmap-placeholder.png'"
              mode="aspectFit"
              width="100%"
              height="120px"
              radius="8"
              loading-icon="loading"
            ></u-image>
          </view>
          
          <view class="mindmap-info">
            <text class="mindmap-title">{{ mindmap.title || '无标题思维导图' }}</text>
            <text class="mindmap-date">{{ formatDate(mindmap.createdAt) }}</text>
            
            <view class="mindmap-meta">
              <view class="book-info">
                <u-icon name="book" size="10" color="#999"></u-icon>
                <text class="book-name">{{ mindmap.bookTitle || '未知书籍' }}</text>
              </view>
              <text class="node-count">{{ mindmap.nodeCount || 0 }}个节点</text>
            </view>
          </view>
          
          <view class="mindmap-actions" @click.stop="">
            <u-icon name="more-dot-fill" size="16" color="#999" @click="showActions(mindmap)"></u-icon>
          </view>
        </view>
      </view>

      <!-- 列表视图 -->
      <view v-else class="mindmap-list">
        <view 
          v-for="(mindmap, idx) in mindmaps" 
          :key="mindmap.id || ('mml-'+idx)" 
          class="mindmap-item cr-card cr-card--padded"
          @click="goToMindmapDetail(mindmap)"
        >
          <view class="mindmap-thumbnail">
            <u-image 
              :src="mindmap.thumbnail || '/static/images/mindmap-placeholder.png'"
              mode="aspectFit"
              width="60px"
              height="60px"
              radius="6"
            ></u-image>
          </view>
          
          <view class="mindmap-content">
            <view class="mindmap-header">
              <text class="mindmap-title">{{ mindmap.title || '无标题思维导图' }}</text>
              <text class="mindmap-date">{{ formatDate(mindmap.createdAt) }}</text>
            </view>
            
            <view class="mindmap-meta">
              <text class="book-info">{{ mindmap.bookTitle || '未知书籍' }}</text>
              <text class="node-count">{{ mindmap.nodeCount || 0 }}个节点</text>
            </view>
          </view>
          
          <view class="mindmap-actions" @click.stop="">
            <u-icon name="more-dot-fill" size="16" color="#999" @click="showActions(mindmap)"></u-icon>
          </view>
        </view>
      </view>
    </view>
    </PageContainer>
    <TabBar />

    <!-- 悬浮添加按钮 -->
    <view class="fab-button" @click="goToCreateMindmap">
      <u-icon name="plus" size="24" color="#fff"></u-icon>
    </view>

    <!-- 操作菜单 -->
    <u-action-sheet 
      v-model="showActionSheet"
      :actions="actionList"
      title="选择操作"
      @click="onActionClick"
    ></u-action-sheet>

    <!-- 加载提示 -->
    <u-loading-page 
      :loading="pageLoading"
      bg-color="#f5f7fa"
    ></u-loading-page>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useMindmapStore } from '@/stores/modules/mindmap'
import { useUserStore } from '@/stores/modules/user'
import { safeHideTabBar } from '@/utils/tabbar'
import AppNavBar from '@/components/common/AppNavBar.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import TabBar from '@/components/common/TabBar.vue'

// 类型定义
interface Mindmap {
  id: number
  title?: string
  bookId: number
  bookTitle?: string
  thumbnail?: string
  nodeCount?: number
  createdAt: string
  updatedAt?: string
}

// Store
const mindmapStore = useMindmapStore()
const userStore = useUserStore()

// 响应式数据
const mindmaps = ref<Mindmap[]>([])
const loading = ref(false)
const pageLoading = ref(false)
const hasMore = ref(true)
const activeView = ref(0) // 0: 网格视图, 1: 列表视图
const showActionSheet = ref(false)
const selectedMindmap = ref<Mindmap | null>(null)

// 视图选项
const viewTabs = ref([
  { name: '网格' },
  { name: '列表' }
])

// 操作菜单
const actionList = ref([
  { text: '编辑', name: 'edit' },
  { text: '分享', name: 'share' },
  { text: '删除', name: 'delete', color: '#ff4757' }
])

// 生命周期
onMounted(async () => {
  await checkLoginAndLoadData()
})

onShow(async () => {
  // 🔧 修复：使用统一的TabBar工具函数
  safeHideTabBar()
  // 页面显示时刷新数据
  await loadMindmaps()
})

onPullDownRefresh(async () => {
  await loadMindmaps(true)
  uni.stopPullDownRefresh()
})

onReachBottom(async () => {
  if (hasMore.value && !loading.value) {
    await loadMoreMindmaps()
  }
})

// 方法
const checkLoginAndLoadData = async () => {
  try {
    pageLoading.value = true
    
    // 检查登录状态
    if (!userStore.isLoggedIn) {
      uni.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    // 加载思维导图数据
    await loadMindmaps()
  } catch (error) {
    console.error('初始化失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    pageLoading.value = false
  }
}

const loadMindmaps = async (refresh = false) => {
  try {
    loading.value = true
    
    // TODO: 实现思维导图数据加载
    // const result = await mindmapStore.fetchMindmaps(refresh ? 1 : mindmapStore.currentPage)
    
    // 模拟数据
    const mockMindmaps = [
      {
        id: 1,
        title: '《示例书籍》知识结构',
        bookId: 1,
        bookTitle: '《示例书籍》',
        nodeCount: 15,
        createdAt: '2024-01-15T10:30:00Z'
      }
    ]
    
    if (refresh) {
      mindmaps.value = mockMindmaps
    } else {
      mindmaps.value.push(...mockMindmaps)
    }
    
    hasMore.value = false // 模拟无更多数据
  } catch (error) {
    console.error('加载思维导图失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const loadMoreMindmaps = async () => {
  if (!hasMore.value) return
  await loadMindmaps()
}

const onViewChange = (index: number) => {
  activeView.value = index
}

const goToMindmapDetail = (mindmap: Mindmap) => {
  uni.navigateTo({
    url: `/pages-mindmap/detail/detail?id=${mindmap.id}`
  })
}

const goToCreateMindmap = () => {
  uni.navigateTo({
    url: '/pages-mindmap/create/create'
  })
}

const goToSearch = () => {
  uni.navigateTo({
    url: '/pages/search/search?type=mindmap'
  })
}

const showActions = (mindmap: Mindmap) => {
  selectedMindmap.value = mindmap
  showActionSheet.value = true
}

const onActionClick = (item: any) => {
  if (!selectedMindmap.value) return
  
  switch (item.name) {
    case 'edit':
      uni.navigateTo({
        url: `/pages-mindmap/edit/edit?id=${selectedMindmap.value.id}`
      })
      break
    case 'share':
      // TODO: 实现分享功能
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
      break
    case 'delete':
      uni.showModal({
        title: '确认删除',
        content: '删除后不可恢复，确定要删除这个思维导图吗？',
        success: (res) => {
          if (res.confirm) {
            deleteMindmap(selectedMindmap.value!.id)
          }
        }
      })
      break
  }
  
  showActionSheet.value = false
  selectedMindmap.value = null
}

const deleteMindmap = async (id: number) => {
  try {
    // TODO: 实现删除功能
    // await mindmapStore.deleteMindmap(id)
    
    // 从列表中移除
    const index = mindmaps.value.findIndex(m => m.id === id)
    if (index > -1) {
      mindmaps.value.splice(index, 1)
    }
    
    uni.showToast({
      title: '删除成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('删除思维导图失败:', error)
    uni.showToast({
      title: '删除失败',
      icon: 'error'
    })
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric' 
    })
  }
}
</script>

<style lang="scss" scoped>
.mindmap-page { min-height: 100vh; background-color: var(--cr-color-bg); }

/* 自定义导航栏已替换为 AppNavBar */

.view-switcher {
  background: var(--cr-color-surface);
  padding: 0 16px;
  border-bottom: 1px solid var(--cr-color-divider);
}

.mindmap-content {
  padding: 16px;
  padding-bottom: 100px;
}

.empty-state {
  padding-top: 100px;
  text-align: center;
}

// 网格视图
.mindmap-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.mindmap-card {
  /* 使用 cr-card 样式，移除手写样式 */
  position: relative;
  
  &:active {
    transform: scale(0.98);
  }
  
  .mindmap-preview {
    margin-bottom: 8px;
  }
  
  .mindmap-info {
    .mindmap-title {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--cr-color-text-strong);
      line-height: 1.4;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .mindmap-date {
      display: block;
      font-size: 11px;
      color: var(--cr-color-subtext);
      margin-bottom: 8px;
    }
    
    .mindmap-meta {
      .book-info {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
        
        .book-name {
          margin-left: 4px;
          font-size: 11px;
          color: var(--cr-color-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
      }
      
      .node-count {
        display: block;
        font-size: 10px;
        color: var(--cr-color-subtext);
      }
    }
  }
  
  .mindmap-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
  }
}

// 列表视图
.mindmap-list {
  .mindmap-item {
    /* 使用 cr-card 样式，移除手写样式 */
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    
    &:active {
      background: #f8f9fa;
    }
    
    .mindmap-thumbnail {
      margin-right: 12px;
    }
    
    .mindmap-content {
      flex: 1;
      
      .mindmap-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 6px;
        
        .mindmap-title {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          color: var(--cr-color-text-strong);
          line-height: 1.4;
          margin-right: 8px;
        }
        
        .mindmap-date {
          font-size: 11px;
          color: var(--cr-color-subtext);
          white-space: nowrap;
        }
      }
      
      .mindmap-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .book-info {
          font-size: 12px;
          color: var(--cr-color-text);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 8px;
        }
        
        .node-count {
          font-size: 11px;
          color: var(--cr-color-subtext);
          white-space: nowrap;
        }
      }
    }
    
    .mindmap-actions {
      margin-left: 8px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.fab-button {
  position: fixed;
  left: 50%;
  bottom: 100px;
  transform: translateX(-50%); // 水平居中
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: var(--cr-color-primary-600);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--cr-shadow-md);
  z-index: 100;
  
  &:active {
    transform: translateX(-50%) scale(0.95);
  }
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
