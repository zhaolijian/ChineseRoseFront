/**
 * @file 平台能力检测工具测试
 * @description 测试平台能力检测相关函数的正确性
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  compareVersion,
  canUseWechatPhoneLogin,
  getWechatPhoneLoginCapability,
  isTabBarPage,
  smartNavigate
} from '../platform'

// Mock uni全局对象
const mockUni = {
  getSystemInfoSync: vi.fn(),
  canIUse: vi.fn(),
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  redirectTo: vi.fn(),
  navigateTo: vi.fn()
}

// Mock process.env
const mockEnv = {
  UNI_PLATFORM: 'mp-weixin'
}

// 设置全局变量
beforeEach(() => {
  // @ts-ignore
  global.uni = mockUni
  // @ts-ignore
  global.process = { env: mockEnv }

  // 重置所有mock
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('compareVersion', () => {
  it('应该正确比较版本号 - v1 > v2', () => {
    expect(compareVersion('2.21.3', '2.21.2')).toBe(1)
    expect(compareVersion('3.0.0', '2.21.2')).toBe(1)
    expect(compareVersion('2.22.0', '2.21.9')).toBe(1)
  })

  it('应该正确比较版本号 - v1 < v2', () => {
    expect(compareVersion('2.21.1', '2.21.2')).toBe(-1)
    expect(compareVersion('2.20.9', '2.21.0')).toBe(-1)
    expect(compareVersion('1.9.9', '2.0.0')).toBe(-1)
  })

  it('应该正确比较版本号 - v1 = v2', () => {
    expect(compareVersion('2.21.2', '2.21.2')).toBe(0)
    expect(compareVersion('1.0.0', '1.0.0')).toBe(0)
  })

  it('应该处理不同长度的版本号', () => {
    expect(compareVersion('2.21', '2.21.0')).toBe(0)
    expect(compareVersion('2.21.2', '2.21')).toBe(1)
    expect(compareVersion('2.21.0.1', '2.21.0')).toBe(1)
  })

  it('应该抛出错误当版本号为空', () => {
    expect(() => compareVersion('', '1.0.0')).toThrow('版本号不能为空')
    expect(() => compareVersion('1.0.0', '')).toThrow('版本号不能为空')
    expect(() => compareVersion('', '')).toThrow('版本号不能为空')
  })

  it('应该抛出错误当版本号格式无效', () => {
    expect(() => compareVersion('abc', '1.0.0')).toThrow('无效的版本号格式: abc')
    expect(() => compareVersion('1.0.0', 'xyz')).toThrow('无效的版本号格式: xyz')
    expect(() => compareVersion('1.a.0', '1.0.0')).toThrow('无效的版本号格式: 1.a.0')
  })
})

describe('canUseWechatPhoneLogin', () => {
  beforeEach(() => {
    // 设置默认的成功条件
    mockEnv.UNI_PLATFORM = 'mp-weixin'
    mockUni.getSystemInfoSync.mockReturnValue({
      platform: 'ios',
      SDKVersion: '2.21.2'
    })
    mockUni.canIUse.mockImplementation((api: string) => {
      if (api === 'button.open-type.getPhoneNumber') return true
      if (api === 'login') return true
      return false
    })
  })

  it('应该在微信小程序环境且满足条件时返回true', () => {
    expect(canUseWechatPhoneLogin()).toBe(true)
  })

  it('应该在非微信小程序环境时返回false', () => {
    mockEnv.UNI_PLATFORM = 'h5'
    expect(canUseWechatPhoneLogin()).toBe(false)
  })

  it('应该在基础库版本过低时返回false', () => {
    mockUni.getSystemInfoSync.mockReturnValue({
      platform: 'ios',
      SDKVersion: '2.20.1'
    })
    expect(canUseWechatPhoneLogin()).toBe(false)
  })

  it('应该在不支持getPhoneNumber API时返回false', () => {
    mockUni.canIUse.mockImplementation((api: string) => {
      if (api === 'button.open-type.getPhoneNumber') return false
      if (api === 'login') return true
      return false
    })
    expect(canUseWechatPhoneLogin()).toBe(false)
  })

  it('应该在不支持login API时返回false', () => {
    mockUni.canIUse.mockImplementation((api: string) => {
      if (api === 'button.open-type.getPhoneNumber') return true
      if (api === 'login') return false
      return false
    })
    expect(canUseWechatPhoneLogin()).toBe(false)
  })

  it('应该在getSystemInfoSync失败时返回false', () => {
    mockUni.getSystemInfoSync.mockImplementation(() => {
      throw new Error('getSystemInfoSync failed')
    })
    expect(canUseWechatPhoneLogin()).toBe(false)
  })

  it('应该在系统信息缺少SDKVersion时返回false', () => {
    mockUni.getSystemInfoSync.mockReturnValue({
      platform: 'ios'
      // 缺少SDKVersion
    })
    expect(canUseWechatPhoneLogin()).toBe(false)
  })
})

describe('getWechatPhoneLoginCapability', () => {
  beforeEach(() => {
    // 设置默认的成功条件
    mockEnv.UNI_PLATFORM = 'mp-weixin'
    mockUni.getSystemInfoSync.mockReturnValue({
      platform: 'ios',
      SDKVersion: '2.21.2'
    })
    mockUni.canIUse.mockImplementation((api: string) => {
      if (api === 'button.open-type.getPhoneNumber') return true
      if (api === 'login') return true
      return false
    })
  })

  it('应该在所有条件满足时返回成功结果', () => {
    const result = getWechatPhoneLoginCapability()
    expect(result.canUse).toBe(true)
    expect(result.reason).toBe('支持微信手机号一键登录')
  })

  it('应该在非微信环境时返回详细错误信息', () => {
    mockEnv.UNI_PLATFORM = 'h5'
    const result = getWechatPhoneLoginCapability()
    expect(result.canUse).toBe(false)
    expect(result.reason).toContain('当前不在微信小程序环境')
  })

  it('应该在版本过低时返回详细错误信息', () => {
    mockUni.getSystemInfoSync.mockReturnValue({
      platform: 'ios',
      SDKVersion: '2.20.1'
    })
    const result = getWechatPhoneLoginCapability()
    expect(result.canUse).toBe(false)
    expect(result.reason).toContain('微信基础库版本过低')
    expect(result.reason).toContain('当前：2.20.1')
    expect(result.reason).toContain('要求：≥2.21.2')
  })

  it('应该在API不支持时返回详细错误信息', () => {
    mockUni.canIUse.mockImplementation((api: string) => {
      if (api === 'button.open-type.getPhoneNumber') return false
      if (api === 'login') return true
      return false
    })
    const result = getWechatPhoneLoginCapability()
    expect(result.canUse).toBe(false)
    expect(result.reason).toContain('设备不支持微信手机号授权API')
  })
})

describe('isTabBarPage', () => {
  it('应该正确识别tabBar页面', () => {
    expect(isTabBarPage('/pages/index/index')).toBe(true)
    expect(isTabBarPage('/pages/notes/index')).toBe(true)
    expect(isTabBarPage('/pages/profile/index')).toBe(true)
  })

  it('应该正确识别非tabBar页面', () => {
    expect(isTabBarPage('/pages/login/login')).toBe(false)
    expect(isTabBarPage('/pages-note/add/add')).toBe(false)
    expect(isTabBarPage('/pages-book/detail/index')).toBe(false)
    expect(isTabBarPage('/pages-note/list/list')).toBe(false)
    expect(isTabBarPage('/pages-book/list/list')).toBe(false)
  })

  it('应该忽略查询参数', () => {
    expect(isTabBarPage('/pages/index/index?tab=1')).toBe(true)
    expect(isTabBarPage('/pages/profile/index?from=login')).toBe(true)
    expect(isTabBarPage('/pages/login/login?redirect=/home')).toBe(false)
  })

  it('应该处理空值和无效输入', () => {
    expect(isTabBarPage('')).toBe(false)
    expect(isTabBarPage('/')).toBe(false)
    expect(isTabBarPage('invalid-url')).toBe(false)
  })
})

describe('smartNavigate', () => {
  beforeEach(() => {
    mockUni.switchTab.mockImplementation(({ success }) => success?.())
    mockUni.reLaunch.mockImplementation(({ success }) => success?.())
    mockUni.redirectTo.mockImplementation(({ success }) => success?.())
    mockUni.navigateTo.mockImplementation(({ success }) => success?.())
  })

  it('应该对tabBar页面使用switchTab', async () => {
    await smartNavigate('/pages/index/index')
    expect(mockUni.switchTab).toHaveBeenCalledWith({
      url: '/pages/index/index',
      success: expect.any(Function),
      fail: expect.any(Function)
    })
    expect(mockUni.reLaunch).not.toHaveBeenCalled()
  })

  it('应该对普通页面使用reLaunch（默认fallback）', async () => {
    await smartNavigate('/pages/login/login')
    expect(mockUni.reLaunch).toHaveBeenCalledWith({
      url: '/pages/login/login',
      success: expect.any(Function),
      fail: expect.any(Function)
    })
    expect(mockUni.switchTab).not.toHaveBeenCalled()
  })

  it('应该支持自定义fallback方式', async () => {
    await smartNavigate('/pages/login/login', { fallback: 'navigateTo' })
    expect(mockUni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/login/login',
      success: expect.any(Function),
      fail: expect.any(Function)
    })
  })

  it('应该在switchTab失败时使用fallback', async () => {
    mockUni.switchTab.mockImplementation(({ fail }) =>
      fail?.({ errMsg: 'switchTab failed' })
    )

    await smartNavigate('/pages/index/index', { fallback: 'reLaunch' })

    expect(mockUni.switchTab).toHaveBeenCalled()
    expect(mockUni.reLaunch).toHaveBeenCalled()
  })

  it('应该拒绝空URL', async () => {
    await expect(smartNavigate('')).rejects.toThrow('跳转URL不能为空')
  })

  it('应该在跳转失败时抛出错误', async () => {
    mockUni.reLaunch.mockImplementation(({ fail }) =>
      fail?.({ errMsg: 'navigate failed' })
    )

    await expect(smartNavigate('/pages/login/login')).rejects.toEqual({
      errMsg: 'navigate failed'
    })
  })
})
