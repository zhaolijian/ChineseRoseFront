<template>
  <view class="book-detail-page">
    <!-- 导航栏 -->
    <AppNavBar title="书籍详情" :showBack="true">
      <template #right>
        <u-icon 
          name="trash" 
          size="20" 
          color="#ff4444"
          data-testid="delete-button"
          @click="handleDeleteBook" 
        />
      </template>
    </AppNavBar>
    
    <!-- 书籍信息 -->
    <view class="book-header">
      <view class="book-cover">
        <u-image
          :src="book?.coverUrl || '/static/images/book-placeholder.png'"
          mode="aspectFit"
          width="120px"
          height="160px"
          radius="8"
          loading-icon="book"
        ></u-image>
      </view>
      
      <view class="book-info">
        <text class="book-title">{{ book?.title || '未知书籍' }}</text>
        <text class="book-author">{{ book?.author || '未知作者' }}</text>
        <text v-if="book?.isbn" class="book-isbn">ISBN: {{ book.isbn }}</text>
        
        <view class="book-stats">
          <view class="stat-item">
            <text class="stat-value">{{ book?.noteCount || 0 }}</text>
            <text class="stat-label">笔记</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ book?.progress || 0 }}%</text>
            <text class="stat-label">进度</text>
          </view>
        </view>
        
        <view class="book-actions">
          <u-button 
            type="primary" 
            size="small"
            @click="goToAddNote"
          >
            添加笔记
          </u-button>
          <u-button 
            type="info" 
            size="small"
            @click="goToMindMap"
            style="margin-left: 8px;"
          >
            思维导图
          </u-button>
        </view>
      </view>
    </view>

    <!-- 阅读进度 -->
    <view class="progress-section">
      <view class="section-header">
        <text class="section-title">阅读进度</text>
        <text class="edit-text" @click="showProgressEdit = true">编辑</text>
      </view>
      
      <view class="progress-content">
        <u-line-progress 
          :percent="book?.progress || 0"
          active-color="#00a82d"
          inactive-color="#e9ecef"
          height="8"
        ></u-line-progress>
        <text class="progress-text">{{ book?.progress || 0 }}% 已读</text>
      </view>
    </view>

    <!-- 最近笔记 -->
    <view class="notes-section">
      <view class="section-header">
        <text class="section-title">最近笔记</text>
        <text class="more-text" @click="goToNoteList">查看全部</text>
      </view>
      
      <view v-if="recentNotes.length === 0" class="empty-notes">
        <u-empty 
          mode="list" 
          text="还没有添加笔记"
          textColor="#999"
          iconSize="60"
        >
          <template #bottom>
            <u-button 
              type="primary" 
              text="添加第一条笔记"
              size="small"
              @click="goToAddNote"
              style="margin-top: 16px;"
            ></u-button>
          </template>
        </u-empty>
      </view>
      
      <view v-else class="notes-list">
        <view 
          v-for="note in recentNotes" 
          :key="note.id"
          class="note-item"
          @click="goToNoteDetail(note)"
        >
          <view class="note-header">
            <text class="note-title">{{ note.title }}</text>
            <text class="note-date">{{ formatDate(note.createdAt) }}</text>
          </view>
          <text class="note-content">{{ note.content }}</text>
          <view v-if="note.tags && note.tags.length > 0" class="note-tags">
            <text 
              v-for="tag in note.tags" 
              :key="tag"
              class="note-tag"
            >
              #{{ tag }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 进度编辑弹窗 -->
    <u-popup 
      v-model="showProgressEdit" 
      mode="center"
      width="300px"
      height="250px"
      round="16"
      closeable
    >
      <view class="progress-edit-popup">
        <view class="popup-title">更新阅读进度</view>
        
        <view class="progress-input">
          <text class="input-label">当前进度：{{ editProgress }}%</text>
          <u-slider 
            v-model="editProgress"
            min="0"
            max="100"
            step="1"
            inactive-color="#e9ecef"
            active-color="#00a82d"
            block-color="#00a82d"
          ></u-slider>
        </view>
        
        <view class="popup-actions">
          <u-button 
            text="取消" 
            @click="showProgressEdit = false"
            style="margin-right: 12px;"
          ></u-button>
          <u-button 
            type="primary" 
            text="确定"
            :loading="updateLoading"
            @click="updateProgress"
          ></u-button>
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
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useBookStore } from '@/stores/modules/book'
import { deleteBook } from '@/api/modules/book'
import AppNavBar from '@/components/common/AppNavBar.vue'

// 类型定义
interface Book {
  id: number
  title: string
  author?: string
  isbn?: string
  coverUrl?: string
  noteCount?: number
  progress?: number
  createdAt?: string
  updatedAt?: string
}

interface Note {
  id: number
  title: string
  content: string
  tags?: string[]
  createdAt?: string
}

// Store
const bookStore = useBookStore()

