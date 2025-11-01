<template>
  <view class="add-book-page">
    <!-- 自定义导航栏 -->
    <AppNavBar :title="pageTitle" />
    
    <!-- 表单容器 -->
    <view class="form-container">
      <!-- ISBN扫码区域 -->
      <IsbnScanner
        v-if="!isEditMode"
        v-model="scannedISBN"
        @bookFound="handleBookFound"
        @scanComplete="handleScanComplete"
      />

      <u-form ref="formRef" :model="formData" :rules="rules" label-position="left" label-width="160rpx">
        <!-- 书籍封面 -->
        <view class="cover-section">
          <text class="section-title">书籍封面</text>
          <view class="cover-upload" @click="chooseCover">
            <BookCover
              :src="formData.cover"
              :width="200"
              :ratio="3 / 4"
              :radius="16"
              :padding="12"
              :shadow="true"
              bg-color="#F5F7FA"
            >
              <view v-if="!formData.cover" class="upload-placeholder">
                <u-icon name="photo" size="40" color="#999"></u-icon>
                <text class="upload-tips">点击上传封面</text>
              </view>
            </BookCover>
          </view>
        </view>

        <!-- 基本信息 -->
        <view class="form-section">
          <u-form-item label="书名" prop="title" required borderBottom>
            <u-input
              v-model="formData.title"
              placeholder="请输入书名"
              clearable
            />
          </u-form-item>

          <u-form-item label="作者" prop="author" borderBottom>
            <u-input
              v-model="formData.author"
              placeholder="请输入作者名称（选填）"
              clearable
            />
          </u-form-item>

          <u-form-item label="出版社" prop="publisher" borderBottom>
            <u-input
              v-model="formData.publisher"
              placeholder="请输入出版社名称（选填）"
              clearable
            />
          </u-form-item>


          <u-form-item label="页数" prop="pages" borderBottom>
            <u-input
              v-model="formData.pages"
              type="number"
              placeholder="请输入页数（选填）"
              clearable
            />
          </u-form-item>

          <u-form-item label="出版年份" prop="publishYear" borderBottom>
            <u-input
              v-model="formData.publishYear"
              type="number"
              placeholder="请输入出版年份（选填）"
              clearable
            />
          </u-form-item>


          <u-form-item label="简介" prop="description" borderBottom>
            <u-textarea
              v-model="formData.description"
              placeholder="请输入书籍简介（选填）"
              count
              maxlength="500"
              height="200rpx"
            />
          </u-form-item>
        </view>
      </u-form>

      <!-- 保存按钮 -->
      <view class="save-button-wrapper">
        <u-button
          type="primary"
          text="保存"
          size="large"
          :loading="loading"
          :customStyle="{
            borderRadius: '48rpx',
            height: '96rpx'
          }"
          @click="handleSave"
        />
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBookStore } from '@/stores/modules/book'
import { logger, createContext } from '@/utils'
import AppNavBar from '@/components/common/AppNavBar.vue'
import IsbnScanner from '@/components/business/IsbnScanner.vue'
import BookCover from '@/components/book/BookCover.vue'
import type { CreateBookParams, UpdateBookParams, Book } from '@/stores/modules/book'
import { 
  BOOK_PAGES_MIN,
  BOOK_PAGES_MAX,
  PUBLISH_YEAR_MIN,
  BOOK_NAME_MAX_LENGTH,
  AUTHOR_NAME_MAX_LENGTH,
  PUBLISHER_NAME_MAX_LENGTH,
  BOOK_DESCRIPTION_MAX_LENGTH
} from '@/constants'

// Store
const bookStore = useBookStore()

// 页面数据
const bookId = ref<number | null>(null)
const isEditMode = computed(() => !!bookId.value)
const pageTitle = computed(() => isEditMode.value ? '编辑书籍' : '添加书籍')
const loading = ref(false)

// ISBN扫码相关
const scannedISBN = ref<string>('')

// 表单数据
const formData = reactive({
  title: '',
  author: '',
  publisher: '',
  description: '',
  cover: '',
  pages: '', // 页数字段（选填）
  publishYear: '', // 出版年份字段（选填）
  isbn: '' // ISBN字段
})

// 表单引用
const formRef = ref()

