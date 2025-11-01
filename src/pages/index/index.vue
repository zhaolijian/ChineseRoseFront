<template>
  <view class="bookshelf-page">
    <AppNavBar title="书架" :showBack="false" />

    <!-- 书籍列表 -->
    <PageContainer>
      <view class="bookshelf-content">
        <!-- 未登录状态：显示登录引导 -->
        <view v-if="!userStore.isLoggedIn" class="bookshelf-empty">
          <EmptyState
            icon="account"
            title="登录后查看你的书架"
            actionText="立即登录"
            @action="goToLogin"
          />
        </view>

        <!-- 已登录状态：显示书籍列表 -->
        <view v-else>
          <view class="bookshelf-search" :style="searchSafeStyle">
            <view
              :class="[
                'search-box',
                { 'search-box--focus': isSearchFocus }
              ]"
            >
              <view class="search-leading">
                <u-icon name="search" size="20" color="#6b7280" class="search-leading__icon" />
                <input
                  class="search-input"
                  type="text"
                  confirm-type="search"
                  :value="searchKeyword"
                  placeholder="搜索书籍"
                  placeholder-class="search-placeholder"
                  @input="handleSearchInput"
                  @confirm="handleSearchConfirm"
                  @keyup.enter="handleSearchConfirm"
                  @focus="handleSearchFocus"
                  @blur="handleSearchBlur"
                />
                <u-icon
                  v-if="searchKeyword"
                  name="close"
                  size="20"
                  color="#6b7280"
                  class="search-clear-icon"
                  @click="handleClearSearch"
                />
              </view>
              <view class="search-divider" />
              <view class="search-suffix" @click="handleScanISBN">
                <image
                  class="scan-icon"
                  src="/static/icons/scan-isbn.svg"
                  mode="aspectFit"
                />
              </view>
            </view>
          </view>

          <view v-if="loading && books.length === 0">
            <LoadingSkeleton :rows="4" />
          </view>

          <view v-else class="shelf-grid">
            <view class="shelf-card add-book-card" @click="goToAddBook">
              <view class="add-card__icon">
                <text class="add-card__plus">+</text>
              </view>
              <text class="add-card__text">添加新书</text>
            </view>
            <view
              v-for="book in books"
              :key="book.id"
              class="shelf-card book-card"
              @click="goToBookDetail(book)"
            >
              <BookCover
                :src="book.coverUrl"
                :width="120"
                :ratio="3 / 4"
                :radius="16"
                :padding="12"
                bg-color="#F5F7FA"
                :shadow="true"
              />
              <view class="book-info">
                <text class="book-title">{{ book.title }}</text>
                <text class="book-notes">{{ book.noteCount || 0 }}条笔记</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </PageContainer>
    <!-- 浮动添加按钮 -->
    <view class="bookshelf-fab" @click="goToAddBook">
      <text class="fab-icon">+</text>
    </view>
    <TabBar />

    <!-- 添加书籍弹窗 -->
    <u-popup
      v-if="showAddBook"
      v-model="showAddBook"
      mode="bottom"
      :round="24"
      closeable
      :z-index="10075"
      :overlay="true"
      :close-on-click-overlay="true"
      :custom-style="popupStyle"
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
      v-if="showBookPreview"
      v-model="showBookPreview"
      :book="previewBook"
      @rescan="handleRescan"
      @added="handleBookAdded"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
import BookCover from '@/components/book/BookCover.vue'
import BookPreview from '@/components/business/BookPreview.vue'
import { searchBookByISBN } from '@/api/modules/book'
import { isNetworkError } from '@/types/errorCodes'
import type { BookListParams } from '@/stores/modules/book'

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
const PAGE_SIZE = 12
const popupStyle = {
  backgroundColor: '#ffffff',
  boxShadow: '0 -2rpx 16rpx rgba(0, 0, 0, 0.08)'
}
const searchKeyword = ref('')
const currentKeyword = ref('')
const isSearchFocus = ref(false)
const windowWidth = ref(375)
const safeTopPx = ref(56)
const safeRightPx = ref(16)

const pxToRpx = (px: number) => {
  const width = windowWidth.value || 375
  return Math.round((px * 750) / width)
}

const searchSafeStyle = computed(() => {
  const extra = Math.max(0, safeRightPx.value - 16)
  if (extra <= 0) return {}
  return { paddingRight: `${pxToRpx(extra)}rpx` }
})

