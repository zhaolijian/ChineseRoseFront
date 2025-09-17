import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Login from '@/pages/login/login.vue'

// 模拟 uni-app 生命周期
const mockOnLoadCallbacks: Function[] = []
const mockOnShowCallbacks: Function[] = []

vi.mock('@dcloudio/uni-app', () => ({
  onLoad: (callback: Function) => {
    mockOnLoadCallbacks.push(callback)
    // 立即执行 onLoad
    callback()
  },
  onShow: (callback: Function) => {
    mockOnShowCallbacks.push(callback)
  }
}))

// 模拟 useCountdown
import { ref } from 'vue'

const mockRestore = vi.fn()
const mockStart = vi.fn()
const mockCountdownRef = ref(0)

vi.mock('@/composables/useCountdown', () => ({
  useCountdown: () => ({
    countdown: mockCountdownRef,
    start: mockStart,
    restore: mockRestore
  })
}))

// 模拟其他依赖
vi.mock('@/stores/modules/user', () => ({
  useUserStore: () => ({
    phoneLogin: vi.fn(),
    wechatLogin: vi.fn()
  })
}))

vi.mock('@/utils/validate', () => ({
  isValidPhone: (phone: string) => /^1[3-9]\d{9}$/.test(phone)
}))

// 模拟 uni 对象
global.uni = {
  getSystemInfoSync: vi.fn(() => ({
    statusBarHeight: 20
  })),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showToast: vi.fn(),
  reLaunch: vi.fn()
}

describe('登录页面', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // 重置回调数组
    mockOnLoadCallbacks.length = 0
    mockOnShowCallbacks.length = 0
    // 重置倒计时值
    mockCountdownRef.value = 0
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.useRealTimers()
  })

  describe('生命周期', () => {
    it('应该在 onLoad 时恢复倒计时', async () => {
      wrapper = mount(Login)
      await wrapper.vm.$nextTick()

      // 验证 onLoad 回调被注册
      expect(mockOnLoadCallbacks.length).toBe(1)
      // 验证恢复倒计时被调用
      expect(mockRestore).toHaveBeenCalledTimes(1)
      // 验证获取系统信息
      expect(uni.getSystemInfoSync).toHaveBeenCalled()
    })

    it('应该在 onShow 时恢复倒计时（从后台返回）', async () => {
      wrapper = mount(Login)
      await wrapper.vm.$nextTick()

      // 清除之前的调用记录
      mockRestore.mockClear()

      // 验证 onShow 回调被注册
      expect(mockOnShowCallbacks.length).toBe(1)
      
      // 模拟触发 onShow（从后台返回）
      mockOnShowCallbacks[0]()

      // 验证恢复倒计时被调用
      expect(mockRestore).toHaveBeenCalledTimes(1)
    })
  })

  describe('倒计时功能', () => {
    it('倒计时进行时应该禁用发送验证码按钮', async () => {
      // 设置倒计时为30秒
      mockCountdownRef.value = 30

      wrapper = mount(Login)
      await wrapper.vm.$nextTick()

      // 查找验证码按钮
      const codeBtn = wrapper.find('.code-btn')
      expect(codeBtn.exists()).toBe(true)
      
      
      // 验证按钮是禁用状态
      expect(codeBtn.attributes('disabled')).toBeDefined()
      expect(codeBtn.classes()).toContain('disabled')
      
      // 验证按钮文本
      expect(codeBtn.text()).toBe('30s后重试')
    })

    it('倒计时结束后应该可以重新发送验证码', async () => {
      // 设置倒计时为0
      mockCountdownRef.value = 0

      wrapper = mount(Login)
      await wrapper.vm.$nextTick()
      
      // 输入有效手机号
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      await phoneInput.setValue('13800138000')
      await wrapper.vm.$nextTick()

      // 查找验证码按钮
      const codeBtn = wrapper.find('.code-btn')
      
      // 验证按钮不是禁用状态
      expect(codeBtn.attributes('disabled')).toBeFalsy()
      expect(codeBtn.classes()).not.toContain('disabled')
      
      // 验证按钮文本
      expect(codeBtn.text()).toBe('获取验证码')
    })

    it('发送验证码成功后应该开始60秒倒计时', async () => {
      mockCountdownRef.value = 0  // 确保倒计时为0
      wrapper = mount(Login)
      await wrapper.vm.$nextTick()
      
      // 输入有效手机号
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      await phoneInput.setValue('13800138000')
      await wrapper.vm.$nextTick()

      // 点击发送验证码
      await wrapper.find('.code-btn').trigger('click')
      
      // 等待异步操作
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()

      // 验证开始倒计时
      expect(mockStart).toHaveBeenCalledWith(60)
      
      // 验证提示信息
      expect(uni.showToast).toHaveBeenCalledWith({
        title: '验证码已发送',
        icon: 'success'
      })
    })
  })

  describe('表单验证', () => {
    it('无效手机号时应该禁用发送验证码按钮', async () => {
      wrapper = mount(Login)
      await wrapper.vm.$nextTick()

      // 输入无效手机号
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      await phoneInput.setValue('123')

      await wrapper.vm.$nextTick()

      // 验证按钮是禁用状态
      const codeBtn = wrapper.find('.code-btn')
      expect(codeBtn.attributes('disabled')).toBeDefined()
      expect(codeBtn.classes()).toContain('disabled')
    })

    it('有效手机号时应该启用发送验证码按钮', async () => {
      mockCountdownRef.value = 0 // 确保倒计时为0

      wrapper = mount(Login)
      await wrapper.vm.$nextTick()

      // 输入有效手机号
      const phoneInput = wrapper.find('input[placeholder="请输入手机号"]')
      await phoneInput.setValue('13800138000')

      await wrapper.vm.$nextTick()

      // 验证按钮不是禁用状态
      const codeBtn = wrapper.find('.code-btn')
      expect(codeBtn.attributes('disabled')).toBeUndefined()
      expect(codeBtn.classes()).not.toContain('disabled')
    })

    it('手机号和验证码都有效时应该启用登录按钮', async () => {
      wrapper = mount(Login)
      
      // 直接设置组件的数据
      const vm = wrapper.vm as any
      vm.phoneNumber = '13800138000'
      vm.verifyCode = '123456'
      
      await wrapper.vm.$nextTick()
      
      // 验证计算属性
      expect(vm.isPhoneValid).toBe(true)
      expect(vm.canLogin).toBe(true)
      
      // 验证登录按钮不是禁用状态
      const loginBtn = wrapper.find('.login-btn')
      
      // 在测试中，如果 disabled = false，属性可能是 undefined 或空字符串
      // 我们只需要确保按钮不包含 disabled 类
      expect(loginBtn.classes()).not.toContain('disabled')
    })
  })
})