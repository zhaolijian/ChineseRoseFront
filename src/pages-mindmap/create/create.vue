<template>
  <view class="create-mindmap-page">
    <AppNavBar title="创建思维导图" :showBack="true">
      <template #right>
        <u-button 
          text="保存" 
          size="mini" 
          type="primary"
          :loading="saving"
          @click="saveMindmap"
        ></u-button>
      </template>
    </AppNavBar>

    <PageContainer>
    <view class="create-content">
      <!-- 基本信息表单 -->
      <view class="form-section">
        <u-form ref="formRef" :model="formData" :rules="rules">
          <u-form-item label="思维导图标题" prop="title" required>
            <u-input 
              v-model="formData.title" 
              placeholder="请输入思维导图标题"
              :border="false"
              class="cr-input"
            />
          </u-form-item>
          
          <u-form-item label="选择书籍" prop="bookId" required>
            <u-button 
              :text="selectedBook ? selectedBook.title : '请选择书籍'" 
              size="large"
              :type="selectedBook ? 'info' : 'default'"
              :plain="true"
              @click="showBookPicker = true"
            />
          </u-form-item>
          
          <u-form-item label="备注" prop="description">
            <u-textarea 
              v-model="formData.description" 
              placeholder="请输入备注信息（可选）"
              height="80"
              :border="false"
              class="cr-input"
            />
          </u-form-item>
        </u-form>
      </view>

      <!-- 创建方式选择 -->
      <view class="method-section">
        <text class="section-title">创建方式</text>
        <view class="method-grid">
          <view 
            class="method-item" 
            :class="{ active: selectedMethod === 'blank' }"
            @click="selectMethod('blank')"
          >
            <u-icon name="file" size="32" :color="selectedMethod === 'blank' ? '#059669' : '#666'"></u-icon>
            <text class="method-text">空白思维导图</text>
            <text class="method-desc">从头开始创建</text>
          </view>
          
          <view 
            class="method-item"
            :class="{ active: selectedMethod === 'notes' }"
            @click="selectMethod('notes')"
          >
            <u-icon name="list" size="32" :color="selectedMethod === 'notes' ? '#059669' : '#666'"></u-icon>
            <text class="method-text">基于笔记生成</text>
            <text class="method-desc">AI智能生成</text>
          </view>
        </view>
      </view>

      <!-- 笔记选择（当选择基于笔记生成时显示） -->
      <view v-if="selectedMethod === 'notes'" class="notes-section">
        <text class="section-title">选择笔记</text>
        <view class="notes-list">
          <view v-if="availableNotes.length === 0" class="empty-notes">
            <EmptyState 
              icon="list" 
              title="该书籍暂无笔记" 
              actionText="去添加笔记"
              @action="goToAddNote"
            />
          </view>
          <view v-else>
            <view 
              v-for="note in availableNotes"
              :key="note.id"
              class="note-item cr-card"
              :class="{ selected: selectedNotes.includes(note.id) }"
              @click="toggleNote(note.id)"
            >
              <view class="note-checkbox">
                <u-icon 
                  :name="selectedNotes.includes(note.id) ? 'checkbox-mark' : 'checkbox'"
                  size="20"
                  :color="selectedNotes.includes(note.id) ? '#059669' : '#ccc'"
                />
              </view>
              <view class="note-content">
                <text class="note-title">{{ note.title || '无标题' }}</text>
                <text class="note-preview">{{ note.content }}</text>
                <text class="note-date">{{ formatDate(note.createdAt) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    </PageContainer>

    <!-- 书籍选择弹窗 -->
    <u-popup 
      v-model="showBookPicker"
      mode="bottom"
      height="60%"
      round="20"
      closeable
    >
      <view class="book-picker">
        <view class="picker-header">
          <text class="picker-title">选择书籍</text>
        </view>
        <scroll-view 
          scroll-y 
          class="book-list"
          style="max-height: 400px;"
        >
          <view v-if="books.length === 0" class="empty-books">
            <EmptyState 
              icon="book" 
              title="暂无书籍" 
              actionText="去添加书籍"
              @action="goToAddBook"
            />
          </view>
          <view v-else>
            <view 
              v-for="book in books"
              :key="book.id"
              class="book-option"
              @click="selectBook(book)"
            >
              <text class="book-title">{{ book.title }}</text>
              <text class="book-author">{{ book.author || '未知作者' }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </u-popup>

    <!-- 加载提示 -->
    <u-loading-page :loading="loading" bg-color="#f5f7fa" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useBookStore } from '@/stores/modules/book'
import { useNoteStore } from '@/stores/modules/note'
import { useMindmapStore } from '@/stores/modules/mindmap'
import AppNavBar from '@/components/common/AppNavBar.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// 类型定义
interface Book {
  id: number
  title: string
  author?: string
}

interface Note {
  id: number
  title?: string
  content: string
  bookId: number
  createdAt: string
}

interface FormData {
  title: string
  bookId: number | null
  description: string
}

// Store
const bookStore = useBookStore()
const noteStore = useNoteStore()
const mindmapStore = useMindmapStore()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const showBookPicker = ref(false)
const selectedMethod = ref<'blank' | 'notes'>('blank')
const books = ref<Book[]>([])
const availableNotes = ref<Note[]>([])
const selectedNotes = ref<number[]>([])
const selectedBook = ref<Book | null>(null)

// 表单数据
const formData = reactive<FormData>({
  title: '',
  bookId: null,
  description: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入思维导图标题', trigger: 'blur' }
  ],
  bookId: [
    { required: true, message: '请选择书籍', trigger: 'change' }
  ]
}

// 计算属性
const canSave = computed(() => {
  if (selectedMethod.value === 'blank') {
    return formData.title.trim() && formData.bookId
  } else {
    return formData.title.trim() && formData.bookId && selectedNotes.value.length > 0
  }
})

// 生命周期
onMounted(async () => {
  await loadData()
})

// 方法
const loadData = async () => {
  try {
    loading.value = true
    
    // 加载书籍列表
    const result = await bookStore.fetchBooks(1)
    books.value = result.books || []
  } catch (error) {
    console.error('加载数据失败:', error)
    uni.showToast({
      title: '加载数据失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const selectMethod = (method: 'blank' | 'notes') => {
  selectedMethod.value = method
  if (method === 'notes' && formData.bookId) {
    loadNotes()
  }
}

const selectBook = async (book: Book) => {
  selectedBook.value = book
  formData.bookId = book.id
  showBookPicker.value = false
  
  // 如果选择了基于笔记生成，则加载该书籍的笔记
  if (selectedMethod.value === 'notes') {
    await loadNotes()
  }
}

const loadNotes = async () => {
  if (!formData.bookId) return
  
  try {
    // TODO: 实现加载指定书籍的笔记
    // const notes = await noteStore.fetchNotesByBookId(formData.bookId)
    
    // 模拟数据
    availableNotes.value = [
      {
        id: 1,
        title: '第一章重点',
        content: '这是第一章的重点内容摘录...',
        bookId: formData.bookId,
        createdAt: '2024-01-15T10:30:00Z'
      }
    ]
  } catch (error) {
    console.error('加载笔记失败:', error)
  }
}

const toggleNote = (noteId: number) => {
  const index = selectedNotes.value.indexOf(noteId)
  if (index > -1) {
    selectedNotes.value.splice(index, 1)
  } else {
    selectedNotes.value.push(noteId)
  }
}

const saveMindmap = async () => {
  if (!canSave.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'error'
    })
    return
  }
  
  try {
    saving.value = true
    
    const mindmapData = {
      title: formData.title.trim(),
      bookId: formData.bookId!,
      description: formData.description.trim() || undefined,
      type: selectedMethod.value,
      ...(selectedMethod.value === 'notes' && {
        sourceNoteIds: selectedNotes.value
      })
    }
    
    // TODO: 实现创建思维导图
    // const result = await mindmapStore.createMindmap(mindmapData)
    
    uni.showToast({
      title: '创建成功',
      icon: 'success'
    })
    
    setTimeout(() => {
      // 返回到思维导图列表页面
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('创建思维导图失败:', error)
    uni.showToast({
      title: '创建失败',
      icon: 'error'
    })
  } finally {
    saving.value = false
  }
}

const goToAddNote = () => {
  if (!formData.bookId) {
    uni.showToast({
      title: '请先选择书籍',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages-note/add/add?bookId=${formData.bookId}`
  })
}

const goToAddBook = () => {
  showBookPicker.value = false
  uni.navigateTo({
    url: '/pages/index/index'
  })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { 
    month: 'numeric', 
    day: 'numeric' 
  })
}
</script>

<style lang="scss" scoped>
.create-mindmap-page {
  min-height: 100vh;
  background-color: var(--cr-color-bg);
}

.create-content {
  padding: 16px;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--cr-color-text-strong);
  margin-bottom: 12px;
}

.method-section {
  margin-bottom: 24px;
  
  .method-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .method-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 16px;
    background: var(--cr-color-surface);
    border-radius: var(--cr-radius-base);
    border: 2px solid transparent;
    transition: all 0.2s;
    
    &.active {
      border-color: var(--cr-color-primary-600);
      background: var(--cr-color-primary-50);
    }
    
    .method-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--cr-color-text-strong);
      margin: 8px 0 4px;
    }
    
    .method-desc {
      font-size: 12px;
      color: var(--cr-color-subtext);
      text-align: center;
    }
  }
}

.notes-section {
  .notes-list {
    .empty-notes {
      padding: 40px 20px;
      text-align: center;
    }
    
    .note-item {
      display: flex;
      align-items: flex-start;
      padding: 12px;
      margin-bottom: 8px;
      border: 2px solid transparent;
      transition: all 0.2s;
      
      &.selected {
        border-color: var(--cr-color-primary-600);
        background: var(--cr-color-primary-50);
      }
      
      .note-checkbox {
        margin-right: 12px;
        padding-top: 2px;
      }
      
      .note-content {
        flex: 1;
        
        .note-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--cr-color-text-strong);
          margin-bottom: 4px;
        }
        
        .note-preview {
          display: block;
          font-size: 12px;
          color: var(--cr-color-text);
          line-height: 1.4;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .note-date {
          display: block;
          font-size: 11px;
          color: var(--cr-color-subtext);
        }
      }
    }
  }
}

.book-picker {
  padding: 20px;
  
  .picker-header {
    text-align: center;
    margin-bottom: 20px;
    
    .picker-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--cr-color-text-strong);
    }
  }
  
  .book-list {
    .empty-books {
      padding: 40px 20px;
      text-align: center;
    }
    
    .book-option {
      padding: 16px 0;
      border-bottom: 1px solid var(--cr-color-divider);
      
      &:last-child {
        border-bottom: none;
      }
      
      .book-title {
        display: block;
        font-size: 16px;
        font-weight: 600;
        color: var(--cr-color-text-strong);
        margin-bottom: 4px;
      }
      
      .book-author {
        display: block;
        font-size: 14px;
        color: var(--cr-color-text);
      }
    }
  }
}
</style>