// 验证页数
const validatePages = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback()
    return
  }
  
  const pages = parseInt(value)
  if (isNaN(pages) || pages < BOOK_PAGES_MIN || pages > BOOK_PAGES_MAX || !Number.isInteger(pages)) {
    callback(new Error(`页数必须是${BOOK_PAGES_MIN}-${BOOK_PAGES_MAX}之间的正整数`))
    return
  }
  
  callback()
}

// 验证出版年份
const validatePublishYear = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback()
    return
  }
  
  const year = parseInt(value)
  const currentYear = new Date().getFullYear()
  
  if (isNaN(year) || year < PUBLISH_YEAR_MIN || year > currentYear) {
    callback(new Error(`出版年份必须在${PUBLISH_YEAR_MIN}年至${currentYear}年之间`))
    return
  }
  
  callback()
}

// 暴露给测试的验证函数
const validatePagesHelper = (value: string): boolean => {
  if (!value) return true
  const pages = parseInt(value)
  return !isNaN(pages) && pages >= BOOK_PAGES_MIN && pages <= BOOK_PAGES_MAX && Number.isInteger(pages)
}

const validatePublishYearHelper = (value: string): boolean => {
  if (!value) return true
  const year = parseInt(value)
  const currentYear = new Date().getFullYear()
  return !isNaN(year) && year >= PUBLISH_YEAR_MIN && year <= currentYear
}

// 暴露给测试
defineExpose({
  validatePages: validatePagesHelper,
  validatePublishYear: validatePublishYearHelper
})

// 表单验证规则（简化版：只有书名是必填项）
const rules = {
  title: [
    { required: true, message: '请输入书名', trigger: 'blur' },
    { min: 1, max: BOOK_NAME_MAX_LENGTH, message: `书名长度不能超过${BOOK_NAME_MAX_LENGTH}个字符`, trigger: 'blur' }
  ],
  author: [
    { max: AUTHOR_NAME_MAX_LENGTH, message: `作者名称不能超过${AUTHOR_NAME_MAX_LENGTH}个字符`, trigger: 'blur' }
  ],
  publisher: [
    { max: PUBLISHER_NAME_MAX_LENGTH, message: `出版社名称不能超过${PUBLISHER_NAME_MAX_LENGTH}个字符`, trigger: 'blur' }
  ],
  pages: [
    { validator: validatePages, message: `页数必须是${BOOK_PAGES_MIN}-${BOOK_PAGES_MAX}之间的正整数`, trigger: 'blur' }
  ],
  publishYear: [
    { validator: validatePublishYear, message: `出版年份必须在${PUBLISH_YEAR_MIN}年至今之间`, trigger: 'blur' }
  ],
  description: [
    { max: BOOK_DESCRIPTION_MAX_LENGTH, message: `简介不能超过${BOOK_DESCRIPTION_MAX_LENGTH}个字符`, trigger: 'blur' }
  ]
}

// 生命周期
onLoad(async (options) => {
  const ctx = createContext()
  
  if (options?.id) {
    bookId.value = parseInt(options.id)
    logger.info(ctx, '[AddBookPage] 编辑模式，书籍ID:', bookId.value)
    await loadBookDetail()
  } else {
    logger.info(ctx, '[AddBookPage] 新增模式')
  }
})

// 加载书籍详情
const loadBookDetail = async () => {
  const ctx = createContext()
  
  if (!bookId.value) return
  
  try {
    uni.showLoading({ title: '加载中...' })
    const book = await bookStore.fetchBookDetail(bookId.value)
    
    // 填充表单数据
    formData.title = book.title || ''
    formData.author = book.author || ''
    formData.publisher = book.publisher || ''
    formData.description = book.description || ''
    formData.cover = book.coverUrl || ''
    formData.pages = book.pages?.toString() || ''
    formData.publishYear = book.publishYear?.toString() || ''
    formData.isbn = book.isbn || ''
    
    logger.info(ctx, '[loadBookDetail] 书籍详情加载成功')
  } catch (error) {
    logger.error(ctx, '[loadBookDetail] 加载书籍详情失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
    // 加载失败返回上一页
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } finally {
    uni.hideLoading()
  }
}

// 选择封面
const chooseCover = () => {
  const ctx = createContext()
  
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      logger.info(ctx, '[chooseCover] 选择图片成功')
      // 暂时使用本地路径
      formData.cover = res.tempFilePaths[0]
      // 说明：如保留该页面，请接入“预签名直传”封面上传逻辑（参考 add-book 页面实现），并同步更新TECH_DEBT.md。
    },
    fail: (err) => {
      logger.error(ctx, '[chooseCover] 选择图片失败', err)
    }
  })
}

