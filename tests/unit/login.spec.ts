import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Login from '@/pages/login/login.vue'

const userStoreMock = {
  wechatQuickLogin: vi.fn().mockResolvedValue(undefined)
}

vi.mock('@/stores', () => ({
  useUserStore: () => userStoreMock
}))

const mountOptions = {
  global: {
    plugins: [createPinia()]
  }
}

const createUni = () => ({
  showToast: vi.fn(),
  login: vi.fn().mockResolvedValue({ code: 'login-code' }),
  reLaunch: vi.fn()
})

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('Login 页面（基础行为）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    userStoreMock.wechatQuickLogin.mockResolvedValue(undefined)
    global.uni = createUni() as any
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('未勾选协议时阻止微信登录并提示', async () => {
    const wrapper = mount(Login, mountOptions)

    await wrapper.find('.wechat-button').trigger('getphonenumber', { detail: { code: 'phone-code' } })

    expect(global.uni.showToast).toHaveBeenCalledWith({
      title: '请先勾选用户协议和隐私政策',
      icon: 'none',
      duration: 2000
    })
    expect(userStoreMock.wechatQuickLogin).not.toHaveBeenCalled()
  })

  it('勾选协议后触发微信一键登录流程', async () => {
    vi.useFakeTimers()

    const wrapper = mount(Login, mountOptions)
    await wrapper.find('checkbox-group').trigger('change', { detail: { value: ['agree'] } })

    await wrapper.find('.wechat-button').trigger('getphonenumber', { detail: { code: 'phone-code' } })
    await flushPromises()

    expect(global.uni.login).toHaveBeenCalledWith({ provider: 'weixin' })
    expect(userStoreMock.wechatQuickLogin).toHaveBeenCalledWith('login-code', 'phone-code')

    vi.runAllTimers()

    expect(global.uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/index/index' })
  })
})
