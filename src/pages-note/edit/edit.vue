<template>
  <view class="note-edit-page cr-page-bg">
    <AppNavBar :title="isEditing ? '编辑笔记' : '笔记详情'" @back="handleBack">
      <template #right>
        <text v-if="isEditing" class="nav-action" :class="{ disabled: !canSave }" @click="saveNote">保存</text>
        <u-icon v-else name="edit-pen" size="20" class="cr-icon--active" @click="enterEditMode" />
      </template>
    </AppNavBar>

    <!-- 笔记内容 -->
    <PageContainer>
    <view class="note-content">
      <!-- 阅读模式 -->
      <view v-if="!isEditing" class="view-mode">
        <!-- 笔记头部信息 -->
        <view class="note-header cr-card cr-card--padded">
          <text class="note-title">{{ noteData.title }}</text>
          <view class="note-meta">
            <text v-if="noteData.bookTitle" class="book-title">《{{ noteData.bookTitle }}》</text>
            <text v-if="noteData.pageNumber" class="page-info">第{{ noteData.pageNumber }}页</text>
            <text v-if="noteData.chapterName" class="chapter-info">{{ noteData.chapterName }}</text>
          </view>
          <view class="note-info">
            <text class="note-type">{{ getNoteTypeText(noteData.noteType) }}</text>
            <text class="note-date">{{ formatDate(noteData.updatedAt) }}</text>
          </view>
        </view>

        <!-- 笔记内容 -->
        <view class="note-body cr-card cr-card--padded">
          <text class="note-text">{{ noteData.content }}</text>
        </view>

        <!-- 笔记图片 -->
        <view v-if="noteData.images && noteData.images.length > 0" class="note-images cr-card cr-card--padded">
          <view 
            v-for="(image, index) in noteData.images" 
            :key="index"
            class="image-item"
            @click="previewImage(index)"
          >
            <u-image
              :src="image"
              mode="aspectFill"
              width="100%"
              height="120px"
              radius="8"
            ></u-image>
          </view>
        </view>

        <!-- 笔记标签 -->
        <view v-if="noteData.tags && noteData.tags.length > 0" class="note-tags cr-card cr-card--padded">
          <text 
            v-for="tag in noteData.tags" 
            :key="tag"
            class="tag-item"
          >
            #{{ tag }}
          </text>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <PrimaryButton size="md" @click="enterEditMode">编辑</PrimaryButton>
          <view style="width: 12rpx;" />
          <u-button text="分享" @click="shareNote" />
          <view style="width: 12rpx;" />
          <u-button text="删除" type="error" @click="deleteNote" />
        </view>
      </view>

      <!-- 编辑模式 -->
      <view v-else class="edit-mode">
        <!-- 笔记标题 -->
        <view class="form-section cr-card cr-card--padded">
          <text class="section-label">标题</text>
          <view class="cr-input"><u-input v-model="editForm.title" placeholder="请输入笔记标题" :border="false" maxlength="100" /></view>
        </view>

        <!-- 笔记类型 -->
        <view class="form-section cr-card cr-card--padded">
          <text class="section-label">类型</text>
          <view class="note-types">
            <view 
              v-for="type in noteTypes" 
              :key="type.key"
              class="type-item"
              :class="{ active: editForm.noteType === type.key }"
              @click="editForm.noteType = type.key"
            >
              <u-icon :name="type.icon" size="16" :class="editForm.noteType === type.key ? 'cr-icon--active' : 'cr-icon'" />
              <text class="type-text">{{ type.label }}</text>
            </view>
          </view>
        </view>

        <!-- 位置信息 -->
        <view class="form-section cr-card cr-card--padded">
          <text class="section-label">位置</text>
          <view class="location-inputs">
            <view class="cr-input" style="flex:1;"><u-input v-model="editForm.pageNumber" placeholder="页码" type="number" :border="false" /></view>
            <view style="width:12rpx;" />
            <view class="cr-input" style="flex:1;"><u-input v-model="editForm.chapterName" placeholder="章节" :border="false" /></view>
          </view>
        </view>

        <!-- 笔记内容 -->
        <view class="form-section cr-card cr-card--padded">
          <text class="section-label">内容</text>
          <u-textarea v-model="editForm.content" placeholder="请输入笔记内容..." :border="false" auto-height maxlength="5000" show-word-limit />
        </view>

        <!-- 图片管理 -->
        <view class="form-section cr-card cr-card--padded">
          <text class="section-label">图片</text>
          <view class="image-section">
            <view class="image-list" v-if="editForm.images.length > 0">
              <view 
                v-for="(image, index) in editForm.images" 
                :key="index"
                class="image-item"
              >
                <u-image
                  :src="image"
                  width="80px"
                  height="80px"
                  radius="8"
                  mode="aspectFill"
                ></u-image>
                <view class="image-remove" @click="removeImage(index)">
                  <u-icon name="close" size="12" color="#fff"></u-icon>
                </view>
              </view>
            </view>
            
            <u-button text="添加图片" size="small" @click="chooseImage" style="margin-top: 12px;" />
          </view>
        </view>

        <!-- 标签管理 -->
        <view class="form-section cr-card cr-card--padded">
          <text class="section-label">标签</text>
          <view class="tag-section">
            <view class="current-tags" v-if="editForm.tags.length > 0">
              <view 
                v-for="(tag, index) in editForm.tags" 
                :key="index"
                class="tag-item"
              >
                <text class="tag-text">#{{ tag }}</text>
                <u-icon name="close" size="12" color="#999" @click="removeTag(index)"></u-icon>
              </view>
            </view>
            
            <view class="tag-input">
              <view class="cr-input" style="flex:1;margin-right:12rpx;">
                <u-input v-model="tagInput" placeholder="添加标签..." :border="false" @confirm="addTag" />
              </view>
              <u-button text="添加" size="small" type="primary" @click="addTag" :disabled="!tagInput.trim()" />
            </view>
          </view>
        </view>
      </view>
    </view>
    </PageContainer>

    <!-- 加载提示 -->
    <u-loading-page :loading="loading" bg-color="rgba(255,255,255,0.8)" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppNavBar from '@/components/common/AppNavBar.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'

