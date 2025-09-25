<template>
  <PageContainer class="ocr-page">
    <!-- 页面标题 -->
    <view class="page-header">
      <view class="ocr-title">文字识别</view>
      <view class="batch-tip">支持1-{{ MAX_IMAGES }}张图片批量识别</view>
    </view>

    <!-- 图片选择区域 -->
    <view class="image-section">
      <view class="section-title">选择图片</view>

      <!-- 选中的图片列表 -->
      <scroll-view
        v-if="selectedImages.length > 0"
        class="image-list"
        scroll-x="true"
      >
        <view
          v-for="(image, index) in selectedImages"
          :key="index"
          class="image-item"
        >
          <image
            class="image-preview"
            :src="image.path"
            mode="aspectFill"
          />
          <view class="image-info">
            <text class="image-size">{{ formatFileSize(image.size) }}</text>
            <text v-if="image.compressed" class="compressed-tag">已压缩</text>
          </view>
          <view
            class="delete-image-btn"
            @click="removeImage(index)"
          >
            <u-icon name="close-circle-fill" size="20" color="#fff"></u-icon>
          </view>

          <!-- OCR结果状态 -->
          <view
            v-if="getImageOCRResult(index)"
            class="ocr-status success"
          >
            <u-icon name="checkmark-circle-fill" size="16" color="#4CAF50"></u-icon>
          </view>
          <view
            v-else-if="isProcessingImage(index)"
            class="ocr-status processing"
          >
            <u-loading-icon mode="circle" size="16"></u-loading-icon>
          </view>
        </view>
      </scroll-view>

      <!-- 添加图片按钮 -->
      <view
        class="image-upload-area"
        @click="handleChooseImages"
        :class="{ disabled: selectedImages.length >= MAX_IMAGES }"
      >
        <view class="upload-placeholder">
          <u-icon name="plus" size="40" color="#999"></u-icon>
          <text class="upload-tips">
            {{ selectedImages.length === 0 ? '点击选择图片' : `${selectedImages.length}/${MAX_IMAGES}` }}
          </text>
        </view>
      </view>
    </view>

    <!-- OCR操作区域 -->
    <view v-if="selectedImages.length > 0" class="action-section">
      <view class="action-buttons">
        <PrimaryButton
          v-if="selectedImages.length === 1"
          class="ocr-start-btn"
          type="primary"
          :loading="isSingleProcessing"
          :disabled="isSingleProcessing || isBatchProcessing"
          @click="startSingleOCR"
        >
          开始识别
        </PrimaryButton>

        <PrimaryButton
          v-if="selectedImages.length > 1"
          class="batch-ocr-btn"
          type="primary"
          :loading="isBatchProcessing"
          :disabled="isSingleProcessing || isBatchProcessing"
          @click="startBatchOCR"
        >
          批量识别 ({{ selectedImages.length }}张)
        </PrimaryButton>

        <u-button
          type="default"
          :disabled="isSingleProcessing || isBatchProcessing"
          @click="clearAllImages"
        >
          清空
        </u-button>
      </view>

      <!-- 批量处理进度 -->
      <view v-if="isBatchProcessing && batchProgress.total > 0" class="batch-progress">
        <view class="progress-info">
          <text>正在处理：{{ batchProgress.current }}/{{ batchProgress.total }}</text>
        </view>
        <u-line-progress
          :percentage="(batchProgress.current / batchProgress.total) * 100"
          :show-percent="false"
          active-color="#2E7D32"
        />
      </view>
    </view>

    <!-- OCR结果展示区域 -->
    <view v-if="ocrResults.length > 0" class="result-section">
      <view class="section-title">识别结果</view>

      <view
        v-for="(result, index) in ocrResults"
        :key="index"
        class="ocr-result-area"
      >
        <view class="result-header">
          <text class="result-title">图片 {{ result.imageIndex + 1 }}</text>
          <view class="result-actions">
            <u-button
              type="default"
              size="mini"
              @click="retryOCR(result.imageIndex)"
            >
              重试
            </u-button>
            <u-button
              type="default"
              size="mini"
              @click="manualInput(result.imageIndex)"
            >
              手动输入
            </u-button>
          </view>
        </view>

        <view class="result-text">
          <u-textarea
            v-model="result.editedText"
            :placeholder="result.originalText || '请输入文字内容'"
            :autoHeight="true"
            :minHeight="100"
            :maxLength="5000"
            count
          />
        </view>

        <!-- 置信度和统计信息 -->
        <view class="result-meta">
          <view v-if="result.confidence" class="confidence-info">
            <text class="confidence-label">识别置信度：</text>
            <text
              class="confidence-value"
              :class="getConfidenceLevel(result.confidence)"
            >
              {{ (result.confidence * 100).toFixed(1) }}%
            </text>
          </view>

          <view class="text-stats">
            <text class="stats-item">字符数：{{ result.editedText?.length || 0 }}</text>
            <text class="stats-item">行数：{{ getLineCount(result.editedText) }}</text>
            <text v-if="result.texts?.length" class="stats-item">
              文本块：{{ result.texts.length }}
            </text>
          </view>
        </view>

        <!-- 文本处理工具 -->
        <view class="text-tools">
          <u-button
            type="default"
            size="mini"
            @click="formatText(result)"
          >
            格式化
          </u-button>
          <u-button
            type="default"
            size="mini"
            @click="translateText()"
          >
            翻译
          </u-button>
          <u-button
            type="default"
            size="mini"
            @click="copyText(result.editedText)"
          >
            复制
          </u-button>
          <u-button
            type="default"
            size="mini"
            @click="clearText(result)"
          >
            清空
          </u-button>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="ocrResults.length > 0" class="bottom-actions">
      <PrimaryButton
        class="save-note-btn"
        type="primary"
        :disabled="!hasValidContent"
        @click="saveAsNote"
      >
        保存为笔记
      </PrimaryButton>

      <u-button
        type="default"
        @click="exportText"
      >
        导出文本
      </u-button>
    </view>

    <!-- 空状态 -->
    <EmptyState
      v-if="selectedImages.length === 0"
      icon="camera"
      title="开始文字识别"
      description="选择图片进行OCR识别，支持中英文混合内容"
    />

    <!-- 隐藏的临时canvas，用于获取图片数据 -->
    <canvas
      canvas-id="temp-canvas"
      style="position: fixed; top: -9999px; left: -9999px; width: 1px; height: 1px;"
    ></canvas>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { logger, createContext } from '@/utils'
