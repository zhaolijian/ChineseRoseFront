import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCountdown } from '@/composables/useCountdown'

// 模拟 uni 对象
global.uni = {
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn()
}

describe('useCountdown - 时间戳测试', () => {
  let realDateNow: typeof Date.now
  
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks()
    // 保存真实的 Date.now
    realDateNow = Date.now
    // 使用假定时器
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    // 恢复真实定时器
    vi.useRealTimers()
    // 恢复真实的 Date.now
    Date.now = realDateNow
  })
  
  describe('基于时间戳的准确计时', () => {
    it('应该基于时间戳计算剩余时间，而非简单递减', () => {
      const { countdown, start } = useCountdown()
      const startTime = 1000000000000 // 固定的开始时间
      
      // 模拟当前时间
      Date.now = vi.fn(() => startTime)
      
      // 设置 getStorageSync 的 mock，当 setStorageSync 被调用后返回对应的值
      vi.mocked(uni.getStorageSync).mockImplementation((key) => {
        if (key === 'smsCodeEndTime') {
          // 返回 setStorageSync 设置的值
          const calls = vi.mocked(uni.setStorageSync).mock.calls
          const lastCall = calls.find(call => call[0] === 'smsCodeEndTime')
          return lastCall ? lastCall[1] : null
        }
        return null
      })
      
      // 开始60秒倒计时
      start(60)
      
      // 验证存储的是结束时间戳
      expect(uni.setStorageSync).toHaveBeenCalledWith('smsCodeEndTime', startTime + 60000)
      
      // 初始值应该是60
      expect(countdown.value).toBe(60)
      
      // 模拟过了10秒
      Date.now = vi.fn(() => startTime + 10000)
      vi.advanceTimersByTime(1000) // 触发一次更新
      
      // 应该剩余50秒
      expect(countdown.value).toBe(50)
      
      // 再模拟过了25秒
      Date.now = vi.fn(() => startTime + 35000)
      vi.advanceTimersByTime(1000) // 触发一次更新
      
      // 应该剩余25秒
      expect(countdown.value).toBe(25)
    })
    
    it('小程序后台运行场景：恢复时应该显示正确的剩余时间', () => {
      const { countdown, restore } = useCountdown()
      const startTime = 1000000000000
      
      // 模拟存储中有一个30秒后过期的时间戳
      vi.mocked(uni.getStorageSync).mockReturnValue(startTime + 30000)
      
      // 模拟当前时间已经过去了15秒
      Date.now = vi.fn(() => startTime + 15000)
      
      // 恢复倒计时
      restore()
      
      // 应该显示剩余15秒
      expect(countdown.value).toBe(15)
      
      // 继续倒计时5秒
      Date.now = vi.fn(() => startTime + 20000)
      vi.advanceTimersByTime(1000)
      
      // 应该剩余10秒
      expect(countdown.value).toBe(10)
    })
    
    it('极端场景：从后台返回时倒计时已经结束', () => {
      const { countdown, restore } = useCountdown()
      const startTime = 1000000000000
      
      // 模拟存储中有一个60秒后过期的时间戳
      vi.mocked(uni.getStorageSync).mockReturnValue(startTime + 60000)
      
      // 模拟当前时间已经过去了65秒（已过期）
      Date.now = vi.fn(() => startTime + 65000)
      
      // 恢复倒计时
      restore()
      
      // 倒计时应该是0
      expect(countdown.value).toBe(0)
      // 存储应该被清除
      expect(uni.removeStorageSync).toHaveBeenCalledWith('smsCodeEndTime')
    })
    
    it('连续调用restore应该只保留一个定时器', () => {
      const { countdown, restore } = useCountdown()
      const startTime = 1000000000000
      
      // 模拟存储中有一个30秒后过期的时间戳
      vi.mocked(uni.getStorageSync).mockReturnValue(startTime + 30000)
      Date.now = vi.fn(() => startTime)
      
      // 第一次恢复
      restore()
      expect(countdown.value).toBe(30)
      
      // 第二次恢复（应该清除之前的定时器）
      restore()
      expect(countdown.value).toBe(30)
      
      // 前进5秒
      Date.now = vi.fn(() => startTime + 5000)
      vi.advanceTimersByTime(1000)
      
      // 应该只有一个定时器在工作
      expect(countdown.value).toBe(25)
    })
  })
  
  describe('onShow 生命周期集成场景', () => {
    it('模拟真实场景：发送验证码 → 进入后台 → 10秒后返回', () => {
      const { countdown, start, restore } = useCountdown()
      const startTime = 1000000000000
      
      // 设置 getStorageSync 的 mock
      vi.mocked(uni.getStorageSync).mockImplementation((key) => {
        if (key === 'smsCodeEndTime') {
          const calls = vi.mocked(uni.setStorageSync).mock.calls
          const lastCall = calls.find(call => call[0] === 'smsCodeEndTime')
          return lastCall ? lastCall[1] : null
        }
        return null
      })
      
      // 步骤1：用户点击发送验证码
      Date.now = vi.fn(() => startTime)
      start(60)
      expect(countdown.value).toBe(60)
      
      // 步骤2：用户切到后台（5秒后）
      Date.now = vi.fn(() => startTime + 5000)
      vi.advanceTimersByTime(5000)
      expect(countdown.value).toBe(55)
      
      // 步骤3：模拟后台运行10秒（定时器被系统暂停）
      // 此时实际时间已过去15秒，但倒计时仍显示55秒
      
      // 步骤4：用户从后台返回，触发 onShow
      Date.now = vi.fn(() => startTime + 15000)
      restore()
      
      // 倒计时应该正确显示45秒（60-15）
      expect(countdown.value).toBe(45)
      
      // 验证倒计时继续正常工作
      Date.now = vi.fn(() => startTime + 16000)
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(44)
    })
  })
})