// 响应式数据
const book = ref<Book | null>(null)
const recentNotes = ref<Note[]>([])
const pageLoading = ref(false)
const updateLoading = ref(false)
const showProgressEdit = ref(false)
const editProgress = ref(0)
const bookId = ref<number>(0)

// 生命周期
onLoad((options: any) => {
  if (options.id) {
    bookId.value = parseInt(options.id)
  }
})

onMounted(async () => {
  await loadBookDetail()
})

onShow(async () => {
  // 从笔记页面返回时刷新数据
  await loadRecentNotes()
})

// 方法
const loadBookDetail = async () => {
  if (!bookId.value) {
    uni.showToast({
      title: '书籍ID不存在',
      icon: 'error'
    })
    return
  }

  try {
    pageLoading.value = true
    
    // 获取书籍详情
    const bookData = await bookStore.fetchBookDetail(bookId.value)
    book.value = bookData
    editProgress.value = bookData.progress || 0
    
    // 获取最近笔记
    await loadRecentNotes()
  } catch (error) {
    console.error('加载书籍详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    pageLoading.value = false
  }
}

const loadRecentNotes = async () => {
  try {
    // TODO: 实现获取书籍最近笔记的API
    // const notes = await noteStore.fetchNotesByBook(bookId.value, 1, 5)
    // recentNotes.value = notes.notes
    
    // 临时模拟数据
    recentNotes.value = []
  } catch (error) {
    console.error('加载最近笔记失败:', error)
  }
}

const updateProgress = async () => {
  try {
    updateLoading.value = true
    
    await bookStore.updateReadingProgress(bookId.value, editProgress.value)
    
    if (book.value) {
      book.value.progress = editProgress.value
    }
    
    showProgressEdit.value = false
    
    uni.showToast({
      title: '进度更新成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('更新进度失败:', error)
    uni.showToast({
      title: '更新失败',
      icon: 'error'
    })
  } finally {
    updateLoading.value = false
  }
}

const goToAddNote = () => {
  uni.navigateTo({
    url: `/pages-note/add/add?bookId=${bookId.value}`
  })
}

const goToNoteList = () => {
  uni.navigateTo({
    url: `/pages-note/list/list?bookId=${bookId.value}`
  })
}

const goToNoteDetail = (note: Note) => {
  uni.navigateTo({
    url: `/pages-note/edit/edit?id=${note.id}`
  })
}

const goToMindMap = () => {
  uni.navigateTo({
    url: `/pages-mindmap/view/view?bookId=${bookId.value}`
  })
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

// 删除书籍
const handleDeleteBook = () => {
  uni.showModal({
    title: '确认删除书籍',
    content: '删除后，该书籍下的笔记仍会保留在笔记列表中',
    confirmText: '确认删除',
    confirmColor: '#ee0a24',
    success: async (res) => {
      if (res.confirm) {
        try {
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
          
          // 延迟返回，让用户看到成功提示
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
          
        } catch (error) {
          uni.hideLoading()
          console.error('删除书籍失败:', error)
          uni.showToast({
            title: '删除失败',
            icon: 'error'
          })
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.book-detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.book-header {
  background: #fff;
  padding: 20px;
  display: flex;
  
  .book-cover {
    margin-right: 16px;
    flex-shrink: 0;
  }
  
  .book-info {
    flex: 1;
    
    .book-title {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    
    .book-author {
      display: block;
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .book-isbn {
      display: block;
      font-size: 12px;
      color: #999;
      margin-bottom: 12px;
    }
    
    .book-stats {
      display: flex;
      margin-bottom: 16px;
      
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-right: 24px;
        
        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #00a82d;
          margin-bottom: 2px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #999;
        }
      }
    }
    
    .book-actions {
      display: flex;
    }
  }
}

.progress-section,
.notes-section {
  background: #fff;
  margin-top: 12px;
  padding: 20px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .edit-text,
    .more-text {
      font-size: 14px;
      color: #00a82d;
    }
  }
}

.progress-content {
  .progress-text {
    display: block;
    font-size: 14px;
    color: #666;
    margin-top: 8px;
    text-align: center;
  }
}

.empty-notes {
  padding: 40px 0;
  text-align: center;
}

.notes-list {
  .note-item {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &:active {
      background: #e9ecef;
    }
    
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .note-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .note-date {
        font-size: 12px;
        color: #999;
        margin-left: 12px;
      }
    }
    
    .note-content {
      font-size: 13px;
      color: #666;
      line-height: 1.5;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
    
    .note-tags {
      display: flex;
      flex-wrap: wrap;
      
      .note-tag {
        font-size: 11px;
        color: #00a82d;
        background: rgba(0, 168, 45, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 6px;
        margin-bottom: 4px;
      }
    }
  }
}

.progress-edit-popup {
  padding: 24px;
  
  .popup-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    text-align: center;
    margin-bottom: 24px;
  }
  
  .progress-input {
    margin-bottom: 24px;
    
    .input-label {
      display: block;
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
      text-align: center;
    }
  }
  
  .popup-actions {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
