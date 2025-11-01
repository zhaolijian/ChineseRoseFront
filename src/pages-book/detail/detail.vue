<template>
  <view class="detail-root book-detail-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-content">
        <view class="nav-left" @click="handleBack">
          <image class="back-icon" src="/static/icons/back-arrow.svg" mode="aspectFit" />
        </view>
        <view class="nav-title">书籍详情</view>
        <view class="nav-right" @click="handleShowMenu">
          <u-icon name="more-dot-fill" :size="20" color="#333333" />
        </view>
      </view>
    </view>

    <!-- 页面内容区域 -->
    <view class="page-content" :style="{ paddingTop: contentPaddingTop + 'px' }">
      <!-- 书籍信息卡片 -->
      <view class="book-card">
        <view class="book-card__main">
          <!-- 封面 -->
          <BookCover
            :src="book?.coverUrl"
            :width="128"
            :ratio="3 / 4"
            :radius="16"
            :padding="12"
            bg-color="#F5F7FA"
            :shadow="true"
          />

          <!-- 信息区域 -->
          <view class="book-info">
            <text class="book-info__title">{{ book?.title || '未知书籍' }}</text>
            <text v-if="book?.author" class="book-info__author">{{ book.author }}</text>
            <text class="book-info__notes">
              <text class="notes-count">{{ book?.noteCount || 0 }}</text> 条笔记
            </text>
          </view>
        </view>
      </view>

      <!-- 思维导图区域 -->
      <view v-if="hasMindMap" class="mindmap-section">
        <!-- 区域标题 -->
        <view class="section-header">
          <text class="section-title">
            <u-icon
              name="grid"
              :size="20"
              color="#00a82d"
              class="section-icon"
            />
            思维导图
          </text>
        </view>

        <!-- 思维导图卡片 -->
        <view class="mindmap-card" @click="goToMindMap">
          <view class="mindmap-card__header">
            <view class="mindmap-card__icon">
              <u-icon name="grid" :size="24" color="#ffffff" />
            </view>
            <view class="mindmap-card__info">
              <text class="mindmap-card__title">{{ mindMapData?.title || '思维导图' }}</text>
              <text class="mindmap-card__time">
                更新于 {{ formatDate(mindMapData?.updatedAt) }}
              </text>
            </view>
          </view>
          <u-icon name="arrow-right" :size="16" color="#999999" />
        </view>
      </view>

      <!-- 笔记列表 -->
      <view class="notes-section">
        <view class="section-header">
          <text class="section-title">
            <u-icon
              name="file-text"
              :size="20"
              color="#00a82d"
              class="section-icon"
            />
            笔记列表
          </text>
          <view id="sort-trigger" class="sort-selector" @click.stop="openSortDropdown">
            <text class="sort-label">{{ currentSortLabel }}</text>
            <u-icon :name="sortOpen ? 'arrow-up' : 'arrow-down'" :size="12" color="#666666" />
          </view>
        </view>

        <DropdownMenu :open="sortOpen" :x="sortPos.x" :y="sortPos.y" :width="sortPos.w" @close="closeSortDropdown">
          <view class="sort-menu">
            <view
              v-for="it in sortActions"
              :key="it.key"
              class="sort-item"
              @tap.stop="onClickSortItem(it.key)"
            >
              <text class="sort-item__label">{{ it.name }}</text>
              <u-icon v-if="it.key === currentSortKey" name="checkmark" :size="14" color="#00a82d" />
            </view>
          </view>
        </DropdownMenu>

        <!-- 空状态 -->
        <view v-if="loading && notes.length === 0" class="notes-loading">
          <LoadingSkeleton :rows="3" />
        </view>

        <view v-else-if="notes.length === 0" class="notes-empty">
          <view class="notes-empty__icon">
            <u-icon name="edit-pen" :size="32" color="#00a82d" />
          </view>
          <text class="notes-empty__title">还没有添加笔记</text>
          <text class="notes-empty__subtitle">记录下你的阅读灵感，打造专属知识库</text>
          <u-button
            type="primary"
            text="添加第一条笔记"
            size="small"
            class="notes-empty__action"
            @click="handleAddNote"
          />
        </view>

        <!-- 笔记列表 -->
        <view v-else class="notes-list">
          <view
            v-for="note in notes"
            :key="note.id"
            class="note-card"
            @click="goToNoteDetail(note)"
          >
            <view class="note-card__header">
              <text class="note-card__title">{{ note.title }}</text>
              <view class="note-card__meta">
                <u-icon name="clock" :size="12" color="#999999" />
                <text class="note-card__time">{{ formatDate(note.updatedAt) }}</text>
              </view>
            </view>

            <view
              v-if="note.chapterName || note.pageNumber"
              class="note-card__chapter"
            >
              <u-icon
                name="file-text"
                :size="12"
                color="#666666"
              />
              <text class="note-card__chapter-text">
                {{ formatChapterInfo(note.chapterName, note.pageNumber) }}
              </text>
            </view>

            <text class="note-card__content">{{ note.content }}</text>

            <view v-if="note.tags && note.tags.length > 0" class="note-card__tags">
              <text
                v-for="tag in note.tags"
                :key="tag"
                class="tag"
              >
                #{{ tag }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 浮动添加按钮 -->
    <view class="book-detail-fab" @click.stop="handleFabClick">
      <text class="fab-icon">+</text>
    </view>

    <!-- 底部导航栏 -->
    <TabBar />

    <!-- 更多菜单 -->
    <u-action-sheet
      v-model="showMoreMenu"
      :list="moreActions"
      @click="handleMenuAction"
    />

    <!-- 新建笔记弹层（组件内部已包含 u-popup） -->
    <CreateNoteModal
      v-model:open="showCreateNote"
      :initial-books="bookList"
      :initial-book-id="bookId"
      :chapters="chapterOptions"
      @confirm="onCreateNoteSubmit"
    />

    <!-- 排序菜单 -->
    <u-action-sheet
      :show="showSortSheet"
      :actions="sortActions"
      title="排序方式"
      @select="onSelectSort"
      @close="showSortSheet = false"
    />

    <!-- 加载提示 -->
    <u-loading-page
      :loading="pageLoading"
      bg-color="#fafafa"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, getCurrentInstance, nextTick } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useBookStore } from '@/stores/modules/book'
