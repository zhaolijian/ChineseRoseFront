<template>
  <view class="note-list-page">
    <!-- 搜索栏 -->
    <view class="search-section">
      <u-search
        v-model="searchKeyword"
        placeholder="搜索笔记..."
        bg-color="#f8f9fa"
        border-color="transparent"
        @search="handleSearch"
        @clear="handleClearSearch"
      >
        <template #suffix>
          <u-icon name="search" size="18" color="#999"></u-icon>
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
            <u-button 
              type="primary" 
              text="添加第一条笔记"
              @click="goToAddNote"
              style="margin-top: 20px;"
            ></u-button>
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
          
          <text class="note-content">{{ note.content }}</text>
          
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
                v-if="note.images && note.images.length > 0"
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
      height="300px"
      round="20"
      closeable
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
      height="200px"
      round="20"
      closeable
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
import { ref, onMounted } from 'vue'
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

// 类型定义
interface Note {
  id: number
  title: string
  content: string
  bookId?: number
  bookTitle?: string
  noteType: string
  tags?: string[]
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

// 生命周期
onLoad((options: any) => {
  if (options.bookId) {
    routeParams.value.bookId = parseInt(options.bookId)
  }
})

onMounted(async () => {
  await loadNotes(true)
})

onShow(async () => {
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
.note-list-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 80px; // 为FAB按钮留出空间
}

.search-section {
  background: #fff;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-section {
  background: #fff;
  padding: 12px 0;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  
  .filter-scroll {
    flex: 1;
    white-space: nowrap;
  }
  
  .filter-list {
    display: flex;
    padding: 0 16px;
    
    .filter-item {
      padding: 6px 16px;
      margin-right: 12px;
      border-radius: 20px;
      background: #f8f9fa;
      white-space: nowrap;
      
      &.active {
        background: #00a82d;
        
        .filter-text {
          color: #fff;
        }
      }
      
      .filter-text {
        font-size: 14px;
        color: #666;
      }
    }
  }
  
  .sort-button {
    padding: 8px 16px;
    margin-right: 8px;
  }
}

.notes-content {
  padding: 12px 16px;
}

.empty-state {
  padding-top: 100px;
  text-align: center;
}

.notes-list {
  .note-item {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    &:active {
      transform: scale(0.98);
      transition: transform 0.1s;
    }
    
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      
      .note-title-section {
        flex: 1;
        margin-right: 12px;
        
        .note-title {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          line-height: 1.4;
          margin-bottom: 4px;
        }
        
        .book-title {
          font-size: 12px;
          color: #00a82d;
          background: rgba(0, 168, 45, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
      }
      
      .note-date {
        font-size: 12px;
        color: #999;
        white-space: nowrap;
      }
    }
    
    .note-content {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
    
    .note-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .note-tags {
        display: flex;
        flex-wrap: wrap;
        flex: 1;
        
        .note-tag {
          font-size: 11px;
          color: #00a82d;
          background: rgba(0, 168, 45, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 6px;
          margin-bottom: 4px;
        }
        
        .more-tags {
          font-size: 11px;
          color: #999;
        }
      }
      
      .note-actions {
        display: flex;
        align-items: center;
        
        .note-type {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}

.fab-button {
  position: fixed;
  right: 20px;
  bottom: 100px; // 避开tabbar
  width: 56px;
  height: 56px;
  background: #00a82d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 168, 45, 0.3);
  z-index: 999;
  
  &:active {
    transform: scale(0.95);
  }
}

.sort-popup,
.action-popup {
  padding: 20px;
  
  .popup-header {
    text-align: center;
    margin-bottom: 20px;
    
    .popup-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .sort-options,
  .action-options {
    .sort-option,
    .action-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.active {
        .option-text {
          color: #00a82d;
          font-weight: 600;
        }
      }
      
      .option-text {
        font-size: 14px;
        color: #333;
        margin-left: 12px;
        flex: 1;
      }
    }
    
    .action-option {
      justify-content: flex-start;
    }
  }
}
</style>