// 类型定义
interface Note {
  id?: number
  title: string
  content: string
  bookId?: number
  bookTitle?: string
  noteType: string
  pageNumber?: string
  chapterName?: string
  tags: string[]
  images: string[]
  createdAt?: string
  updatedAt?: string
}

interface NoteType {
  key: string
  label: string
  icon: string
}

// 响应式数据
const noteData = reactive<Note>({
  title: '',
  content: '',
  noteType: 'reading',
  tags: [],
  images: []
})

const editForm = reactive<Note>({
  title: '',
  content: '',
  noteType: 'reading',
  pageNumber: '',
  chapterName: '',
  tags: [],
  images: []
})

const isEditing = ref(false)
const loading = ref(false)
const tagInput = ref('')
const noteId = ref<number>(0)

// 笔记类型
const noteTypes: NoteType[] = [
  { key: 'reading', label: '阅读', icon: 'book' },
  { key: 'thought', label: '思考', icon: 'heart' },
  { key: 'quote', label: '摘录', icon: 'quote-left' },
  { key: 'summary', label: '总结', icon: 'list' }
]

// 计算属性
const canSave = computed(() => {
  return editForm.title.trim() && editForm.content.trim()
})

// 样式对象已移除，改用 cr-input 与令牌（见 src/uni.scss）

// 生命周期
onLoad((options: any) => {
  if (options.id) {
    noteId.value = parseInt(options.id)
  }
})

onMounted(async () => {
  if (noteId.value) {
    await loadNoteDetail()
  }
})

// 方法
const loadNoteDetail = async () => {
  try {
    loading.value = true
    
    // TODO: 实现获取笔记详情的API
    // const note = await noteStore.fetchNoteDetail(noteId.value)
    
    // 临时模拟数据
    const mockNote: Note = {
      id: noteId.value,
      title: '示例笔记标题',
      content: '这是一条示例笔记内容，展示笔记的详细信息和编辑功能。',
      bookTitle: '示例书籍',
      noteType: 'reading',
      pageNumber: '123',
      chapterName: '第一章',
      tags: ['重要', '学习'],
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    Object.assign(noteData, mockNote)
  } catch (error) {
    console.error('加载笔记详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const enterEditMode = () => {
  // 将当前数据复制到编辑表单
  Object.assign(editForm, {
    ...noteData,
    pageNumber: noteData.pageNumber?.toString() || '',
    chapterName: noteData.chapterName || ''
  })
  
  isEditing.value = true
}

const saveNote = async () => {
  if (!canSave.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'error'
    })
    return
  }

  try {
    loading.value = true
    
    // TODO: 实现更新笔记的API
    // const updateData = {
    //   ...editForm,
    //   pageNumber: editForm.pageNumber ? parseInt(editForm.pageNumber) : undefined
    // }
    // const updatedNote = await noteStore.updateNote(noteId.value, updateData)
    
    // 更新显示数据
    Object.assign(noteData, editForm)
    
    isEditing.value = false
    
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('保存笔记失败:', error)
    uni.showToast({
      title: '保存失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const deleteNote = () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定要删除这条笔记吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          loading.value = true
          
          // TODO: 实现删除笔记的API
          // await noteStore.deleteNote(noteId.value)
          
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } catch (error) {
          console.error('删除笔记失败:', error)
          uni.showToast({
            title: '删除失败',
            icon: 'error'
          })
        } finally {
          loading.value = false
        }
      }
    }
  })
}