import { getNotesByBook } from '@/api/modules/note'
import { getMindmapByBook } from '@/api/modules/mindmap'
import { deleteBook } from '@/api/modules/book'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import TabBar from '@/components/common/TabBar.vue'
import DropdownMenu from '@/components/common/DropdownMenu.vue'
import CreateNoteModal from '@/components/create-note-modal/index.vue'
import BookCover from '@/components/book/BookCover.vue'
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
const pageLoading = ref(false)
const loading = ref(false)
const showSortSheet = ref(false)
const showMoreMenu = ref(false)
const bookId = ref<number>(0)
const currentSortKey = ref<string>('modifiedDesc')
const sortOpen = ref(false)
const sortPos = ref({ x: 0, y: 0, w: 200 })

// 新建笔记弹窗状态
const showCreateNote = ref(false)

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

// 状态栏高度（用于安全区适配）
const statusBarHeight = ref(0)

// 内容区域顶部padding（避免被导航栏遮挡）
const contentPaddingTop = computed(() => {
  const navbarHeight = 49.718 // 导航栏高度（px）
  const navbarTotalHeight = statusBarHeight.value + navbarHeight
  return navbarTotalHeight + 16 // 额外16px间距
})

// 排序选项
const sortActions = [
  { name: '修改时间（新→旧）', key: 'modifiedDesc' },
  { name: '标题（A→Z）', key: 'titleAZ' },
  { name: '创建时间（旧→新）', key: 'createdAsc' }
] as const
const collatorZh = new Intl.Collator('zh')

