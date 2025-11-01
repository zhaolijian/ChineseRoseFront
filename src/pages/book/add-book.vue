<template>
  <view class="add-book-page">
    <!-- 导航栏：返回 + 标题 -->
    <view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-content">
        <view class="nav-left" @click="handleBack">
          <image class="back-icon" src="/static/icons/back-arrow.svg" mode="aspectFit" />
        </view>
        <view class="nav-title">自定义创建</view>
        <view class="nav-placeholder"></view>
      </view>
    </view>

    <!-- 表单内容 -->
    <view class="form-container" :style="{ paddingTop: containerPaddingTop + 'px', paddingBottom: '100px' }">
      <view class="form-row cover-row">
        <view class="label">书籍封面</view>
        <view class="cover-upload" @click="handleChooseImage">
          <BookCover
            :src="formData.coverUrl"
            :width="144"
            :ratio="3 / 4"
            :radius="16"
            :padding="12"
            :shadow="true"
            bg-color="#F5F7FA"
          >
            <view v-if="!formData.coverUrl" class="upload-placeholder">
              <image class="upload-icon" src="/static/icons/camera.svg" mode="aspectFit" />
            </view>
            <view v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
              <text>{{ uploadProgress }}%</text>
            </view>
          </BookCover>
        </view>
      </view>

      <view class="form-row">
        <view class="label">
          <text>书名</text>
          <text class="star">*</text>
        </view>
        <input
          class="input"
          v-model="formData.title"
          placeholder="轻点输入"
          placeholder-class="input-placeholder"
          maxlength="200"
          @input="handleTitleInput"
        />
      </view>
      <view v-if="errors.title" class="error-tip">{{ errors.title }}</view>

      <view class="form-row">
        <view class="label">作者</view>
        <input
          class="input"
          v-model="formData.author"
          placeholder="轻点输入"
          placeholder-class="input-placeholder"
          maxlength="200"
        />
      </view>

      <view class="form-row">
        <view class="label">出版社</view>
        <input
          class="input"
          v-model="formData.publisher"
          placeholder="轻点输入"
          placeholder-class="input-placeholder"
          maxlength="200"
        />
      </view>

      <view class="form-row">
        <view class="label">出版时间</view>
        <picker mode="date" :value="formData.publishDate" @change="handleDateChange" class="picker-wrapper">
          <view class="date-picker">
            <text :class="{ placeholder: !formData.publishDate }" style="text-align: right; width: 100%; display: block;">
              {{ formData.publishDate || '轻点选择' }}
            </text>
          </view>
        </picker>
      </view>

      <view class="form-row">
        <view class="label">页数</view>
        <input
          class="input"
          v-model.number="formData.pages"
          placeholder="轻点输入"
          placeholder-class="input-placeholder"
          type="digit"
          @input="handlePagesInput"
        />
      </view>
      <view v-if="errors.pages" class="error-tip">{{ errors.pages }}</view>
    </view>

    <!-- 底部固定按钮 -->
    <view class="footer-actions">
      <view class="submit-btn" @click="handleSubmit">
        完成
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
// 使用预签名直传封面
// @ts-ignore
import { presignAndUploadCover } from '@/utils/imageUpload'
// @ts-ignore
import { deleteTempObject } from '@/api/modules/storage'
// @ts-ignore
import { createBook } from '@/api/modules/book'
// @ts-ignore
import { useBookStore } from '@/stores/modules/book'
import BookCover from '@/components/book/BookCover.vue'

const statusBarHeight = ref(0)

interface FormState {
  title: string
  author: string
  publisher: string
  publishDate: string
  coverUrl: string
  pages: number | null
}

interface ErrorState {
  title: string
  pages: string
}

const formData = ref<FormState>({
  title: '',
  author: '',
  publisher: '',
  publishDate: '',
  coverUrl: '',
  pages: null
})
// 临时封面key（提交时传coverKey；预览使用coverUrl）
const coverKey = ref('')

const errors = ref<ErrorState>({
  title: '',
  pages: ''
})

