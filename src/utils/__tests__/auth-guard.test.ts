import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureLoggedIn } from '../auth-guard'
import { useUserStore } from '@/stores/modules/user'

// Mock userStore
vi.mock('@/stores/modules/user', () => ({
  useUserStore: vi.fn()
}))

describe('ensureLoggedIn 登录守卫', () => {
  let mockUserStore: any
  let mockUni: any

  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks()

    // Mock uni API
    mockUni = {
      showModal: vi.fn(),
      navigateTo: vi.fn()
    }
    global.uni = mockUni as any

    // Mock userStore
    mockUserStore = {
      isLoggedIn: true
    }
    vi.mocked(useUserStore).mockReturnValue(mockUserStore)
  })

  it('用户已登录时应该返回true', async () => {
    mockUserStore.isLoggedIn = true

    const result = await ensureLoggedIn('测试操作')

    expect(result).toBe(true)
    expect(mockUni.showModal).not.toHaveBeenCalled()
  })

  it('用户未登录时应该显示登录引导Modal', async () => {
    mockUserStore.isLoggedIn = false
    mockUni.showModal.mockImplementation(({ success }: any) => {
      // 模拟用户点击取消
      success({ confirm: false, cancel: true })
    })

    const result = await ensureLoggedIn('添加书籍')

    expect(result).toBe(false)
    expect(mockUni.showModal).toHaveBeenCalledWith({
      title: '需要登录',
      content: '添加书籍需要登录，是否立即登录？',
      confirmText: '去登录',
      cancelText: '取消',
      success: expect.any(Function)
    })
  })

  it('用户未登录且点击"去登录"时应该跳转到登录页', async () => {
    mockUserStore.isLoggedIn = false
    mockUni.showModal.mockImplementation(({ success }: any) => {
      // 模拟用户点击确认
      success({ confirm: true, cancel: false })
    })

    const result = await ensureLoggedIn('保存笔记')

    expect(result).toBe(false)
    expect(mockUni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/login/login'
    })
  })

  it('用户未登录且点击"取消"时不应该跳转', async () => {
    mockUserStore.isLoggedIn = false
    mockUni.showModal.mockImplementation(({ success }: any) => {
      // 模拟用户点击取消
      success({ confirm: false, cancel: true })
    })

    const result = await ensureLoggedIn('保存笔记')

    expect(result).toBe(false)
    expect(mockUni.navigateTo).not.toHaveBeenCalled()
  })

  it('应该使用默认操作名称', async () => {
    mockUserStore.isLoggedIn = false
    mockUni.showModal.mockImplementation(({ success }: any) => {
      success({ confirm: false })
    })

    await ensureLoggedIn()

    expect(mockUni.showModal).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '此操作需要登录，是否立即登录？'
      })
    )
  })

  it('应该正确传递自定义操作名称', async () => {
    mockUserStore.isLoggedIn = false
    mockUni.showModal.mockImplementation(({ success }: any) => {
      success({ confirm: false })
    })

    await ensureLoggedIn('删除笔记')

    expect(mockUni.showModal).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '删除笔记需要登录，是否立即登录？'
      })
    )
  })
})