// 更多操作
const moreActions = [
  { text: '删除书籍', color: '#dc2626' }
]

// 计算属性
const currentSortLabel = computed(() => {
  return (
    sortActions.find(action => action.key === currentSortKey.value)?.name ||
    '修改时间（新→旧）'
  )
})

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
  updateSafeArea() // 获取状态栏高度
  await loadBookDetail()
})

onShow(async () => {
  const ctx = createContext()
  logger.debug(ctx, '[BookDetail] 页面显示')
  // 从笔记页面返回时刷新笔记列表
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
    logger.debug(ctx, '[updateSafeArea] 状态栏高度', { height: statusBarHeight.value })
  } catch (error) {
    logger.error(ctx, '[updateSafeArea] 获取系统信息失败', error)
    statusBarHeight.value = 20 // 默认值
  }
}

// 返回按钮处理
const handleBack = () => {
  const ctx = createContext()
  logger.debug(ctx, '[handleBack] 返回上一页')
  uni.navigateBack({
    fail: () => {
      logger.warn(ctx, '[handleBack] 无法返回，跳转到首页')
      uni.switchTab({ url: '/pages/index/index' })
    }
  })
}

const loadBookDetail = async () => {
  const ctx = createContext()

  if (!bookId.value) {
    logger.error(ctx, '[loadBookDetail] 书籍ID为空')
    return
  }

  try {
    pageLoading.value = true
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
  } finally {
    pageLoading.value = false
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
    sortNotesByKey(currentSortKey.value)

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
    // 404时代表没有导图,不显示错误
    if (error?.code !== 10004) {
      logger.error(ctx, '[checkMindMap] 检查思维导图失败', error)
    }
    hasMindMap.value = false
  }
}

const sortNotesByKey = (key: string) => {
  currentSortKey.value = key

  const sorted = [...notes.value]

  switch (key) {
    case 'titleAZ':
      sorted.sort((a, b) => collatorZh.compare(a.title || '', b.title || ''))
      break
    case 'createdAsc':
      sorted.sort((a, b) => {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      })
      break
    case 'modifiedDesc':
    default:
      sorted.sort((a, b) => {
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      })
      break
  }

  notes.value = sorted

  const ctx = createContext()
  logger.debug(ctx, '[sortNotesByKey] 更新排序方式', { sortKey: key, total: notes.value.length })
}

const onSelectSort = (action: { key?: string; value?: string }) => {
  const key = action?.key || action?.value
  if (!key) return

  sortNotesByKey(key)
  showSortSheet.value = false
}

const openSortDropdown = async () => {
  const inst = getCurrentInstance()
  const ctxVm = inst?.proxy as any
  const q = uni.createSelectorQuery()

  // 优先使用组件 scope（小程序需要 $scope）
  if (ctxVm?.$scope) q.in(ctxVm)
  // 等待下一帧，确保 #sort-trigger 已渲染
  await nextTick()

  q.select('#sort-trigger').boundingClientRect(rect => {
    if (rect && !Array.isArray(rect) && rect.width) {
      // 贴合 Figma：面板与触发器下缘间距 8rpx≈4px
      const x = rect.left as number
      const y = (rect.bottom as number) + 8
      sortPos.value = { x, y, w: rect.width as number }
      sortOpen.value = true
    } else {
      // 兜底：定位失败时回退到 action-sheet，避免交互中断
      showSortSheet.value = true
    }
  }).exec()
}

const closeSortDropdown = () => { sortOpen.value = false }

const onClickSortItem = (key: string) => {
  sortNotesByKey(key)
  closeSortDropdown()
}

