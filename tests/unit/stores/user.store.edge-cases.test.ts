import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import * as authAPI from '@/api/modules/auth'
import * as storage from '@/utils/storage'
import { ErrorCode } from '@/types/errorCodes'

vi.mock('@/api/modules/auth', () => ({
  wechatCodeLogin: vi.fn(),
  wechatPhoneLogin: vi.fn(),
  wechatQuickLogin: vi.fn(),
  smsLogin: vi.fn(),
  sendSMSCode: vi.fn(),
  getUserInfo: vi.fn(),
  updateUserInfo: vi.fn(),
  logout: vi.fn()
}))

vi.mock('@/utils/storage', () => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn()
}))

describe('user store – 边界与竞态处理', () => {
  const uniMock = {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showToast: vi.fn()
  }

  let store: ReturnType<typeof useUserStore>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = useUserStore()

    vi.mocked(storage.setStorage).mockResolvedValue()
    vi.mocked(storage.removeStorage).mockResolvedValue()
    vi.mocked(authAPI.logout).mockResolvedValue()

    global.uni = uniMock as any
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('wechatQuickLogin 并发调用时后续请求应被拒绝', async () => {
    let resolveLogin: (value: any) => void
    const pendingPromise = new Promise((resolve) => { resolveLogin = resolve })

    vi.mocked(authAPI.wechatQuickLogin).mockReturnValue(pendingPromise as any)

    const first = store.wechatQuickLogin('loginCode', 'phoneCode')
    const second = store.wechatQuickLogin('loginCode', 'phoneCode')

    await expect(second).rejects.toMatchObject({ code: ErrorCode.ERR_OPERATION_IN_PROGRESS })

    resolveLogin!({ token: 'token', user: { id: 1 } })
    await first

    expect(store.userInfo?.id).toBe(1)
  })

  it('loginWithPhone 失败后锁应被释放，允许再次尝试', async () => {
    vi.mocked(authAPI.smsLogin)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ token: 'next', user: { id: 2 } })

    const first = await store.loginWithPhone({ phone: '13800000000', code: '000000' })
    expect(first.success).toBe(false)

    const second = await store.loginWithPhone({ phone: '13800000000', code: '000000' })
    expect(second.success).toBe(true)
    expect(store.userInfo?.id).toBe(2)
  })

  it('logout 应清除状态并调用存储清理', async () => {
    store.token = 'token'
    store.userInfo = { id: 3, nickname: 'tester' } as any

    await store.logout()

    expect(store.token).toBe('')
    expect(store.userInfo).toBe(null)
    expect(storage.removeStorage).toHaveBeenCalledWith('token')
    expect(storage.removeStorage).toHaveBeenCalledWith('userInfo')
  })
})
