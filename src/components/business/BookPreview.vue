<template>
  <u-popup
    v-model="show"
    mode="center"
    width="90%"
    round="20"
    closeable
    :z-index="10075"
    :overlay="true"
    :close-on-click-overlay="true"
    @close="handleClose"
  >
    <view class="book-preview">
      <view class="preview-header">
        <text class="preview-title">书籍信息</text>
      </view>
      
      <view class="preview-content">
        <!-- 书籍封面 -->
        <view class="book-cover-section">
          <BookCover
            :src="book.coverUrl"
            :width="120"
            :ratio="3 / 4"
            :radius="16"
            :padding="12"
            :shadow="true"
            bg-color="#F5F7FA"
          />
        </view>
        
        <!-- 书籍信息 -->
        <view class="book-info-section">
          <view class="info-item">
            <text class="info-label">书名：</text>
            <text class="info-value">{{ book.title || '-' }}</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">作者：</text>
            <text class="info-value">{{ book.author || '-' }}</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">出版社：</text>
            <text class="info-value">{{ book.publisher || '-' }}</text>
          </view>
          
          <view class="info-item">
            <text class="info-label">ISBN：</text>
            <text class="info-value">{{ book.isbn || '-' }}</text>
          </view>
          
          <view class="info-item" v-if="book.publishDate">
            <text class="info-label">出版日期：</text>
            <text class="info-value">{{ book.publishDate }}</text>
          </view>
        </view>
        
        <!-- 简介 -->
        <view class="book-description" v-if="book.description">
          <text class="desc-label">简介：</text>
          <text class="desc-content">{{ book.description }}</text>
        </view>
      </view>
      
      <!-- 操作按钮 -->
      <view class="preview-actions">
        <u-button
          type="default"
          text="重新扫描"
          shape="circle"
          size="normal"
          @click="handleRescan"
        />
        <u-button
          type="primary"
          text="添加到书架"
          shape="circle"
          size="normal"
          :loading="loading"
          @click="handleAddToShelf"
        />
      </view>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { createBook } from '@/api/modules/book'
import { logger, createContext } from '@/utils'
import { ensureLoggedIn } from '@/utils/auth-guard'
import type { Book } from '@/api/modules/book'
import BookCover from '@/components/book/BookCover.vue'

// 扩展Book类型以包含description
interface BookWithDescription extends Book {
  description?: string
}

interface Props {
  modelValue: boolean
  book: BookWithDescription
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'rescan'): void
  (e: 'added', book: Book): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const show = ref(false)
const loading = ref(false)

// 监听外部状态变化
watch(() => props.modelValue, (val) => {
  show.value = val
})

// 监听内部状态变化
watch(show, (val) => {
  emit('update:modelValue', val)
})

// 方法
const handleClose = () => {
  const ctx = createContext()
  logger.debug(ctx, '[BookPreview] 关闭预览弹窗')
  show.value = false
}

const handleRescan = () => {
  const ctx = createContext()
  logger.debug(ctx, '[BookPreview] 触发重新扫描')
  show.value = false
  emit('rescan')
}

const handleAddToShelf = async () => {
  const ctx = createContext()

  // ADR-007 P0守卫：添加到书架需要登录
  const canProceed = await ensureLoggedIn('添加书籍')
  if (!canProceed) {
    show.value = false
    return
  }

  try {
    loading.value = true
    logger.info(ctx, '[BookPreview] 开始添加书籍到书架', { isbn: props.book.isbn })

    // 准备创建书籍的数据
    const createData = {
      title: props.book.title,
      author: props.book.author,
      isbn: props.book.isbn,
      publisher: props.book.publisher,
      publishDate: props.book.publishDate,
      coverUrl: props.book.coverUrl,
      source: 'isbn_api' as const
    }

    const newBook = await createBook(createData)
    
    logger.info(ctx, '[BookPreview] 书籍添加成功', { bookId: newBook.id })
    
    uni.showToast({
      title: '添加成功',
      icon: 'success'
    })
    
    show.value = false
    emit('added', newBook)
    
  } catch (error: any) {
    logger.error(ctx, '[BookPreview] 添加书籍失败', error)
    
    // 处理特定错误
    if (error.message?.includes('已存在')) {
      uni.showToast({
        title: '该书籍已在书架中',
        icon: 'none'
      })
    } else {
      uni.showToast({
        title: '添加失败',
        icon: 'error'
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.book-preview {
  padding: 20px;
  
  .preview-header {
    text-align: center;
    margin-bottom: 20px;
    
    .preview-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--cr-color-text-strong);
    }
  }
  
  .preview-content {
    .book-cover-section {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    
    .book-info-section {
      margin-bottom: 20px;
      
      .info-item {
        display: flex;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .info-label {
          flex-shrink: 0;
          width: 80px;
          font-size: 14px;
          color: var(--cr-color-text);
        }
        
        .info-value {
          flex: 1;
          font-size: 14px;
          color: var(--cr-color-text-strong);
        }
      }
    }
    
    .book-description {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;
      
      .desc-label {
        display: block;
        font-size: 14px;
        color: var(--cr-color-text);
        margin-bottom: 8px;
      }
      
      .desc-content {
        font-size: 14px;
        color: var(--cr-color-text);
        line-height: 1.6;
      }
    }
  }
  
  .preview-actions {
    display: flex;
    gap: 12px;
    margin-top: 30px;
    
    .u-button {
      flex: 1;
    }
  }
}
</style>
