<template>
  <u-popup
    class="cr-popup"
    :show="show"
    mode="bottom"
    :closeable="true"
    :close-on-click-overlay="!anyPanelOpen"
    :round="27"
    :safe-area-inset-bottom="true"
    :custom-style="{ padding: '0', backgroundColor: 'transparent' }"
    @close="handleClose"
  >
    <view class="cr-modal">
      <!-- 标题 -->
      <view class="cr-title">新建笔记</view>

      <!-- 选择书籍 -->
      <view>
        <view class="cr-field-label">📚 选择书籍</view>
        <view id="book-field" class="cr-field" @click="openBookPanel">
          <view class="cr-book-left">
            <BookCover
              :src="activeBook?.cover || activeBook?.coverUrl || defaultCover"
              :width="48"
              :ratio="3 / 4"
              :radius="8"
              :padding="0"
              bg-color="#F5F7FA"
              :shadow="false"
            />
            <view>
              <text class="cr-field-text">
                {{ activeBook ? `${activeBook.title}（${activeBook.noteCount ?? 0}条笔记）` : '请选择一本书籍' }}
              </text>
            </view>
          </view>
          <u-icon name="arrow-down" size="18" />
        </view>
      </view>

      <!-- 选择章节 -->
      <view>
        <view class="cr-field-label">📖 选择章节（可选）</view>
        <view id="chapter-field" class="cr-field" @click="openChapterPanel">
          <input
            class="cr-input"
            v-model="chapterText"
            placeholder="点击选择或手动输入"
            confirm-type="done"
            @confirm="onChapterConfirm"
            @click.stop
          />
          <view class="cr-arrow" style="font-size: 20rpx">✏️</view>
        </view>
      </view>

      <!-- 确认按钮 -->
      <view class="cr-primary" @click="onConfirm">确认</view>
    </view>
  </u-popup>

  <!-- 统一点击遮罩：任一面板打开时出现，挡住弹窗内容，点击关闭面板 -->
  <u-overlay :show="anyPanelOpen" :z-index="10090" @click="closePanels" />

  <!-- 书籍列表浮动面板（突破主弹窗裁剪） -->
  <view
    v-show="showBookPanel"
    class="cr-float-panel"
    :style="`position:fixed;z-index:10100;top:${bookPanelStyle.top};left:${bookPanelStyle.left};width:${bookPanelStyle.width};height:${bookPanelStyle.height};`"
    @tap.stop
  >
    <scroll-view scroll-y class="cr-float-panel__scroll">
      <view
        v-for="b in bookList"
        :key="b.id"
        class="cr-book-item"
        @tap="onPickBook(b)"
      >
        <BookCover
          :src="b.cover || b.coverUrl || defaultCover"
          :width="48"
          :ratio="3 / 4"
          :radius="8"
          :padding="0"
          bg-color="#F5F7FA"
          :shadow="false"
        />
        <view class="cr-book-item__main">
          <text class="cr-book-item__title">{{ b.title }}（{{ b.noteCount ?? 0 }}条笔记）</text>
        </view>
        <u-icon v-if="b.id === selectedBookId" name="checkmark" size="18" color="#16A34A" />
      </view>
    </scroll-view>
  </view>

  <!-- 章节列表浮动面板（突破主弹窗裁剪） -->
  <view
    v-show="showChapterPanel"
    class="cr-float-panel"
    :style="`position:fixed;z-index:10100;top:${chapterPanelStyle.top};left:${chapterPanelStyle.left};width:${chapterPanelStyle.width};height:${chapterPanelStyle.height};`"
    @tap.stop
  >
    <scroll-view scroll-y class="cr-float-panel__scroll">
      <view
        v-for="(chapter, index) in chapterList"
        :key="index"
        class="cr-chapter-item"
        @tap="chooseChapter(chapter)"
      >
        {{ chapter.name }}
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, getCurrentInstance, nextTick, reactive } from 'vue'
import { getBookList, getBookChapters } from '@/api/modules/book'
import { logger, createContext } from '@/utils'
import BookCover from '@/components/book/BookCover.vue'