const uploadProgress = ref(0)
const bookStore = useBookStore()

// 计算容器顶部padding，避免导航栏遮挡
const containerPaddingTop = computed(() => {
  const navbarTotalHeight = statusBarHeight.value + 49.718
  return navbarTotalHeight + 50 // 导航栏高度 + 间距
})

const updateSafeArea = () => {
  try {
    const info = uni.getSystemInfoSync?.()
    if (!info) return
    statusBarHeight.value = info.statusBarHeight || 0
  } catch (error) {
    statusBarHeight.value = 0
  }
}

onLoad(() => {
  updateSafeArea()
})

onMounted(() => {
  updateSafeArea()
})

const handleBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    // 如果是栈首页，切换到书架标签页
    uni.switchTab({ url: '/pages/bookshelf/index' })
  }
}

const handleChooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths?.[0]
      if (!tempFilePath) {
        return
      }
      try {
        uploadProgress.value = 1
        // 若已有旧临时key，先尝试回收（忽略失败）
        if (coverKey.value) {
          deleteTempObject(coverKey.value).catch(() => undefined)
        }
        // 预签名 + PUT直传
        const { key, previewUrl } = await presignAndUploadCover(tempFilePath)
        coverKey.value = key
        formData.value.coverUrl = previewUrl // 仅用于预览
        uploadProgress.value = 100
        uni.showToast({
          title: '封面上传成功',
          icon: 'success'
        })
      } catch (error: any) {
        uploadProgress.value = 0
        uni.showToast({
          title: error?.message || '上传失败',
          icon: 'none'
        })
      }
    }
  })
}

const handleDateChange = (e: any) => {
  formData.value.publishDate = e.detail.value
}

const handleTitleInput = () => {
  const value = formData.value.title.trim()
  if (!value) {
    errors.value.title = ''
    return
  }
  if (value.length > 200) {
    errors.value.title = '书名不能超过200字符'
    return
  }
  errors.value.title = ''
}

const handlePagesInput = (e: any) => {
  const inputValue = e.detail.value
  if (!inputValue || inputValue === '') {
    errors.value.pages = ''
    formData.value.pages = null
    return
  }
  const pages = Number(inputValue)
  if (!Number.isFinite(pages)) {
    errors.value.pages = '页数范围：1-50000'
    formData.value.pages = null
    return
  }
  if (pages < 1 || pages > 50000) {
    errors.value.pages = '页数范围：1-50000'
    return
  }
  errors.value.pages = ''
  formData.value.pages = Math.floor(pages)
}

