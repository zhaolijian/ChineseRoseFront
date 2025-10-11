import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import IndexPage from '../index.vue'

const wechatQuickLoginMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/stores', () => ({
  useUserStore: () => ({
    wechatQuickLogin: wechatQuickLoginMock
  })
}))

const createUni = () =>
  ({
    navigateTo: vi.fn(),
    showToast: vi.fn(),
    login: vi.fn().mockResolvedValue({ code: 'login-code' }),
    reLaunch: vi.fn()
  }) as any

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
  wechatQuickLoginMock.mockResolvedValue(undefined)
  global.uni = createUni()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('LoginPage - 设计还原', () => {
  it('点击手机号登录跳转', async () => {
    const wrapper = mount(IndexPage)
    await wrapper.find('.phone-login-button').trigger('click')
    expect(global.uni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/login/phone-login'
    })
  })

  it('点击协议链接跳转对应页面', async () => {
    const wrapper = mount(IndexPage)
    const links = wrapper.findAll('.link')
    await links[0].trigger('click')
    expect(global.uni.navigateTo).toHaveBeenCalledWith({
      url: `/pages/webview/index?url=${encodeURIComponent('https://example.com/user-agreement')}`
    })

    await links[1].trigger('click')
    expect(global.uni.navigateTo).toHaveBeenCalledWith({
      url: `/pages/webview/index?url=${encodeURIComponent('https://example.com/privacy-policy')}`
    })
  })

  it('同意协议后点击一键登录触发微信登录流程', async () => {
    vi.useFakeTimers()

    const wrapper = mount(IndexPage)
    await wrapper.find('checkbox-group').trigger('change', { detail: { value: ['agree'] } })

    await wrapper.find('.wechat-button').trigger('getphonenumber', { detail: { code: 'phone-code' } })
    await flushPromises()

    expect(global.uni.login).toHaveBeenCalledWith({ provider: 'weixin' })
    expect(wechatQuickLoginMock).toHaveBeenCalledWith('login-code', 'phone-code')
    expect(global.uni.showToast).toHaveBeenCalledWith({
      title: '登录成功',
      icon: 'success'
    })

    vi.runAllTimers()
    expect(global.uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/index/index' })
  })

  it('未同意协议时点击按钮显示提示', async () => {
    const wrapper = mount(IndexPage)
    await wrapper.find('.wechat-button').trigger('getphonenumber', { detail: { code: 'phone-code' } })

    expect(global.uni.showToast).toHaveBeenCalledWith({
      title: '请先勾选用户协议和隐私政策',
      icon: 'none',
      duration: 2000
    })
    expect(wechatQuickLoginMock).not.toHaveBeenCalled()
  })
})