import { ErrorCode, getFriendlyErrorMessage } from '@/types/errorCodes'
import PageContainer from '@/components/common/PageContainer.vue'
import PrimaryButton from '@/components/common/PrimaryButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// 接口定义
interface SelectedImage {
  path: string
  size: number
  compressed: boolean
  originalSize?: number
}

interface OCRText {
  text: string
  confidence: number
}

interface OCRResult {
  imageIndex: number
  originalText: string
  editedText: string
  texts: OCRText[]
  confidence?: number
}

interface BatchProgress {
  current: number
  total: number
}

// OCR专用错误类
class OCRError extends Error {
  constructor(
    public errorCode: number,
    message: string,
    public errno?: number
  ) {
    super(message)
    this.name = 'OCRError'
  }
}

// 常量定义
const MAX_IMAGES = 9 // uni-app chooseImage API的最大限制

// VisionKit errno到ErrorCode映射
const mapVKErrnoToErrorCode = (errno: number): number => {
  switch (errno) {
    case 1: // VK会话启动失败
    case 2: // 设备不支持VisionKit
    case 3: // 权限不足
      return ErrorCode.ERR_OCR_VK_NOT_SUPPORTED
    case 4: // 参数错误
    case 7: // 图片处理失败
      return ErrorCode.ERR_OCR_IMAGE_PROCESS_ERROR
    case 5: // OCR识别超时
      return ErrorCode.ERR_OCR_TIMEOUT
    case 6: // OCR识别失败
    case 8: // 文字识别失败
      return ErrorCode.ERR_OCR_RECOGNITION_FAILED
    case 9: // 服务不可用
      return ErrorCode.ERR_OCR_SERVICE_UNAVAIL
    default:
      return ErrorCode.ERR_OCR_FAILED
  }
}

// 响应式数据
const selectedImages = ref<SelectedImage[]>([])
const ocrResults = ref<OCRResult[]>([])
const isSingleProcessing = ref(false)
const isBatchProcessing = ref(false)
const batchProgress = ref<BatchProgress>({ current: 0, total: 0 })

// 计算属性
const hasValidContent = computed(() => {
  return ocrResults.value.some(result => result.editedText?.trim())
})

// 图片选择
const handleChooseImages = () => {
  const ctx = createContext()

  if (selectedImages.value.length >= MAX_IMAGES) {
    uni.showToast({
      title: `最多只能选择${MAX_IMAGES}张图片`,
      icon: 'none'
    })
    return
  }

  const remainingCount = MAX_IMAGES - selectedImages.value.length

  uni.chooseImage({
    count: remainingCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      logger.info(ctx, '[OCRPage] 选择图片成功', {
        count: res.tempFilePaths.length,
        totalFiles: res.tempFiles?.length
      })

      try {
        for (let i = 0; i < res.tempFilePaths.length; i++) {
          const tempFilePath = res.tempFilePaths[i]
          const fileInfo = res.tempFiles?.[i]

          if (fileInfo) {
            await processSelectedImage(tempFilePath, fileInfo.size)
          }
        }
      } catch (error) {
        logger.error(ctx, '[OCRPage] 处理选择的图片失败', error)
        uni.showToast({
          title: '处理图片失败',
          icon: 'none'
        })
      }
    },
    fail: (err) => {
      logger.error(ctx, '[OCRPage] 选择图片失败', err)
      if (err.errMsg !== 'chooseImage:fail cancel') {
        uni.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    }
  })
}