const handleSubmit = async () => {
  // 1. 验证书名（必填）
  const title = formData.value.title.trim()
  if (!title || title.length === 0) {
    uni.showToast({
      title: '请输入书名',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 2. 验证书名长度
  if (title.length > 200) {
    uni.showToast({
      title: '书名不能超过200字符',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 3. 验证页数
  if (errors.value.pages) {
    uni.showToast({
      title: '页数范围：1-50000',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 4. 提交数据
  try {
    uni.showLoading({ title: '创建中...' })

    const requestData: Record<string, any> = {
      title: title,
      source: 'manual'
    }

    if (formData.value.author.trim()) {
      requestData.author = formData.value.author.trim()
    }
    if (formData.value.publisher.trim()) {
      requestData.publisher = formData.value.publisher.trim()
    }
    if (formData.value.publishDate) {
      // 后端要求RFC3339格式，使用东八区0点
      requestData.publishDate = `${formData.value.publishDate}T00:00:00+08:00`
    }
    // 预签名直传：提交coverKey；不再直接提交coverUrl
    if (coverKey.value) {
      requestData.coverKey = coverKey.value
    }
    if (formData.value.pages !== null && !errors.value.pages) {
      requestData.pages = formData.value.pages
    }

    await createBook(requestData)

    // 尝试刷新本地书籍列表（忽略错误）
    bookStore.fetchBooks(1).catch(() => undefined)

    uni.showToast({
      title: '添加成功',
      icon: 'success'
    })

    setTimeout(() => {
      uni.$emit('refreshBookList')
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.switchTab({ url: '/pages/bookshelf/index' })
      }
    }, 1200)
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '创建失败',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
$primary-green: #00a82d;
$text-primary: #333333;
$text-secondary: #666666;
$text-required: #dc2626;
$bg-navbar: rgba(255, 255, 255, 0.95);
$border-navbar: rgba(0, 168, 45, 0.12);

.add-book-page {
  min-height: 100vh;
  background: #fafafa;
}

.custom-navbar {
  background: $bg-navbar;
  border-bottom: 0.749px solid $border-navbar;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;

  .navbar-content {
    height: 49.718px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10.489px 16px 0.749px 16px;
  }

  .nav-left {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .back-icon {
      width: 20px;
      height: 20px;
    }
  }

  .nav-title {
    flex: 1;
    font-size: 15.75px;
    line-height: 24.5px;
    letter-spacing: -0.2922px;
    color: $text-primary;
    font-weight: 500;
    text-align: center;
  }

  .nav-placeholder {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }
}

.form-container {
  padding: 0 33px 0;
}

// 水平单行布局（标签+输入框）
.form-row {
  display: flex;
  align-items: center;
  gap: 13.989px; // 标签和输入框间距
  height: 31.49px; // 整行高度
  margin-bottom: 52.48px; // 行间距 ⚠️ 关键变更：从21px改为52.48px

  &:last-child {
    margin-bottom: 0;
  }

  // 标签固定宽度
  .label {
    width: 55.992px; // 固定宽度
    flex-shrink: 0; // 不收缩
    font-size: 14px;
    line-height: 21px;
    letter-spacing: -0.1504px;
    font-weight: 500;
    color: $text-primary;

    .star {
      color: $text-required;
      margin-left: 4px;
    }
  }

  // 输入框占据剩余空间并右对齐
  .input {
    flex: 1; // 占据剩余空间
    text-align: right; // ⭐ 右对齐
    background: transparent;
    border: none;
    border-radius: 6.75px;
    padding: 3.5px 10.5px;
    font-size: 14px;
    letter-spacing: -0.1504px;
    color: $text-primary;

    // 占位符也右对齐
    &::placeholder {
      text-align: right;
      color: $text-secondary;
      font-weight: 400;
    }
  }

  // uni-app 特定的占位符类
  .input-placeholder {
    text-align: right;
    color: $text-secondary;
    font-weight: 400;
  }

  // picker包装器
  .picker-wrapper {
    flex: 1;
  }

  // 日期选择器样式
  .date-picker {
    height: 31.49px;
    display: flex;
    align-items: center;
    justify-content: flex-end; // 容器右对齐
    padding: 3.5px 10.5px;

    // ✅ P2修复：text元素右对齐（已通过内联style强制）
    text {
      font-size: 14px;
      letter-spacing: -0.1504px;
      color: $text-primary;

      &.placeholder {
        color: $text-secondary;
        font-weight: 400;
      }
    }
  }
}

// 封面上传行特殊处理（与其他行保持一致的右对齐）
.cover-row {
  align-items: center;
  gap: 13.989px;
}

.cover-upload {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  position: relative;

  :deep(.cr-book-cover) {
    pointer-events: none;
  }

  .upload-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    .upload-icon {
      width: 56rpx;
      height: 56rpx;
    }
  }

  .upload-progress {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 28rpx;
    pointer-events: none;
  }
}

// 错误提示
.error-tip {
  margin-top: 8px;
  margin-left: 69.981px; // 标签宽度(55.992px) + 间距(13.989px)
  font-size: 12px;
  color: $text-required;
}

// 底部固定按钮
.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 33px;
  padding-bottom: calc(16px + constant(safe-area-inset-bottom));
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  z-index: 99;

  .submit-btn {
    width: 100%;
    height: 48px;
    background: $primary-green;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
    transition: opacity 0.2s;

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