// ISBN 归一化与校验
const normalizeISBN = (raw: string) => (raw || '').replace(/[^0-9Xx]/g, '').toUpperCase()
const isValidISBN = (s: string) => /^\d{13}$/.test(s) || /^\d{9}[\dX]$/.test(s)

// 生命周期
onMounted(async () => {
  const ctx = createContext()
  logger.info(ctx, '[BookshelfPage] 页面挂载')
  updateSafeArea()
  await init()
})

onShow(async () => {
  const ctx = createContext()
  logger.info(ctx, '[BookshelfPage] 页面显示')
  updateSafeArea()
  
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
    const params: BookListParams & { limit?: number } = {
      pageSize: PAGE_SIZE,
      limit: PAGE_SIZE
    }
    if (currentKeyword.value) {
      params.keyword = currentKeyword.value
    }
    const result = await bookStore.fetchBooks(targetPage, params)

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
    url: '/pages/book/add-book'
  })
}

const addByISBN = () => {
  const ctx = createContext()
  logger.debug(ctx, '[addByISBN] 调用扫码功能')
  showAddBook.value = false
  handleScanISBN()
}

// 安全显示Toast（避免与扫码界面关闭动画冲突）
const showToastSafely = (options: any) => {
  // 延迟300ms，等待扫码界面完全关闭
  setTimeout(() => {
    uni.showToast({
      ...options,
      duration: options.duration || 2500 // 默认2.5秒，让用户有足够时间看到
    })
  }, 300)
}

// ISBN扫码处理
const handleScanISBN = async () => {
  const ctx = createContext()

  try {
    logger.info(ctx, '[handleScanISBN] 开始扫码')

    // 调用uni-app扫码API
    const scanResult = await uni.scanCode({
      onlyFromCamera: true,
      scanType: ['barCode'] // 仅条形码（ISBN常见为EAN-13）
    })

    if (!scanResult.result) {
      logger.warn(ctx, '[handleScanISBN] 扫码结果为空')
      showToastSafely({
        title: '未识别到条形码，请重试',
        icon: 'none'
      })
      return
    }

    const raw = scanResult.result || ''
    const isbn = normalizeISBN(raw)
    logger.info(ctx, '[handleScanISBN] 扫码原始结果', { raw, isbn })

    if (!isValidISBN(isbn)) {
      logger.warn(ctx, '[handleScanISBN] 无效的ISBN', { raw, isbn })
      showToastSafely({
        title: `扫描到：${raw}，这不是有效的ISBN码`,
        icon: 'none',
        duration: 3000
      })
      return
    }
    logger.info(ctx, '[handleScanISBN] ISBN校验通过', { isbn })
    
    // 显示加载提示
    uni.showLoading({
      title: '正在查询书籍信息...',
      mask: true
    })
    
    scanLoading.value = true
    
    try {
      // 调用后端ISBN查询接口（禁用request自动Loading，由页面管理）
      const bookInfo = await searchBookByISBN(isbn, { showLoading: false })

      logger.info(ctx, '[handleScanISBN] 书籍信息查询成功', {
        hasTitle: !!bookInfo?.title,
        hasISBN: !!bookInfo?.isbn,
        bookInfo
      })

      // 显示书籍预览
      previewBook.value = bookInfo
      showBookPreview.value = true

    } catch (error: any) {
      logger.error(ctx, '[handleScanISBN] 查询书籍信息失败', {
        error,
        errorCode: error?.code,
        errorMessage: error?.message
      })

      // 网络异常单独提示
      if (typeof error?.code === 'number' && isNetworkError(error.code)) {
        showToastSafely({
          title: '网络异常，请检查网络后重试',
          icon: 'none'
        })
        return
      }

      // 未找到书籍：弹窗询问
      uni.showModal({
        title: '未找到书籍信息',
        content: `ISBN：${isbn}\n\n数据库中暂无此书信息，请手动添加`,
        confirmText: '手动添加',
        cancelText: '重新扫描',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: `/pages/book/add-book?isbn=${isbn}` })
          } else if (res.cancel) {
            handleScanISBN()
          }
        }
      })
    } finally {
      // 防御性关闭Loading：避免在某些异常情况下Loading已被关闭导致报错
      try {
        uni.hideLoading()
      } catch (e) {
        logger.warn(ctx, '[handleScanISBN] hideLoading失败（非致命错误）', e)
      }
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
    url: '/pages/book/add-book'
  })
}