// ISBN扫码处理函数
const handleBookFound = (book: Book) => {
  const ctx = createContext()
  logger.info(ctx, '[handleBookFound] 通过ISBN找到书籍', { isbn: book.isbn, title: book.title })

  // 填充表单数据
  if (book.isbn) formData.isbn = book.isbn
  if (book.title) formData.title = book.title
  if (book.author) formData.author = book.author
  if (book.publisher) formData.publisher = book.publisher
  if (book.description) formData.description = book.description
  if (book.coverUrl) formData.cover = book.coverUrl
  if (book.pages) formData.pages = book.pages.toString()
  if (book.publishYear) formData.publishYear = book.publishYear.toString()

  // 如果是手动添加模式（source: 'manual'），显示提示
  if (book.source === 'manual') {
    uni.showToast({
      title: '请完善书籍信息',
      icon: 'none'
    })
  }
}

const handleScanComplete = (isbn: string) => {
  const ctx = createContext()
  logger.info(ctx, '[handleScanComplete] ISBN扫码完成', { isbn })
  scannedISBN.value = isbn
  formData.isbn = isbn
}


// 保存书籍
const handleSave = async () => {
  const ctx = createContext()
  
  try {
    // 表单验证
    const isValid = await formRef.value.validate()
    if (!isValid) {
      logger.warn(ctx, '[handleSave] 表单验证失败')
      return
    }
    
    loading.value = true
    uni.showLoading({ title: '保存中...' })
    
    // 准备提交数据
    const submitData: CreateBookParams | UpdateBookParams = {
      title: formData.title.trim(),
      author: formData.author.trim() || undefined,
      publisher: formData.publisher.trim() || undefined,
      description: formData.description.trim() || undefined,
      coverUrl: formData.cover || undefined,
      pages: formData.pages ? parseInt(formData.pages) : undefined,
      publishYear: formData.publishYear ? parseInt(formData.publishYear) : undefined,
      isbn: formData.isbn.trim() || undefined
    }
    
    // 根据模式调用不同的接口
    if (isEditMode.value) {
      logger.info(ctx, '[handleSave] 更新书籍', { bookId: bookId.value })
      await bookStore.updateBook({
        ...submitData,
        id: bookId.value!
      } as UpdateBookParams)
      uni.showToast({
        title: '更新成功',
        icon: 'success'
      })
    } else {
      logger.info(ctx, '[handleSave] 创建书籍')
      const newBook = await bookStore.createBook(submitData as CreateBookParams)
      logger.info(ctx, '[handleSave] 书籍创建成功', { bookId: newBook.id })
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      })
    }
    
    // 返回上一页
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    
  } catch (error: any) {
    logger.error(ctx, '[handleSave] 保存失败', error)
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
.add-book-page {
  min-height: 100vh;
  background-color: var(--cr-color-bg);
}

.form-container {
  padding: 32rpx;
  padding-bottom: 100rpx;
}

.cover-section {
  margin-bottom: 48rpx;
  
  .section-title {
    display: block;
    font-size: 32rpx;
    font-weight: 500;
    color: var(--cr-color-text-strong);
    margin-bottom: 24rpx;
  }
  
  .cover-upload {
    display: inline-flex;
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
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;

      .upload-tips {
        margin-top: 16rpx;
        font-size: 24rpx;
        color: var(--cr-color-subtext);
      }
    }
  }
}

.form-section {
  background: var(--cr-color-surface);
  border-radius: var(--cr-radius-card);
  padding: 0 32rpx;
  box-shadow: var(--cr-shadow-sm);
}

.save-button-wrapper {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  bottom: 40rpx;
  z-index: 100;
}

// 修复表单项样式
:deep(.u-form-item) {
  padding: 32rpx 0;
}

:deep(.u-form-item__body__left__content__label) {
  color: var(--cr-color-text);
  font-size: 30rpx;
}

:deep(.u-input__content__input) {
  color: var(--cr-color-text-strong);
  font-size: 30rpx;
}

:deep(.u-textarea) {
  background: transparent;
  padding: 0;
}
</style>
