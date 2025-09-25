import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TabBar from '../TabBar.vue'

// Mock uni API
const mockSwitchTab = vi.fn()
const mockShowActionSheet = vi.fn()
const mockNavigateTo = vi.fn()

vi.mock('@dcloudio/uni-app', () => ({
  onShow: vi.fn()
}))

// Mock getCurrentPages
global.getCurrentPages = vi.fn(() => [
  { route: 'pages/index/index' }
])

global.uni = {
  switchTab: mockSwitchTab,
  showActionSheet: mockShowActionSheet,
  navigateTo: mockNavigateTo
} as any

describe('TabBar组件', () => {
  beforeEach(() => {
    mockSwitchTab.mockClear()
    mockShowActionSheet.mockClear()
    mockNavigateTo.mockClear()
  })

  it('应该渲染3个常规Tab', () => {
    const wrapper = mount(TabBar)
    const items = wrapper.findAll('.cr-tabbar__item')
    
    // 应该有3个常规tab（移除了导图）
    expect(items).toHaveLength(3)
    
    // 检查文本内容
    const texts = items.map(item => item.find('.cr-tabbar__text').text())
    expect(texts).toEqual(['书架', '笔记', '我的'])
  })

  it('应该渲染快录按钮', () => {
    const wrapper = mount(TabBar)
    const quickBtn = wrapper.find('.cr-tabbar__quick-btn')
    
    expect(quickBtn.exists()).toBe(true)
    expect(quickBtn.classes()).toContain('cr-tabbar__quick-btn')
  })

  it('快录按钮应该采用悬浮式设计', () => {
    const wrapper = mount(TabBar)
    const quickBtn = wrapper.find('.cr-tabbar__quick-btn')
    
    // 检查样式类
    expect(quickBtn.classes()).toContain('cr-tabbar__quick-btn--float')
  })

  it('点击快录按钮应该显示操作菜单', async () => {
    const wrapper = mount(TabBar)
    const quickBtn = wrapper.find('.cr-tabbar__quick-btn')
    
    await quickBtn.trigger('click')
    
    expect(mockShowActionSheet).toHaveBeenCalledWith({
      itemList: ['添加书籍', '新建笔记', 'OCR识别'],
      success: expect.any(Function)
    })
    
    // 测试选择菜单项后的导航行为
    const successCallback = mockShowActionSheet.mock.calls[0][0].success
    
    // 选择添加书籍
    successCallback({ tapIndex: 0 })
    expect(mockNavigateTo).toHaveBeenCalledWith({
      url: '/pages-book/add/add'
    })
    
    // 选择新建笔记
    mockNavigateTo.mockClear()
    successCallback({ tapIndex: 1 })
    expect(mockNavigateTo).toHaveBeenCalledWith({
      url: '/pages-note/add/add'
    })
    
    // 选择OCR识别
    mockNavigateTo.mockClear()
    successCallback({ tapIndex: 2 })
    expect(mockNavigateTo).toHaveBeenCalledWith({
      url: '/pages-note/ocr/ocr'
    })
  })

  it('点击Tab应该切换到对应页面', async () => {
    const wrapper = mount(TabBar)
    const tabs = wrapper.findAll('.cr-tabbar__item')
    
    // 点击笔记Tab
    await tabs[1].trigger('click')
    
    expect(mockSwitchTab).toHaveBeenCalledWith({
      url: '/pages/notes/index'
    })
  })

  it('当前激活的Tab应该有active样式', async () => {
    const wrapper = mount(TabBar, {
      props: {
        modelValue: '/pages/notes/index'
      }
    })
    
    const tabs = wrapper.findAll('.cr-tabbar__item')
    
    expect(tabs[0].classes()).not.toContain('active')
    expect(tabs[1].classes()).toContain('active')
    expect(tabs[2].classes()).not.toContain('active')
  })

  it('快录按钮应该使用主题色', () => {
    const wrapper = mount(TabBar)
    const quickBtn = wrapper.find('.cr-tabbar__quick-btn')
    
    // 检查是否使用了绿色主题
    expect(quickBtn.attributes('style')).toContain('#2E7D32')
  })
})