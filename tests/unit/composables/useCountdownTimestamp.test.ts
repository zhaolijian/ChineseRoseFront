import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCountdown } from '@/composables/useCountdown'
import { STORAGE_PREFIX } from '@/constants'

const DEFAULT_KEY = `${STORAGE_PREFIX}smsCodeEndTime`

global.uni = {
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn()
}

describe('useCountdown - 时间戳测试', () => {
  let realDateNow: typeof Date.now

  beforeEach(() => {
    vi.clearAllMocks()
    realDateNow = Date.now
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    Date.now = realDateNow
  })

  const mockStorageReturn = (value: number | null) => {
    vi.mocked(uni.getStorageSync).mockImplementation((key: string) => {
      if (key === DEFAULT_KEY) {
        return value
      }
      return null
    })
  }

  describe('基于时间戳的准确计时', () => {
    it('应该基于时间戳计算剩余时间，而非简单递减', () => {
      const { countdown, start } = useCountdown()
      const startTime = 1_000_000_000_000

      Date.now = vi.fn(() => startTime)
      mockStorageReturn(startTime + 60000)

      start(60)
      expect(uni.setStorageSync).toHaveBeenCalledWith(DEFAULT_KEY, startTime + 60000)
      expect(countdown.value).toBe(60)

      Date.now = vi.fn(() => startTime + 10000)
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(50)

      Date.now = vi.fn(() => startTime + 35000)
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(25)
    })

    it('小程序后台运行场景：恢复时应该显示正确的剩余时间', () => {
      const { countdown, restore } = useCountdown()
      const startTime = 1_000_000_000_000

      mockStorageReturn(startTime + 30000)
      Date.now = vi.fn(() => startTime + 15000)

      restore()
      expect(countdown.value).toBe(15)

      Date.now = vi.fn(() => startTime + 20000)
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(10)
    })

    it('极端场景：从后台返回时倒计时已经结束', () => {
      const { countdown, restore } = useCountdown()
      const startTime = 1_000_000_000_000

      mockStorageReturn(startTime + 60000)
      Date.now = vi.fn(() => startTime + 65000)

      restore()
      expect(countdown.value).toBe(0)
      expect(uni.removeStorageSync).toHaveBeenCalledWith(DEFAULT_KEY)
    })

    it('连续调用restore应该只保留一个定时器', () => {
      const { countdown, restore } = useCountdown()
      const startTime = 1_000_000_000_000

      mockStorageReturn(startTime + 30000)
      Date.now = vi.fn(() => startTime)

      restore()
      expect(countdown.value).toBe(30)
      restore()
      expect(countdown.value).toBe(30)

      Date.now = vi.fn(() => startTime + 5000)
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(25)
    })
  })

  describe('onShow 生命周期集成场景', () => {
    it('模拟真实场景：发送验证码 → 进入后台 → 10秒后返回', () => {
      const { countdown, start, restore } = useCountdown()
      const startTime = 1_000_000_000_000

      vi.mocked(uni.getStorageSync).mockImplementation((key: string) => {
        if (key === DEFAULT_KEY) {
          const calls = vi.mocked(uni.setStorageSync).mock.calls
          const lastCall = calls.find(call => call[0] === DEFAULT_KEY)
          return lastCall ? lastCall[1] : null
        }
        return null
      })

      Date.now = vi.fn(() => startTime)
      start(60)
      expect(countdown.value).toBe(60)

      Date.now = vi.fn(() => startTime + 5000)
      vi.advanceTimersByTime(5000)
      expect(countdown.value).toBeGreaterThan(40)

      Date.now = vi.fn(() => startTime + 15000)
      restore()
      expect(countdown.value).toBe(45)

      Date.now = vi.fn(() => startTime + 16000)
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(44)
    })
  })
})
