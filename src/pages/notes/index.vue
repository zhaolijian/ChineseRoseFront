<template>
  <view class="notes-page">
    <AppNavBar title="笔记" :showBack="false">
      <template #right>
        <u-icon name="search" size="20" class="cr-icon" @click="goToSearch" />
        <u-icon name="plus-circle" size="20" class="cr-icon" @click="goToAddNote" style="margin-left: 16rpx;" />
      </template>
    </AppNavBar>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <u-tabs 
        :list="filterTabs" 
        v-model="activeFilter" 
        @click="onFilterChange"
        lineWidth="30"
        lineHeight="3"
        :activeStyle="{ color: '#059669', fontWeight: 'bold' }"
      ></u-tabs>
    </view>

    <!-- 笔记列表 -->
    <PageContainer>
    <view class="notes-content">
      <view v-if="loading && notes.length === 0">
        <LoadingSkeleton :rows="4" />
      </view>
      <view v-else-if="notes.length === 0" class="empty-state">
        <EmptyState icon="list" title="还没有笔记" actionText="添加第一条笔记" @action="goToAddNote" />
      </view>

      <view v-else class="notes-list">
        <view 
          v-for="(note, idx) in notes" 
          :key="note.id || ('note-'+idx)" 
          class="note-item cr-card cr-card--padded"
          @click="goToNoteDetail(note)"
        >
          <view class="note-header">
            <text class="note-title">{{ note.title || '无标题' }}</text>
            <text class="note-date">{{ formatDate(note.createdAt) }}</text>
          </view>
          
          <view class="note-content">
            <text class="note-text">{{ note.content }}</text>
          </view>
          
          <view class="note-footer">
            <view class="book-info">
              <u-icon name="book" size="12" class="cr-icon"></u-icon>
              <text class="book-name">{{ note.bookTitle || '未知书籍' }}</text>
            </view>
            <view class="note-tags" v-if="note.tags && note.tags.length">
              <text class="tag" v-for="(tag, tIdx) in note.tags.slice(0, 2)" :key="tag || ('t'+tIdx)">#{{ tag }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    </PageContainer>
    <TabBar />

    <!-- 悬浮添加按钮 -->
    <view class="fab-button" @click="goToAddNote">
      <u-icon name="plus" size="24" color="#fff"></u-icon>
    </view>

    <!-- 加载提示 -->
    <u-loading-page :loading="pageLoading" bg-color="#f5f7fa" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useNoteStore } from '@/stores/modules/note'
import { useUserStore } from '@/stores/modules/user'
import { safeHideTabBar } from '@/utils/tabbar'
import { logger, createContext } from '@/utils'
import AppNavBar from '@/components/common/AppNavBar.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import TabBar from '@/components/common/TabBar.vue'

// 类型定义
interface Note {
  id: number
  title?: string
  content: string
  bookId: number
  bookTitle?: string
  tags?: string[]
  createdAt: string
  updatedAt?: string
}

// Store
const noteStore = useNoteStore()
const userStore = useUserStore()

// 响应式数据
const notes = ref<Note[]>([])
const loading = ref(false)
const pageLoading = ref(false)
const hasMore = ref(true)
const activeFilter = ref(0)

// 筛选选项
const filterTabs = ref([
  { name: '全部' },
  { name: '最近' },
  { name: '收藏' }
])

// 生命周期
onMounted(async () => {
  const ctx = createContext()
  logger.info(ctx, '[NotesPage] 页面挂载')
  await checkLoginAndLoadData()
})

onShow(async () => {
  const ctx = createContext()
  logger.info(ctx, '[NotesPage] 页面显示')
  
  // 修复：使用统一的TabBar工具函数
  safeHideTabBar()
  // 页面显示时刷新数据
  await loadNotes()
})

onPullDownRefresh(async () => {
  const ctx = createContext()
  logger.debug(ctx, '[NotesPage] 触发下拉刷新')
  await loadNotes(true)
  uni.stopPullDownRefresh()
})

onReachBottom(async () => {
  const ctx = createContext()
  if (hasMore.value && !loading.value) {
    logger.debug(ctx, '[NotesPage] 触底加载更多')
    await loadMoreNotes()
  }
})