// 处理选中的图片（应用智能压缩策略）
const processSelectedImage = async (filePath: string, fileSize: number) => {
  const ctx = createContext()
  const COMPRESS_THRESHOLD = 2 * 1024 * 1024 // 2MB阈值
  const MAX_RESOLUTION = 1920 // 最大分辨率

  let finalPath = filePath
  let finalSize = fileSize
  let compressed = false

  try {
    // 获取图片信息
    const imgInfo = await getImageInfo(filePath)

    // 智能压缩策略
    const needsCompression = fileSize > COMPRESS_THRESHOLD ||
                            imgInfo.width > MAX_RESOLUTION ||
                            imgInfo.height > MAX_RESOLUTION

    if (needsCompression) {
      logger.info(ctx, '[OCRPage] 开始智能压缩图片', {
        originalSize: fileSize,
        originalWidth: imgInfo.width,
        originalHeight: imgInfo.height,
        reason: fileSize > COMPRESS_THRESHOLD ? 'size' : 'resolution'
      })

      const result = await smartCompressImage(filePath, imgInfo, fileSize)
      finalPath = result.path
      finalSize = result.size
      compressed = true

      logger.info(ctx, '[OCRPage] 智能压缩完成', {
        originalSize: fileSize,
        compressedSize: finalSize,
        compressionRatio: (finalSize / fileSize * 100).toFixed(1) + '%'
      })
    }

    // 添加到选中列表
    selectedImages.value.push({
      path: finalPath,
      size: finalSize,
      compressed,
      originalSize: fileSize
    })

  } catch (error) {
    logger.error(ctx, '[OCRPage] 处理图片失败', error)

    // 使用原图作为兜底
    selectedImages.value.push({
      path: filePath,
      size: fileSize,
      compressed: false,
      originalSize: fileSize
    })
  }
}

// 获取图片信息
const getImageInfo = (src: string): Promise<{width: number, height: number, type: string}> => {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: (res: any) => {
        resolve({
          width: res.width,
          height: res.height,
          type: res.type
        })
      },
      fail: reject
    })
  })
}

// 智能压缩图片（OCR优化版）
const smartCompressImage = async (
  src: string,
  imgInfo: {width: number, height: number},
  originalSize: number
): Promise<{path: string, size: number}> => {
  const ctx = createContext()
  const COMPRESS_THRESHOLD = 2 * 1024 * 1024 // 2MB压缩阈值
  const OCR_MIN_RESOLUTION = 800 // OCR最小有效分辨率
  const OCR_MAX_RESOLUTION = 2400 // OCR最佳分辨率上限

  // OCR优化的压缩参数
  let quality = 92 // 默认高质量，保证OCR识别率
  let width = imgInfo.width
  let height = imgInfo.height

  // 智能质量调整策略
  if (originalSize > 8 * 1024 * 1024) { // >8MB：高质量压缩
    quality = 85
  } else if (originalSize > 5 * 1024 * 1024) { // >5MB：中等压缩
    quality = 88
  } else if (originalSize > COMPRESS_THRESHOLD) { // >2MB：轻度压缩
    quality = 90
  }

  // OCR优化的尺寸调整策略
  const minSize = Math.min(imgInfo.width, imgInfo.height)
  const maxSize = Math.max(imgInfo.width, imgInfo.height)

  if (maxSize > OCR_MAX_RESOLUTION) {
    // 超大图：压缩到最佳OCR分辨率
    const ratio = OCR_MAX_RESOLUTION / maxSize
    width = Math.floor(imgInfo.width * ratio)
    height = Math.floor(imgInfo.height * ratio)

    logger.info(ctx, '[smartCompressImage] 压缩超大图片', {
      originalSize: `${imgInfo.width}x${imgInfo.height}`,
      newSize: `${width}x${height}`,
      ratio: ratio.toFixed(3)
    })
  } else if (minSize < OCR_MIN_RESOLUTION && maxSize > OCR_MIN_RESOLUTION) {
    // 极小图：放大到最小有效分辨率
    const ratio = OCR_MIN_RESOLUTION / minSize
    width = Math.floor(imgInfo.width * ratio)
    height = Math.floor(imgInfo.height * ratio)

    logger.info(ctx, '[smartCompressImage] 放大小图提升OCR质量', {
      originalSize: `${imgInfo.width}x${imgInfo.height}`,
      newSize: `${width}x${height}`,
      ratio: ratio.toFixed(3)
    })
  }

  logger.info(ctx, '[smartCompressImage] OCR压缩策略', {
    originalSize: formatFileSize(originalSize),
    resolution: `${imgInfo.width}x${imgInfo.height}`,
    targetQuality: quality,
    sizeAdjusted: (width !== imgInfo.width || height !== imgInfo.height)
  })

  return compressImage(src, quality, width, height)
}

