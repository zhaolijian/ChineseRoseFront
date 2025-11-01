<template>
  <view class="note-list-page">
    <!-- 搜索栏 -->
    <view class="search-section" :style="searchSectionStyle">
      <u-search
        v-model="searchKeyword"
        placeholder="搜索笔记..."
        bg-color="transparent"
        shape="round"
        :custom-style="searchInputStyle"
        :placeholder-style="searchPlaceholderStyle"
        @search="handleSearch"
        @clear="handleClearSearch"
        @focus="handleSearchFocus"
        @blur="handleSearchBlur"
      >
        <template #suffix>
          <u-icon class="search-icon" name="search" size="16" color="#999"></u-icon>
        </template>
      </u-search>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-section">
      <scroll-view class="filter-scroll" scroll-x>
        <view class="filter-list">
          <view
            v-for="filter in filterList"
            :key="filter.key"
            class="filter-item"
            :class="{ active: activeFilter === filter.key }"
            @click="handleFilterChange(filter.key)"
          >
            <text class="filter-text">{{ filter.label }}</text>
          </view>
        </view>
      </scroll-view>
      
      <view class="sort-button" @click="showSortPopup = true">
        <u-icon name="list" size="16" color="#666"></u-icon>
      </view>
    </view>

    <!-- 笔记列表 -->
    <view class="notes-content">
      <view v-if="notes.length === 0 && !loading" class="empty-state">
        <u-empty
          mode="list"
          text="还没有笔记"
          textColor="#999"
          iconSize="80"
        >
          <template #bottom>
            <PrimaryButton class="empty-action" size="md" @click="goToAddNote">
              添加第一条笔记
            </PrimaryButton>
          </template>
        </u-empty>
      </view>

      <view v-else class="notes-list">
        <view 
          v-for="note in notes" 
          :key="note.id"
          class="note-item"
          @click="goToNoteDetail(note)"
          @longpress="handleNoteLongPress(note)"
        >
          <!-- 笔记卡片内容 -->
          <view class="note-header">
            <view class="note-title-section">
              <text class="note-title">{{ note.title }}</text>
              <text v-if="note.bookTitle" class="book-title">《{{ note.bookTitle }}》</text>
            </view>
            <text class="note-date">{{ formatDate(note.createdAt) }}</text>
          </view>
          
          <text class="note-content">{{ note.excerpt || note.content }}</text>
          
          <view class="note-footer">
            <view class="note-tags" v-if="note.tags && note.tags.length > 0">
              <text 
                v-for="tag in note.tags.slice(0, 3)" 
                :key="tag"
                class="note-tag"
              >
                #{{ tag }}
              </text>
              <text v-if="note.tags.length > 3" class="more-tags">...</text>
            </view>
            
            <view class="note-actions">
              <u-icon 
                v-if="note.hasImages || (note.images && note.images.length > 0)"
                name="image" 
                size="14" 
                color="#999"
                style="margin-right: 8px;"
              ></u-icon>
              <text class="note-type">{{ getNoteTypeText(note.noteType) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 浮动添加按钮 -->
    <view class="fab-button" @click="goToAddNote">
      <u-icon name="plus" size="24" color="#fff"></u-icon>
    </view>

    <!-- 排序弹窗 -->
    <u-popup
      v-model="showSortPopup"
      mode="bottom"
      :round="24"
      closeable
      :custom-style="popupStyle"
    >
      <view class="sort-popup">
        <view class="popup-header">
          <text class="popup-title">排序方式</text>
        </view>
        
        <view class="sort-options">
          <view 
            v-for="option in sortOptions" 
            :key="option.key"
            class="sort-option"
            :class="{ active: currentSort === option.key }"
            @click="handleSortChange(option.key)"
          >
            <text class="option-text">{{ option.label }}</text>
            <u-icon 
              v-if="currentSort === option.key"
              name="checkmark" 
              size="16" 
              color="#00a82d"
            ></u-icon>
          </view>
        </view>
      </view>
    </u-popup>

    <!-- 笔记操作弹窗 -->
    <u-popup
      v-model="showNoteActions"
      mode="bottom"
      :round="24"
      closeable
      :custom-style="popupStyle"
    >
      <view class="action-popup">
        <view class="popup-header">
          <text class="popup-title">笔记操作</text>
        </view>
        
        <view class="action-options">
          <view class="action-option" @click="editNote">
            <u-icon name="edit-pen" size="20" color="#00a82d"></u-icon>
            <text class="option-text">编辑</text>
          </view>
          <view class="action-option" @click="shareNote">
            <u-icon name="share" size="20" color="#00a82d"></u-icon>
            <text class="option-text">分享</text>
          </view>
          <view class="action-option" @click="deleteNote">
            <u-icon name="trash" size="20" color="#ff6b6b"></u-icon>
            <text class="option-text">删除</text>
          </view>
        </view>
      </view>
    </u-popup>

    <!-- 加载提示 -->
    <u-loading-page 
      :loading="pageLoading"
      bg-color="#f5f7fa"
    ></u-loading-page>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import { logger, createContext } from '@/utils'

// 类型定义
interface Note {
  id: number
  title: string
  content: string
  bookId?: number
  bookTitle?: string
  noteType?: string
  tags?: string[]
  excerpt?: string
  hasImages?: boolean
  images?: string[]
  createdAt?: string
  updatedAt?: string
}

interface FilterItem {
  key: string
  label: string
}

interface SortOption {
  key: string
  label: string
}

// 响应式数据
const notes = ref<Note[]>([])
const searchKeyword = ref('')
const activeFilter = ref('all')
const currentSort = ref('createdAt_desc')
const loading = ref(false)
const pageLoading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = ref(20)
const isSearchFocus = ref(false)
const windowWidth = ref(375)
const safeTopPx = ref(56)
const searchPlaceholderStyle = 'color:#6b7280;font-size:28rpx;'

const pxToRpx = (px: number) => {
  const width = windowWidth.value || 375
  return Math.round((px * 750) / width)
}

const searchSectionStyle = computed(() => ({
  paddingTop: `${pxToRpx(safeTopPx.value)}rpx`
}))

const searchInputStyle = computed(() => ({
  background: isSearchFocus.value ? '#ffffff' : '#f8f9fa',
  border: isSearchFocus.value
    ? '2rpx solid #00a82d'
    : '1rpx solid rgba(0, 0, 0, 0.12)',
  height: '72rpx',
  borderRadius: '40rpx',
  paddingLeft: isSearchFocus.value ? '31rpx' : '32rpx',
  paddingRight: isSearchFocus.value ? '31rpx' : '32rpx',
  transition: 'all 0.2s ease'
}))
const popupStyle = {
  backgroundColor: '#ffffff',
  boxShadow: '0 -2rpx 16rpx rgba(0, 0, 0, 0.08)'
}

// 弹窗状态
const showSortPopup = ref(false)
const showNoteActions = ref(false)
const selectedNote = ref<Note | null>(null)

// 筛选选项
const filterList: FilterItem[] = [
  { key: 'all', label: '全部' },
  { key: 'reading', label: '阅读笔记' },
  { key: 'thought', label: '思考感悟' },
  { key: 'quote', label: '摘录' },
  { key: 'summary', label: '总结' }
]

// 排序选项
const sortOptions: SortOption[] = [
  { key: 'createdAt_desc', label: '创建时间（新到旧）' },
  { key: 'createdAt_asc', label: '创建时间（旧到新）' },
  { key: 'updatedAt_desc', label: '更新时间（新到旧）' },
  { key: 'title_asc', label: '标题（A到Z）' }
]

// 路由参数
const routeParams = ref<{ bookId?: number }>({})

// 安全区计算函数
function updateSafeArea() {
  try {
    const info = uni.getSystemInfoSync?.()
    if (!info) return
    windowWidth.value = info.windowWidth || 375
    const statusBarHeight = info.statusBarHeight || 0
    const menuRect = uni.getMenuButtonBoundingClientRect?.()
    const capsuleBottom = menuRect?.bottom ?? (statusBarHeight + 44)
    safeTopPx.value = capsuleBottom + 6
  } catch (error) {
    logger.warn(createContext(), '[NotesPage] 获取系统信息失败', error)
  }
}

// 生命周期
onLoad((options: any) => {
  if (options.bookId) {
    routeParams.value.bookId = parseInt(options.bookId)
  }
})

onMounted(async () => {
  const ctx = createContext()
  logger.info(ctx, '[NotesPage] 页面挂载')
  updateSafeArea()
  await loadNotes(true)
})

onShow(async () => {
  const ctx = createContext()
  logger.info(ctx, '[NotesPage] 页面显示')
  updateSafeArea()
  // 从编辑页面返回时刷新数据
  await loadNotes(true)
})

onPullDownRefresh(async () => {
  await loadNotes(true)
  uni.stopPullDownRefresh()
})

onReachBottom(async () => {
  if (hasMore.value && !loading.value) {
    await loadMoreNotes()
  }
})

// 方法
const loadNotes = async (refresh = false) => {
  try {
    loading.value = true
    if (refresh) {
      pageLoading.value = true
      currentPage.value = 1
    }
    
    // TODO: 实现获取笔记列表的API
    // const params = {
    //   page: currentPage.value,
    //   pageSize: pageSize.value,
    //   keyword: searchKeyword.value,
    //   bookId: routeParams.value.bookId,
    //   noteType: activeFilter.value === 'all' ? undefined : activeFilter.value,
    //   sortBy: currentSort.value.split('_')[0],
    //   sortOrder: currentSort.value.split('_')[1]
    // }
    // const result = await noteStore.fetchNotes(params)
    
    // 临时模拟数据
    const mockNotes: Note[] = []
    
    if (refresh) {
      notes.value = mockNotes
    } else {
      notes.value.push(...mockNotes)
    }
    
    hasMore.value = mockNotes.length === pageSize.value
    if (!refresh) {
      currentPage.value++
    }
  } catch (error) {
    console.error('加载笔记失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
    pageLoading.value = false
  }
}

const loadMoreNotes = async () => {
  if (!hasMore.value) return
  currentPage.value++
  await loadNotes()
}

const handleSearch = async (keyword: string) => {
  searchKeyword.value = keyword
  await loadNotes(true)
}

const handleClearSearch = async () => {
  searchKeyword.value = ''
  await loadNotes(true)
}

const handleFilterChange = async (filterKey: string) => {
  activeFilter.value = filterKey
  await loadNotes(true)
}

const handleSearchFocus = () => {
  isSearchFocus.value = true
}

const handleSearchBlur = () => {
  isSearchFocus.value = false
}

const handleSortChange = async (sortKey: string) => {
  currentSort.value = sortKey
  showSortPopup.value = false
  await loadNotes(true)
}

const handleNoteLongPress = (note: Note) => {
  selectedNote.value = note
  showNoteActions.value = true
}

const goToAddNote = () => {
  const url = routeParams.value.bookId 
    ? `/pages-note/add/add?bookId=${routeParams.value.bookId}`
    : '/pages-note/add/add'
  
  uni.navigateTo({ url })
}

const goToNoteDetail = (note: Note) => {
  uni.navigateTo({
    url: `/pages-note/edit/edit?id=${note.id}`
  })
}

const editNote = () => {
  if (selectedNote.value) {
    uni.navigateTo({
      url: `/pages-note/edit/edit?id=${selectedNote.value.id}`
    })
  }
  showNoteActions.value = false
}

const shareNote = () => {
  if (selectedNote.value) {
    // TODO: 实现笔记分享功能
    uni.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
  showNoteActions.value = false
}

const deleteNote = () => {
  if (selectedNote.value) {
    uni.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除这条笔记吗？',
      success: async (res) => {
        if (res.confirm && selectedNote.value) {
          try {
            // TODO: 实现删除笔记的API
            // await noteStore.deleteNote(selectedNote.value.id)
            
            // 从列表中移除
            const index = notes.value.findIndex(n => n.id === selectedNote.value!.id)
            if (index !== -1) {
              notes.value.splice(index, 1)
            }
            
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
          } catch (error) {
            console.error('删除笔记失败:', error)
            uni.showToast({
              title: '删除失败',
              icon: 'error'
            })
          }
        }
      }
    })
  }
  showNoteActions.value = false
}

const getNoteTypeText = (noteType: string): string => {
  const typeMap: Record<string, string> = {
    reading: '阅读',
    thought: '思考', 
    quote: '摘录',
    summary: '总结'
  }
  return typeMap[noteType] || '笔记'
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
    return date.toLocaleDateString()
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens/notes.scss';

$card-default: map-get($notes-card-states, default);
$card-hover: map-get($notes-card-states, hover);
$card-active: map-get($notes-card-states, active);
$filter-default: map-get($notes-filter-states, default);
$filter-active: map-get($notes-filter-states, active);
$filter-hover: map-get($notes-filter-states, hover);
$fab-default: map-get($notes-fab-states, default);
$fab-hover: map-get($notes-fab-states, hover);
$fab-active: map-get($notes-fab-states, active);
$tag-default: map-get($notes-tag-states, default);

.note-list-page {
  min-height: 100vh;
  background-color: map-get($notes-colors, background);
  padding-bottom: map-get($notes-spacing, bottom-safe);
}

.search-section {
  padding-left: map-get($notes-layout, search-padding-x);
  padding-right: map-get($notes-layout, search-padding-x);
  padding-bottom: 12rpx; // 减小底部间距，与书架页面对齐
  background: transparent;
  // padding-top通过searchSectionStyle动态设置
}

.search-icon {
  color: map-get($notes-colors, secondary-text);
}

.filter-section {
  display: flex;
  align-items: center;
  background: map-get($notes-colors, card-background);
  padding: map-get($notes-layout, filter-padding-y) 0;
  border-bottom: 1rpx solid map-get($notes-colors, divider);

  .filter-scroll {
    flex: 1;
    white-space: nowrap;
  }

  .filter-list {
    display: flex;
    align-items: center;
    padding: 0 map-get($notes-layout, filter-padding-x);
    gap: map-get($notes-spacing, md);
  }

  .filter-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: map-get($notes-sizes, filter-height);
    padding: map-get($notes-spacing, sm) map-get($notes-spacing, lg);
    border-radius: map-get($notes-radius, pill);
    background: map-get($filter-default, background);
    color: map-get($filter-default, color);
    font-size: map-get($notes-font-sizes, base);
    transition: background-color map-get($notes-transitions, normal), color map-get($notes-transitions, normal);

    &.active {
      background: map-get($filter-active, background);
      color: map-get($filter-active, color);
    }
  }

  .sort-button {
    margin-right: map-get($notes-spacing, lg);
    display: flex;
    align-items: center;
    justify-content: center;
    width: map-get($notes-sizes, filter-height);
    height: map-get($notes-sizes, filter-height);
    border-radius: map-get($notes-radius, pill);
    background: map-get($notes-colors, filter-background);
    transition: background-color map-get($notes-transitions, normal);
  }
}

.notes-content {
  padding: map-get($notes-layout, list-padding-y) map-get($notes-layout, list-padding-x);
}

.empty-state {
  padding-top: map-get($notes-spacing, huge);
  text-align: center;
}

.empty-action {
  margin-top: map-get($notes-spacing, xl);
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: map-get($notes-spacing, md);
}

.note-item {
  background: map-get($card-default, background);
  border-radius: map-get($notes-radius, lg);
  padding: map-get($notes-spacing, lg);
  box-shadow: map-get($card-default, shadow);
  transition: transform map-get($notes-transitions, fast), box-shadow map-get($notes-transitions, normal);

  &:active {
    transform: map-get($card-active, transform);
    box-shadow: map-get($card-active, shadow);
  }
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: map-get($notes-spacing, sm);
  gap: map-get($notes-spacing, sm);
}

.note-title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: map-get($notes-spacing, xs);
}

.note-title {
  font-size: map-get($notes-font-sizes, base);
  font-weight: map-get($notes-font-weights, semibold);
  color: map-get($notes-colors, title);
  line-height: 1.4;
}

.book-title {
  display: inline-flex;
  align-items: center;
  padding: map-get($notes-spacing, xs) map-get($notes-spacing, sm);
  border-radius: map-get($notes-radius, sm);
  background: map-get($tag-default, background);
  color: map-get($tag-default, color);
  font-size: map-get($notes-font-sizes, xs);
}

.note-date {
  font-size: map-get($notes-font-sizes, xs);
  color: map-get($notes-colors, secondary-text);
  white-space: nowrap;
}

.note-content {
  font-size: map-get($notes-font-sizes, sm);
  color: map-get($notes-colors, muted-foreground);
  line-height: 1.6;
  margin-bottom: map-get($notes-spacing, md);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: map-get($notes-spacing, md);
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: map-get($notes-spacing, xs);

  .note-tag {
    font-size: map-get($notes-font-sizes, xxs);
    padding: map-get($notes-spacing, xs) map-get($notes-spacing, sm);
    border-radius: map-get($notes-radius, sm);
    background: map-get($tag-default, background);
    color: map-get($tag-default, color);
  }

  .more-tags {
    font-size: map-get($notes-font-sizes, xxs);
    color: map-get($notes-colors, secondary-text);
  }
}

.note-actions {
  display: flex;
  align-items: center;
  gap: map-get($notes-spacing, xs);

  .note-type {
    font-size: map-get($notes-font-sizes, xs);
    color: map-get($notes-colors, secondary-text);
  }
}

.fab-button {
  position: fixed;
  right: map-get($notes-layout, fab-right);
  bottom: map-get($notes-layout, fab-bottom);
  width: map-get($notes-sizes, fab-size);
  height: map-get($notes-sizes, fab-size);
  border-radius: map-get($notes-radius, full);
  background: map-get($fab-default, background);
  box-shadow: map-get($fab-default, shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: transform map-get($notes-transitions, fast), box-shadow map-get($notes-transitions, normal), background-color map-get($notes-transitions, normal);

  &:active {
    transform: map-get($fab-active, transform);
    box-shadow: map-get($fab-active, shadow);
  }
}

.sort-popup,
.action-popup {
  padding: map-get($notes-spacing, xl);
  display: flex;
  flex-direction: column;
  gap: map-get($notes-spacing, xl);

  .popup-header {
    text-align: center;

    .popup-title {
      font-size: map-get($notes-font-sizes, lg);
      font-weight: map-get($notes-font-weights, semibold);
      color: map-get($notes-colors, title);
    }
  }

  .sort-options,
  .action-options {
    display: flex;
    flex-direction: column;
    gap: map-get($notes-spacing, md);
  }

  .sort-option,
  .action-option {
    display: flex;
    align-items: center;
    gap: map-get($notes-spacing, sm);
    padding: map-get($notes-spacing, sm) 0;
    font-size: map-get($notes-font-sizes, base);
    color: map-get($notes-colors, title);
    border-bottom: 1rpx solid map-get($notes-colors, divider);

    &:last-child {
      border-bottom: none;
    }

    &.active .option-text {
      color: map-get($notes-colors, primary);
      font-weight: map-get($notes-font-weights, semibold);
    }
  }

  .action-option {
    justify-content: flex-start;
  }

  .option-text {
    flex: 1;
  }
}
</style>