interface Book {
  id: number | string
  title: string
  cover?: string
  coverUrl?: string
  noteCount?: number
  author?: string
}

interface Chapter {
  id: number | string
  name: string
  title?: string
}

const props = defineProps<{
  open: boolean
  initialBookId?: number | string
  currentBookId?: number | string
  initialBookTitle?: string
  initialNoteCount?: number
  initialCoverUrl?: string
  initialBooks?: Book[]
  chapters?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'confirm', payload: { bookId: number | string; chapterTitle?: string }): void
  (e: 'close'): void
}>()

// ===== 获取组件实例（在顶层调用） =====
const { proxy } = getCurrentInstance()!

// ===== 工具函数：动态测量行高 =====
/**
 * 测量首个 item 的真实渲染高度
 * @param selector - CSS选择器（如 '.cr-book-item'）
 * @param fallback - 兜底值（测量失败时使用）
 * @returns Promise<number> - 实际高度（px）
 */
async function measureRowHeight(selector: string, fallback: number): Promise<number> {
  // 等待足够时间确保屏幕外元素完全渲染（小程序对屏幕外元素渲染较慢）
  await new Promise(r => setTimeout(r, 100))
  return new Promise(resolve => {
    const q = uni.createSelectorQuery().in(proxy!)
    q.select(selector).boundingClientRect((rect: any) => {
      // 🔍 详细调试日志
      console.log('[DEBUG measureRowHeight] 测量详情：', {
        selector,
        rect: rect ? {
          height: rect.height,
          width: rect.width,
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right
        } : null,
        fallback
      })

      // 取整避免小数导致的累积误差
      const h = rect?.height ? Math.max(1, Math.round(rect.height)) : fallback

      // 🔍 最终返回值日志
      console.log('[DEBUG measureRowHeight] 最终高度：', h, '(原始值:', rect?.height, ')')

      resolve(h)
    }).exec()
  })
}

/**
 * 按整数行计算面板高度与定位
 * @returns { panelHeight, panelTop, visibleRows }
 */
function computePanelByRows(params: {
  anchorTop: number      // 选择框顶部位置
  topLimit: number       // 面板不能超过的顶部限制
  gap: number            // 与锚点的间距
  rowHeight: number      // 单行高度
  totalRows: number      // 数据总行数
  preferredRows: number  // 优先显示的行数
}) {
  const { anchorTop, topLimit, gap, rowHeight, totalRows, preferredRows } = params

  // 可用空间能容纳的最大行数（向下取整）
  const availablePx = Math.max(0, anchorTop - topLimit - gap)
  const maxRowsBySpace = Math.floor(availablePx / rowHeight)

  // 实际显示行数：不超过优先值、空间限制、数据总数，且至少1行
  const visibleRows = Math.max(1, Math.min(preferredRows, maxRowsBySpace, totalRows))
  const panelHeight = Math.max(rowHeight, visibleRows * rowHeight)
  const panelTop = anchorTop - panelHeight - gap

  return {
    panelHeight: Math.round(panelHeight),
    panelTop: Math.round(panelTop),
    visibleRows
  }
}

// ===== 常量 =====
const defaultCover = '/static/cover-default.png'

// ===== 统一获取当前书籍ID =====
const currentId = computed(() => props.initialBookId ?? props.currentBookId ?? 0)

// ===== 内部状态 =====
const show = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v)
})

const showBookPanel = ref(false)
const showChapterPanel = ref(false)
const bookList = ref<Book[]>([])
const selectedBookId = ref<number | string | null>(null)
const chapterList = ref<Chapter[]>([])
const chapterText = ref('')
const bookPanelStyle = reactive({
  top: '0px',
  left: '0px',
  width: '0px',
  height: '0px'
})
const chapterPanelStyle = reactive({
  top: '0px',
  left: '0px',
  width: '0px',
  height: '0px'
})

// ===== 计算属性 =====
const activeBook = computed(() => bookList.value.find(b => b.id === selectedBookId.value) || null)
const anyPanelOpen = computed(() => showBookPanel.value || showChapterPanel.value)

