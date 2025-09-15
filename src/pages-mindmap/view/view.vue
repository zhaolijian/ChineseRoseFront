<template>
  <view class="mindmap-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-content">
        <view class="navbar-left" @click="handleBack">
          <u-icon name="arrow-left" size="20" color="#333"></u-icon>
        </view>
        <text class="navbar-title">思维导图</text>
        <view class="navbar-right">
          <u-icon name="more-dot-fill" size="20" color="#333" @click="showMoreActions = true"></u-icon>
        </view>
      </view>
    </view>

    <!-- 思维导图列表/查看器 -->
    <view class="mindmap-content">
      <!-- 当没有传入bookId时，显示思维导图列表 -->
      <view v-if="!routeParams.bookId" class="mindmap-list">
        <view class="list-header">
          <text class="section-title">我的思维导图</text>
          <u-button 
            text="新建" 
            size="small"
            type="primary"
            @click="createMindMap"
          ></u-button>
        </view>
        
        <view v-if="mindmaps.length === 0" class="empty-state">
          <u-empty 
            mode="data" 
            text="还没有思维导图"
            textColor="#999"
            iconSize="80"
          >
            <template #bottom>
              <u-button 
                type="primary" 
                text="创建第一个思维导图"
                @click="createMindMap"
                style="margin-top: 20px;"
              ></u-button>
            </template>
          </u-empty>
        </view>
        
        <view v-else class="mindmap-grid">
          <view 
            v-for="mindmap in mindmaps" 
            :key="mindmap.id"
            class="mindmap-item"
            @click="viewMindMap(mindmap)"
          >
            <view class="mindmap-thumbnail">
              <u-image
                :src="mindmap.thumbnail || '/static/images/mindmap-placeholder.png'"
                width="100%"
                height="120px"
                mode="aspectFill"
                radius="8"
              ></u-image>
            </view>
            <view class="mindmap-info">
              <text class="mindmap-title">{{ mindmap.title }}</text>
              <text v-if="mindmap.bookTitle" class="book-title">《{{ mindmap.bookTitle }}》</text>
              <text class="mindmap-date">{{ formatDate(mindmap.updatedAt) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 当传入bookId时，显示该书籍的思维导图 -->
      <view v-else class="book-mindmap">
        <view v-if="!currentMindMap" class="no-mindmap">
          <u-empty 
            mode="data" 
            text="该书籍还没有思维导图"
            textColor="#999"
            iconSize="80"
          >
            <template #bottom>
              <u-button 
                type="primary" 
                text="为这本书创建思维导图"
                @click="createBookMindMap"
                style="margin-top: 20px;"
              ></u-button>
            </template>
          </u-empty>
        </view>
        
        <view v-else class="mindmap-viewer">
          <!-- 思维导图工具栏 -->
          <view class="mindmap-toolbar">
            <view class="toolbar-left">
              <text class="mindmap-title">{{ currentMindMap.title }}</text>
            </view>
            <view class="toolbar-right">
              <u-icon name="edit-pen" size="18" color="#00a82d" @click="editMindMap"></u-icon>
              <u-icon name="download" size="18" color="#00a82d" @click="exportMindMap" style="margin-left: 16px;"></u-icon>
            </view>
          </view>
          
          <!-- 思维导图画布 -->
          <view class="mindmap-canvas" id="mindmapCanvas">
            <!-- 这里将集成思维导图组件 -->
            <view class="canvas-placeholder">
              <text class="placeholder-text">思维导图画布</text>
              <text class="placeholder-desc">功能开发中...</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <u-popup 
      v-model="showMoreActions" 
      mode="bottom"
      height="200px"
      round="20"
      closeable
    >
      <view class="action-popup">
        <view class="popup-header">
          <text class="popup-title">更多操作</text>
        </view>
        
        <view class="action-options">
          <view class="action-option" @click="shareCurrentMindMap">
            <u-icon name="share" size="20" color="#00a82d"></u-icon>
            <text class="option-text">分享</text>
          </view>
          <view class="action-option" @click="exportCurrentMindMap">
            <u-icon name="download" size="20" color="#00a82d"></u-icon>
            <text class="option-text">导出</text>
          </view>
          <view class="action-option" @click="deleteCurrentMindMap">
            <u-icon name="trash" size="20" color="#ff6b6b"></u-icon>
            <text class="option-text">删除</text>
          </view>
        </view>
      </view>
    </u-popup>

    <!-- 加载提示 -->
    <u-loading-page 
      :loading="loading"
      bg-color="#f5f7fa"
    ></u-loading-page>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

// 类型定义
interface MindMap {
  id: number
  title: string
  bookId?: number
  bookTitle?: string
  content: string
  thumbnail?: string
  createdAt?: string
  updatedAt?: string
}

// 响应式数据
const mindmaps = ref<MindMap[]>([])
const currentMindMap = ref<MindMap | null>(null)
const loading = ref(false)
const showMoreActions = ref(false)

// 路由参数
const routeParams = ref<{ bookId?: number }>({})

// 生命周期
onLoad((options: any) => {
  if (options.bookId) {
    routeParams.value.bookId = parseInt(options.bookId)
  }
})

onMounted(async () => {
  await loadMindMaps()
})

onShow(async () => {
  await loadMindMaps()
})

// 方法
const loadMindMaps = async () => {
  try {
    loading.value = true
    
    if (routeParams.value.bookId) {
      // 加载特定书籍的思维导图
      await loadBookMindMap(routeParams.value.bookId)
    } else {
      // 加载所有思维导图
      await loadAllMindMaps()
    }
  } catch (error) {
    console.error('加载思维导图失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const loadAllMindMaps = async () => {
  // TODO: 实现获取所有思维导图的API
  // const result = await mindmapStore.fetchMindMaps()
  // mindmaps.value = result.mindmaps
  
  // 临时模拟数据
  mindmaps.value = []
}

const loadBookMindMap = async (bookId: number) => {
  // TODO: 实现获取书籍思维导图的API
  // const mindmap = await mindmapStore.fetchMindMapByBook(bookId)
  // currentMindMap.value = mindmap
  
  // 临时模拟数据
  currentMindMap.value = null
}

const createMindMap = () => {
  // TODO: 跳转到思维导图创建页面
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const createBookMindMap = () => {
  if (routeParams.value.bookId) {
    // TODO: 为指定书籍创建思维导图
    uni.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
}

const viewMindMap = (mindmap: MindMap) => {
  currentMindMap.value = mindmap
  // TODO: 在画布中渲染思维导图
}

const editMindMap = () => {
  if (currentMindMap.value) {
    // TODO: 进入编辑模式
    uni.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
}

const exportMindMap = () => {
  if (currentMindMap.value) {
    // TODO: 导出思维导图
    uni.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
}

const shareCurrentMindMap = () => {
  if (currentMindMap.value) {
    // TODO: 分享思维导图
    uni.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
  showMoreActions.value = false
}

const exportCurrentMindMap = () => {
  if (currentMindMap.value) {
    // TODO: 导出当前思维导图
    uni.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
  showMoreActions.value = false
}

const deleteCurrentMindMap = () => {
  if (currentMindMap.value) {
    uni.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除这个思维导图吗？',
      success: async (res) => {
        if (res.confirm && currentMindMap.value) {
          try {
            // TODO: 实现删除思维导图的API
            // await mindmapStore.deleteMindMap(currentMindMap.value.id)
            
            currentMindMap.value = null
            
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
            
            await loadMindMaps()
          } catch (error) {
            console.error('删除思维导图失败:', error)
            uni.showToast({
              title: '删除失败',
              icon: 'error'
            })
          }
        }
      }
    })
  }
  showMoreActions.value = false
}

const handleBack = () => {
  if (currentMindMap.value && routeParams.value.bookId) {
    // 如果是在查看书籍的思维导图，返回到思维导图列表
    currentMindMap.value = null
  } else {
    uni.navigateBack()
  }
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style lang="scss" scoped>
.mindmap-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.custom-navbar {
  background: #fff;
  padding-top: var(--status-bar-height);
  border-bottom: 1px solid #f0f0f0;
  
  .navbar-content {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    
    .navbar-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    
    .navbar-left,
    .navbar-right {
      width: 40px;
      display: flex;
      justify-content: center;
    }
  }
}

.mindmap-content {
  flex: 1;
  overflow: hidden;
}

.mindmap-list {
  padding: 16px;
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .empty-state {
    padding-top: 100px;
    text-align: center;
  }
  
  .mindmap-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    
    .mindmap-item {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      
      &:active {
        transform: scale(0.98);
        transition: transform 0.1s;
      }
      
      .mindmap-thumbnail {
        width: 100%;
        height: 120px;
        background: #f8f9fa;
      }
      
      .mindmap-info {
        padding: 12px;
        
        .mindmap-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .book-title {
          display: block;
          font-size: 12px;
          color: #00a82d;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .mindmap-date {
          font-size: 11px;
          color: #999;
        }
      }
    }
  }
}

.book-mindmap {
  height: calc(100vh - 44px - var(--status-bar-height));
  
  .no-mindmap {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
  }
  
  .mindmap-viewer {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .mindmap-toolbar {
      background: #fff;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .toolbar-left {
        flex: 1;
        
        .mindmap-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
      }
      
      .toolbar-right {
        display: flex;
        align-items: center;
      }
    }
    
    .mindmap-canvas {
      flex: 1;
      background: #fff;
      position: relative;
      
      .canvas-placeholder {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        
        .placeholder-text {
          display: block;
          font-size: 18px;
          color: #333;
          margin-bottom: 8px;
        }
        
        .placeholder-desc {
          font-size: 14px;
          color: #999;
        }
      }
    }
  }
}

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
  
  .action-options {
    .action-option {
      display: flex;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .option-text {
        font-size: 14px;
        color: #333;
        margin-left: 12px;
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