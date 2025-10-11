<template>
  <view class="bookshelf-page">
    <AppNavBar title="书架" :showBack="false">
      <template #left>
        <u-icon name="plus" size="20" color="#2E7D32" @click="goToAddBook" />
      </template>
      <template #right>
        <u-icon name="scan" size="20" color="#2E7D32" @click="handleScanISBN" />
      </template>
    </AppNavBar>

    <!-- 书籍列表 -->
    <PageContainer>
    <view class="bookshelf-content">
      <!-- 未登录状态：显示登录引导 -->
      <view v-if="!userStore.isLoggedIn" class="empty-state">
        <EmptyState
          icon="account"
          title="登录后查看你的书架"
          actionText="立即登录"
          @action="goToLogin"
        />
      </view>

      <!-- 已登录状态：显示书籍列表 -->
      <view v-else>
        <view v-if="loading && books.length === 0">
          <LoadingSkeleton :rows="4" />
        </view>
        <view v-else-if="books.length === 0" class="empty-state">
          <EmptyState icon="book" title="还没有添加书籍" actionText="添加第一本书" @action="showAddBook = true" />
        </view>

        <view v-else class="book-grid">
          <view v-for="book in books" :key="book.id" class="book-item cr-card cr-card--padded" @click="goToBookDetail(book)">
            <view class="book-cover">
              <u-image
                :src="book.coverUrl || '/static/images/book-placeholder.svg'"
                mode="aspectFit"
                width="100%"
                height="140px"
                radius="8"
                loading-icon="book"
              ></u-image>
            </view>
            <view class="book-info">
              <text class="book-title">{{ book.title }}</text>
              <text class="book-author">{{ book.author }}</text>
              <text class="book-notes">{{ book.noteCount || 0 }}条笔记</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    </PageContainer>
    <TabBar />

    <!-- 添加书籍弹窗 -->
    <u-popup 
      v-model="showAddBook" 
      mode="bottom" 
      height="30%"
      round="20"
      closeable
    >
      <view class="add-book-popup">
        <view class="popup-header">
          <text class="popup-title">添加书籍</text>
        </view>
        
        <view class="add-methods">
          <view class="method-item" @click="addByISBN">
            <u-icon name="scan" size="30" class="cr-icon--active"></u-icon>
            <text class="method-text">扫描ISBN</text>
          </view>
          
          <view class="method-item" @click="addManually">
            <u-icon name="edit-pen" size="30" class="cr-icon--active"></u-icon>
            <text class="method-text">手动添加</text>
          </view>
        </view>
      </view>
    </u-popup>

    <!-- 加载提示 -->
    <u-loading-page 
      :loading="pageLoading"
      bg-color="#f5f7fa"
    ></u-loading-page>

    <!-- 书籍预览弹窗 -->
    <BookPreview
      v-model="showBookPreview"
      :book="previewBook"
      @rescan="handleRescan"
      @added="handleBookAdded"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useBookStore } from '@/stores/modules/book'
import { useUserStore } from '@/stores/modules/user'
import { safeHideTabBar } from '@/utils/tabbar'
import { logger, createContext } from '@/utils'
import AppNavBar from '@/components/common/AppNavBar.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TabBar from '@/components/common/TabBar.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import BookPreview from '@/components/business/BookPreview.vue'
import { searchBookByISBN } from '@/api/modules/book'

// 类型定义
interface Book {
  id: number
  title: string
  author?: string
  isbn?: string
  coverUrl?: string
  noteCount?: number
  createdAt?: string
  updatedAt?: string
}


// Store
const bookStore = useBookStore()
const userStore = useUserStore()

// 响应式数据
const books = ref<Book[]>([])
const showAddBook = ref(false)
const loading = ref(false)
const pageLoading = ref(false)
const hasMore = ref(true)
const showBookPreview = ref(false)
const previewBook = ref<any>({})
const scanLoading = ref(false)
const hasInitialLoaded = ref(false)

// 生命周期
onMounted(async () => {
  const ctx = createContext()
  logger.info(ctx, '[BookshelfPage] 页面挂载')
  await init()
})