const handleShowMenu = () => {
  showMoreMenu.value = true
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
    content: '删除后,该书籍下的笔记仍会保留在笔记列表中',
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

const handleFabClick = () => {
  const ctx = createContext()
  logger.info(ctx, '[handleFabClick] FAB按钮被点击')
  showCreateNote.value = true
}

const handleAddNote = () => {
  const ctx = createContext()
  logger.info(ctx, '[handleAddNote] 点击添加笔记')
  showCreateNote.value = true
}

const goToNoteDetail = (note: Note) => {
  const ctx = createContext()
  logger.debug(ctx, '[goToNoteDetail] 跳转到笔记详情', { noteId: note.id })
  uni.navigateTo({
    url: `/pages-note/edit/edit?id=${note.id}`
  })
}

const goToMindMap = () => {
  const ctx = createContext()
  logger.debug(ctx, '[goToMindMap] 跳转到思维导图', { bookId: bookId.value })
  uni.navigateTo({
    url: `/pages-mindmap/view/view?bookId=${bookId.value}`
  })
}

const onCreateNoteSubmit = (payload: { bookId: number; chapterTitle: string | null }) => {
  const ctx = createContext()
  logger.info(ctx, '[onCreateNoteSubmit] 确认创建笔记', payload)

  // 构建跳转URL，如果有章节则带上
  let url = `/pages-note/edit/edit?bookId=${payload.bookId}`
  if (payload.chapterTitle) {
    url += `&chapter=${encodeURIComponent(payload.chapterTitle)}`
  }

  // 跳转到笔记编辑页
  uni.navigateTo({ url })

  showCreateNote.value = false
}

const formatChapterInfo = (
  chapterName?: string | null,
  pageNumber?: number | null
): string => {
  const segments: string[] = []

  if (chapterName) {
    segments.push(chapterName)
  }

  if (typeof pageNumber === 'number' && !Number.isNaN(pageNumber)) {
    segments.push(`第${pageNumber}页`)
  }

  return segments.join(' · ')
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens/book-detail.scss';

// 关键：防止 fixed 定位退化为 absolute
.detail-root {
  transform: none !important;
  filter: none !important;
  perspective: none !important;
  overflow: visible !important;
  position: relative;
  min-height: 100vh;
  background: var(--cr-color-bg, #f7f8fa);
}

.book-detail-page {
  min-height: 100vh;
  background-color: $book-detail-bg;
}

// 自定义导航栏
.custom-navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1rpx solid $book-detail-border;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;

  .navbar-content {
    height: 99.436rpx; // 49.718px × 2
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx; // px-4 → 32rpx
  }

  .nav-left,
  .nav-right {
    width: 44px; // 与add-book.vue保持一致使用px
    height: 44px; // 与add-book.vue保持一致使用px
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }

  .nav-left {
    transition: opacity 0.2s ease;

    &:active {
      opacity: 0.6;
    }

    .back-icon {
      width: 20px; // 与add-book.vue保持一致
      height: 20px; // 与add-book.vue保持一致
    }
  }

  .nav-right {
    // 保持居中对齐
  }

  .nav-title {
    flex: 1;
    font-size: 32rpx; // 16px × 2
    line-height: 1.5;
    color: $book-detail-text-primary;
    font-weight: $book-detail-font-semibold;
    text-align: center;
  }
}

// 页面内容区域
.page-content {
  min-height: 100vh;
  padding: 0 32rpx; // Figma: px-4 → 32rpx
  padding-top: 48rpx; // Figma: py-6 → 48rpx
  padding-bottom: calc(env(safe-area-inset-bottom) + 100rpx + 32rpx); // 为TabBar留出空间

  // 适配iPad等大屏设备
  > view {
    max-width: 768rpx;
    margin: 0 auto;
  }
}

// 书籍信息卡片
.book-card {
  background: $book-detail-card-bg;
  border: 1rpx solid $book-detail-border-light;
  border-radius: $book-detail-radius-card;
  padding: 40rpx; // Figma: p-5 → 20px × 2 = 40rpx
  margin-bottom: 48rpx; // Figma: mb-6 → 24px × 2 = 48rpx
  box-shadow: $book-detail-shadow-card;

  &__main {
    display: flex;
    gap: 32rpx; // Figma: space-x-4 → 16px × 2 = 32rpx
  }
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;

  &__title {
    font-size: $book-detail-font-base; // 32rpx (16px，与Figma一致)
    font-weight: $book-detail-font-semibold;
    color: $book-detail-text-primary;
    line-height: 1.4;
    margin-bottom: $book-detail-spacing-0-5; // 4rpx (mb-1)
    @include book-detail-line-clamp(2);
  }

  &__author {
    font-size: $book-detail-font-sm; // 28rpx (14px)
    color: $book-detail-text-secondary;
    margin-bottom: $book-detail-spacing-1; // 8rpx (mb-2)
  }

  &__notes {
    font-size: $book-detail-font-xs; // 24rpx (12px，text-xs)
    color: $book-detail-text-muted;

    .notes-count {
      font-weight: $book-detail-font-medium; // 500 (font-medium)
    }
  }
}

// 思维导图区域
.mindmap-section {
  margin-bottom: 48rpx; // Figma: mb-6 → 48rpx

  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx; // Figma: mb-4 → 32rpx

    .section-title {
      font-size: $book-detail-font-lg;       // 36rpx (18px)
      font-weight: $book-detail-font-semibold;
      color: $book-detail-text-primary;
      display: flex;
      align-items: center;

      .section-icon {
        margin-right: 32rpx; // Figma: mr-2 → 16px × 2 = 32rpx
      }
    }
  }
}

// 思维导图卡片
.mindmap-card {
  background: $book-detail-card-bg;
  border: 1rpx solid $book-detail-border-light;
  border-radius: $book-detail-radius-card;
  padding: $book-detail-spacing-4;
  box-shadow: $book-detail-shadow-card;
  display: flex;
  justify-content: space-between;
  align-items: center;
  @include book-detail-card-hover;

  &__header {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $book-detail-spacing-2;
  }

  &__icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: $book-detail-radius-lg;
    background: linear-gradient(135deg, $book-detail-mindmap-gradient-from, $book-detail-mindmap-gradient-to);
    @include book-detail-flex-center;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $book-detail-spacing-0-5;
  }

  &__title {
    font-size: 32rpx;
    font-weight: $book-detail-font-medium;
    color: $book-detail-text-primary;
  }

  &__time {
    font-size: $book-detail-font-xs;
    color: $book-detail-text-muted;
  }
}

