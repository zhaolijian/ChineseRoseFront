import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TabBar from '../TabBar.vue'

// Mock uni API
const mockSwitchTab = vi.fn()

vi.mock('@dcloudio/uni-app', () => ({
  onShow: vi.fn()
}))

// Mock getCurrentPages
global.getCurrentPages = vi.fn(() => [
  { route: 'pages/index/index' }
])

global.uni = {
  switchTab: mockSwitchTab
} as any

describe('TabBar组件', () => {
  beforeEach(() => {
    mockSwitchTab.mockClear()
  })

  it('应该渲染3个常规Tab并展示图标', () => {
    const wrapper = mount(TabBar)
    const items = wrapper.findAll('.cr-tabbar__item')
    
    expect(items).toHaveLength(3)
    
    const expectations = [
      { text: '书架', icon: '/static/images/tabbar/bookshelf.png', activeIcon: '/static/images/tabbar/bookshelf-active.png' },
      { text: '笔记', icon: '/static/images/tabbar/note.png', activeIcon: '/static/images/tabbar/note-active.png' },
      { text: '我的', icon: '/static/images/tabbar/profile.png', activeIcon: '/static/images/tabbar/profile-active.png' }
    ]

    items.forEach((item, index) => {
      expect(item.find('.cr-tabbar__text').text()).toBe(expectations[index].text)
      const icon = item.find('image.cr-tabbar__icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('src')).toBe(expectations[index].icon)
    })
  })

  it('不应再渲染快录悬浮按钮', () => {
    const wrapper = mount(TabBar)
    expect(wrapper.find('.cr-tabbar__quick-btn').exists()).toBe(false)
  })

  it('点击Tab应该切换到对应页面', async () => {
    const wrapper = mount(TabBar)
    const tabs = wrapper.findAll('.cr-tabbar__item')
    
    await tabs[1].trigger('click')
    
    expect(mockSwitchTab).toHaveBeenCalledWith({
      url: '/pages/notes/index'
    })
  })

  it('当前激活的Tab应该展示active样式并更换高亮图标', () => {
    const wrapper = mount(TabBar, {
      props: {
        modelValue: '/pages/notes/index'
      }
    })
    
    const tabs = wrapper.findAll('.cr-tabbar__item')
    expect(tabs[1].classes()).toContain('active')

    const activeIcon = tabs[1].find('image.cr-tabbar__icon')
    expect(activeIcon.attributes('src')).toBe('/static/images/tabbar/note-active.png')

    // 其余标签仍为默认图标
    expect(tabs[0].find('image.cr-tabbar__icon').attributes('src')).toBe('/static/images/tabbar/bookshelf.png')
    expect(tabs[2].find('image.cr-tabbar__icon').attributes('src')).toBe('/static/images/tabbar/profile.png')
  })
})
