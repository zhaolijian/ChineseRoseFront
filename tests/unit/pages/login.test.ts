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

const createUni = () =>
  ({
    showToast: vi.fn(),
    navigateTo: vi.fn(),
    login: vi.fn().mockResolvedValue({ code: 'login-code' }),
    reLaunch: vi.fn()
  }) as any

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('登录首页', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    userStoreMock.wechatQuickLogin.mockResolvedValue(undefined)
    global.uni = createUni()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('应渲染微信一键登录按钮', () => {
    const wrapper = mount(Login, mountOptions)
    const btn = wrapper.find('.wechat-button')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('一键登录')
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

  it('授权手机号后触发微信登录流程', async () => {
    vi.useFakeTimers()

    const wrapper = mount(Login, mountOptions)
    await wrapper.find('checkbox-group').trigger('change', { detail: { value: ['agree'] } })

    await wrapper.find('.wechat-button').trigger('getphonenumber', {
      detail: { code: 'phone-code' }
    })
    await flushPromises()

    expect(global.uni.login).toHaveBeenCalledWith({ provider: 'weixin' })
    expect(userStoreMock.wechatQuickLogin).toHaveBeenCalledWith('login-code', 'phone-code')
    expect(global.uni.showToast).toHaveBeenCalledWith({
      title: '登录成功',
      icon: 'success'
    })

    vi.runAllTimers()

    expect(global.uni.reLaunch).toHaveBeenCalledWith({
      url: '/pages/index/index'
    })
  })

  it('点击“其他手机号登录”跳转到手机号登录页', async () => {
    const wrapper = mount(Login, mountOptions)
    await wrapper.find('.phone-login-button').trigger('click')
    expect(global.uni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/login/phone-login'
    })
  })
})