// 笔记列表区域
.notes-section {
  margin-bottom: 48rpx; // Figma: mb-6 → 48rpx
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx; // Figma: mb-4 → 32rpx

  .section-title {
    font-size: $book-detail-font-lg;       // 36rpx (18px)
    font-weight: $book-detail-font-semibold;
    color: $book-detail-text-primary;
    display: flex;
    align-items: center;

    .section-icon {
      margin-right: 32rpx; // Figma: mr-2 → 16px × 2 = 32rpx
    }
  }
}

/* 触发器（Figma：胶囊 + 轻投影） */
.sort-selector {
  display: inline-flex;
  align-items: center;
  gap: $book-detail-spacing-1-5;
  padding: 0 $book-detail-spacing-3;
  height: $book-detail-control-md-h;      // 64rpx
  min-width: $book-detail-control-md-w;   // 256rpx
  background: $book-detail-surface-elevated;
  border: 1rpx solid $book-detail-border-light;
  border-radius: $book-detail-radius-2xl; // 胶囊感
  box-shadow: $book-detail-shadow-elev-1; // 轻阴影
  z-index: $book-detail-z-control;

  .sort-label {
    flex: 1;
    font-size: 24rpx;
    font-weight: $book-detail-font-medium;
    color: $book-detail-text-secondary;
    line-height: 1;
    white-space: nowrap;
  }
}

/* 下拉面板与选项 */
.sort-menu {
  display: flex;
  flex-direction: column;
  gap: $book-detail-spacing-1;
}

