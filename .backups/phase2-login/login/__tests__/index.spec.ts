import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import IndexPage from '../index.vue'

vi.mock('@/stores', () => ({
  useUserStore: () => ({
    wechatQuickLogin: vi.fn()
  })
}))

const UButtonStub = defineComponent({
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          role: 'button',
          disabled: props.disabled ? '' : null,
          onClick: () => emit('click')
        },
        slots.default ? slots.default() : []
      )
  }
})

const UCheckboxStub = defineComponent({
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
        class: attrs.class ?? 'u-checkbox',
        checked: props.modelValue,
        onClick: () => emit('update:modelValue', !props.modelValue)
      })
  }
})

beforeEach(() => {
  global.uni = {
    navigateTo: vi.fn(),
    showToast: vi.fn(),
    login: vi.fn(({ success }) => success?.({ code: 'mock-code' }))
  } as any
})

afterEach(() => {
  vi.restoreAllMocks()
})

const mountOptions = {
  global: {
    stubs: {
      'u-button': UButtonStub,
      'u-checkbox': UCheckboxStub,
      'u-icon': defineComponent({
        setup(_, { attrs }) {
          return () => h('span', { class: attrs.class ?? 'u-icon' })
        }
      })
    }
  }
}

describe('LoginPage', () => {
  it('初始状态：未同意协议时按钮禁用', () => {
    const wrapper = mount(IndexPage, mountOptions)
    const button = wrapper.find('.login-button')
    expect(button.element.hasAttribute('disabled')).toBe(true)
  })

  it('同意协议后按钮可点击', async () => {
    const wrapper = mount(IndexPage, mountOptions)
    await wrapper.find('input[type="checkbox"]').trigger('click')
    const button = wrapper.find('.login-button')
    expect(button.element.hasAttribute('disabled')).toBe(false)
  })

  it('点击手机号登录跳转', async () => {
    const navigateSpy = vi.spyOn(global.uni, 'navigateTo')
    const wrapper = mount(IndexPage, mountOptions)
    await wrapper.find('.phone-login-link').trigger('click')
    expect(navigateSpy).toHaveBeenCalledWith({
      url: '/pages/login/phone-login'
    })
  })
})
