import { ref, onUnmounted } from 'vue'
import { STORAGE_PREFIX } from '@/constants'

/**
 * 倒计时 Composable
 * 用于管理验证码倒计时等场景
 * 基于时间戳计算，确保后台运行时计时准确
 */
export function useCountdown(storageKey = `${STORAGE_PREFIX}smsCodeEndTime`) {
  const countdown = ref(0)
  let timer: number | null = null
  
  /**
   * 更新倒计时显示
   * 基于结束时间戳计算剩余秒数
   */
  const updateCountdown = () => {
    const endTime = uni.getStorageSync(storageKey)
    if (!endTime) {
      stop()
      return
    }
    
    const now = Date.now()
    const remaining = Math.floor((endTime - now) / 1000)
    
    if (remaining <= 0) {
      stop()
      uni.removeStorageSync(storageKey)
    } else {
      countdown.value = remaining
    }
  }
  
  /**
   * 开始倒计时
   * @param seconds 倒计时秒数
   */
  const start = (seconds: number) => {
    // 清除之前的计时器
    stop()

    // 保存结束时间到存储
    const endTime = Date.now() + seconds * 1000
    uni.setStorageSync(storageKey, endTime)

    // 立即设置倒计时值，避免时间差
    countdown.value = seconds

    // 启动计时器，每秒更新一次
    timer = setInterval(updateCountdown, 1000) as unknown as number
  }
  
  /**
   * 停止倒计时
   */
  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    countdown.value = 0
  }
  
  /**
   * 恢复倒计时状态
   * 从存储中恢复之前的倒计时
   */
  const restore = () => {
    // 清除之前的计时器
    stop()
    
    const endTime = uni.getStorageSync(storageKey)
    if (!endTime) return
    
    const now = Date.now()
    const remaining = Math.floor((endTime - now) / 1000)
    
    if (remaining > 0) {
      // 立即更新显示
      countdown.value = remaining
      // 启动定时器继续倒计时
      timer = setInterval(updateCountdown, 1000) as unknown as number
    } else {
      // 已过期，清除存储
      uni.removeStorageSync(storageKey)
    }
  }
  
  // 组件卸载时清理计时器
  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
    }
  })
  
  return {
    countdown,
    start,
    stop,
    restore
  }
}