// ===== 封面处理 =====
function coverOf(book: Book | null | undefined): string {
  if (!book) return defaultCover
  const url = book.cover || book.coverUrl
  return (url && url.trim()) ? url : defaultCover
}

// ===== 面板控制 =====
function closePanels() {
  showBookPanel.value = false
  showChapterPanel.value = false
}

// ===== 加载书籍列表 =====
async function ensureBooks() {
  const ctx = createContext()

  // 如果已有缓存且数量 > 1，直接使用
  if (bookList.value.length > 1) {
    return
  }

  try {
    logger.info(ctx, '[CreateNoteModal] 开始加载书籍列表')
    const res = await getBookList({ page: 1, limit: 100 })

    // 处理不同的响应格式
    let books: any[] = []
    if (Array.isArray(res)) {
      books = res
    } else if (res?.books) {
      books = res.books
    } else if (res?.data?.list) {
      books = res.data.list
    } else if (res?.data) {
      books = Array.isArray(res.data) ? res.data : []
    }

    bookList.value = books.map((b: any) => ({
      id: b.id ?? b.bookId,
      title: b.title ?? b.name ?? '',
      cover: b.cover ?? b.coverUrl,
      coverUrl: b.coverUrl ?? b.cover,
      noteCount: b.noteCount ?? b.totalNotes ?? 0,
      author: b.author
    })).filter(b => b.id && b.title)

    logger.info(ctx, '[CreateNoteModal] 书籍列表加载成功', {
      count: bookList.value.length
    })
  } catch (err) {
    logger.error(ctx, '[CreateNoteModal] 书籍列表加载失败', err)
  }
}

// ===== 打开书籍面板 =====
async function openBookPanel() {
  const ctx = createContext()

  // 确保书籍列表已加载
  await ensureBooks()

  // 先关闭章节面板
  showChapterPanel.value = false

  // === 阶段1：预渲染（屏幕外，用户不可见） ===
  bookPanelStyle.top = '-9999px'
  // 移除 visibility: hidden，因为会阻止测量
  showBookPanel.value = true  // 显示但在屏幕外

  // 使用 setTimeout 替代 nextTick，等待弹窗动画完成（微信小程序需要更长延迟）
  setTimeout(async () => {
    const q = uni.createSelectorQuery().in(proxy)
    q.select('#book-field').boundingClientRect(async (rect: any) => {
      logger.debug(ctx, '[CreateNoteModal] 获取锚点rect', {
        rect: rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null
      })

      if (!rect) {
        logger.warn(ctx, '[CreateNoteModal] 未获取到锚点rect，使用兜底定位')
        const { windowHeight, windowWidth } = uni.getWindowInfo()
        bookPanelStyle.top = Math.round(windowHeight * 0.2) + 'px'
        bookPanelStyle.left = Math.round(windowWidth * 0.1) + 'px'
        bookPanelStyle.width = Math.round(windowWidth * 0.8) + 'px'
        bookPanelStyle.height = Math.round(windowHeight * 0.5) + 'px'
        return
      }

      // 🔧 关键修复：先设置面板宽度和位置，确保内部元素在正确宽度下渲染
      bookPanelStyle.width = `${Math.round(rect.width)}px`
      bookPanelStyle.left = `${Math.round(rect.left)}px`

      // 等待一帧，让宽度变更应用到DOM
      await new Promise(r => setTimeout(r, 16))

      // === 阶段2：动态测量（元素已在屏幕外渲染，可测量） ===
      const { windowHeight } = uni.getWindowInfo()
      const gap = 2
      const TOP_LIMIT = windowHeight * 0.35

      // 动态测量首个书籍项的真实高度（兜底值使用自适应 rpx 转换）
      const rowHeight = await measureRowHeight(
        '.cr-book-item',
        Math.round(uni.upx2px(88))  // 88rpx = padding(40) + cover(48)
      )

      const { panelHeight, panelTop, visibleRows } = computePanelByRows({
        anchorTop: rect.top,
        topLimit: TOP_LIMIT,
        gap,
        rowHeight,
        totalRows: bookList.value.length,
        preferredRows: 4
      })

      // === 阶段3：设置最终高度和top位置 ===
      bookPanelStyle.top = `${panelTop}px`
      bookPanelStyle.height = `${panelHeight}px`

      logger.info(ctx, '[CreateNoteModal] 书籍面板(整数行)定位完成', {
        rowHeight,
        visibleRows,
        panelHeight,
        anchorTop: rect.top,
        panelTop,
        gap,
        topLimit: TOP_LIMIT,
        totalRows: bookList.value.length
      })
    }).exec()
  }, 150) // 150ms 延迟，等待弹窗动画完成
}

