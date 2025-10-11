import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PhoneLogin from '@/pages/login/phone-login.vue'
import { VERIFY_CODE_COUNTDOWN } from '@/constants'
import { sendSMSCode } from '@/api/modules/auth'

const countdownRef = ref(0)
const startCountdownMock = vi.fn()
const restoreCountdownMock = vi.fn()

const userStoreMock = {
  loginWithPhone: vi.fn(),
  devBypassLogin: vi.fn()
}

vi.mock('@/stores/modules/user', () => ({
  useUserStore: () => userStoreMock
}))

vi.mock('@/composables/useCountdown', () => ({
  useCountdown: () => ({
    countdown: countdownRef,
    start: startCountdownMock,
    restore: restoreCountdownMock
  })
}))

vi.mock('@/api/modules/auth', () => ({
  sendSMSCode: vi.fn()
}))

vi.mock('@/utils/validate', () => ({
  isValidPhone: (phone: string) => /^1[3-9]\d{9}$/.test(phone)
}))

const onLoadCallbacks: Array<() => void> = []
const onShowCallbacks: Array<() => void> = []

vi.mock('@dcloudio/uni-app', () => ({
  onLoad(cb: () => void) {
    onLoadCallbacks.push(cb)
    cb()
  },
  onShow(cb: () => void) {
    onShowCallbacks.push(cb)
  }
}))

const UButtonStub = defineComponent({
  name: 'UButtonStub',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          disabled: props.disabled,
          'data-loading': props.loading ? 'true' : null,
          onClick: () => {
            if (!props.disabled && !props.loading) {
              emit('click')
            }
          }
        },
        slots.default?.() ?? []
      )
  }
})

const UInputStub = defineComponent({
  name: 'UInputStub',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...attrs,
        value: props.modelValue,
        type: props.type,
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).value)
      })
  }
})

const UCheckboxStub = defineComponent({
  name: 'UCheckboxStub',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...attrs,
        type: 'checkbox',
        checked: props.modelValue,
        onClick: () => emit('update:modelValue', !props.modelValue)
      })
  }
})

const UIconStub = defineComponent({
  name: 'UIconStub',
  setup(_, { attrs }) {
    return () => h('span', attrs, [])
  }
})

const createUni = () =>
  ({
    getSystemInfoSync: vi.fn(() => ({ statusBarHeight: 20 })),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    showToast: vi.fn(),
    navigateBack: vi.fn(),
    navigateTo: vi.fn(),
    reLaunch: vi.fn()
  }) as any

const mountPhoneLogin = async () => {
  setActivePinia(createPinia())
  const wrapper = mount(PhoneLogin, {
    global: {
      stubs: {
        'u-button': UButtonStub,
        'u-input': UInputStub,
        'u-checkbox': UCheckboxStub,
        'u-icon': UIconStub
      }
    }
  })
  await wrapper.vm.$nextTick()
  return wrapper
}

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('手机号登录页', () => {
  let wrapper: Awaited<ReturnType<typeof mountPhoneLogin>> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    countdownRef.value = 0
    startCountdownMock.mockReset()
    restoreCountdownMock.mockReset()
    ;(sendSMSCode as unknown as vi.Mock).mockReset()
    Object.assign(userStoreMock, {
      loginWithPhone: vi.fn(),
      devBypassLogin: vi.fn()
    })
    global.uni = createUni()
    onLoadCallbacks.length = 0
    onShowCallbacks.length = 0
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  it('初始时禁用验证码与登录按钮', async () => {
    wrapper = await mountPhoneLogin()
    const sendButton = wrapper.find('[data-testid="send-code-button"]')
    const submitButton = wrapper.find('[data-testid="submit-button"]')

    expect(sendButton.attributes('disabled')).toBeDefined()
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('输入有效手机号后可获取验证码', async () => {
    wrapper = await mountPhoneLogin()
    const phoneInput = wrapper.find('input[data-testid="phone-input"]')
    await phoneInput.setValue('13800138000')
    await wrapper.vm.$nextTick()

    const sendButton = wrapper.find('[data-testid="send-code-button"]')
    expect(sendButton.attributes('disabled')).toBeUndefined()
  })

  it('发送验证码成功后启动倒计时', async () => {
    (sendSMSCode as unknown as vi.Mock).mockResolvedValue({ message: '验证码已发送' })
    wrapper = await mountPhoneLogin()

    const phoneInput = wrapper.find('input[data-testid="phone-input"]')
    await phoneInput.setValue('13800138000')
    await wrapper.vm.$nextTick()

    const sendButton = wrapper.find('[data-testid="send-code-button"]')
    await sendButton.trigger('click')
    await flushPromises()

    expect(global.uni.showLoading).toHaveBeenCalledWith({ title: '发送中...' })
    expect(sendSMSCode).toHaveBeenCalledWith('13800138000')
    expect(global.uni.showToast).toHaveBeenCalledWith({ title: '验证码已发送', icon: 'success' })
    expect(startCountdownMock).toHaveBeenCalledWith(VERIFY_CODE_COUNTDOWN)
  })

  it('勾选协议并填写表单后登录成功', async () => {
    vi.useFakeTimers()
    userStoreMock.loginWithPhone.mockResolvedValue({ success: true, message: '登录成功' })
    wrapper = await mountPhoneLogin()

    const phoneInput = wrapper.find('input[data-testid="phone-input"]')
    await phoneInput.setValue('13800138000')
    const codeInput = wrapper.find('input[data-testid="code-input"]')
    await codeInput.setValue('123456')
    await wrapper.find('input[type="checkbox"]').trigger('click')
    await wrapper.vm.$nextTick()

    const submitButton = wrapper.find('[data-testid="submit-button"]')
    await submitButton.trigger('click')
    await flushPromises()

    expect(global.uni.showLoading).toHaveBeenCalledWith({ title: '登录中...' })
    expect(userStoreMock.loginWithPhone).toHaveBeenCalledWith({
      phone: '13800138000',
      code: '123456'
    })
    expect(global.uni.showToast).toHaveBeenCalledWith({ title: '登录成功', icon: 'success' })

    vi.runAllTimers()
    await flushPromises()
    expect(global.uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/index/index' })
  })

  it('组件显示时恢复倒计时', async () => {
    wrapper = await mountPhoneLogin()
    expect(restoreCountdownMock).toHaveBeenCalledTimes(1)

    onShowCallbacks.forEach((cb) => cb())
    expect(restoreCountdownMock).toHaveBeenCalledTimes(2)
  })

  it('点击返回按钮触发navigateBack', async () => {
    wrapper = await mountPhoneLogin()
    await wrapper.find('.phone-login-header__back').trigger('click')
    expect(global.uni.navigateBack).toHaveBeenCalledWith({ delta: 1 })
  })
})
