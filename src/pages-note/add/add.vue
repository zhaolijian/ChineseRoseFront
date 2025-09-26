<template>
  <view class="note-add-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @click="handleBack">
          <u-icon name="arrow-left" size="20" color="#333"></u-icon>
          <text class="back-text">取消</text>
        </view>
        <text class="navbar-title">添加笔记</text>
        <view class="navbar-right" @click="saveNote">
          <text class="save-text" :class="{ disabled: !canSave }">保存</text>
        </view>
      </view>
    </view>

    <!-- 表单内容 -->
    <view class="form-content">
      <!-- 书籍选择 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">关联书籍</text>
          <text v-if="!selectedBook" class="required-mark">*</text>
        </view>
        
        <view class="book-selector" @click="showBookPicker = true">
          <view v-if="selectedBook" class="selected-book">
            <u-image
              :src="selectedBook.coverUrl || '/static/images/book-placeholder.png'"
              width="40px"
              height="54px"
              radius="4"
              mode="aspectFit"
            ></u-image>
            <view class="book-info">
              <text class="book-title">{{ selectedBook.title }}</text>
              <text class="book-author">{{ selectedBook.author }}</text>
            </view>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
          <view v-else class="placeholder">
            <u-icon name="book" size="20" color="#999"></u-icon>
            <text class="placeholder-text">选择书籍</text>
            <u-icon name="arrow-right" size="16" color="#999"></u-icon>
          </view>
        </view>
      </view>

      <!-- 笔记标题 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">笔记标题</text>
          <text class="required-mark">*</text>
        </view>
        
        <u-input
          v-model="noteForm.title"
          placeholder="请输入笔记标题"
          :border="false"
          :custom-style="inputStyle"
          maxlength="100"
          show-word-limit
        ></u-input>
      </view>

      <!-- 笔记类型 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">笔记类型</text>
        </view>
        
        <view class="note-types">
          <view 
            v-for="type in noteTypes" 
            :key="type.key"
            class="type-item"
            :class="{ active: noteForm.noteType === type.key }"
            @click="noteForm.noteType = type.key"
          >
            <u-icon :name="type.icon" size="18" :color="noteForm.noteType === type.key ? '#00a82d' : '#999'"></u-icon>
            <text class="type-text">{{ type.label }}</text>
          </view>
        </view>
      </view>

      <!-- 页码和章节 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">位置信息</text>
        </view>
        
        <view class="location-inputs">
          <view class="input-item">
            <text class="input-label">页码</text>
            <u-input
              v-model="noteForm.pageNumber"
              placeholder="页码"
              type="number"
              :border="false"
              :custom-style="smallInputStyle"
            ></u-input>
          </view>
          
          <view class="input-item">
            <text class="input-label">章节</text>
            <u-input
              v-model="noteForm.chapterName"
              placeholder="章节名称"
              :border="false"
              :custom-style="smallInputStyle"
            ></u-input>
          </view>
        </view>
      </view>

      <!-- 笔记内容 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">笔记内容</text>
          <text class="required-mark">*</text>
        </view>
        
        <u-textarea
          v-model="noteForm.content"
          placeholder="请输入笔记内容..."
          :border="false"
          :custom-style="textareaStyle"
          auto-height
          maxlength="5000"
          show-word-limit
        ></u-textarea>
      </view>

      <!-- 标签 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">标签</text>
        </view>
        
        <view class="tag-section">
          <view class="current-tags" v-if="noteForm.tags.length > 0">
            <view 
              v-for="(tag, index) in noteForm.tags" 
              :key="index"
              class="tag-item"
            >
              <text class="tag-text">#{{ tag }}</text>
              <u-icon name="close" size="12" color="#999" @click="removeTag(index)"></u-icon>
            </view>
          </view>
          
          <view class="tag-input">
            <u-input
              v-model="tagInput"
              placeholder="添加标签..."
              :border="false"
              :custom-style="tagInputStyle"
              @confirm="addTag"
            ></u-input>
            <u-button 
              text="添加" 
              size="small"
              type="primary"
              @click="addTag"
              :disabled="!tagInput.trim()"
            ></u-button>
          </view>
        </view>
      </view>

      <!-- 图片 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">图片</text>
        </view>
        
        <view class="image-section">
          <view class="image-list" v-if="noteForm.images.length > 0">
            <view 
              v-for="(image, index) in noteForm.images" 
              :key="index"
              class="image-item"
            >
              <u-image
                :src="image"
                width="80px"
                height="80px"
                radius="8"
                mode="aspectFill"
                @click="previewImage(index)"
              ></u-image>
              <view class="image-remove" @click="removeImage(index)">
                <u-icon name="close" size="12" color="#fff"></u-icon>
              </view>
            </view>
          </view>
          
          <view class="image-actions">
            <view class="action-button" @click="chooseImage">
              <u-icon name="camera" size="20" color="#00a82d"></u-icon>
              <text class="action-text">添加图片</text>
            </view>
            <view class="action-button" @click="startOCR">
              <u-icon name="scan" size="20" color="#00a82d"></u-icon>
              <text class="action-text">OCR识别</text>
            </view>
            <view class="action-button" @click="startRecord">
              <u-icon name="mic" size="20" color="#00a82d"></u-icon>
              <text class="action-text">语音记录</text>
            </view>
          </view>
        </view>
      </view>
    </view>

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
        
        <view class="book-list">
          <view 
            v-for="book in books" 
            :key="book.id"
            class="book-item"
            @click="selectBook(book)"
          >
            <u-image
              :src="book.coverUrl || '/static/images/book-placeholder.png'"
              width="40px"
              height="54px"
              radius="4"
              mode="aspectFit"
            ></u-image>
            <view class="book-info">
              <text class="book-title">{{ book.title }}</text>
              <text class="book-author">{{ book.author }}</text>
            </view>
            <u-icon 
              v-if="selectedBook?.id === book.id"
              name="checkmark" 
              size="16" 
              color="#00a82d"
            ></u-icon>
          </view>
        </view>
      </view>
    </u-popup>

    <!-- 加载提示 -->
    <u-loading-page 
      :loading="loading"
      bg-color="rgba(255,255,255,0.8)"
    ></u-loading-page>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '@/stores/modules/book'