// 方法
const checkLoginAndLoadData = async () => {
  const ctx = createContext()
  
  try {
    pageLoading.value = true
    logger.debug(ctx, '[checkLoginAndLoadData] 开始检查登录状态')
    
    // 检查登录状态
    if (!userStore.isLoggedIn) {
      logger.info(ctx, '[checkLoginAndLoadData] 用户未登录，跳转到登录页')
      uni.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    logger.debug(ctx, '[checkLoginAndLoadData] 用户已登录，加载笔记数据')
    // 加载笔记数据
    await loadNotes()
  } catch (error) {
    logger.error(ctx, '[checkLoginAndLoadData] 初始化失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    pageLoading.value = false
  }
}

const loadNotes = async (refresh = false) => {
  const ctx = createContext()
  
  try {
    loading.value = true
    logger.debug(ctx, '[loadNotes] 开始加载笔记', { refresh, filter: activeFilter.value })
    
    // TODO: 实现笔记数据加载
    // const result = await noteStore.fetchNotes(refresh ? 1 : noteStore.currentPage, activeFilter.value)
    
    // 模拟数据
    const mockNotes = [
      {
        id: 1,
        title: '读书笔记示例',
        content: '这是一条示例笔记，展示笔记内容的格式。可以包含多行文本，支持各种格式的内容记录...',
        bookId: 1,
        bookTitle: '《示例书籍》',
        tags: ['重要', '理论'],
        createdAt: '2024-01-15T10:30:00Z'
      }
    ]
    
    if (refresh) {
      notes.value = mockNotes
    } else {
      notes.value.push(...mockNotes)
    }
    
    hasMore.value = false // 模拟无更多数据
    logger.info(ctx, '[loadNotes] 加载笔记成功', { count: mockNotes.length })
  } catch (error) {
    logger.error(ctx, '[loadNotes] 加载笔记失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const loadMoreNotes = async () => {
  if (!hasMore.value) return
  await loadNotes()
}

const onFilterChange = (index: number) => {
  const ctx = createContext()
  logger.debug(ctx, '[onFilterChange] 切换筛选', { filter: filterTabs.value[index].name })
  activeFilter.value = index
  loadNotes(true) // 重新加载数据
}

const goToNoteDetail = (note: Note) => {
  const ctx = createContext()
  logger.debug(ctx, '[goToNoteDetail] 跳转到笔记详情', { noteId: note.id, title: note.title })
  uni.navigateTo({
    url: `/pages-note/detail/detail?id=${note.id}`
  })
}

const goToAddNote = () => {
  const ctx = createContext()
  logger.debug(ctx, '[goToAddNote] 跳转到添加笔记页')
  uni.navigateTo({
    url: '/pages-note/add/add'
  })
}

const goToSearch = () => {
  const ctx = createContext()
  logger.debug(ctx, '[goToSearch] 跳转到搜索页', { type: 'note' })
  uni.navigateTo({
    url: '/pages/search/search?type=note'
  })
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
.notes-page { min-height: 100vh; background-color: var(--cr-color-bg); }

/* 自定义导航栏已替换为 AppNavBar */

.filter-bar { background: var(--cr-color-surface); padding: 0 16px; border-bottom: 1px solid var(--cr-color-divider); }

.notes-content {
  padding: 16px;
  padding-bottom: 100px; // 为tabbar和fab留出空间
}

.empty-state {
  padding-top: 100px;
  text-align: center;
}

.notes-list {
  .note-item {
    /* 使用 cr-card 样式，已在模板添加 cr-card 类 */
    margin-bottom: 12px;
    
    &:active {
      background: var(--cr-color-bg);
    }
    
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      
      .note-title {
        flex: 1;
        font-size: 16px;
        font-weight: 600;
        color: var(--cr-color-text-strong);
        line-height: 1.4;
        margin-right: 12px;
      }
      
      .note-date {
        font-size: 12px;
        color: var(--cr-color-subtext);
        white-space: nowrap;
      }
    }
    
    .note-content {
      margin-bottom: 12px;
      
      .note-text {
        font-size: 14px;
        color: var(--cr-color-text);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
    
    .note-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .book-info {
        display: flex;
        align-items: center;
        
        .book-name {
          margin-left: 4px;
          font-size: 12px;
          color: var(--cr-color-text);
        }
      }
      
      .note-tags {
        display: flex;
        gap: 8px;
        
        .tag { font-size: 11px; color: var(--cr-color-primary-600); background: var(--cr-color-primary-50); padding: 2px 6px; border-radius: 8rpx; }
      }
    }
  }
}

.fab-button {
  position: fixed;
  left: 50%;
  bottom: 100px; // 避开tabbar
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
