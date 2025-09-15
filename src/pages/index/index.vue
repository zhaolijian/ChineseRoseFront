<template>
  <view class="bookshelf-page">
    <AppNavBar title="书架" :showBack="false">
      <template #right>
        <u-icon name="search" size="20" class="cr-icon" @click="goToSearch" />
        <u-icon name="plus-circle" size="20" class="cr-icon" @click="showAddBook = true" style="margin-left: 16rpx;" />
      </template>
    </AppNavBar>

    <!-- 书籍列表 -->
    <PageContainer>
    <view class="bookshelf-content">
      <view v-if="loading && books.length === 0">
        <LoadingSkeleton :rows="4" />
      </view>
      <view v-else-if="books.length === 0" class="empty-state">
        <EmptyState icon="book" title="还没有添加书籍" actionText="添加第一本书" @action="showAddBook = true" />
      </view>

      <view v-else class="book-grid">
        <view v-for="book in books" :key="book.id" class="book-item cr-card cr-card--padded" @click="goToBookDetail(book)">
          <view class="book-cover">
            <u-image 
              :src="book.cover || '/static/images/book-placeholder.png'"
              mode="aspectFit"
              width="100%"
              height="140px"
              radius="8"
              loading-icon="book"
            ></u-image>
          </view>
          <view class="book-info">
            <text class="book-title">{{ book.title }}</text>
            <text class="book-author">{{ book.author }}</text>
            <text class="book-notes">{{ book.noteCount || 0 }}条笔记</text>
          </view>
        </view>
      </view>
    </view>
    </PageContainer>
    <TabBar />

    <!-- 悬浮添加按钮 -->
    <view class="fab-button" @click="showAddBook = true">
      <u-icon name="plus" size="24" color="#fff"></u-icon>
    </view>

    <!-- 添加书籍弹窗 -->
    <u-popup 
      v-model="showAddBook" 
      mode="bottom" 
      height="60%"
      round="20"
      closeable
    >
      <view class="add-book-popup">
        <view class="popup-header">
          <text class="popup-title">添加书籍</text>
        </view>
        
        <view class="add-methods">
          <view class="method-item" @click="addByISBN">
            <u-icon name="scan" size="30" class="cr-icon--active"></u-icon>
            <text class="method-text">扫描ISBN</text>
          </view>
          
          <view class="method-item" @click="addManually">
            <u-icon name="edit-pen" size="30" class="cr-icon--active"></u-icon>
            <text class="method-text">手动添加</text>
          </view>
        </view>

        <!-- 手动添加表单 -->
        <view v-if="showManualForm" class="manual-form">
          <u-form ref="form" :model="bookForm" :rules="rules">
            <u-form-item label="书名" prop="title" required>
              <u-input v-model="bookForm.title" placeholder="请输入书名"></u-input>
            </u-form-item>
            
            <u-form-item label="作者" prop="author">
              <u-input v-model="bookForm.author" placeholder="请输入作者"></u-input>
            </u-form-item>
            
            <u-form-item label="ISBN" prop="isbn">
              <u-input v-model="bookForm.isbn" placeholder="请输入ISBN（可选）"></u-input>
            </u-form-item>
          </u-form>
          
          <view class="form-actions">
            <u-button 
              type="primary" 
              text="添加书籍"
              :loading="loading"
              @click="submitBook"
            ></u-button>
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
import { ref, reactive, onMounted } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useBookStore } from '@/stores/modules/book'
import { useUserStore } from '@/stores/modules/user'
import { safeHideTabBar } from '@/utils/tabbar'
import AppNavBar from '@/components/common/AppNavBar.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TabBar from '@/components/common/TabBar.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'

// 类型定义
interface Book {
  id: number
  title: string
  author?: string
  isbn?: string
  cover?: string
  noteCount?: number
  createdAt?: string
  updatedAt?: string
}

interface BookForm {
  title: string
  author: string
  isbn: string
}

// Store
const bookStore = useBookStore()
const userStore = useUserStore()

// 响应式数据
const books = ref<Book[]>([])
const showAddBook = ref(false)
const showManualForm = ref(false)
const loading = ref(false)
const pageLoading = ref(false)
const hasMore = ref(true)

// 表单数据
const bookForm = reactive<BookForm>({
  title: '',
  author: '',
  isbn: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入书名', trigger: 'blur' }
  ]
}

