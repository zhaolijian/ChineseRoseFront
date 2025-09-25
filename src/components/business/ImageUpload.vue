<template>
  <view class="image-upload">
    <view class="upload-area" @click="handleChooseImage">
      <!-- 图片预览 -->
      <view v-if="imageUrl" class="preview-container">
        <image 
          class="preview-image" 
          :src="imageUrl" 
          mode="aspectFill"
        />
        <!-- 删除按钮 -->
        <view 
          v-if="deletable && imageUrl" 
          class="delete-btn"
          @click.stop="handleDelete"
        >
          <u-icon name="close-circle-fill" size="24" color="#fff"></u-icon>
        </view>
      </view>
      
      <!-- 上传占位符 -->
      <view v-else class="upload-placeholder">
        <u-icon name="photo" size="40" color="#999"></u-icon>
        <text class="upload-tips">{{ tips }}</text>
      </view>
      
      <!-- 上传进度 -->
      <view v-if="showProgress && isUploading" class="upload-progress">
        <u-line-progress :percentage="uploadProgress" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { logger, createContext } from '@/utils'
import { getStorageSync } from '@/utils/storage'
import { API_BASE_URL, STORAGE_KEYS } from '@/constants'

// Props定义
interface Props {
  modelValue: string
  tips?: string
  sourceType?: ('album' | 'camera')[]
  maxSize?: number // 最大文件大小(字节)
  uploadUrl?: string // 上传接口地址
  showProgress?: boolean // 是否显示上传进度
  deletable?: boolean // 是否可删除
  compressQuality?: number // 压缩质量(1-100)
}

const props = withDefaults(defineProps<Props>(), {
  tips: '点击上传图片',
  sourceType: () => ['album', 'camera'],
  maxSize: 5 * 1024 * 1024, // 默认5MB
  uploadUrl: '/api/v1/upload/image',
  showProgress: true,
  deletable: true,
  compressQuality: 80
})

// Emits定义
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'success': [url: string]
  'error': [error: any]
  'delete': []
}>()

// 响应式数据
const imageUrl = ref(props.modelValue)
const isUploading = ref(false)
const uploadProgress = ref(0)

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  imageUrl.value = newVal
})

// 选择图片
const handleChooseImage = () => {
  const ctx = createContext()
  
  if (isUploading.value) {
    logger.warn(ctx, '[ImageUpload] 正在上传中，请稍候')
    return
  }
  
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: props.sourceType as any,
    success: async (res) => {
      logger.info(ctx, '[ImageUpload] 选择图片成功', {
        tempFilePath: res.tempFilePaths[0],
        fileSize: res.tempFiles?.[0]?.size
      })
      
      const tempFilePath = res.tempFilePaths[0]
      const fileInfo = res.tempFiles?.[0]
      
      try {
        // 检查是否需要压缩
        let finalPath = tempFilePath
        if (fileInfo && fileInfo.size > props.maxSize) {
          logger.info(ctx, '[ImageUpload] 图片大小超限，开始压缩', {
            originalSize: fileInfo.size,
            maxSize: props.maxSize
          })
          finalPath = await compressImage(tempFilePath)
        }
        
        // 上传图片
        await uploadImage(finalPath)
      } catch (error) {
        logger.error(ctx, '[ImageUpload] 处理图片失败', error)
        uni.showToast({
          title: '处理图片失败',
          icon: 'none'
        })
        emit('error', error)
      }
    },
    fail: (err) => {
      logger.error(ctx, '[ImageUpload] 选择图片失败', err)
      if (err.errMsg !== 'chooseImage:fail cancel') {
        uni.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    }
  })
}

// 压缩图片
const compressImage = (src: string): Promise<string> => {
  const ctx = createContext()
  
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src,
      quality: props.compressQuality,
      success: (res) => {
        logger.info(ctx, '[ImageUpload] 压缩成功', {
          originalPath: src,
          compressedPath: res.tempFilePath
        })
        resolve(res.tempFilePath)
      },
      fail: (err) => {
        logger.error(ctx, '[ImageUpload] 压缩失败', err)
        reject(err)
      }
    })
  })
}

// 上传图片
const uploadImage = (filePath: string) => {
  const ctx = createContext()
  
  return new Promise<void>((resolve, reject) => {
    isUploading.value = true
    uploadProgress.value = 0
    
    uni.showLoading({
      title: '上传中...'
    })
    
    // 获取token
    const token = getStorageSync(STORAGE_KEYS.TOKEN)
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // 构建完整的上传URL
    const fullUrl = props.uploadUrl.startsWith('http') 
      ? props.uploadUrl 
      : `${API_BASE_URL}${props.uploadUrl}`
    
    logger.info(ctx, '[ImageUpload] 开始上传', {
      url: fullUrl,
      filePath
    })
    
    const uploadTask = uni.uploadFile({
      url: fullUrl,
      filePath,
      name: 'file',
      header: headers,
      success: (res) => {
        logger.info(ctx, '[ImageUpload] 上传响应', {
          statusCode: res.statusCode,
          data: res.data
        })
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(res.data)
            if (response.code === 0 && response.data?.url) {
              imageUrl.value = response.data.url
              emit('update:modelValue', response.data.url)
              emit('success', response.data.url)
              logger.info(ctx, '[ImageUpload] 上传成功', { url: response.data.url })
              resolve()
            } else {
              throw new Error(response.message || '上传失败')
            }
          } catch (error) {
            logger.error(ctx, '[ImageUpload] 解析响应失败', error)
            throw error
          }
        } else {
          throw new Error(`上传失败: ${res.statusCode}`)
        }
      },
      fail: (err) => {
        logger.error(ctx, '[ImageUpload] 上传失败', err)
        reject(err)
      },
      complete: () => {
        isUploading.value = false
        uploadProgress.value = 0
        uni.hideLoading()
      }
    })
    
    // 监听上传进度
    if (props.showProgress) {
      uploadTask.onProgressUpdate((res) => {
        uploadProgress.value = res.progress
        logger.debug(ctx, '[ImageUpload] 上传进度', { progress: res.progress })
      })
    }
  }).catch((error) => {
    uni.showToast({
      title: '上传失败，请重试',
      icon: 'none'
    })
    emit('error', error)
  })
}

// 删除图片
const handleDelete = () => {
  const ctx = createContext()
  logger.info(ctx, '[ImageUpload] 删除图片')
  
  imageUrl.value = ''
  emit('update:modelValue', '')
  emit('delete')
}
</script>

<style lang="scss" scoped>
.image-upload {
  display: inline-block;
  
  .upload-area {
    position: relative;
    width: 200rpx;
    height: 280rpx;
    border-radius: 16rpx;
    overflow: hidden;
    background: var(--cr-color-surface, #f5f5f5);
    border: 2rpx dashed var(--cr-color-border, #e0e0e0);
    
    &:active {
      opacity: 0.8;
    }
  }
  
  .preview-container {
    width: 100%;
    height: 100%;
    position: relative;
    
    .preview-image {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    .delete-btn {
      position: absolute;
      top: 8rpx;
      right: 8rpx;
      width: 48rpx;
      height: 48rpx;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:active {
        opacity: 0.8;
      }
    }
  }
  
  .upload-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    .upload-tips {
      margin-top: 16rpx;
      font-size: 24rpx;
      color: var(--cr-color-subtext, #999);
    }
  }
  
  .upload-progress {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 16rpx;
    background: rgba(255, 255, 255, 0.9);
  }
}
</style>