function onPickBook(b: Book) {
  const ctx = createContext()
  selectedBookId.value = b.id
  showBookPanel.value = false
  chapterText.value = ''

  logger.info(ctx, '[CreateNoteModal] 选择书籍', {
    bookId: b.id,
    title: b.title
  })

  // 重新加载章节
  loadChapters(b.id)
}

async function loadChapters(bookId: number | string | undefined) {
  const ctx = createContext()

  if (!bookId) {
    chapterList.value = []
    return
  }

  if (props.chapters && props.chapters.length) {
    chapterList.value = props.chapters.map((name, index) => ({
      id: index,
      name
    }))
    return
  }

  try {
    logger.info(ctx, '[CreateNoteModal] 开始加载章节列表', { bookId })

    const res = await getBookChapters(Number(bookId))

    // 处理不同的响应格式
    let chapters: any[] = []
    if (Array.isArray(res)) {
      chapters = res
    } else if (res?.chapters) {
      chapters = res.chapters
    } else if (res?.data) {
      chapters = Array.isArray(res.data) ? res.data : []
    }

    chapterList.value = chapters.map((c: any, index: number) => ({
      id: c.id ?? index,
      name: (typeof c === 'string') ? c : (c.name ?? c.title ?? '')
    })).filter(c => c.name)

    logger.info(ctx, '[CreateNoteModal] 章节列表加载成功', {
      count: chapterList.value.length
    })
  } catch (err) {
    logger.error(ctx, '[CreateNoteModal] 章节列表加载失败', err)
    chapterList.value = []
  }
}

// ===== 交互处理 =====
function openChapterPanel() {
  const ctx = createContext()

  if (!activeBook.value) {
    logger.warn(ctx, '[CreateNoteModal] 未选择书籍')
    showBookPanel.value = true
    return
  }

  // 若没有任何章节，不显示列表面板，直接允许输入
  if (!chapterList.value || chapterList.value.length === 0) {
    logger.debug(ctx, '[CreateNoteModal] 无章节，允许手动输入')
    return
  }

  // 先关闭书籍面板
  showBookPanel.value = false

  // === 阶段1：预渲染（屏幕外，用户不可见） ===
  chapterPanelStyle.top = '-9999px'
  // 移除 visibility: hidden，因为会阻止测量
  showChapterPanel.value = true  // 显示但在屏幕外

  // 使用 setTimeout 等待弹窗动画完成
  setTimeout(async () => {
    const q = uni.createSelectorQuery().in(proxy)
    q.select('#chapter-field').boundingClientRect(async (rect: any) => {
      logger.debug(ctx, '[CreateNoteModal] 获取章节字段rect', {
        rect: rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null
      })

      if (!rect) {
        logger.warn(ctx, '[CreateNoteModal] 未获取到章节字段rect，使用兜底定位')
        const { windowHeight, windowWidth } = uni.getWindowInfo()
        chapterPanelStyle.top = Math.round(windowHeight * 0.2) + 'px'
        chapterPanelStyle.left = Math.round(windowWidth * 0.1) + 'px'
        chapterPanelStyle.width = Math.round(windowWidth * 0.8) + 'px'
        chapterPanelStyle.height = Math.round(windowHeight * 0.5) + 'px'
        return
      }

      // 🔧 关键修复：先设置面板宽度和位置，确保内部元素在正确宽度下渲染
      chapterPanelStyle.width = `${Math.round(rect.width)}px`
      chapterPanelStyle.left = `${Math.round(rect.left)}px`

      // 等待一帧，让宽度变更应用到DOM
      await new Promise(r => setTimeout(r, 16))

      // === 阶段2：动态测量（元素已在屏幕外渲染，可测量） ===
      const { windowHeight } = uni.getWindowInfo()
      const gap = 2
      const TOP_LIMIT = windowHeight * 0.35

      // 动态测量首个章节项的真实高度（兜底值使用自适应 rpx 转换）
      const rowHeight = await measureRowHeight(
        '.cr-chapter-item',
        Math.round(uni.upx2px(80))  // 80rpx = padding(40) + line-height(40)
      )

      const { panelHeight, panelTop, visibleRows } = computePanelByRows({
        anchorTop: rect.top,
        topLimit: TOP_LIMIT,
        gap,
        rowHeight,
        totalRows: chapterList.value.length,
        preferredRows: 6
      })

      // === 阶段3：设置最终高度和top位置 ===
      chapterPanelStyle.top = `${panelTop}px`
      chapterPanelStyle.height = `${panelHeight}px`

      logger.info(ctx, '[CreateNoteModal] 章节面板(整数行)定位完成', {
        rowHeight,
        visibleRows,
        panelHeight,
        anchorTop: rect.top,
        panelTop,
        gap,
        topLimit: TOP_LIMIT,
        totalRows: chapterList.value.length
      })
    }).exec()
  }, 150) // 150ms 延迟，等待弹窗动画完成
}

