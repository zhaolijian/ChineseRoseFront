<template>
  <view class="selector-container">
    <!-- Header -->
    <view class="selector-header">
      <text class="selector-title">选择书籍和章节</text>
    </view>

    <!-- Content -->
    <view class="selector-content">
      <!-- 书籍选择 -->
      <view class="select-section">
        <view class="section-label">📚 选择书籍</view>

        <!-- 书籍选择触发器 -->
        <view class="select-trigger" @click="showBookPicker = true">
          <view v-if="selectedBook" class="selected-book">
            <BookCover
              :src="selectedBook.coverUrl"
              :width="80"
              :ratio="3 / 4"
              :radius="12"
              :padding="8"
              :shadow="false"
              :bg-color="selectedBook.coverColor || '#F5F7FA'"
            />
            <view class="book-info">
              <text class="book-title">{{ selectedBook.title }}</text>
              <text class="book-notes">{{ selectedBook.totalNotes || 0 }}条笔记</text>
            </view>
          </view>
          <text v-else class="placeholder">请选择一本书籍</text>
          <u-icon name="arrow-down" :size="16" class="arrow-icon" />
        </view>
      </view>

      <!-- 章节选择 (仅在选择书籍后显示) -->
      <view v-if="selectedBookId" class="select-section chapter-section">
        <view class="section-label">📖 选择章节（可选）</view>

        <!-- 章节输入框包裹器（相对定位参考点） -->
        <view class="chapter-input-wrapper">
          <!-- 章节输入框 -->
          <view class="chapter-input" @click="handleChapterInputClick">
            <input
              v-model="chapterName"
              class="chapter-text-input"
              placeholder="点击选择或手动输入"
              @input="handleChapterInput"
              @focus="handleChapterInputFocus"
            />
            <u-icon name="edit-pen" :size="16" class="edit-icon" />
          </view>

          <!-- 章节列表Popover（绝对定位，从顶部弹出） -->
          <view
            v-if="showChapterList"
            class="chapter-list-popover"
            @click.stop
          >
            <!-- 实时过滤的章节列表 -->
            <scroll-view
              v-if="filteredChapters.length > 0"
              class="chapter-list-scroll"
              scroll-y
            >
              <view class="chapter-list-header">
                <text class="header-text">已有章节</text>
              </view>
              <view
                v-for="chapter in filteredChapters"
                :key="chapter.id"
                class="chapter-item"
                @click="selectChapter(chapter.title)"
              >
                <text class="chapter-title">{{ chapter.title }}</text>
                <u-icon
                  v-if="chapterName === chapter.title"
                  name="checkmark"
                  :size="20"
                  color="#00a82d"
                />
              </view>
            </scroll-view>

            <!-- 无匹配章节提示 -->
            <view v-else class="chapter-empty">
              <text class="empty-text">没有匹配的章节</text>
            </view>
          </view>
        </view>

        <!-- 新章节提示（输入框下方） -->
        <view v-if="isNewChapter" class="new-chapter-tip">
          <u-icon name="edit-pen" :size="12" color="#00a82d" />
          <text class="tip-text">将创建新章节: "{{ chapterName }}"</text>
        </view>
      </view>
    </view>

    <!-- Footer -->
    <view class="selector-footer">
      <u-button
        type="primary"
        :disabled="!selectedBookId"
        @click="handleConfirm"
        class="confirm-btn"
      >
        确认
      </u-button>
    </view>
  </view>

  <!-- 书籍选择弹窗(平级,非嵌套) -->
  <u-popup
    v-model="showBookPicker"
    mode="bottom"
    :round="24"
    :z-index="10076"
    @close="showBookPicker = false"
  >
    <view class="book-picker-container">
      <view class="picker-header">
        <text class="picker-title">选择书籍</text>
        <view class="close-btn" @click="showBookPicker = false">
          <u-icon name="close" :size="20" />
        </view>
      </view>
      <scroll-view class="book-list" scroll-y>
        <view
          v-for="book in books"
          :key="book.id"
          class="book-item"
          :class="{ active: selectedBookId === book.id }"
          @click="handleBookSelect(book)"
        >
          <BookCover
            :src="book.coverUrl"
            :width="80"
            :ratio="3 / 4"
            :radius="12"
            :padding="8"
            :shadow="false"
            :bg-color="book.coverColor || '#F5F7FA'"
          />
          <view class="book-info">
            <text class="book-title">{{ book.title }}</text>
            <text class="book-notes">{{ book.totalNotes || 0 }}条笔记</text>
          </view>
          <u-icon v-if="selectedBookId === book.id" name="checkmark" :size="20" color="#00a82d" />
        </view>
      </scroll-view>
    </view>
  </u-popup>

  <!-- 蒙层（点击关闭章节列表） -->
  <view
    v-if="showChapterList"
    class="chapter-list-mask"
    @click="showChapterList = false"
    catchtouchmove
  ></view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getBookList, getBookChapters, type BookResponse, type Chapter } from '@/api/modules/book'