.sort-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $book-detail-spacing-2 $book-detail-spacing-3;
  border-radius: $book-detail-radius-lg;

  &:active { background: $book-detail-surface-hover; }

  &__label {
    font-size: $book-detail-font-xs;
    color: $book-detail-text-secondary;
  }
}

.notes-loading {
  padding: $book-detail-spacing-8 0;
}

.notes-empty {
  padding: $book-detail-spacing-16 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $book-detail-spacing-3;
  text-align: center;

  &__icon {
    width: $book-detail-spacing-16;
    height: $book-detail-spacing-16;
    border-radius: $book-detail-radius-full;
    background: $book-detail-accent-bg;
    @include book-detail-flex-center;
  }

  &__title {
    font-size: $book-detail-font-lg;
    font-weight: $book-detail-font-medium;
    color: $book-detail-text-primary;
  }

  &__subtitle {
    font-size: 28rpx;
    color: $book-detail-text-secondary;
    text-align: center;
  }

  &__action {
    margin-top: $book-detail-spacing-2;
    align-self: stretch;
    width: 100%;

    :deep(.u-button) {
      width: 100%;
    }
  }
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx; // Figma: space-y-3 → 12px × 2 = 24rpx
}

.note-card {
  background: $book-detail-card-bg;
  border: 1rpx solid $book-detail-border-light;
  border-radius: $book-detail-radius-card;
  padding: $book-detail-spacing-4;
  box-shadow: $book-detail-shadow-card;
  @include book-detail-card-hover;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $book-detail-spacing-2;
  }

  &__title {
    flex: 1;
    font-size: 32rpx;
    font-weight: $book-detail-font-semibold;
    color: $book-detail-text-primary;
    line-height: 1.4;
    @include book-detail-text-ellipsis;
  }

  &__time {
    font-size: $book-detail-font-xs;
    color: $book-detail-text-muted;
    margin-left: 0;
    flex-shrink: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $book-detail-spacing-0-5;
    margin-left: $book-detail-spacing-2;
    flex-shrink: 0;
  }

  &__chapter {
    display: flex;
    align-items: center;
    gap: $book-detail-spacing-0-5;
    margin-bottom: $book-detail-spacing-2;

    &-text {
      font-size: $book-detail-font-xs;
      color: $book-detail-text-secondary;
    }
  }

  &__content {
    font-size: $book-detail-font-sm;
    color: $book-detail-text-secondary;
    line-height: 1.5;
    margin-bottom: $book-detail-spacing-2;
    @include book-detail-line-clamp(2);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $book-detail-spacing-1;

    .tag {
      font-size: $book-detail-font-xs;
      color: $book-detail-accent-fg;
      background: $book-detail-accent-bg;
      padding: $book-detail-spacing-0-5 $book-detail-spacing-1-5;
      border-radius: $book-detail-radius-sm;
    }
  }
}

// FAB按钮（底部中间定位，TabBar上方）
.book-detail-fab {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);  // 水平居中
  bottom: calc(env(safe-area-inset-bottom) + 120rpx);
  width: 112rpx;
  height: 112rpx;
  border-radius: $book-detail-radius-full;
  background: $book-detail-primary;
  box-shadow: 0 10rpx 24rpx rgba(59, 179, 87, 0.35);
  @include book-detail-flex-center;
  z-index: $book-detail-z-fab;
  transition: transform 150ms ease, box-shadow 200ms ease;

  &:active {
    transform: translateX(-50%) scale(0.95);  // 保持水平居中的同时缩放
    box-shadow: 0 6rpx 20rpx rgba(0, 168, 45, 0.25);
  }

  .fab-icon {
    font-size: 48rpx;
    font-weight: $book-detail-font-semibold;
    color: $book-detail-primary-fg;
    line-height: 1;
    pointer-events: none;  // 防止文字拦截点击事件
  }
}
</style>