function chooseChapter(chapter: Chapter) {
  const ctx = createContext()

  chapterText.value = chapter.name
  showChapterPanel.value = false

  logger.info(ctx, '[CreateNoteModal] 选择章节', { chapter: chapter.name })
}

function onChapterConfirm(e: any) {
  const ctx = createContext()

  chapterText.value = (e?.detail?.value ?? chapterText.value)?.trim() || ''
  showChapterPanel.value = false

  logger.debug(ctx, '[CreateNoteModal] 章节输入确认', { text: chapterText.value })
}

function handleClose() {
  const ctx = createContext()
  logger.debug(ctx, '[CreateNoteModal] 关闭弹窗')

  closePanels()
  emit('close')
  emit('update:open', false)
}

function onConfirm() {
  const ctx = createContext()

  if (!activeBook.value) {
    logger.warn(ctx, '[CreateNoteModal] 未选择书籍')
    showBookPanel.value = true
    return
  }

  // 关闭所有面板
  closePanels()

  const chapterTitle = chapterText.value.trim() || undefined

  logger.info(ctx, '[CreateNoteModal] 确认创建笔记', {
    bookId: activeBook.value.id,
    chapterTitle
  })

  emit('confirm', {
    bookId: activeBook.value.id,
    chapterTitle
  })

  show.value = false
}

// ===== 生命周期与监听 =====
watch(() => props.open, async (v) => {
  const ctx = createContext()

  if (!v) return

  logger.debug(ctx, '[CreateNoteModal] 弹窗打开')

  // 先加载书籍列表
  await ensureBooks()

  // 默认选中当前书籍
  const target = bookList.value.find(b => b.id === currentId.value)
  selectedBookId.value = target ? target.id : (bookList.value[0]?.id ?? null)

  logger.info(ctx, '[CreateNoteModal] 默认选中书籍', {
    currentId: currentId.value,
    selectedBookId: selectedBookId.value,
    bookListCount: bookList.value.length
  })

  // 加载章节
  if (selectedBookId.value) {
    await loadChapters(selectedBookId.value)
  }

  // 重置章节输入
  chapterText.value = ''
})
</script>

<style scoped lang="scss">
/* ========== 样式令牌（rpx） ========== */
.cr-modal {
  width: 100%;
  background: #FFFFFF;
  padding: 28rpx 48rpx 32rpx; /* 左右对称，48rpx = 32rpx × 1.5 */
  position: relative;
  z-index: 10060; /* 低于遮罩与面板 */
  box-sizing: border-box; /* 确保 padding 计入总宽度，避免左右不对称 */
}