import { useNoteStore } from '@/stores/modules/note'
import { logger, createContext } from '@/utils'

// 类型定义
interface Book {
  id: number
  title: string
  author?: string
  coverUrl?: string
}

interface NoteForm {
  title: string
  content: string
  bookId?: number
  noteType: string
  pageNumber: string
  chapterName: string
  tags: string[]
  images: string[]
}

interface NoteType {
  key: string
  label: string
  icon: string
}

// Store
const bookStore = useBookStore()
const noteStore = useNoteStore()

// 响应式数据
const noteForm = reactive<NoteForm>({
  title: '',
  content: '',
  bookId: undefined,
  noteType: 'reading',
  pageNumber: '',
  chapterName: '',
  tags: [],
  images: []
})

const books = ref<Book[]>([])
const selectedBook = ref<Book | null>(null)
const tagInput = ref('')
const loading = ref(false)
const showBookPicker = ref(false)

// 笔记类型
const noteTypes: NoteType[] = [
  { key: 'reading', label: '阅读笔记', icon: 'book' },
  { key: 'thought', label: '思考感悟', icon: 'heart' },
  { key: 'quote', label: '摘录', icon: 'quote-left' },
  { key: 'summary', label: '总结', icon: 'list' }
]

// 计算属性
const canSave = computed(() => {
  return noteForm.title.trim() && 
         noteForm.content.trim() && 
         selectedBook.value
})

// 样式
// 样式对象已移除：统一使用 cr-input 与令牌（见 src/uni.scss）

// 生命周期
onLoad((options: any) => {
  if (options.bookId) {
    const bookId = parseInt(options.bookId)
    noteForm.bookId = bookId
    // 从书籍列表中找到对应的书籍
    loadInitialBook(bookId)
  }

  // 处理OCR传递的文本内容
  if (options.ocrText) {
    try {
      const ocrText = decodeURIComponent(options.ocrText)
      noteForm.content = ocrText

      // 自动生成笔记标题（取前20个字符）
      if (!noteForm.title.trim() && ocrText.length > 0) {
        const autoTitle = ocrText.trim().substring(0, 20).replace(/\n/g, ' ')
        noteForm.title = autoTitle + (ocrText.length > 20 ? '...' : '')
      }

      // 显示提示
      uni.showToast({
        title: 'OCR内容已导入',
        icon: 'success'
      })
    } catch (error) {
      console.error('解析OCR文本失败:', error)
      uni.showToast({
        title: 'OCR内容导入失败',
        icon: 'none'
      })
    }
  }
})

onMounted(async () => {
  await loadBooks()
})

// 方法
const loadBooks = async () => {
  try {
    const result = await bookStore.fetchBooks(1, { pageSize: 100 })
    books.value = result.books
    
    // 如果有预设的bookId，设置选中的书籍
    if (noteForm.bookId) {
      const book = books.value.find(b => b.id === noteForm.bookId)
      if (book) {
        selectedBook.value = book
      }
    }
  } catch (error) {
    console.error('加载书籍列表失败:', error)
  }
}

const loadInitialBook = async (bookId: number) => {
  try {
    const book = await bookStore.fetchBookDetail(bookId)
    selectedBook.value = book
  } catch (error) {
    console.error('加载书籍详情失败:', error)
  }
}

const selectBook = (book: Book) => {
  selectedBook.value = book
  noteForm.bookId = book.id
  showBookPicker.value = false
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !noteForm.tags.includes(tag) && noteForm.tags.length < 5) {
    noteForm.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  noteForm.tags.splice(index, 1)
}

