<template>
  <view class="isbn-scanner">
    <!-- 扫码结果展示 -->
    <view v-if="scannedISBN" class="scan-result">
      <view class="result-header">
        <u-icon name="checkmark-circle" size="20" color="#4CAF50" />
        <text class="result-title">扫码成功</text>
      </view>
      <view class="isbn-info">
        <text class="isbn-label">ISBN：</text>
        <text class="isbn-value">{{ scannedISBN }}</text>
      </view>
      <view class="result-actions">
        <u-button type="primary" size="small" @click="queryBookInfo" :loading="loading">查询书籍信息</u-button>
        <u-button type="default" size="small" @click="resetScan">重新扫码</u-button>
      </view>
    </view>

    <!-- 扫码按钮 -->
    <view v-else class="scan-trigger" @click="startScan">
      <view class="scan-icon">
        <u-icon name="scan" size="40" color="#2E7D32" />
      </view>
      <text class="scan-text">点击扫描ISBN条码</text>
      <text class="scan-tip">支持图书背面的条形码</text>
    </view>

    <!-- 手动输入选项 -->
    <view class="manual-input" v-if="!scannedISBN">
      <text class="manual-text">找不到条码？</text>
      <u-button type="default" size="small" @click="showManualInput = true">手动输入ISBN</u-button>
    </view>

    <!-- 手动输入弹窗 -->
    <u-popup v-model="showManualInput" mode="center" :custom-style="{padding: '40rpx'}">
      <view class="manual-input-modal">
        <view class="modal-header">
          <text class="modal-title">输入ISBN</text>
        </view>
        <view class="modal-content">
          <u-input
            v-model="manualISBN"
            placeholder="请输入13位ISBN码"
            maxlength="13"
            type="number"
            :custom-style="{marginBottom: '20rpx'}"
          />
          <text class="input-tip">ISBN通常为13位数字，如：9787111234567</text>
        </view>
        <view class="modal-actions">
          <u-button type="default" @click="showManualInput = false">取消</u-button>
          <u-button
            type="primary"
            @click="confirmManualInput"
            :disabled="!isValidISBN(manualISBN)"
          >
            确定
          </u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { searchBookByISBN, type Book } from '@/api/modules/book'
import { logger, createContext } from '@/utils'

// Props
const props = defineProps<{
  modelValue?: string
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'bookFound': [book: Book]
  'scanComplete': [isbn: string]
}>()

// 响应式数据
const scannedISBN = ref<string>(props.modelValue || '')
const manualISBN = ref<string>('')
const showManualInput = ref<boolean>(false)
const loading = ref<boolean>(false)

// ISBN格式验证
const isValidISBN = (isbn: string): boolean => {
  if (!isbn) return false
  const cleanISBN = isbn.replace(/[-\s]/g, '')
  return /^\d{13}$/.test(cleanISBN)
}

// 开始扫码
const startScan = () => {
  const ctx = createContext()

  uni.scanCode({
    scanType: ['barCode'],
    success: (res) => {
      logger.info(ctx, '[IsbnScanner] 扫码成功', { result: res.result })

      const isbn = res.result.trim()
      if (isValidISBN(isbn)) {
        scannedISBN.value = isbn
        emit('update:modelValue', isbn)
        emit('scanComplete', isbn)
      } else {
        uni.showToast({
          title: '扫码结果不是有效的ISBN',
          icon: 'none'
        })
      }
    },
    fail: (err) => {
      logger.error(ctx, '[IsbnScanner] 扫码失败', err)
      if (err.errMsg !== 'scanCode:fail cancel') {
        uni.showToast({
          title: '扫码失败，请重试',
          icon: 'none'
        })
      }
    }
  })
}

// 查询书籍信息
const queryBookInfo = async () => {
  if (!scannedISBN.value) return

  const ctx = createContext()
  try {
    loading.value = true

    logger.info(ctx, '[IsbnScanner] 开始查询ISBN', { isbn: scannedISBN.value })

    const book = await searchBookByISBN(scannedISBN.value)

    logger.info(ctx, '[IsbnScanner] ISBN查询成功', {
      isbn: scannedISBN.value,
      title: book.title
    })

    emit('bookFound', book)

    uni.showToast({
      title: '找到书籍信息',
      icon: 'success'
    })
  } catch (error) {
    logger.error(ctx, '[IsbnScanner] ISBN查询失败', error)

    uni.showModal({
      title: '查询失败',
      content: '未找到该ISBN的书籍信息，是否手动添加？',
      confirmText: '手动添加',
      cancelText: '重新扫码',
      success: (res) => {
        if (res.confirm) {
          // 保留ISBN，让用户手动填写其他信息
          emit('bookFound', {
            id: 0,
            title: '',
            isbn: scannedISBN.value,
            source: 'manual'
          } as Book)
        } else {
          resetScan()
        }
      }
    })
  } finally {
    loading.value = false
  }
}

// 确认手动输入
const confirmManualInput = () => {
  if (!isValidISBN(manualISBN.value)) return

  scannedISBN.value = manualISBN.value
  emit('update:modelValue', manualISBN.value)
  emit('scanComplete', manualISBN.value)

  showManualInput.value = false
  manualISBN.value = ''
}

// 重置扫码
const resetScan = () => {
  scannedISBN.value = ''
  emit('update:modelValue', '')
}
</script>

<style lang="scss" scoped>
.isbn-scanner {
  padding: 32rpx;
  background: white;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.scan-result {
  .result-header {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;

    .result-title {
      margin-left: 8rpx;
      font-size: 32rpx;
      font-weight: 600;
      color: #4CAF50;
    }
  }

  .isbn-info {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
    padding: 16rpx;
    background: #f5f5f5;
    border-radius: 8rpx;

    .isbn-label {
      font-size: 28rpx;
      color: #666;
    }

    .isbn-value {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
      font-family: monospace;
    }
  }

  .result-actions {
    display: flex;
    gap: 16rpx;
  }
}

.scan-trigger {
  text-align: center;
  padding: 40rpx 20rpx;

  .scan-icon {
    margin-bottom: 16rpx;
  }

  .scan-text {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 8rpx;
  }

  .scan-tip {
    display: block;
    font-size: 24rpx;
    color: #999;
  }
}

.manual-input {
  margin-top: 32rpx;
  padding-top: 32rpx;
  border-top: 1rpx solid #e0e0e0;
  text-align: center;

  .manual-text {
    font-size: 28rpx;
    color: #666;
    margin-right: 16rpx;
  }
}

.manual-input-modal {
  width: 560rpx;

  .modal-header {
    text-align: center;
    margin-bottom: 32rpx;

    .modal-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
    }
  }

  .modal-content {
    margin-bottom: 32rpx;

    .input-tip {
      font-size: 24rpx;
      color: #666;
      line-height: 1.4;
    }
  }

  .modal-actions {
    display: flex;
    gap: 16rpx;
  }
}
</style>