const handleSearchInput = (event: any) => {
  searchKeyword.value = event?.detail?.value ?? event?.target?.value ?? ''
}

const handleSearchConfirm = async (event?: any) => {
  const value = event?.detail?.value ?? searchKeyword.value
  currentKeyword.value = value.trim()
  searchKeyword.value = currentKeyword.value
  await loadBooks(true)
}

const handleSearchFocus = () => {
  isSearchFocus.value = true
}

const handleSearchBlur = () => {
  isSearchFocus.value = false
}

const handleClearSearch = async () => {
  searchKeyword.value = ''
  currentKeyword.value = ''
  await loadBooks(true)
}

function updateSafeArea() {
  try {
    const info = uni.getSystemInfoSync?.()
    if (!info) return
    windowWidth.value = info.windowWidth || 375
    const statusBarHeight = info.statusBarHeight || 0
    const menuRect = uni.getMenuButtonBoundingClientRect?.()
    const capsuleBottom = menuRect?.bottom ?? (statusBarHeight + 44)
    const capsuleRight = menuRect?.right ?? (windowWidth.value - 16)
    safeTopPx.value = capsuleBottom + 6
    safeRightPx.value = Math.max(12, windowWidth.value - capsuleRight)
  } catch (error) {
    logger.warn(createContext(), '[BookshelfPage] 获取系统信息失败', error)
  }
}
</script>

<style lang="scss">
@import '@/styles/design-tokens/bookshelf.scss';
@import '@/styles/modules/bookshelf.scss';

$fab-default: map-get($bookshelf-fab-states, default);
$fab-hover: map-get($bookshelf-fab-states, hover);
$fab-active: map-get($bookshelf-fab-states, active);

.bookshelf-page {
  min-height: 100vh;
  background-color: map-get($bookshelf-colors, background);
  padding-bottom: map-get($bookshelf-layout, tabbar-height);
}

.bookshelf-content {
  padding: map-get($bookshelf-layout, page-padding-y) map-get($bookshelf-layout, page-padding-x);
  display: flex;
  flex-direction: column;
  // gap: $shelf-card-gap;  // 移除：小程序flex gap兼容性问题，改用margin-top
}

// 为shelf-grid添加上边距（替代gap）
.shelf-grid {
  margin-top: $shelf-card-gap;
}

.bookshelf-search {
  display: flex;
  align-items: center;
  gap: map-get($bookshelf-spacing, md);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 map-get($bookshelf-spacing, md);
  border-radius: 40rpx;
  background: #f8f9fa;
  border: 1rpx solid rgba(0, 0, 0, 0.12);
  transition: background-color map-get($bookshelf-transitions, normal), border-color map-get($bookshelf-transitions, normal), border-width map-get($bookshelf-transitions, normal), box-shadow map-get($bookshelf-transitions, normal);
}