const chooseImage = () => {
  uni.chooseImage({
    count: 9 - noteForm.images.length,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      noteForm.images.push(...res.tempFilePaths)
    }
  })
}

const removeImage = (index: number) => {
  noteForm.images.splice(index, 1)
}

const previewImage = (index: number) => {
  uni.previewImage({
    urls: noteForm.images,
    current: index
  })
}

const startOCR = () => {
  // 跳转到OCR识别页面
  uni.navigateTo({
    url: '/pages-note/ocr/ocr'
  })
}

const startRecord = () => {
  // TODO: 实现语音记录功能
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const saveNote = async () => {
  const ctx = createContext()

  if (!canSave.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'error'
    })
    return
  }

  try {
    loading.value = true

    // 构建笔记数据
    const noteData = {
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
      bookId: noteForm.bookId,
      pageNumber: noteForm.pageNumber ? parseInt(noteForm.pageNumber) : undefined,
      chapter: noteForm.chapterName.trim() || undefined
    }

    logger.info(ctx, '[NoteAdd] 开始保存笔记', {
      title: noteData.title,
      bookId: noteData.bookId,
      contentLength: noteData.content.length
    })

    // 调用store创建笔记
    await noteStore.createNote(noteData)

    logger.info(ctx, '[NoteAdd] 笔记保存成功')

    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    logger.error(ctx, '[NoteAdd] 保存笔记失败', error)
    uni.showToast({
      title: '保存失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  if (noteForm.title.trim() || noteForm.content.trim()) {
    uni.showModal({
      title: '确认退出',
      content: '当前有未保存的内容，确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack()
        }
      }
    })
  } else {
    uni.navigateBack()
  }
}
</script>

<style lang="scss" scoped>
.note-add-page { min-height: 100vh; background-color: var(--cr-color-bg); }
.nav-action { color: var(--cr-color-primary-600); font-size: 28rpx; }
.nav-action.disabled { color: var(--cr-color-subtext); }

.form-content { padding: 16px; }

.form-section {
  background: var(--cr-color-surface);
  border-radius: var(--cr-radius-card);
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--cr-shadow-sm);
  
  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--cr-color-text-strong);
    }
    
    .required-mark {
      color: var(--cr-color-error);
      margin-left: 4px;
    }
  }
}

.book-selector {
  .selected-book,
  .placeholder {
    display: flex;
    align-items: center;
    padding: 12px;
    background: var(--cr-color-bg);
    border-radius: 8px;
    
    .book-info {
      flex: 1;
      margin-left: 12px;
      
      .book-title {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: var(--cr-color-text-strong);
        margin-bottom: 4px;
      }
      
      .book-author {
        font-size: 12px;
        color: var(--cr-color-text);
      }
    }
    
    .placeholder-text {
      flex: 1;
      margin-left: 12px;
      font-size: 14px;
      color: var(--cr-color-subtext);
    }
  }
}

.note-types {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  
  .type-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: var(--cr-color-bg);
    border-radius: 20px;
    border: 1px solid transparent;
    
    &.active {
      background: var(--cr-color-primary-50);
      border-color: var(--cr-color-primary-600);
    }
    
    .type-text {
      font-size: 14px;
      color: var(--cr-color-text);
      margin-left: 6px;
    }
  }
}

.location-inputs {
  display: flex;
  gap: 12px;
  
  .input-item {
    flex: 1;
    
    .input-label {
      display: block;
      font-size: 12px;
      color: var(--cr-color-subtext);
      margin-bottom: 6px;
    }
  }
}

.tag-section {
  .current-tags {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 12px;
    
    .tag-item {
      display: flex;
      align-items: center;
      background: var(--cr-color-primary-50);
      color: var(--cr-color-primary-600);
      padding: 4px 8px;
      border-radius: 12px;
      margin-right: 8px;
      margin-bottom: 8px;
      
      .tag-text {
        font-size: 12px;
        margin-right: 4px;
      }
    }
  }
  
  .tag-input {
    display: flex;
    align-items: center;
  }
}

.image-section {
  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    
    .image-item {
      position: relative;
      
      .image-remove {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 20px;
        height: 20px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
  
  .image-actions {
    display: flex;
    gap: 16px;
    
    .action-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
    background: var(--cr-color-bg);
      border-radius: 8px;
      flex: 1;
      
      .action-text {
        font-size: 12px;
        color: var(--cr-color-text);
        margin-top: 4px;
      }
    }
  }
}

.book-picker {
  padding: 20px;
  max-height: 100%;
  
  .picker-header {
    text-align: center;
    margin-bottom: 20px;
    
    .picker-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .book-list {
    max-height: 400px;
    overflow-y: auto;
    
    .book-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .book-info {
        flex: 1;
        margin-left: 12px;
        
        .book-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        
        .book-author {
          font-size: 12px;
          color: #666;
        }
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