// 压缩图片（支持尺寸调整）
const compressImage = (
  src: string,
  quality: number = 90,
  width?: number,
  height?: number
): Promise<{path: string, size: number}> => {
  const ctx = createContext()

  return new Promise((resolve, reject) => {
    const compressOptions: any = {
      src,
      quality,
      success: (res: any) => {
        // 获取压缩后的文件大小
        uni.getFileInfo({
          filePath: res.tempFilePath,
          success: (fileInfo: any) => {
            logger.info(ctx, '[OCRPage] 压缩图片成功', {
              originalPath: src,
              compressedPath: res.tempFilePath,
              compressedSize: fileInfo.size
            })
            resolve({
              path: res.tempFilePath,
              size: fileInfo.size
            })
          },
          fail: () => {
            // 如果获取文件信息失败，使用默认值
            resolve({
              path: res.tempFilePath,
              size: 0
            })
          }
        })
      },
      fail: (err: any) => {
        logger.error(ctx, '[OCRPage] 压缩图片失败', err)
        reject(err)
      }
    }

    // 如果指定了尺寸，添加到选项中
    if (width && height) {
      compressOptions.width = width
      compressOptions.height = height
    }

    uni.compressImage(compressOptions)
  })
}

// 删除图片
const removeImage = (index: number) => {
  const ctx = createContext()
  logger.info(ctx, '[OCRPage] 删除图片', { index })

  selectedImages.value.splice(index, 1)

  // 同时删除对应的OCR结果
  ocrResults.value = ocrResults.value.filter(result =>
    result.imageIndex !== index
  ).map(result => ({
    ...result,
    imageIndex: result.imageIndex > index ? result.imageIndex - 1 : result.imageIndex
  }))
}

// 清空所有图片
const clearAllImages = () => {
  const ctx = createContext()
  logger.info(ctx, '[OCRPage] 清空所有图片')

  selectedImages.value = []
  ocrResults.value = []
  batchProgress.value = { current: 0, total: 0 }
}

// 单张图片OCR识别
const startSingleOCR = async () => {
  if (selectedImages.value.length !== 1) return

  isSingleProcessing.value = true
  await performOCR(0)
  isSingleProcessing.value = false
}