onShow(async () => {
  const ctx = createContext()
  logger.info(ctx, '[BookshelfPage] 页面显示')
  
  // 修复：使用统一的TabBar工具函数
  safeHideTabBar()
  
  // 页面显示时按需加载：未登录不请求，已登录才加载
  if (userStore.isLoggedIn) {
    logger.debug(ctx, '[BookshelfPage] 用户已登录，加载书籍数据')
    if (hasInitialLoaded.value) {
      await loadBooks(true)
    }
  } else {
    logger.debug(ctx, '[BookshelfPage] 用户未登录，跳过加载')
  }
})

onPullDownRefresh(async () => {
  const ctx = createContext()
  logger.debug(ctx, '[BookshelfPage] 触发下拉刷新')

  // 未登录时静默返回
  if (!userStore.isLoggedIn) {
    logger.debug(ctx, '[BookshelfPage] 用户未登录，静默处理下拉刷新')
    uni.stopPullDownRefresh()
    return
  }

  await loadBooks(true)
  uni.stopPullDownRefresh()
})

onReachBottom(async () => {
  const ctx = createContext()

  // 未登录时静默返回
  if (!userStore.isLoggedIn) {
    logger.debug(ctx, '[BookshelfPage] 用户未登录，静默处理触底事件')
    return
  }

  if (hasMore.value && !loading.value) {
    logger.debug(ctx, '[BookshelfPage] 触底加载更多')
    await loadMoreBooks()
  }
})