// 生命周期
onMounted(async () => {
  await checkLoginAndLoadData()
})

onShow(async () => {
  // 🔧 修复：使用统一的TabBar工具函数
  safeHideTabBar()
  
  // 页面显示时按需加载：未登录不请求，已登录才加载
  if (userStore.isLoggedIn) {
    await loadBooks()
  }
})

onPullDownRefresh(async () => {
  await loadBooks(true)
  uni.stopPullDownRefresh()
})

onReachBottom(async () => {
  if (hasMore.value && !loading.value) {
    await loadMoreBooks()
  }
})

// 方法
const checkLoginAndLoadData = async () => {
  try {
    pageLoading.value = true
    
    // 🔧 优化：先检查登录状态，再根据结果决定是否跳转
    const isLoggedIn = await userStore.checkLoginStatus()
    
    if (!isLoggedIn) {
      uni.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    // 加载书籍数据
    await loadBooks()
  } catch (error) {
    console.error('初始化失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    pageLoading.value = false
  }
}

const loadBooks = async (refresh = false) => {
  try {
    loading.value = true
    
    const result = await bookStore.fetchBooks(refresh ? 1 : bookStore.currentPage)
    
    if (refresh) {
      books.value = result.books
    } else {
      books.value.push(...result.books)
    }
    
    hasMore.value = result.hasMore
  } catch (error) {
    console.error('加载书籍失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const loadMoreBooks = async () => {
  if (!hasMore.value) return
  
  await loadBooks()
}

const goToBookDetail = (book: Book) => {
  uni.navigateTo({
    url: `/pages-book/detail/detail?id=${book.id}`
  })
}

const goToSearch = () => {
  uni.navigateTo({
    url: '/pages/search/search'
  })
}

const addByISBN = () => {
  // TODO: 实现ISBN扫描功能
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const addManually = () => {
  showManualForm.value = true
}

const submitBook = async () => {
  try {
    loading.value = true
    
    // 表单验证
    if (!bookForm.title.trim()) {
      uni.showToast({
        title: '请输入书名',
        icon: 'error'
      })
      return
    }
    
    // 添加书籍
    const newBook = await bookStore.createBook({
      title: bookForm.title.trim(),
      author: bookForm.author.trim() || undefined,
      isbn: bookForm.isbn.trim() || undefined
    })
    
    // 添加到列表
    books.value.unshift(newBook)
    
    // 重置表单
    Object.assign(bookForm, {
      title: '',
      author: '',
      isbn: ''
    })
    
    // 关闭弹窗
    showAddBook.value = false
    showManualForm.value = false
    
    uni.showToast({
      title: '添加成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('添加书籍失败:', error)
    uni.showToast({
      title: '添加失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.bookshelf-page { min-height: 100vh; background-color: var(--cr-color-bg); }

.bookshelf-content {
  padding: 16px;
  padding-bottom: 100px; // 为tabbar留出空间
}

.empty-state {
  padding-top: 100px;
  text-align: center;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.book-item {
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
  
  .book-cover {
    margin-bottom: 8px;
  }
  
.book-info {
  .book-title {
    display: block;
    font-size: 14px; // 保持原字号（后续按令牌统一）
    font-weight: 600;
    color: var(--cr-color-text-strong);
    line-height: 1.4;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .book-author {
    display: block;
    font-size: 12px;
    color: var(--cr-color-text);
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .book-notes {
    display: block;
    font-size: 11px;
    color: var(--cr-color-subtext);
  }
}
}

.add-book-popup {
  padding: 20px;
  
  .popup-header {
    text-align: center;
    margin-bottom: 30px;
    
    .popup-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .add-methods {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30px;
    
    .method-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 12px;
      background: #f8f9fa;
      min-width: 100px;
      
      &:active {
        background: #e9ecef;
      }
      
      .method-text {
        margin-top: 8px;
        font-size: 14px;
        color: #333;
      }
    }
  }
  
  .manual-form {
    .form-actions {
      margin-top: 30px;
    }
  }
}

.fab-button {
  position: fixed;
  left: 50%;
  bottom: 100px; // 避开tabbar
  transform: translateX(-50%); // 水平居中
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: var(--cr-color-primary-600);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--cr-shadow-md);
  z-index: 100;
  
  &:active {
    transform: translateX(-50%) scale(0.95);
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
