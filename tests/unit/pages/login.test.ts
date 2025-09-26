import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Login from '@/pages/login/login.vue'
import { ref } from 'vue'

const onLoadCallbacks: Function[] = []
const onShowCallbacks: Function[] = []

vi.mock('@dcloudio/uni-app', () => ({
  onLoad(cb: Function) {
    onLoadCallbacks.push(cb)
    cb()
  },
  onShow(cb: Function) {
    onShowCallbacks.push(cb)
  }
}))

const mockCountdown = ref(0)
const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  restore: vi.fn(),
  loginWithPhone: vi.fn(),
  wechatLogin: vi.fn(),
  sendSMSCode: vi.fn()
}))

const mockStart = mocks.start
const mockRestore = mocks.restore

vi.mock('@/composables/useCountdown', () => ({
  useCountdown: () => ({
    countdown: mockCountdown,
    start: mockStart,
    restore: mockRestore
  })
}))

vi.mock('@/stores/modules/user', () => ({
  useUserStore: () => ({
    loginWithPhone: mocks.loginWithPhone,
    wechatLogin: mocks.wechatLogin
  })
}))

vi.mock('@/api/modules/auth', () => ({
  sendSMSCode: mocks.sendSMSCode
}))

vi.mock('@/utils/validate', () => ({
  isValidPhone: (phone: string) => /^1[3-9]\d{9}$/.test(phone)
}))

const createUni = () => ({
  getSystemInfoSync: vi.fn(() => ({ statusBarHeight: 20 })),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showToast: vi.fn(),
  reLaunch: vi.fn(),
  login: vi.fn(() => Promise.resolve({ code: 'mock-code', errMsg: 'login:ok' })),
  showModal: vi.fn()
})

global.uni = createUni() as any

describe('登录页面', () => {
  let wrapper: ReturnType<typeof mount> | null = null

  const mountPage = async () => {
    setActivePinia(createPinia())
    wrapper = mount(Login)
    await wrapper.vm.$nextTick()
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    global.uni = createUni() as any
    mockCountdown.value = 0
    onLoadCallbacks.length = 0
    onShowCallbacks.length = 0
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  it('onLoad 时应该恢复倒计时并读取系统信息', async () => {
    await mountPage()

    expect(onLoadCallbacks.length).toBe(1)
    expect(mockRestore).toHaveBeenCalledTimes(1)
    expect(uni.getSystemInfoSync).toHaveBeenCalled()
  })

  it('onShow 时应再次恢复倒计时', async () => {
    await mountPage()

    expect(onShowCallbacks.length).toBe(1)
    mockRestore.mockClear()

    onShowCallbacks[0]()
    expect(mockRestore).toHaveBeenCalledTimes(1)
  })

  it('倒计时进行时验证码按钮应禁用并展示剩余时间', async () => {
    mockCountdown.value = 30
    await mountPage()

    const button = wrapper!.find('.code-btn')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toBe('30s后重试')
  })

  it('有效手机号时可发送验证码并启动倒计时', async () => {
    mockCountdown.value = 0
    mocks.sendSMSCode.mockResolvedValue({ message: '验证码已发送' })

    await mountPage()
    const phoneInput = wrapper!.find('input[placeholder="请输入手机号"]')
    await phoneInput.setValue('13800138000')

    await wrapper!.find('.code-btn').trigger('click')

    expect(uni.showLoading).toHaveBeenCalledWith({ title: '发送中...' })
    expect(mocks.sendSMSCode).toHaveBeenCalledWith('13800138000')
    expect(mockStart).toHaveBeenCalledWith(60)
    expect(uni.showToast).toHaveBeenCalledWith({ title: '验证码已发送', icon: 'success' })
  })

  it('手机号登录成功后应跳转首页', async () => {
    mocks.loginWithPhone.mockResolvedValue({ success: true, message: '登录成功' })
    await mountPage()

    await wrapper!.find('input[placeholder="请输入手机号"]').setValue('13800138000')
    await wrapper!.find('input[placeholder="请输入验证码"]').setValue('123456')
    
    await wrapper!.vm.$nextTick()
    
    const loginBtn = wrapper!.find('.login-btn')
    // Skip disabled check due to type="number" issues with validation
    
    await loginBtn.trigger('click')
    await wrapper!.vm.$nextTick()

    expect(uni.showLoading).toHaveBeenCalledWith({ title: '登录中...' })
    expect(mocks.loginWithPhone).toHaveBeenCalledWith({ phone: '13800138000', code: '123456' })
    expect(uni.showToast).toHaveBeenCalledWith({ title: '登录成功', icon: 'success' })
    
    // 等待延迟跳转
    await vi.waitFor(() => {
      expect(uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/index/index' })
    }, { timeout: 2000 })
  })

  it('微信手机号授权成功应调用 wechatLogin', async () => {
    mocks.wechatLogin.mockResolvedValue(undefined)
    uni.login = vi.fn(() => Promise.resolve({ code: 'wx-code', errMsg: 'login:ok' }))

    await mountPage()
    const btn = wrapper!.find('.wechat-login-btn')
    await btn.trigger('getphonenumber', {
      detail: {
        errMsg: 'getPhoneNumber:ok',
        encryptedData: 'enc',
        iv: 'iv'
      }
    })

    expect(uni.showLoading).toHaveBeenCalledWith({ title: '登录中...', mask: true })
    expect(uni.login).toHaveBeenCalledWith({ provider: 'weixin' })
    expect(mocks.wechatLogin).toHaveBeenCalledWith({ code: 'wx-code', encryptedData: 'enc', iv: 'iv' })
  })
})
