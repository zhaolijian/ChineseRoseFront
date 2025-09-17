import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCountdown } from '@/composables/useCountdown'

// 模拟 uni 对象
global.uni = {
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn()
}

describe('useCountdown composable', () => {
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks()
    // 使用假定时器
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    // 恢复真实定时器
    vi.useRealTimers()
  })
  
  describe('start 函数', () => {
    it('应该开始倒计时并保存结束时间到存储', () => {
      const { countdown, start } = useCountdown()
      const now = Date.now()
      vi.setSystemTime(now)
      
      // 模拟存储返回值
      vi.mocked(uni.getStorageSync).mockReturnValue(now + 60000)
      
      // 开始60秒倒计时
      start(60)
      
      // 验证初始值
      expect(countdown.value).toBe(60)
      
      // 验证存储被调用
      expect(uni.setStorageSync).toHaveBeenCalledWith('smsCodeEndTime', now + 60000)
      
      // 前进1秒，模拟时间流逝
      vi.setSystemTime(now + 1000)
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(59)
      
      // 前进到结束
      vi.setSystemTime(now + 60000)
      vi.advanceTimersByTime(59000)
      expect(countdown.value).toBe(0)
      
      // 验证存储被清除
      expect(uni.removeStorageSync).toHaveBeenCalledWith('smsCodeEndTime')
    })
    
    it('应该在开始新倒计时前停止之前的倒计时', () => {
      const { countdown, start } = useCountdown()
      const now = Date.now()
      vi.setSystemTime(now)
      
      // 第一次倒计时
      vi.mocked(uni.getStorageSync).mockReturnValue(now + 60000)
      start(60)
      
      // 前进5秒
      vi.setSystemTime(now + 5000)
      vi.advanceTimersByTime(5000)
      expect(countdown.value).toBe(55)
      
      // 开始新的倒计时
      const newNow = now + 5000
      vi.mocked(uni.getStorageSync).mockReturnValue(newNow + 30000)
      start(30)
      expect(countdown.value).toBe(30)
      
      // 确保之前的倒计时不会影响新倒计时
      vi.setSystemTime(newNow + 1000)
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(29)
    })
  })
  
  describe('stop 函数', () => {
    it('应该停止倒计时并重置为0', () => {
      const { countdown, start, stop } = useCountdown()
      const now = Date.now()
      vi.setSystemTime(now)
      
      vi.mocked(uni.getStorageSync).mockReturnValue(now + 60000)
      start(60)
      
      // 前进5秒
      vi.setSystemTime(now + 5000)
      vi.advanceTimersByTime(5000)
      expect(countdown.value).toBe(55)
      
      stop()
      expect(countdown.value).toBe(0)
      
      // 验证定时器已停止
      vi.setSystemTime(now + 10000)
      vi.advanceTimersByTime(5000)
      expect(countdown.value).toBe(0)
    })
  })
  
  describe('restore 函数', () => {
    it('应该从存储恢复倒计时（剩余25秒）', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      
      // 模拟存储中有25秒后过期的时间戳
      vi.mocked(uni.getStorageSync).mockReturnValue(now + 25000)
      
      const { countdown, restore } = useCountdown()
      restore()
      
      expect(countdown.value).toBe(25)
      
      // 验证倒计时正常工作
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(24)
    })
    
    it('应该在恢复的倒计时结束时清除存储', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      
      // 模拟存储中有5秒后过期的时间戳
      vi.mocked(uni.getStorageSync).mockReturnValue(now + 5000)
      
      const { countdown, restore } = useCountdown()
      restore()
      
      expect(countdown.value).toBe(5)
      
      // 前进到结束
      vi.advanceTimersByTime(5000)
      expect(countdown.value).toBe(0)
      expect(uni.removeStorageSync).toHaveBeenCalledWith('smsCodeEndTime')
    })
    
    it('如果倒计时已过期应该清除存储', () => {
      const now = Date.now()
      vi.setSystemTime(now)
      
      // 模拟存储中有已过期的时间戳（5秒前）
      vi.mocked(uni.getStorageSync).mockReturnValue(now - 5000)
      
      const { countdown, restore } = useCountdown()
      restore()
      
      expect(countdown.value).toBe(0)
      expect(uni.removeStorageSync).toHaveBeenCalledWith('smsCodeEndTime')
    })
    
    it('如果存储中没有数据应该不做任何操作', () => {
      vi.mocked(uni.getStorageSync).mockReturnValue(null)
      
      const { countdown, restore } = useCountdown()
      restore()
      
      expect(countdown.value).toBe(0)
      expect(uni.removeStorageSync).not.toHaveBeenCalled()
    })
  })
  
  describe('自定义存储键', () => {
    it('应该使用自定义的存储键', () => {
      const customKey = 'customCountdownKey'
      const { start, restore } = useCountdown(customKey)
      const now = Date.now()
      vi.setSystemTime(now)
      
      // 开始倒计时
      start(30)
      expect(uni.setStorageSync).toHaveBeenCalledWith(customKey, now + 30000)
      
      // 模拟恢复
      vi.mocked(uni.getStorageSync).mockReturnValue(now + 15000)
      restore()
      expect(uni.getStorageSync).toHaveBeenCalledWith(customKey)
    })
  })
})