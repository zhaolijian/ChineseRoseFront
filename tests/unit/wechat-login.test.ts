import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import * as authAPI from '@/api/modules/auth'
import * as storage from '@/utils/storage'
import { ErrorCode } from '@/types/errorCodes'

vi.mock('@/api/modules/auth', () => ({
  wechatCodeLogin: vi.fn(),
  wechatPhoneLogin: vi.fn(),
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

describe('user store – 微信登录流程', () => {
  const uniMock = {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showToast: vi.fn()
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(storage.setStorage).mockResolvedValue()
    vi.mocked(storage.removeStorage).mockResolvedValue()
    vi.mocked(authAPI.logout).mockResolvedValue()
    global.uni = uniMock as any
  })

  const createToken = () => {
    const now = Math.floor(Date.now() / 1000)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
    const payload = Buffer.from(JSON.stringify({
      user_id: 10,
      exp: now + 3600,
      iat: now - 10,
      nbf: now - 10
    })).toString('base64')
    return `${header}.${payload}.signature`
  }

  it('wechatLogin 应调用 wechatPhoneLogin 并持久化用户信息', async () => {
    const store = useUserStore()
    const apiResult = { token: createToken(), user: { id: 10, phone: '13800000000' } }
    vi.mocked(authAPI.wechatPhoneLogin).mockResolvedValue(apiResult)

    await store.wechatLogin({ code: 'code', encryptedData: 'enc', iv: 'iv' })

    expect(uni.showLoading).toHaveBeenCalledWith({ title: '登录中...', mask: true })
    expect(authAPI.wechatPhoneLogin).toHaveBeenCalledWith({ code: 'code', encryptedData: 'enc', iv: 'iv' })
    expect(store.userInfo).toEqual(apiResult.user)
    expect(storage.setStorage).toHaveBeenCalledWith('token', apiResult.token)
    expect(storage.setStorage).toHaveBeenCalledWith('userInfo', apiResult.user)
  })

  it('wechatLogin 参数缺失时应抛出业务异常', async () => {
    const store = useUserStore()

    await expect(store.wechatLogin({ code: '', encryptedData: '', iv: '' }))
      .rejects.toMatchObject({ code: ErrorCode.ERR_INVALID_PARAMS })
  })

  it('wechatLogin 网络错误应提示并返回超时错误码', async () => {
    const store = useUserStore()
    vi.mocked(authAPI.wechatPhoneLogin).mockRejectedValue(new Error('Network Error'))

    await expect(store.wechatLogin({ code: 'c', encryptedData: 'e', iv: 'i' }))
      .rejects.toMatchObject({ code: ErrorCode.ERR_REQUEST_TIMEOUT })

    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ icon: 'none' }))
  })

  it('loginWithWeChat 应调用 wechatCodeLogin 并返回成功结构', async () => {
    const store = useUserStore()
    const apiResponse = { token: createToken(), user: { id: 3 } }
    vi.mocked(authAPI.wechatCodeLogin).mockResolvedValue(apiResponse)

    const result = await store.loginWithWeChat({
      code: 'wx_code',
      userInfo: {
        nickName: 'test',
        avatarUrl: 'url',
        gender: 1
      }
    })

    expect(result.success).toBe(true)
    expect(authAPI.wechatCodeLogin).toHaveBeenCalledWith({
      code: 'wx_code',
      nickname: 'test',
      avatar: 'url',
      gender: 1
    })
    expect(store.token).toBe(apiResponse.token)
  })
})