import { logger, createContext } from '@/utils'
import BookCover from '@/components/book/BookCover.vue'

// Props
const props = defineProps<{
  initialBookId?: number | null
}>()

// Emits
const emit = defineEmits<{
  close: []
  confirm: [bookId: number, chapterName: string | null]
}>()

// 状态
const showBookPicker = ref(false)
const showChapterList = ref(false)  // 修改：从showChapterPicker改为showChapterList
const selectedBookId = ref<number | null>(null)
const chapterName = ref('')
const books = ref<BookResponse[]>([])
const chapters = ref<Chapter[]>([])
const loading = ref(false)
const loadingChapters = ref(false)

// 计算属性
const selectedBook = computed(() => {
  return books.value.find(b => b.id === selectedBookId.value) || null
})

// 过滤章节列表（基于输入内容实时过滤）
const filteredChapters = computed(() => {
  if (!chapterName.value.trim()) {
    return chapters.value
  }
  return chapters.value.filter(chapter =>
    chapter.title.includes(chapterName.value.trim())
  )
})

// 判断是否为新章节
const isNewChapter = computed(() => {
  if (!chapterName.value.trim()) {
    return false
  }
  return !chapters.value.find(ch => ch.title === chapterName.value.trim())
})

// 获取书籍列表
const loadBooks = async () => {
  const ctx = createContext()
  try {
    loading.value = true
    logger.info(ctx, '[BookChapterSelector] 加载书籍列表')

    const res = await getBookList({ page: 1, pageSize: 100 })
    books.value = res.books || []

    logger.info(ctx, '[BookChapterSelector] 书籍列表加载成功', { count: books.value.length })
  } catch (error) {
    logger.error(ctx, '[BookChapterSelector] 加载书籍列表失败', { error })
    uni.showToast({ title: '加载书籍列表失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 加载章节列表
const loadChapters = async (bookId: number) => {
  const ctx = createContext()
  try {
    loadingChapters.value = true
    logger.info(ctx, '[BookChapterSelector] 加载章节列表', { bookId })

    const res = await getBookChapters(bookId)
    chapters.value = res.chapters || []

    logger.info(ctx, '[BookChapterSelector] 章节列表加载成功', {
      count: chapters.value.length
    })
  } catch (error) {
    logger.error(ctx, '[BookChapterSelector] 加载章节列表失败', { error })
    uni.showToast({ title: '加载章节列表失败', icon: 'none' })
    chapters.value = []
  } finally {
    loadingChapters.value = false
  }
}

const resetState = () => {
  selectedBookId.value = props.initialBookId || null
  chapterName.value = ''
  showBookPicker.value = false
  showChapterList.value = false
}

onMounted(async () => {
  resetState()
  await loadBooks()
  if (selectedBookId.value) {
    await loadChapters(selectedBookId.value)
  }
})

watch(
  () => props.initialBookId,
  async (val) => {
    if (typeof val === 'number' && val > 0) {
      selectedBookId.value = val
      await loadChapters(val)
    }
  }
)

// 监听书籍切换，自动加载章节
watch(selectedBookId, (bookId) => {
  if (bookId) {
    loadChapters(bookId)
  } else {
    chapters.value = []
  }
})

// 处理书籍选择
const handleBookSelect = (book: BookResponse) => {
  selectedBookId.value = book.id
  showBookPicker.value = false
}

// 新增：处理章节输入框点击
const handleChapterInputClick = () => {
  if (chapters.value.length > 0) {
    showChapterList.value = true
  }
}

// 新增：处理章节输入（实时过滤）
const handleChapterInput = () => {
  if (chapterName.value && chapters.value.length > 0) {
    showChapterList.value = true
  }
}

// 新增：处理章节输入框聚焦
const handleChapterInputFocus = () => {
  if (chapters.value.length > 0) {
    showChapterList.value = true
  }
}

// 选择章节
const selectChapter = (title: string) => {
  chapterName.value = title
  showChapterList.value = false  // 修改：关闭章节列表
}

// 处理确认
const handleConfirm = () => {
  if (selectedBookId.value) {
    emit('confirm', selectedBookId.value, chapterName.value || null)
    emit('close')
  }
}

</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens/book-detail.scss';

.selector-container {
  background: $book-detail-card-bg;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.selector-header {
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid $book-detail-border-light;

  .selector-title {
    font-size: 36rpx;
    font-weight: 600;
    color: $book-detail-text-primary;
  }
}

.selector-content {
  flex: 1;
  overflow-y: auto;
  padding: 24rpx 32rpx;
  background: $book-detail-bg;
}

.select-section {
  margin-bottom: 32rpx;

  .section-label {
    font-size: 28rpx;
    font-weight: 500;
    color: $book-detail-text-secondary;
    margin-bottom: 16rpx;
  }

  // 章节区域需要相对定位，作为下拉框的参考点
  &.chapter-section {
    position: relative;
  }

  .select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
    background: $book-detail-input-bg;
    border: 1rpx solid $book-detail-border-light;
    border-radius: $book-detail-radius-md;
    min-height: 96rpx;

    &:active {
      background: rgba(0, 168, 45, 0.06);
    }

    .selected-book {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex: 1;
      min-width: 0;
    }

    .placeholder {
      font-size: 28rpx;
      color: $book-detail-text-muted;
    }

    .arrow-icon {
      color: $book-detail-text-muted;
    }
  }

  // 章节输入框包裹器（相对定位参考点）
  .chapter-input-wrapper {
    position: relative;
    z-index: 1;
  }

  .chapter-input {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;
    background: $book-detail-input-bg;
    border: 1rpx solid $book-detail-border-light;
    border-radius: $book-detail-radius-md;
    min-height: 96rpx;

    &:active {
      background: rgba(0, 168, 45, 0.06);
    }

    .chapter-text-input {
      flex: 1;
      font-size: 28rpx;
      color: $book-detail-text-primary;
      height: 96rpx;
      line-height: 96rpx;

      &::placeholder {
        color: $book-detail-text-muted;
      }
    }

    .edit-icon {
      color: $book-detail-text-muted;
      margin-left: 16rpx;
      flex-shrink: 0;
    }
  }

  .new-chapter-tip {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 16rpx;
    padding: 16rpx;
    background: $book-detail-accent-bg;
    border: 1rpx solid rgba(0, 168, 45, 0.16);
    border-radius: 12rpx;

    .tip-text {
      font-size: 24rpx;
      color: $book-detail-primary;
    }
  }
}

// 章节列表Popover（绝对定位，从顶部弹出）
.chapter-list-popover {
  position: absolute;
  bottom: calc(100% + 16rpx);  // 输入框上方16rpx（从顶部弹出）
  left: 0;
  right: 0;
  z-index: 10077;
  background: $book-detail-card-bg;
  border-radius: $book-detail-radius-md;
  box-shadow: $book-detail-shadow-card;
  max-height: 480rpx;
  overflow: hidden;
}

// 蒙层（半透明，点击关闭）
.chapter-list-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10076;
  background: rgba(0, 0, 0, 0.35);
}

.chapter-list-scroll {
  max-height: 480rpx;
}

.chapter-list-header {
  padding: 24rpx 32rpx 16rpx;
  border-bottom: 1rpx solid $book-detail-border-light;

  .header-text {
    font-size: 24rpx;
    color: $book-detail-text-muted;
  }
}

.chapter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid rgba($book-detail-border-light, 0.4);

  &:active {
    background: rgba(0, 168, 45, 0.04);
  }

  .chapter-title {
    font-size: 28rpx;
    color: $book-detail-text-primary;
    flex: 1;
  }
}

.chapter-empty {
  padding: 64rpx 32rpx;
  text-align: center;

  .empty-text {
    font-size: 26rpx;
    color: $book-detail-text-muted;
  }
}

.book-info {
  flex: 1;
  min-width: 0;

  .book-title {
    font-size: 28rpx;
    font-weight: 500;
    color: $book-detail-text-primary;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-notes {
    font-size: 24rpx;
    color: $book-detail-text-muted;
    display: block;
    margin-top: 4rpx;
  }
}

.selector-footer {
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid $book-detail-border-light;

  .confirm-btn {
    width: 100%;
  }
}

// 书籍选择弹窗
.book-picker-container {
  background: $book-detail-card-bg;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid $book-detail-border-light;

  .picker-title {
    font-size: 36rpx;
    font-weight: 600;
    color: $book-detail-text-primary;
  }

  .close-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 32rpx;

    &:active {
      background: rgba(0, 168, 45, 0.06);
    }
  }
}

.book-list {
  flex: 1;
  padding: 16rpx 0;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}

.book-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 32rpx;

  &:active {
    background: rgba(0, 168, 45, 0.04);
  }

  &.active {
    background: $book-detail-accent-bg;
  }
}

</style>