// 方法
const init = async () => {
  const ctx = createContext()

  try {
    pageLoading.value = true
    logger.debug(ctx, '[init] 初始化书架页')

    // ADR-007: 使用简单的二元状态判断，不做网络验证
    if (userStore.isLoggedIn) {
      logger.debug(ctx, '[init] 用户已登录，加载书籍数据')
      await loadBooks(true)
      hasInitialLoaded.value = true
    } else {
      logger.debug(ctx, '[init] 用户未登录，显示登录引导')
    }
  } catch (error) {
    logger.error(ctx, '[init] 初始化失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    pageLoading.value = false
  }
}

// 跳转到登录页
const goToLogin = () => {
  const ctx = createContext()
  logger.debug(ctx, '[goToLogin] 跳转到登录页')
  uni.navigateTo({
    url: '/pages/login/login'
  })
}

const loadBooks = async (refresh = false) => {
  const ctx = createContext()
  
  try {
    loading.value = true
    logger.debug(ctx, '[loadBooks] 开始加载书籍', { refresh })
    
    const targetPage = refresh || books.value.length === 0 ? 1 : bookStore.currentPage + 1
    const result = await bookStore.fetchBooks(targetPage)

    if (targetPage === 1) {
      books.value = [...result.books]
    } else {
      books.value = [...books.value, ...result.books]
    }
    
    hasMore.value = result.hasMore
    logger.info(ctx, '[loadBooks] 加载书籍成功', { count: result.books.length, hasMore: result.hasMore })
  } catch (error) {
    logger.error(ctx, '[loadBooks] 加载书籍失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const loadMoreBooks = async () => {
  if (!hasMore.value) return

  await loadBooks()
}

const goToBookDetail = (book: Book) => {
  const ctx = createContext()
  logger.debug(ctx, '[goToBookDetail] 跳转到书籍详情', { bookId: book.id, title: book.title })
  uni.navigateTo({
    url: `/pages-book/detail/detail?id=${book.id}`
  })
}

const goToAddBook = () => {
  const ctx = createContext()
  logger.debug(ctx, '[goToAddBook] 跳转到添加书籍页面')
  uni.navigateTo({
    url: '/pages-book/add/add'
  })
}

const addByISBN = () => {
  const ctx = createContext()
  logger.debug(ctx, '[addByISBN] 调用扫码功能')
  showAddBook.value = false
  handleScanISBN()
}

// ISBN扫码处理
const handleScanISBN = async () => {
  const ctx = createContext()
  
  try {
    logger.debug(ctx, '[handleScanISBN] 开始扫码')
    
    // 调用uni-app扫码API
    const scanResult = await uni.scanCode({
      onlyFromCamera: false,
      scanType: ['barCode'] // ISBN通常是条形码
    })
    
    if (!scanResult.result) {
      logger.warn(ctx, '[handleScanISBN] 扫码结果为空')
      return
    }
    
    const isbn = scanResult.result
    logger.info(ctx, '[handleScanISBN] 扫码成功', { isbn })
    
    // 显示加载提示
    uni.showLoading({
      title: '正在查询书籍信息...',
      mask: true
    })
    
    scanLoading.value = true
    
    try {
      // 调用后端ISBN查询接口
      const bookInfo = await searchBookByISBN(isbn)
      
      logger.info(ctx, '[handleScanISBN] 书籍信息查询成功', { bookInfo })
      
      // 显示书籍预览
      previewBook.value = bookInfo
      showBookPreview.value = true
      
    } catch (error: any) {
      logger.error(ctx, '[handleScanISBN] 查询书籍信息失败', error)
      
      // 查询失败，询问是否手动创建
      uni.showModal({
        title: '未找到书籍信息',
        content: '无法获取该ISBN的书籍信息，是否手动创建？',
        confirmText: '手动创建',
        cancelText: '重新扫描',
        success: (res) => {
          if (res.confirm) {
            // 跳转到手动添加页面，带上ISBN
            uni.navigateTo({
              url: `/pages-book/add/add?isbn=${isbn}`
            })
          } else {
            // 重新扫描
            handleScanISBN()
          }
        }
      })
    } finally {
      uni.hideLoading()
      scanLoading.value = false
    }
    
  } catch (error: any) {
    const ctx = createContext()
    
    if (error.errMsg?.includes('cancel')) {
      logger.debug(ctx, '[handleScanISBN] 用户取消扫码')
      // 用户取消扫码，静默处理
      return
    }
    
    logger.error(ctx, '[handleScanISBN] 扫码失败', error)
    uni.showToast({
      title: '扫码失败，请重试',
      icon: 'none'
    })
  }
}

// 处理重新扫描
const handleRescan = () => {
  const ctx = createContext()
  logger.debug(ctx, '[handleRescan] 重新扫描')
  showBookPreview.value = false
  handleScanISBN()
}

// 处理书籍添加成功
const handleBookAdded = async (book: Book) => {
  const ctx = createContext()
  logger.info(ctx, '[handleBookAdded] 书籍添加成功', { bookId: book.id })
  
  // 刷新书架列表
  await loadBooks(true)
}

const addManually = () => {
  const ctx = createContext()
  logger.debug(ctx, '[addManually] 跳转到手动添加页面')
  showAddBook.value = false
  uni.navigateTo({
    url: '/pages-book/add/add'
  })
}
</script>

<style lang="scss" scoped>
.bookshelf-page { min-height: 100vh; background-color: var(--cr-color-bg); }

.bookshelf-content {
  padding: 16px;
  padding-bottom: 100px; // 为tabbar留出空间
}

.empty-state {
  padding-top: 100px;
  text-align: center;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.book-item {
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
  
  .book-cover {
    margin-bottom: 8px;
  }
  
.book-info {
  .book-title {
    display: block;
    font-size: 14px; // 保持原字号（后续按令牌统一）
    font-weight: 600;
    color: var(--cr-color-text-strong);
    line-height: 1.4;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .book-author {
    display: block;
    font-size: 12px;
    color: var(--cr-color-text);
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .book-notes {
    display: block;
    font-size: 11px;
    color: var(--cr-color-subtext);
  }
}
}

.add-book-popup {
  padding: 20px;
  
  .popup-header {
    text-align: center;
    margin-bottom: 30px;
    
    .popup-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .add-methods {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30px;
    
    .method-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 12px;
      background: #f8f9fa;
      min-width: 100px;
      
      &:active {
        background: #e9ecef;
      }
      
      .method-text {
        margin-top: 8px;
        font-size: 14px;
        color: #333;
      }
    }
  }
  
}


/* 微信小程序特定样式 */
/* #ifdef MP-WEIXIN */
.custom-navbar {
  padding-top: 20px; // 微信小程序状态栏高度
}
/* #endif */

/* H5特定样式 */
/* #ifdef H5 */
.custom-navbar {
  padding-top: 0;
}
/* #endif */
</style>