// 批量OCR识别
const startBatchOCR = async () => {
  if (selectedImages.value.length === 0) return

  isBatchProcessing.value = true
  batchProgress.value = { current: 0, total: selectedImages.value.length }

  for (let i = 0; i < selectedImages.value.length; i++) {
    batchProgress.value.current = i
    await performOCR(i)

    // 添加延迟避免频繁调用
    if (i < selectedImages.value.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  batchProgress.value.current = selectedImages.value.length
  isBatchProcessing.value = false
}

// 执行OCR识别
const performOCR = async (imageIndex: number) => {
  const ctx = createContext()

  try {
    logger.info(ctx, '[OCRPage] 开始OCR识别', { imageIndex })

    const image = selectedImages.value[imageIndex]
    if (!image) {
      throw new Error('图片不存在')
    }

    // 确保VisionKit会话已初始化
    await ensureVKSession()

    // 获取图片数据
    let imageData
    try {
      imageData = await getImageData(image.path)
    } catch (err) {
      throw new OCRError(ErrorCode.ERR_OCR_IMAGE_PROCESS_ERROR, '获取图片数据失败')
    }

    // 使用VisionKit OCR API
    const result = await runVKOCR(imageData)

    logger.info(ctx, '[OCRPage] OCR识别成功', {
      imageIndex,
      textsCount: result.texts?.length
    })

    handleOCRSuccess(imageIndex, result)

  } catch (error) {
    logger.error(ctx, '[OCRPage] OCR识别异常', { imageIndex, error })
    await handleOCRFailure(imageIndex, error)

    // 批量处理时继续处理下一张图片
    if (!isBatchProcessing.value) {
      throw error
    }
  }
}

// 处理OCR成功结果
const handleOCRSuccess = (imageIndex: number, result: any) => {
  const ctx = createContext()

  // 提取文字内容
  const texts: OCRText[] = result.texts || []
  const originalText = texts.map(item => item.text).join('\n').trim()
  const averageConfidence = texts.length > 0
    ? texts.reduce((sum, item) => sum + (item.confidence || 0), 0) / texts.length
    : 0

  logger.info(ctx, '[OCRPage] 处理OCR结果', {
    imageIndex,
    textLength: originalText.length,
    confidence: averageConfidence
  })

  // 检查是否识别到文字
  if (!originalText || originalText.length === 0) {
    logger.warn(ctx, '[OCRPage] 未识别到文字内容', { imageIndex })

    // 创建空结果，提示用户手动输入
    createManualInputResult(imageIndex)

    // 显示友好提示
    uni.showToast({
      title: '未识别到文字，请手动输入',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 保存结果
  const existingIndex = ocrResults.value.findIndex(r => r.imageIndex === imageIndex)
  const ocrResult: OCRResult = {
    imageIndex,
    originalText,
    editedText: originalText,
    texts,
    confidence: averageConfidence
  }

  if (existingIndex >= 0) {
    ocrResults.value[existingIndex] = ocrResult
  } else {
    ocrResults.value.push(ocrResult)
  }
}

// 处理OCR失败
const handleOCRFailure = async (imageIndex: number, error: OCRError | Error) => {
  const ctx = createContext()

  // 提取错误信息
  const errorCode = error instanceof OCRError ? error.errorCode : ErrorCode.ERR_OCR_FAILED
  const errno = error instanceof OCRError ? error.errno : undefined

  logger.error(ctx, '[OCRPage] OCR识别失败', {
    imageIndex,
    errorMessage: error.message,
    errorCode,
    errno
  })

  // 只在单张处理或最后一张图片时显示降级选项
  if (!isBatchProcessing.value || imageIndex === selectedImages.value.length - 1) {
    await handleOCRFallback(imageIndex, errorCode)
  }
}

// OCR降级处理
const handleOCRFallback = async (imageIndex: number, errorCode?: number) => {
  const ctx = createContext()

  logger.info(ctx, '[OCRPage] 触发OCR降级处理', {
    imageIndex,
    errorCode: errorCode || ErrorCode.ERR_OCR_FAILED
  })

  // 根据错误码显示不同的提示
  const getErrorMessage = (code?: number) => {
    const errorMsg = getFriendlyErrorMessage(code || ErrorCode.ERR_OCR_FAILED)

    // 对特定错误码提供更详细的降级提示
    switch (code) {
      case ErrorCode.ERR_OCR_VK_NOT_SUPPORTED:
        return errorMsg
      case ErrorCode.ERR_OCR_IMAGE_PROCESS_ERROR:
        return `${errorMsg}，是否手动输入？`
      case ErrorCode.ERR_OCR_TIMEOUT:
        return `${errorMsg}，是否重试或手动输入？`
      case ErrorCode.ERR_OCR_RECOGNITION_FAILED:
        return `${errorMsg}，是否手动输入？`
      default:
        return `${errorMsg}，是否手动输入？`
    }
  }

  const showOptions = errorCode !== ErrorCode.ERR_OCR_VK_NOT_SUPPORTED

  return new Promise<void>((resolve) => {
    if (showOptions) {
      // 显示重试和手动输入选项
      uni.showModal({
        title: '识别失败',
        content: getErrorMessage(errorCode),
        showCancel: true,
        confirmText: '手动输入',
        cancelText: '重试',
        success: (res) => {
          if (res.confirm) {
            createManualInputResult(imageIndex)
          } else {
            // 用户选择重试，递归调用识别
            setTimeout(() => {
              performOCR(imageIndex).catch(() => {
                // 重试失败，强制手动输入
                createManualInputResult(imageIndex)
              })
            }, 1000)
          }
          resolve()
        },
        fail: () => {
          createManualInputResult(imageIndex)
          resolve()
        }
      })
    } else {
      // VisionKit不支持，直接提示手动输入
      uni.showModal({
        title: '功能提示',
        content: getErrorMessage(errorCode),
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          createManualInputResult(imageIndex)
          resolve()
        }
      })
    }
  })
}

// 创建手动输入结果
const createManualInputResult = (imageIndex: number) => {
  const ctx = createContext()

  const ocrResult: OCRResult = {
    imageIndex,
    originalText: '',
    editedText: '',
    texts: [],
    confidence: 0
  }

  const existingIndex = ocrResults.value.findIndex(r => r.imageIndex === imageIndex)
  if (existingIndex >= 0) {
    ocrResults.value[existingIndex] = ocrResult
  } else {
    ocrResults.value.push(ocrResult)
  }

  logger.info(ctx, '[OCRPage] 创建手动输入结果', { imageIndex })

  // 显示提示，引导用户输入
  setTimeout(() => {
    uni.showToast({
      title: '请在下方文本框中输入内容',
      icon: 'none',
      duration: 2000
    })
  }, 500)
}

// 重试OCR
const retryOCR = async (imageIndex: number) => {
  await performOCR(imageIndex)
}

// 手动输入
const manualInput = (imageIndex: number) => {
  // 清空对应结果，让用户手动输入
  const resultIndex = ocrResults.value.findIndex(r => r.imageIndex === imageIndex)
  if (resultIndex >= 0) {
    ocrResults.value[resultIndex].editedText = ''
  }
}

// 获取图片的OCR结果
const getImageOCRResult = (imageIndex: number) => {
  return ocrResults.value.find(result => result.imageIndex === imageIndex)
}

// 判断图片是否正在处理
const isProcessingImage = (imageIndex: number) => {
  return (isSingleProcessing.value && imageIndex === 0) ||
         (isBatchProcessing.value && imageIndex === batchProgress.value.current)
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 保存为笔记
const saveAsNote = () => {
  const ctx = createContext()

  // 合并所有识别结果
  const allText = ocrResults.value
    .filter(result => result.editedText?.trim())
    .map(result => result.editedText.trim())
    .join('\n\n')

  if (!allText) {
    uni.showToast({
      title: '请先输入文字内容',
      icon: 'none'
    })
    return
  }

  logger.info(ctx, '[OCRPage] 保存为笔记', { textLength: allText.length })

  // 跳转到添加笔记页面，传递OCR文本
  uni.navigateTo({
    url: `/pages-note/add/add?ocrText=${encodeURIComponent(allText)}`
  })
}

// 导出文本
const exportText = () => {
  const ctx = createContext()

  const allText = ocrResults.value
    .filter(result => result.editedText?.trim())
    .map(result => result.editedText.trim())
    .join('\n\n')

  if (!allText) {
    uni.showToast({
      title: '没有可导出的内容',
      icon: 'none'
    })
    return
  }

  logger.info(ctx, '[OCRPage] 导出文本', { textLength: allText.length })

  // 复制到剪贴板
  copyText(allText)
}

// 文本处理功能
const getConfidenceLevel = (confidence: number): string => {
  if (confidence >= 0.9) return 'confidence-high'
  if (confidence >= 0.7) return 'confidence-medium'
  return 'confidence-low'
}

const getLineCount = (text: string): number => {
  return text ? text.split('\n').length : 0
}

const formatText = (result: OCRResult) => {
  const ctx = createContext()

  if (!result.editedText?.trim()) {
    uni.showToast({
      title: '没有文本内容',
      icon: 'none'
    })
    return
  }

  // 基础文本格式化
  let formatted = result.editedText
    .replace(/\s+/g, ' ') // 合并多个空白字符
    .replace(/([。！？])\s*([^\s])/g, '$1\n$2') // 句子换行
    .replace(/，\s*/g, '，') // 规范标点符号
    .trim()

  result.editedText = formatted

  logger.info(ctx, '[OCRPage] 文本格式化完成', {
    originalLength: result.originalText?.length || 0,
    formattedLength: formatted.length
  })

  uni.showToast({
    title: '格式化完成',
    icon: 'success'
  })
}

const translateText = () => {
  // 这里可以集成翻译服务
  uni.showToast({
    title: '翻译功能开发中',
    icon: 'none'
  })
}

const copyText = (text: string) => {
  if (!text?.trim()) {
    uni.showToast({
      title: '没有可复制的内容',
      icon: 'none'
    })
    return
  }

  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({
        title: '已复制到剪贴板',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
}

const clearText = (result: OCRResult) => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空这段识别结果吗？',
    showCancel: true,
    success: (res) => {
      if (res.confirm) {
        result.editedText = ''
        uni.showToast({
          title: '已清空',
          icon: 'success'
        })
      }
    }
  })
}

// VisionKit OCR相关方法
let vkSession: any = null

// 检查VisionKit支持
const checkVKSupport = (): boolean => {
  if (typeof wx === 'undefined' || !wx.createVKSession) {
    return false
  }

  // 检查版本支持 (基础库 2.20.0+)
  const version = wx.isVKSupport?.('v2') ? 'v2' : (wx.isVKSupport?.('v1') ? 'v1' : '')
  return !!version
}

// 初始化VisionKit会话
const initVKSession = (): Promise<void> => {
  const ctx = createContext()

  return new Promise((resolve, reject) => {
    try {
      const version = wx.isVKSupport?.('v2') ? 'v2' : 'v1'

      vkSession = wx.createVKSession({
        version,
        track: {
          OCR: {
            mode: 2 // 静态图像模式
          }
        }
      })

      logger.info(ctx, '[OCRPage] VK会话已创建', { version })
      resolve()

    } catch (error) {
      logger.error(ctx, '[OCRPage] 创建VK会话失败', error)
      reject(error)
    }
  })
}

// 获取图片数据
const getImageData = (imagePath: string): Promise<{data: ArrayBuffer, width: number, height: number}> => {
  const ctx = createContext()

  return new Promise((resolve, reject) => {
    // 创建临时canvas元素来处理图片

    uni.getImageInfo({
      src: imagePath,
      success: (imgInfo: any) => {
        logger.info(ctx, '[OCRPage] 获取图片信息成功', {
          width: imgInfo.width,
          height: imgInfo.height
        })

        // 使用canvas绘制图片并获取数据
        const canvasCtx = uni.createCanvasContext('temp-canvas')
        canvasCtx.drawImage(imagePath, 0, 0, imgInfo.width, imgInfo.height)
        canvasCtx.draw(false, () => {
          uni.canvasGetImageData({
            canvasId: 'temp-canvas',
            x: 0,
            y: 0,
            width: imgInfo.width,
            height: imgInfo.height,
            success: (res: any) => {
              resolve({
                data: res.data.buffer,
                width: imgInfo.width,
                height: imgInfo.height
              })
            },
            fail: (err: any) => {
              logger.error(ctx, '[OCRPage] 获取canvas数据失败', err)
              reject(err)
            }
          })
        })
      },
      fail: (err: any) => {
        logger.error(ctx, '[OCRPage] 获取图片信息失败', err)
        reject(err)
      }
    })
  })
}

// 执行VisionKit OCR
const runVKOCR = (imageData: {data: ArrayBuffer, width: number, height: number}): Promise<{texts: OCRText[]}> => {
  const ctx = createContext()
  const OCR_TIMEOUT = 15000 // 15秒超时

  return new Promise((resolve, reject) => {
    // 由ensureVKSession保证vkSession已初始化
    if (!vkSession) {
      reject(new OCRError(ErrorCode.ERR_OCR_VK_NOT_SUPPORTED, 'VK会话意外未初始化'))
      return
    }

    let isResolved = false
    let timeoutId: NodeJS.Timeout

    // 清理函数
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId)
      vkSession.off('updateAnchors', handleUpdateAnchors)
    }

    // 设置超时
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true
        cleanup()
        logger.error(ctx, '[runVKOCR] OCR识别超时')
        reject(new OCRError(ErrorCode.ERR_OCR_TIMEOUT, 'OCR识别超时', undefined))
      }
    }, OCR_TIMEOUT)

    // 设置识别结果监听
    const handleUpdateAnchors = (anchors: any[]) => {
      if (isResolved) return
      isResolved = true
      cleanup()

      logger.info(ctx, '[runVKOCR] VK OCR识别完成', {
        anchorsCount: anchors.length
      })

      // 转换格式为兼容的结果
      const texts: OCRText[] = anchors.map(anchor => ({
        text: anchor.text || '',
        confidence: anchor.confidence || 0.9
      }))

      resolve({ texts })
    }

    // 设置监听器
    vkSession.on('updateAnchors', handleUpdateAnchors)

    // 启动会话
    vkSession.start((errno: number) => {
      if (isResolved) return

      if (errno) {
        isResolved = true
        cleanup()
        const errorCode = mapVKErrnoToErrorCode(errno)
        logger.error(ctx, '[runVKOCR] VK会话启动失败', { errno, errorCode })
        reject(new OCRError(errorCode, `VK会话启动失败`, errno))
        return
      }

      // 运行OCR
      try {
        vkSession.runOCR({
          frameBuffer: imageData.data,
          width: imageData.width,
          height: imageData.height
        })
      } catch (error) {
        if (!isResolved) {
          isResolved = true
          cleanup()
          const errorCode = ErrorCode.ERR_OCR_IMAGE_PROCESS_ERROR
          logger.error(ctx, '[runVKOCR] 运行OCR失败', error)
          reject(new OCRError(errorCode, '运行OCR失败', undefined))
        }
      }
    })
  })
}

