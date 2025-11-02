<template>
  <view class="book-detail-page">
    <!-- 1. 顶部导航栏（自定义，节点 36:117） -->
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-content">
        <view class="navbar-btn" @click="onBack">
          <image class="icon" src="@/assets/icons/book-detail/back.svg" mode="aspectFit" />
        </view>
        <text class="navbar-title">书籍详情</text>
        <view class="navbar-btn" @click="onMore">
          <image class="icon" src="@/assets/icons/book-detail/more.svg" mode="aspectFit" />
        </view>
      </view>
    </view>

    <!-- 2. 滚动内容区 -->
    <scroll-view class="content" :style="{ paddingTop: contentPaddingTop + 'px' }" scroll-y>
      <!-- 2.1 书籍信息卡片（节点 36:7） -->
      <view class="book-card">
        <view class="book-cover">
          <image v-if="book?.coverUrl" :src="book.coverUrl" mode="aspectFill" class="cover-image" />
          <image v-else class="icon-placeholder" src="@/assets/icons/book-detail/book.svg" mode="aspectFit" />
        </view>
        <view class="book-info">
          <text class="book-title">{{ book?.title || '未知书籍' }}</text>
          <text v-if="book?.author" class="book-author">{{ book.author }}</text>
          <view class="book-stats">
            <text class="stats-count">{{ book?.noteCount || 0 }}</text>
            <text class="stats-label">条笔记</text>
          </view>
        </view>
      </view>

      <!-- 2.2 思维导图区块（节点 36:25，条件渲染） -->
      <view v-if="hasMindMap" class="section mindmap-section">
        <view class="section-header">
          <view class="header-left">
            <image class="icon" src="@/assets/icons/book-detail/mindmap.svg" mode="aspectFit" />
            <text class="section-title">思维导图</text>
          </view>
        </view>
        <view class="mindmap-card" @click="goMindMap">
          <view class="mindmap-info">
            <view class="mindmap-icon-container">
              <image class="icon" src="@/assets/icons/book-detail/mindmap.svg" mode="aspectFit" />
            </view>
            <text class="mindmap-title">{{ mindMapData?.title || '思维导图' }}</text>
          </view>
          <view class="mindmap-meta">
            <image class="icon-clock" src="@/assets/icons/book-detail/clock.svg" mode="aspectFit" />
            <text class="date">{{ formatDate(mindMapData?.updatedAt) }}</text>
          </view>
        </view>
      </view>

      <!-- 2.3 笔记列表区块（节点 36:57） -->
      <view class="section notes-section">
        <view class="section-header">
          <view class="header-left">
            <image class="icon" src="@/assets/icons/book-detail/note.svg" mode="aspectFit" />
            <text class="section-title">笔记列表</text>
          </view>
          <view class="sort-button" @click="toggleSort">
            <text class="sort-text">修改时间 {{ sortAsc ? '↑' : '↓' }}</text>
            <image class="icon-sort" src="@/assets/icons/book-detail/sort.svg" mode="aspectFit" />
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="loading && notes.length === 0" class="notes-loading">
          <text class="loading-text">加载中...</text>
        </view>

        <view v-else-if="notes.length === 0" class="notes-empty">
          <text class="empty-text">暂无笔记</text>
        </view>

        <!-- 笔记卡片列表（节点 36:72） -->
        <view v-else class="notes-list">
          <view
            v-for="note in sortedNotes"
            :key="note.id"
            class="note-card"
            @click="goNote(note.id)"
          >
            <text class="note-title">{{ note.title }}</text>
            <text v-if="note.chapterName" class="note-chapter">{{ note.chapterName }}</text>
            <text class="note-excerpt">{{ note.content }}</text>
            <view class="note-meta">
              <image class="icon-clock" src="@/assets/icons/book-detail/clock.svg" mode="aspectFit" />
              <text class="date">{{ formatDate(note.updatedAt) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-bottom" :style="{ height: safeBottomHeight + 'px' }" />
    </scroll-view>

    <!-- 浮动添加按钮 -->
    <view class="fab-button" :style="{ bottom: fabBottom + 'px' }" @click="handleAddNote">
      <text class="fab-icon">+</text>
    </view>

    <!-- 底部TabBar -->
    <TabBar />

    <!-- 更多菜单 -->
    <u-action-sheet
      v-model="showMoreMenu"
      :list="moreActions"
      @click="handleMenuAction"
    />

    <!-- 新建笔记弹窗 -->
    <CreateNoteModal
      v-model:open="showCreateNote"
      :initial-books="bookList"
      :initial-book-id="bookId"
      :chapters="chapterOptions"
      @confirm="onCreateNoteSubmit"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useBookStore } from '@/stores/modules/book'
import { getNotesByBook } from '@/api/modules/note'
import { getMindmapByBook } from '@/api/modules/mindmap'
import { deleteBook } from '@/api/modules/book'
import TabBar from '@/components/common/TabBar.vue'
import CreateNoteModal from '@/components/create-note-modal/index.vue'
import { logger, createContext } from '@/utils'

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

interface Note {
  id: number
  title: string
  content: string
  chapterName?: string | null
  pageNumber?: number | null
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

interface MindMapData {
  id: number
  bookId: number
  title?: string
  updatedAt?: string
}

// Store
const bookStore = useBookStore()

// 响应式数据
const book = ref<Book | null>(null)
const notes = ref<Note[]>([])
const mindMapData = ref<MindMapData | null>(null)
const hasMindMap = ref(false)
const loading = ref(false)
const showMoreMenu = ref(false)
const bookId = ref<number>(0)
const sortAsc = ref(false)
const showCreateNote = ref(false)

// 系统安全区域
const statusBarHeight = ref(0)
const safeBottomHeight = ref(100) // TabBar高度 + 底部安全区

// 内容区域顶部padding
const contentPaddingTop = computed(() => {
  const navbarHeight = 49.718 // 导航栏内容高度（px）
  return statusBarHeight.value + navbarHeight + 8 // 额外8px间距
})

// FAB按钮底部位置
const fabBottom = computed(() => {
  return safeBottomHeight.value + 10 // TabBar上方10px
})

// 书籍列表（用于弹窗选择）
const bookList = computed(() => {
  if (!book.value) return []
  return [{
    id: book.value.id,
    title: book.value.title,
    noteCount: book.value.noteCount
  }]
})

const chapterOptions = computed(() => {
  const chapters = notes.value
    .map(note => note.chapterName)
    .filter((name): name is string => Boolean(name && name.trim()))
  return Array.from(new Set(chapters))
})

// 排序逻辑
const sortedNotes = computed(() => {
  return [...notes.value].sort((a, b) => {
    const dateA = new Date(a.updatedAt || 0).getTime()
    const dateB = new Date(b.updatedAt || 0).getTime()
    return sortAsc.value ? dateA - dateB : dateB - dateA
  })
})

// 更多操作
const moreActions = [
  { text: '删除书籍', color: '#dc2626' }
]

// 生命周期
onLoad((options: any) => {
  const ctx = createContext()
  if (options.id) {
    bookId.value = parseInt(options.id)
    logger.info(ctx, '[BookDetail] 页面加载', { bookId: bookId.value })
  } else {
    logger.error(ctx, '[BookDetail] 缺少书籍ID')
    uni.showToast({
      title: '书籍ID不存在',
      icon: 'error'
    })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})

onMounted(async () => {
  updateSafeArea()
  await loadBookDetail()
})

onShow(async () => {
  const ctx = createContext()
  logger.debug(ctx, '[BookDetail] 页面显示')
  if (bookId.value && notes.value.length > 0) {
    await loadNotes()
  }
})

// 方法

// 获取系统信息（状态栏高度）
const updateSafeArea = () => {
  const ctx = createContext()
  try {
    const windowInfo = uni.getWindowInfo()
    statusBarHeight.value = windowInfo.statusBarHeight || 0

    const systemInfo = uni.getSystemInfoSync()
    const screenHeight = systemInfo.screenHeight || 0
    const safeAreaBottom = systemInfo.safeArea?.bottom || screenHeight
    safeBottomHeight.value = screenHeight - safeAreaBottom + 60 // TabBar高度约60px

    logger.debug(ctx, '[updateSafeArea] 安全区域', {
      statusBarHeight: statusBarHeight.value,
      safeBottomHeight: safeBottomHeight.value
    })
  } catch (error) {
    logger.error(ctx, '[updateSafeArea] 获取系统信息失败', error)
    statusBarHeight.value = 20
    safeBottomHeight.value = 100
  }
}

// 返回按钮处理
const onBack = () => {
  const ctx = createContext()
  logger.debug(ctx, '[onBack] 返回上一页')
  uni.navigateBack({
    fail: () => {
      logger.warn(ctx, '[onBack] 无法返回，跳转到首页')
      uni.switchTab({ url: '/pages/index/index' })
    }
  })
}

// 更多按钮处理
const onMore = () => {
  showMoreMenu.value = true
}

const loadBookDetail = async () => {
  const ctx = createContext()

  if (!bookId.value) {
    logger.error(ctx, '[loadBookDetail] 书籍ID为空')
    return
  }

  try {
    logger.info(ctx, '[loadBookDetail] 开始加载书籍详情', { bookId: bookId.value })

    // 并行加载书籍详情、笔记列表、思维导图
    const [bookData] = await Promise.all([
      bookStore.fetchBookDetail(bookId.value),
      loadNotes(),
      checkMindMap()
    ])

    book.value = bookData

    logger.info(ctx, '[loadBookDetail] 书籍详情加载成功', {
      title: bookData.title,
      noteCount: bookData.noteCount
    })
  } catch (error) {
    logger.error(ctx, '[loadBookDetail] 加载书籍详情失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  }
}

const loadNotes = async () => {
  const ctx = createContext()

  try {
    loading.value = true
    logger.debug(ctx, '[loadNotes] 开始加载笔记列表', { bookId: bookId.value })

    const result = await getNotesByBook(bookId.value, {
      page: 1,
      pageSize: 20
    })

    notes.value = result.list || []

    logger.info(ctx, '[loadNotes] 笔记列表加载成功', { count: notes.value.length })
  } catch (error) {
    logger.error(ctx, '[loadNotes] 加载笔记列表失败', error)
    notes.value = []
    uni.showToast({
      title: '笔记加载失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const checkMindMap = async () => {
  const ctx = createContext()

  try {
    logger.debug(ctx, '[checkMindMap] 检查思维导图', { bookId: bookId.value })

    const res = await getMindmapByBook(bookId.value)

    if (res && res.id) {
      mindMapData.value = res
      hasMindMap.value = true
      logger.info(ctx, '[checkMindMap] 发现思维导图', { id: res.id })
    } else {
      hasMindMap.value = false
      logger.debug(ctx, '[checkMindMap] 未找到思维导图')
    }
  } catch (error: any) {
    if (error?.code !== 10004) {
      logger.error(ctx, '[checkMindMap] 检查思维导图失败', error)
    }
    hasMindMap.value = false
  }
}

const toggleSort = () => {
  sortAsc.value = !sortAsc.value
}

const goNote = (id: number) => {
  const ctx = createContext()
  logger.debug(ctx, '[goNote] 跳转到笔记详情', { noteId: id })
  uni.navigateTo({
    url: `/pages-note/edit/edit?id=${id}`
  })
}

const goMindMap = () => {
  const ctx = createContext()
  logger.debug(ctx, '[goMindMap] 跳转到思维导图', { bookId: bookId.value })
  uni.navigateTo({
    url: `/pages-mindmap/view/view?bookId=${bookId.value}`
  })
}

const handleMenuAction = (index: number) => {
  if (index === 0) {
    handleDeleteBook()
  }
}

const handleDeleteBook = () => {
  const ctx = createContext()

  uni.showModal({
    title: '确认删除书籍',
    content: '删除后，该书籍下的笔记仍会保留在笔记列表中',
    confirmText: '确认删除',
    confirmColor: '#dc2626',
    success: async (res) => {
      if (res.confirm) {
        try {
          logger.info(ctx, '[handleDeleteBook] 开始删除书籍', { bookId: bookId.value })

          uni.showLoading({
            title: '删除中...',
            mask: true
          })

          await deleteBook(bookId.value)

          uni.hideLoading()

          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })

          logger.info(ctx, '[handleDeleteBook] 书籍删除成功')

          setTimeout(() => {
            uni.navigateBack()
          }, 1500)

        } catch (error) {
          uni.hideLoading()
          logger.error(ctx, '[handleDeleteBook] 删除书籍失败', error)
          uni.showToast({
            title: '删除失败',
            icon: 'error'
          })
        }
      }
    }
  })
}

const handleAddNote = () => {
  const ctx = createContext()
  logger.info(ctx, '[handleAddNote] 点击添加笔记')
  showCreateNote.value = true
}

const onCreateNoteSubmit = (payload: { bookId: number | string; chapterTitle?: string }) => {
  const ctx = createContext()
  logger.info(ctx, '[onCreateNoteSubmit] 确认创建笔记', payload)

  let url = `/pages-note/edit/edit?bookId=${payload.bookId}`
  if (payload.chapterTitle) {
    url += `&chapter=${encodeURIComponent(payload.chapterTitle)}`
  }

  uni.navigateTo({ url })

  showCreateNote.value = false
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${month}月${day}日`
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens/book-detail.scss';

.book-detail-page {
  min-height: 100vh;
  background-color: $book-detail-bg;
  position: relative;
}

// 1. 顶部导航栏
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: $surface-translucent;
  border-bottom: 1.5rpx solid $book-detail-border-navbar;

  .navbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx $page-padding-x 1.5rpx;
    height: 94.5rpx; // 49.718px × 1.903 ≈ 94.5rpx
  }
}

.navbar-btn {
  width: 53rpx;
  height: 53rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;

  .icon {
    width: 27rpx;
    height: 27rpx;
  }
}

.navbar-title {
  font-size: $book-detail-font-xl;
  font-weight: 600;
  color: $book-detail-text-primary;
}

// 2. 内容区
.content {
  height: 100vh;
  padding-left: $page-padding-x;
  padding-right: $page-padding-x;
  padding-bottom: 120rpx; // 为TabBar留出空间
}

// 2.1 书籍卡片
.book-card {
  display: flex;
  gap: $element-gap-lg;
  padding: $card-padding-lg;
  background-color: $book-detail-card-bg;
  border: 1.5rpx solid $book-detail-border-card;
  border-radius: $radius-card;
  margin-bottom: $card-gap;
}

.book-cover {
  width: 106rpx;
  height: 133rpx;
  flex-shrink: 0;
  border-radius: $radius-cover;
  background-color: $book-cover-placeholder;
  box-shadow: $shadow-cover;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .cover-image {
    width: 100%;
    height: 100%;
    border-radius: inherit;
  }

  .icon-placeholder {
    width: 53rpx;
    height: 53rpx;
  }
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $element-gap-sm;
}

.book-title {
  font-size: $book-detail-font-base;
  font-weight: 600;
  color: $book-detail-text-primary;
  line-height: 40rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.book-author {
  font-size: $book-detail-font-sm;
  color: $book-detail-text-secondary;
  line-height: 33rpx;
}

.book-stats {
  display: flex;
  align-items: center;
  gap: 4rpx;

  .stats-count {
    font-size: $book-detail-font-xs;
    font-weight: 500;
    color: $book-detail-text-secondary;
  }

  .stats-label {
    font-size: $book-detail-font-xs;
    color: $book-detail-text-secondary;
  }
}

// 2.2 分组（思维导图/笔记列表）
.section {
  margin-bottom: $card-gap;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $element-gap-lg;

  .header-left {
    display: flex;
    align-items: center;
    gap: $element-gap-md;
  }

  .icon {
    width: 33rpx;
    height: 33rpx;
  }

  .section-title {
    font-size: $book-detail-font-lg;
    font-weight: 600;
    color: $book-detail-text-primary;
    line-height: 47rpx;
  }
}

// 思维导图卡片
.mindmap-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $card-padding;
  background-color: $book-detail-card-bg;
  border: 1.5rpx solid $book-detail-border-light;
  border-radius: $radius-card;
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.7;
  }
}

.mindmap-info {
  display: flex;
  align-items: center;
  gap: $element-gap-md;
  flex: 1;
}

.mindmap-icon-container {
  width: 106rpx;
  height: 80rpx;
  border-radius: $radius-cover;
  background: linear-gradient(135deg, #60a5fa, #a855f7);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .icon {
    width: 40rpx;
    height: 40rpx;
  }
}

.mindmap-title {
  font-size: $book-detail-font-base;
  font-weight: 500;
  color: $book-detail-text-primary;
  line-height: 40rpx;
}

.mindmap-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;

  .icon-clock {
    width: 20rpx;
    height: 20rpx;
  }

  .date {
    font-size: $book-detail-font-xs;
    color: $book-detail-text-secondary;
  }
}

// 排序按钮
.sort-button {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 1.5rpx 21rpx;
  height: 60rpx;
  background-color: $sort-button-bg;
  border: 1.5rpx solid rgba(0, 0, 0, 0);
  border-radius: $radius-sm;
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.7;
  }

  .sort-text {
    font-size: $book-detail-font-xs;
    color: $book-detail-text-primary;
  }

  .icon-sort {
    width: 27rpx;
    height: 27rpx;
  }
}

// 笔记列表
.notes-loading,
.notes-empty {
  padding: 60rpx 0;
  text-align: center;

  .loading-text,
  .empty-text {
    font-size: $book-detail-font-sm;
    color: $book-detail-text-secondary;
  }
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: $element-gap-md;
}

.note-card {
  padding: $card-padding;
  background-color: $book-detail-card-bg;
  border: 1.5rpx solid $book-detail-border-light;
  border-radius: $radius-card;
  display: flex;
  flex-direction: column;
  gap: $element-gap-sm;
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.7;
  }
}

.note-title {
  font-size: $book-detail-font-base;
  font-weight: 500;
  color: $book-detail-text-primary;
  line-height: 40rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-chapter {
  font-size: $book-detail-font-sm;
  color: $book-detail-text-secondary;
  line-height: 33rpx;
}

.note-excerpt {
  font-size: $book-detail-font-sm;
  color: $book-detail-text-secondary;
  line-height: 33rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  justify-content: flex-end;

  .icon-clock {
    width: 20rpx;
    height: 20rpx;
  }

  .date {
    font-size: $book-detail-font-xs;
    color: $book-detail-text-secondary;
  }
}

// 安全底部区域
.safe-bottom {
  width: 100%;
}

// FAB按钮
.fab-button {
  position: fixed;
  right: $page-padding-x;
  z-index: 99;
  width: 112rpx;
  height: 112rpx;
  border-radius: 999rpx;
  background: $book-detail-primary;
  box-shadow: 0 10rpx 24rpx rgba(0, 168, 45, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.95);
  }

  .fab-icon {
    font-size: 48rpx;
    font-weight: 600;
    color: #ffffff;
    line-height: 1;
  }
}
</style>