/* 标题 */
.cr-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #111111;
  text-align: center;
  line-height: 44rpx;
  margin-bottom: 20rpx;
}

/* 行标题（选择书籍/选择章节） */
.cr-field-label {
  font-size: 28rpx;
  color: #333333;
  margin: 16rpx 0 12rpx;
}

/* 行容器 */
.cr-field {
  height: 64rpx;
  border-radius: 14rpx;
  background: #F8FAF8;
  border: 1rpx solid #E5E6EB;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

/* 行左侧（书籍） */
.cr-book-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  overflow: hidden;
}

.cr-cover {
  width: 48rpx;
  height: 48rpx;
  border-radius: 8rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
}

.cr-cover image {
  width: 100%;
  height: 100%;
  display: block;
}

/* 行文本 */
.cr-field-text {
  font-size: 28rpx;
  color: #333333;
}

.cr-field-sub {
  font-size: 26rpx;
  color: #666666;
  margin-left: 8rpx;
}

/* 右侧箭头 */
.cr-arrow {
  width: 24rpx;
  height: 24rpx;
  font-size: 20rpx;
  color: #666666;
  flex-shrink: 0;
}

/* 通用浮层面板（书籍/章节共用） */
.cr-float-panel {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.cr-float-panel__scroll {
  height: 100%;
}

.cr-book-item {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  column-gap: 16rpx;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.cr-book-item:last-child {
  border-bottom: none;
}

.cr-book-item .cr-cover {
  width: 48rpx;
  height: 48rpx;
  margin-right: 16rpx;
  border-radius: 8rpx;
}

.cr-book-item__main {
  flex: 1;
  min-width: 0;
}

.cr-book-item__title {
  font-size: 28rpx;
  color: #111; // 保持你项目主文案色
}

/* 章节项 */
.cr-chapter-item {
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #333333;
  line-height: 40rpx;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: background 0.2s;
}

.cr-chapter-item:last-child {
  border-bottom: none;
}

.cr-chapter-item:active {
  background: #F5F7FA;
}

/* 输入框 */
.cr-input {
  width: 100%;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 28rpx;
  color: #333333;
  background: transparent;
  border: none;
}

.cr-input::placeholder {
  color: #999999;
}

/* 确认按钮（Figma 主按钮样式） */
.cr-primary {
  width: 100%;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 16rpx;
  background: #00A82D;
  color: #FFFFFF;
  text-align: center;
  font-size: 30rpx;
  font-weight: 600;
  margin-top: 28rpx;
  padding: 0;
  box-sizing: border-box;
  cursor: pointer;
}

.cr-primary:active {
  opacity: 0.8;
}

/* ========= u-popup 底部弹窗左右对称修复（仅作用于本组件） ========= */
:deep(.cr-popup) {
  /* 覆盖 u-popup 的底部内容容器 */
  .u-popup__content--bottom {
    /* 关键：让容器"贴满视口宽度"，不受父级宽度/默认间距影响 */
    left: 0 !important;
    right: 0 !important;
    width: 100vw !important;

    /* 去除任何潜在的横向 padding / margin（uview 某些版本会有） */
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;

    /* 保证盒模型计算一致，避免右侧被挤压 */
    box-sizing: border-box;

    /* 某些端上 transform/scroll 触发布局抖动，先开 GPU 合成再反向抵消 */
    transform: translateZ(0);
    will-change: transform;

    /* iOS 刘海/圆角机型安全区：左右都叠加，确保两侧对称 */
    padding-inline-start: constant(safe-area-inset-left);
    padding-inline-end: constant(safe-area-inset-right);
    padding-inline-start: env(safe-area-inset-left);
    padding-inline-end: env(safe-area-inset-right);
  }

  /* uview 内容实际承载节点，部分版本 class 为 __content 或 __wrapper，做兼容兜底 */
  .u-popup__content,
  .u-popup__content__content,
  .u-popup__content__wrapper {
    /* 去掉默认横向内边距，交给内部 .cr-modal 控制 */
    padding-left: 0 !important;
    padding-right: 0 !important;
    background: transparent !important;
    box-sizing: border-box;
  }
}
</style>