// 确保VisionKit会话已初始化（懒加载）
const ensureVKSession = async (): Promise<void> => {
  if (vkSession) return // 已经初始化

  const ctx = createContext()
  if (!checkVKSupport()) {
    throw new OCRError(ErrorCode.ERR_OCR_VK_NOT_SUPPORTED, '设备不支持VisionKit OCR')
  }

  try {
    await initVKSession()
    logger.info(ctx, '[ensureVKSession] VisionKit OCR会话已就绪')
  } catch (error) {
    logger.error(ctx, '[ensureVKSession] VisionKit初始化失败', error)
    throw new OCRError(ErrorCode.ERR_OCR_VK_NOT_SUPPORTED, 'VisionKit初始化失败')
  }
}

// 页面加载
onMounted(() => {
  const ctx = createContext()
  logger.info(ctx, '[OCRPage] 页面加载完成')

  // 预检查VisionKit支持，但不立即初始化
  if (!checkVKSupport()) {
    logger.warn(ctx, '[OCRPage] 设备不支持VisionKit，将使用降级方案')
  }
})

// 页面卸载时清理资源
onBeforeUnmount(() => {
  const ctx = createContext()

  if (vkSession) {
    try {
      vkSession.destroy()
      logger.info(ctx, '[OCRPage] VK会话已销毁')
    } catch (error) {
      logger.error(ctx, '[OCRPage] 销毁VK会话失败', error)
    }
  }
})
</script>

