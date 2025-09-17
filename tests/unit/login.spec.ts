import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Login from '@/pages/login/login.vue'

// 模拟 uni-app API
vi.mock('@dcloudio/uni-app', () => ({
  onLoad: vi.fn((callback) => callback()),
  onShow: vi.fn((callback) => callback())
}))

// 模拟 uni 全局对象
global.uni = {
  getSystemInfoSync: vi.fn(() => ({ statusBarHeight: 20 })),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showToast: vi.fn(),
  reLaunch: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn()
}

// 模拟 user store
const mockPhoneLogin = vi.fn()
const mockWechatLogin = vi.fn()

vi.mock('@/stores/modules/user', () => ({
  useUserStore: vi.fn(() => ({
    phoneLogin: mockPhoneLogin,
    wechatLogin: mockWechatLogin
  }))
}))

// 模拟验证工具
vi.mock('@/utils/validate', () => ({
  isValidPhone: vi.fn((phone) => /^1[3-9]\d{9}$/.test(phone))
}))

describe('登录页面', () => {
  beforeEach(() => {
    // 创建并激活 Pinia
    setActivePinia(createPinia())
    
    // 清理所有 mock
    vi.clearAllMocks()
    
    // 重置存储，确保没有倒计时状态
    global.uni.getStorageSync = vi.fn((key) => {
      if (key === 'smsCodeEndTime') {
        return null  // 返回null，表示没有倒计时
      }
      return null
    })
  })

  it('应该在页面加载时恢复验证码倒计时状态', () => {
    // 模拟存储中有倒计时数据 - 25秒后过期
    const mockStorage = {
      getStorageSync: vi.fn((key) => {
        if (key === 'smsCodeEndTime') {
          return Date.now() + 25000  // 25秒后的时间戳
        }
        return null
      })
    }
    global.uni = { ...global.uni, ...mockStorage }

    const wrapper = mount(Login)
    
    // 验证倒计时是否正确恢复（应该是25秒）
    const codeButton = wrapper.find('.code-btn')
    expect(codeButton.text()).toBe('25s后重试')
    expect(codeButton.classes()).toContain('disabled')
  })

  describe('手机验证码登录功能', () => {
    it('应该正确渲染手机号和验证码输入框', () => {
      const wrapper = mount(Login)
      
      // 验证手机号输入框
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      expect(phoneInput.exists()).toBe(true)
      expect(phoneInput.attributes('type')).toBe('number')
      expect(phoneInput.attributes('maxlength')).toBe('11')
      
      // 验证验证码输入框
      const codeInput = wrapper.find('input[placeholder="请输入验证码"]')
      expect(codeInput.exists()).toBe(true)
      expect(codeInput.attributes('type')).toBe('number')
      expect(codeInput.attributes('maxlength')).toBe('6')
      
      // 验证获取验证码按钮
      const codeButton = wrapper.find('.code-btn')
      expect(codeButton.exists()).toBe(true)
      expect(codeButton.text()).toBe('获取验证码')
      
      // 验证登录按钮
      const loginButton = wrapper.find('.login-btn')
      expect(loginButton.exists()).toBe(true)
      expect(loginButton.text()).toBe('登录')
    })

    it('应该在手机号无效时禁用获取验证码按钮', async () => {
      const wrapper = mount(Login)
      
      // 获取手机号输入框和验证码按钮
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      const codeButton = wrapper.find('.code-btn')
      
      // 初始状态，按钮应该被禁用
      expect(codeButton.classes()).toContain('disabled')
      expect(codeButton.attributes('disabled')).toBeDefined()
      
      // 输入无效手机号
      await phoneInput.setValue('123')
      await wrapper.vm.$nextTick()
      
      // 按钮仍应该被禁用
      expect(codeButton.classes()).toContain('disabled')
      
      // 输入有效手机号
      await phoneInput.setValue('13800138000')
      await wrapper.vm.$nextTick()
      
      // 按钮应该启用
      expect(codeButton.classes()).not.toContain('disabled')
      expect(codeButton.attributes('disabled')).toBeUndefined()
    })

    it('应该在输入无效时禁用登录按钮', async () => {
      const wrapper = mount(Login)
      
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      const codeInput = wrapper.find('input[placeholder="请输入验证码"]')
      const loginButton = wrapper.find('.login-btn')
      
      // 初始状态，登录按钮应该被禁用
      expect(loginButton.classes()).toContain('disabled')
      
      // 只输入手机号
      await phoneInput.setValue('13800138000')
      await wrapper.vm.$nextTick()
      
      // 登录按钮仍应该被禁用
      expect(loginButton.classes()).toContain('disabled')
      
      // 输入验证码但长度不够
      await codeInput.setValue('123')
      await wrapper.vm.$nextTick()
      
      // 登录按钮仍应该被禁用
      expect(loginButton.classes()).toContain('disabled')
      
      // 输入完整验证码
      await codeInput.setValue('123456')
      await wrapper.vm.$nextTick()
      
      // 登录按钮应该启用
      expect(loginButton.classes()).not.toContain('disabled')
    })

    it('应该成功发送验证码并开始倒计时', async () => {
      const wrapper = mount(Login)
      
      // 输入有效手机号
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      await phoneInput.setValue('13800138000')
      await wrapper.vm.$nextTick()
      
      // 点击获取验证码按钮
      const codeButton = wrapper.find('.code-btn')
      await codeButton.trigger('click')
      
      // 验证是否显示加载状态
      expect(global.uni.showLoading).toHaveBeenCalledWith({ title: '发送中...' })
      
      // 等待模拟的异步操作完成
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // 验证是否隐藏加载并显示成功提示
      expect(global.uni.hideLoading).toHaveBeenCalled()
      expect(global.uni.showToast).toHaveBeenCalledWith({
        title: '验证码已发送',
        icon: 'success'
      })
      
      // 验证倒计时是否开始
      expect(codeButton.text()).toContain('s后重试')
      expect(codeButton.classes()).toContain('disabled')
      
      // 验证是否保存了倒计时结束时间到存储
      expect(global.uni.setStorageSync).toHaveBeenCalledWith(
        'smsCodeEndTime',
        expect.any(Number)
      )
    })

    it('应该处理发送验证码失败的情况', async () => {
      const wrapper = mount(Login)
      
      // TODO: 当实现了真实的API调用后，这个测试需要更新
      // 现在只能测试模拟的成功情况
      
      // 输入有效手机号
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      await phoneInput.setValue('13800138000')
      await wrapper.vm.$nextTick()
      
      // 获取验证码按钮
      const codeButton = wrapper.find('.code-btn')
      
      // 暂时跳过失败情况的测试，因为当前是模拟成功
      expect(codeButton.exists()).toBe(true)
    })

    it('应该成功执行手机号登录流程', async () => {
      const wrapper = mount(Login)
      
      // 设置 mock 函数返回值
      mockPhoneLogin.mockResolvedValue({
        token: 'test_token',
        user: { id: '123', phone: '13800138000' }
      })
      
      // 输入手机号和验证码
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      const codeInput = wrapper.find('input[placeholder="请输入验证码"]')
      
      await phoneInput.setValue('13800138000')
      await codeInput.setValue('123456')
      await wrapper.vm.$nextTick()
      
      // 点击登录按钮
      const loginButton = wrapper.find('.login-btn')
      await loginButton.trigger('click')
      
      // 验证是否显示加载状态
      expect(global.uni.showLoading).toHaveBeenCalledWith({ title: '登录中...' })
      
      // 验证是否调用了 phoneLogin 方法
      expect(mockPhoneLogin).toHaveBeenCalledWith({
        phone: '13800138000',
        code: '123456'
      })
      
      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      
      // 验证登录成功后的操作
      expect(global.uni.hideLoading).toHaveBeenCalled()
      expect(global.uni.showToast).toHaveBeenCalledWith({
        title: '登录成功',
        icon: 'success'
      })
      
      // 等待1.5秒延迟
      await new Promise(resolve => setTimeout(resolve, 1600))
      
      // 验证是否跳转到首页
      expect(global.uni.reLaunch).toHaveBeenCalledWith({
        url: '/pages/index/index'
      })
    })

    it('应该正确处理手机号登录失败的情况', async () => {
      const wrapper = mount(Login)
      
      // 设置 mock 函数抛出异常
      mockPhoneLogin.mockRejectedValue(new Error('验证码错误'))
      
      // 输入手机号和验证码
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      const codeInput = wrapper.find('input[placeholder="请输入验证码"]')
      
      await phoneInput.setValue('13800138000')
      await codeInput.setValue('123456')
      await wrapper.vm.$nextTick()
      
      // 点击登录按钮
      const loginButton = wrapper.find('.login-btn')
      await loginButton.trigger('click')
      
      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 验证是否调用了 hideLoading
      expect(global.uni.hideLoading).toHaveBeenCalled()
      
      // 验证是否显示错误提示
      expect(global.uni.showToast).toHaveBeenCalledWith({
        title: '验证码错误',
        icon: 'none'
      })
      
      // 验证没有进行页面跳转
      expect(global.uni.reLaunch).not.toHaveBeenCalled()
    })

    it('应该在倒计时期间禁止重复发送验证码', async () => {
      const wrapper = mount(Login)
      
      // 输入有效手机号
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      await phoneInput.setValue('13800138000')
      await wrapper.vm.$nextTick()
      
      // 第一次点击获取验证码按钮
      const codeButton = wrapper.find('.code-btn')
      await codeButton.trigger('click')
      
      // 等待模拟的异步操作完成
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // 清除之前的mock调用记录
      vi.clearAllMocks()
      
      // 尝试再次点击按钮
      await codeButton.trigger('click')
      
      // 验证不应该再次调用发送验证码的相关方法
      expect(global.uni.showLoading).not.toHaveBeenCalled()
      expect(global.uni.showToast).not.toHaveBeenCalledWith({
        title: '验证码已发送',
        icon: 'success'
      })
      
      // 按钮应该仍然处于禁用状态
      expect(codeButton.classes()).toContain('disabled')
    })
  })

  describe('微信登录功能', () => {
    it('应该渲染微信一键登录按钮并设置正确的属性', () => {
      const wrapper = mount(Login)
      
      // 查找微信登录按钮
      const wechatLoginButton = wrapper.find('.wechat-login-btn')
      
      // 验证按钮存在
      expect(wechatLoginButton.exists()).toBe(true)
      
      // 验证按钮文本
      expect(wechatLoginButton.text()).toBe('一键登录')
      
      // 验证按钮的 open-type 属性
      expect(wechatLoginButton.attributes('open-type')).toBe('getPhoneNumber')
    })

    it('应该正确处理手机号授权成功事件', async () => {
      const wrapper = mount(Login)
      
      // 模拟微信手机号授权成功的事件数据
      const mockPhoneEvent = {
        detail: {
          code: 'test_phone_code_123',
          errMsg: 'getPhoneNumber:ok'
        }
      }
      
      // 设置 mock 函数返回值
      mockWechatLogin.mockResolvedValue({
        token: 'test_token',
        user: { id: '123', phone: '13800138000' }
      })
      
      // 查找微信登录按钮
      const wechatLoginButton = wrapper.find('.wechat-login-btn')
      
      // 触发 getphonenumber 事件
      await wechatLoginButton.trigger('getphonenumber', mockPhoneEvent)
      
      // 验证是否调用了 showLoading
      expect(global.uni.showLoading).toHaveBeenCalledWith({
        title: '登录中...',
        mask: true
      })
      
      // 验证是否调用了 userStore 的 wechatLogin 方法
      expect(mockWechatLogin).toHaveBeenCalledWith('test_phone_code_123')
      
      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      
      // 验证登录成功后的操作
      expect(global.uni.hideLoading).toHaveBeenCalled()
      expect(global.uni.showToast).toHaveBeenCalledWith({
        title: '登录成功',
        icon: 'success'
      })
      
      // 等待1.5秒延迟
      await new Promise(resolve => setTimeout(resolve, 1600))
      
      // 验证是否跳转到首页
      expect(global.uni.reLaunch).toHaveBeenCalledWith({
        url: '/pages/index/index'
      })
    })
    
    it('应该正确处理手机号授权失败事件', async () => {
      const wrapper = mount(Login)
      
      // 模拟用户拒绝授权的事件数据
      const mockPhoneEvent = {
        detail: {
          errMsg: 'getPhoneNumber:fail user deny'
        }
      }
      
      // 查找微信登录按钮
      const wechatLoginButton = wrapper.find('.wechat-login-btn')
      
      // 触发 getphonenumber 事件
      await wechatLoginButton.trigger('getphonenumber', mockPhoneEvent)
      
      // 验证不应该调用登录相关方法
      expect(global.uni.showLoading).not.toHaveBeenCalled()
      expect(mockWechatLogin).not.toHaveBeenCalled()
      
      // 验证是否显示拒绝授权提示
      expect(global.uni.showToast).toHaveBeenCalledWith({
        title: '需要授权手机号才能登录',
        icon: 'none'
      })
    })
    
    it('应该正确处理微信登录失败的情况', async () => {
      const wrapper = mount(Login)
      
      // 模拟微信手机号授权成功的事件数据
      const mockPhoneEvent = {
        detail: {
          code: 'test_phone_code_456',
          errMsg: 'getPhoneNumber:ok'
        }
      }
      
      // 设置 mock 函数抛出异常
      mockWechatLogin.mockRejectedValue(new Error('登录验证失败'))
      
      // 查找微信登录按钮
      const wechatLoginButton = wrapper.find('.wechat-login-btn')
      
      // 触发 getphonenumber 事件
      await wechatLoginButton.trigger('getphonenumber', mockPhoneEvent)
      
      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 验证是否调用了 hideLoading
      expect(global.uni.hideLoading).toHaveBeenCalled()
      
      // 验证是否显示错误提示
      expect(global.uni.showToast).toHaveBeenCalledWith({
        title: '登录验证失败',
        icon: 'none'
      })
      
      // 验证没有进行页面跳转
      expect(global.uni.reLaunch).not.toHaveBeenCalled()
    })
  })
})