.search-box--focus {
  background: #ffffff;
  border: 2rpx solid map-get($bookshelf-colors, primary);
  padding: 0 calc(#{map-get($bookshelf-spacing, md)} - 1rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 168, 45, 0.12);
}

.search-leading {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;

  &__icon {
    flex-shrink: 0;
  }
}

.search-clear-icon {
  flex-shrink: 0;
  cursor: pointer;
}

.search-divider {
  width: 1rpx;
  height: 44rpx;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 8rpx;
}

.search-suffix {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80rpx;
  height: 72rpx;
  padding: 0 16rpx;
  cursor: pointer;

  &:active {
    opacity: 0.8;
    transform: scale(0.95);
    transition: all 0.1s;
  }
}

.scan-icon {
  width: 48rpx;
  height: 48rpx;
}

.search-icon {
  margin-right: map-get($bookshelf-spacing, sm);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: map-get($bookshelf-font-sizes, sm);
  color: map-get($bookshelf-colors, title);
  line-height: 72rpx;
}

.search-input:focus {
  outline: none;
}

.search-clear {
  margin-left: map-get($bookshelf-spacing, sm);
  padding: map-get($bookshelf-spacing, xs);
}

.search-placeholder {
  color: #6b7280;
  font-size: map-get($bookshelf-font-sizes, sm);
}

.search-quick {
  width: 72rpx;
  height: 72rpx;
  border-radius: map-get($bookshelf-radius, lg);
  border: 1rpx solid map-get($bookshelf-colors, border);
  background: map-get($bookshelf-colors, card-background);
  box-shadow: map-get($bookshelf-shadows, card);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform map-get($bookshelf-transitions, fast), box-shadow map-get($bookshelf-transitions, normal);

  &:active {
    transform: scale(0.95);
  }
}

.bookshelf-empty {
  padding-top: map-get($bookshelf-spacing, huge);
  display: flex;
  justify-content: center;
}

// 添加新书卡片（外壳由 .shelf-card 统一，这里只定义特有样式）
.add-book-card {
  border: 3.5rpx dashed rgba(0, 168, 45, 0.12);
  gap: 12rpx;
  transition: transform map-get($bookshelf-transitions, fast), border-color map-get($bookshelf-transitions, normal);

  &:active {
    transform: scale(0.97);
    border-color: rgba(0, 168, 45, 0.25);
  }
}

 

.add-card__icon {
  // 极致压缩：缩小图标尺寸
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  background: #f8faf8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background map-get($bookshelf-transitions, normal);
}

.add-card__plus {
  font-size: 40rpx;
  font-weight: 300;
  color: #666666;
  line-height: 1;
  transition: color map-get($bookshelf-transitions, normal);
}

 

.add-card__text {
  // 极致压缩：缩小字号
  font-size: 22rpx;
  font-weight: 400;
  color: #666666;
  line-height: 1.4;
  text-align: center;
}

// 书籍卡片（外壳由 .shelf-card 统一，这里只定义内部样式）
.book-card {
  gap: 12rpx;
  transition: transform map-get($bookshelf-transitions, fast), box-shadow map-get($bookshelf-transitions, normal);

  &:active {
    transform: scale(0.98);
  }
}

.book-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  align-items: center; // 居中对齐

  .book-title {
    font-size: 26rpx; // 缩小字号
    font-weight: map-get($bookshelf-font-weights, semibold);
    color: map-get($bookshelf-colors, title);
    line-height: 1.3;
    text-align: center; // 居中
    // 单行截断
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .book-notes {
    font-size: 22rpx; // 缩小字号
    color: map-get($bookshelf-colors, gray-text);
    text-align: center; // 居中
  }
}

.bookshelf-fab {
  position: fixed;
  left: 50%;
  bottom: calc(#{map-get($bookshelf-layout, fab-bottom)} + constant(safe-area-inset-bottom));
  bottom: calc(#{map-get($bookshelf-layout, fab-bottom)} + env(safe-area-inset-bottom));
  width: map-get($bookshelf-sizes, fab-size);
  height: map-get($bookshelf-sizes, fab-size);
  border-radius: map-get($bookshelf-radius, full);
  background: map-get($fab-default, background);
  box-shadow: map-get($fab-default, shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: transform map-get($bookshelf-transitions, fast), box-shadow map-get($bookshelf-transitions, normal), background-color map-get($bookshelf-transitions, normal);
  transform: translateX(-50%);

  &:active {
    transform: translateX(-50%) #{map-get($fab-active, transform)};
    box-shadow: map-get($fab-active, shadow);
  }
}

.fab-icon {
  font-size: 48rpx;
  font-weight: map-get($bookshelf-font-weights, bold);
  color: #ffffff;
  line-height: 1;
}

.add-book-popup {
  padding: map-get($bookshelf-spacing, xl);
  display: flex;
  flex-direction: column;
  gap: map-get($bookshelf-spacing, xl);

  .popup-header {
    text-align: center;

    .popup-title {
      font-size: map-get($bookshelf-font-sizes, lg);
      font-weight: map-get($bookshelf-font-weights, semibold);
      color: map-get($bookshelf-colors, title);
    }
  }

  .add-methods {
    display: flex;
    justify-content: center;
    gap: map-get($bookshelf-spacing, xl);
  }

  .method-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: map-get($bookshelf-spacing, sm);
    min-width: 168rpx;
    padding: map-get($bookshelf-spacing, lg);
    border-radius: map-get($bookshelf-radius, lg);
    background: map-get($bookshelf-colors, primary-light);
    transition: background-color map-get($bookshelf-transitions, normal), transform map-get($bookshelf-transitions, fast);

    &:active {
      transform: scale(0.98);
    }
  }

  .method-text {
    font-size: map-get($bookshelf-font-sizes, base);
    color: map-get($bookshelf-colors, title);
    font-weight: map-get($bookshelf-font-weights, medium);
  }
}
</style>