const shareNote = () => {
  // TODO: 实现笔记分享功能
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !editForm.tags.includes(tag) && editForm.tags.length < 5) {
    editForm.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  editForm.tags.splice(index, 1)
}

const chooseImage = () => {
  uni.chooseImage({
    count: 9 - editForm.images.length,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      editForm.images.push(...res.tempFilePaths)
    }
  })
}

const removeImage = (index: number) => {
  editForm.images.splice(index, 1)
}

const previewImage = (index: number) => {
  uni.previewImage({
    urls: noteData.images,
    current: index
  })
}

const handleBack = () => {
  if (isEditing.value) {
    uni.showModal({
      title: '确认退出',
      content: '当前有未保存的更改，确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          isEditing.value = false
        }
      }
    })
  } else {
    uni.navigateBack()
  }
}

const getNoteTypeText = (noteType?: string): string => {
  const typeMap: Record<string, string> = {
    reading: '阅读笔记',
    thought: '思考感悟', 
    quote: '摘录',
    summary: '总结'
  }
  return typeMap[noteType || ''] || '笔记'
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style lang="scss" scoped>
.note-edit-page { min-height: 100vh; background-color: var(--cr-color-bg); }
.nav-action { color: var(--cr-color-primary-600); font-size: 28rpx; }
.nav-action.disabled { color: var(--cr-color-subtext); }

.note-content { padding: 16px; }

.view-mode {
  .note-header {
    background: var(--cr-color-surface);
    border-radius: var(--cr-radius-card);
    padding: 20px;
    margin-bottom: 16px;
    
    .note-title {
      display: block;
      font-size: 20px;
      font-weight: 600;
      color: var(--cr-color-text-strong);
      line-height: 1.4;
      margin-bottom: 12px;
    }
    
    .note-meta {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 12px;
      
      .book-title,
      .page-info,
      .chapter-info {
        font-size: 12px;
        background: var(--cr-color-primary-50);
        color: var(--cr-color-primary-600);
        padding: 4px 8px;
        border-radius: 12px;
        margin-right: 8px;
        margin-bottom: 4px;
      }
    }
    
    .note-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .note-type {
        font-size: 12px;
        color: var(--cr-color-primary-600);
        background: var(--cr-color-primary-50);
        padding: 4px 8px;
        border-radius: 12px;
      }
      
      .note-date {
        font-size: 12px;
        color: var(--cr-color-subtext);
      }
    }
  }
  
  .note-body {
    background: var(--cr-color-surface);
    border-radius: var(--cr-radius-card);
    padding: 20px;
    margin-bottom: 16px;
    
    .note-text {
      font-size: 16px;
      color: var(--cr-color-text);
      line-height: 1.6;
    }
  }
  
  .note-images {
    background: var(--cr-color-surface);
    border-radius: var(--cr-radius-card);
    padding: 16px;
    margin-bottom: 16px;
    
    .image-item {
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  .note-tags {
    background: var(--cr-color-surface);
    border-radius: var(--cr-radius-card);
    padding: 16px;
    margin-bottom: 16px;
    
    .tag-item {
      display: inline-block;
      font-size: 12px;
      color: var(--cr-color-primary-600);
      background: var(--cr-color-primary-50);
      padding: 6px 12px;
      border-radius: 16px;
      margin-right: 8px;
      margin-bottom: 8px;
    }
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}

.edit-mode {
  .form-section {
    background: var(--cr-color-surface);
    border-radius: var(--cr-radius-card);
    padding: 16px;
    margin-bottom: 16px;
    
    .section-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--cr-color-text-strong);
      margin-bottom: 12px;
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
  }
  
  .image-section {
    .image-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
      
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
  }
  
  .tag-section {
    .current-tags {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 12px;
      
      .tag-item {
        display: flex;
        align-items: center;
        background: rgba(0, 168, 45, 0.1);
        color: #00a82d;
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