<style lang="scss" scoped>
.ocr-page {
  min-height: 100vh;
  background: var(--cr-color-background, #f9fafb);
}

.page-header {
  padding: 32rpx;
  text-align: center;
  background: white;
  border-bottom: 1rpx solid var(--cr-color-border, #e0e0e0);

  .ocr-title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--cr-color-text, #333);
    margin-bottom: 8rpx;
  }

  .batch-tip {
    font-size: 28rpx;
    color: var(--cr-color-subtext, #666);
  }
}

.image-section {
  margin: 24rpx;
  padding: 32rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--cr-color-text, #333);
    margin-bottom: 24rpx;
  }

  .image-list {
    white-space: nowrap;
    margin-bottom: 24rpx;

    .image-item {
      position: relative;
      display: inline-block;
      width: 200rpx;
      height: 280rpx;
      margin-right: 16rpx;
      border-radius: 12rpx;
      overflow: hidden;

      .image-preview {
        width: 100%;
        height: 200rpx;
        background: var(--cr-color-surface, #f5f5f5);
      }

      .image-info {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.7);
        padding: 8rpx 12rpx;

        .image-size {
          font-size: 20rpx;
          color: white;
        }

        .compressed-tag {
          font-size: 20rpx;
          color: #4CAF50;
          margin-left: 8rpx;
        }
      }

      .delete-image-btn {
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

      .ocr-status {
        position: absolute;
        top: 8rpx;
        left: 8rpx;
        width: 32rpx;
        height: 32rpx;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        &.success {
          background: rgba(76, 175, 80, 0.9);
        }

        &.processing {
          background: rgba(255, 193, 7, 0.9);
        }
      }
    }
  }

  .image-upload-area {
    width: 200rpx;
    height: 280rpx;
    border: 2rpx dashed var(--cr-color-border, #e0e0e0);
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--cr-color-surface, #fafafa);

    &:active:not(.disabled) {
      background: var(--cr-color-surface-hover, #f0f0f0);
    }

    &.disabled {
      opacity: 0.5;
      background: var(--cr-color-surface-disabled, #f5f5f5);
    }

    .upload-placeholder {
      text-align: center;

      .upload-tips {
        display: block;
        margin-top: 16rpx;
        font-size: 24rpx;
        color: var(--cr-color-subtext, #999);
      }
    }
  }
}

.action-section {
  margin: 0 24rpx 24rpx;
  padding: 32rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);

  .action-buttons {
    display: flex;
    gap: 16rpx;
    margin-bottom: 24rpx;

    .ocr-start-btn,
    .batch-ocr-btn {
      flex: 1;
    }
  }

  .batch-progress {
    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;
      font-size: 28rpx;
      color: var(--cr-color-text, #333);
    }
  }
}

.result-section {
  margin: 0 24rpx 24rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--cr-color-text, #333);
    margin-bottom: 24rpx;
    padding: 0 32rpx;
  }

  .ocr-result-area {
    background: white;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24rpx;

      .result-title {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--cr-color-text, #333);
      }

      .result-actions {
        display: flex;
        gap: 12rpx;
      }
    }

    .result-text {
      margin-bottom: 16rpx;
    }

    .result-meta {
      margin-bottom: 16rpx;
    }

    .confidence-info {
      font-size: 24rpx;
      color: var(--cr-color-subtext, #666);
      margin-bottom: 8rpx;

      .confidence-value {
        font-weight: 600;

        &.confidence-high {
          color: #4CAF50;
        }

        &.confidence-medium {
          color: #FF9800;
        }

        &.confidence-low {
          color: #F44336;
        }
      }
    }

    .text-stats {
      display: flex;
      gap: 16rpx;
      font-size: 22rpx;
      color: var(--cr-color-subtext, #999);

      .stats-item {
        background: var(--cr-color-surface, #f5f5f5);
        padding: 4rpx 8rpx;
        border-radius: 4rpx;
      }
    }

    .text-tools {
      display: flex;
      gap: 8rpx;
      margin-top: 16rpx;
      padding-top: 16rpx;
      border-top: 1rpx solid var(--cr-color-border, #e0e0e0);
    }
  }
}

.bottom-actions {
  position: sticky;
  bottom: 0;
  padding: 24rpx;
  background: white;
  border-top: 1rpx solid var(--cr-color-border, #e0e0e0);
  display: flex;
  gap: 16rpx;

  .save-note-btn {
    flex: 2;
  }
}
</style>