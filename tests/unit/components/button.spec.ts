import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Button from '@/components/common/Button/index.vue'

describe('CR Button', () => {
  it('renders primary variant by default', () => {
    const wrapper = mount(Button, {
      slots: { default: '主要操作' }
    })

    expect(wrapper.classes()).toContain('cr-btn')
    expect(wrapper.classes()).toContain('cr-btn--variant-primary')
    expect(wrapper.attributes('aria-disabled')).toBe('false')
  })

  it('supports ghost variant and small size', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'ghost',
        size: 'sm',
        loading: true
      },
      slots: { default: 'Ghost' }
    })

    expect(wrapper.classes()).toContain('cr-btn--variant-ghost')
    expect(wrapper.classes()).toContain('cr-btn--size-sm')
    expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(true)
  })
})
