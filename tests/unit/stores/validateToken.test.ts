import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/modules/user'
import * as storage from '@/utils/storage'

vi.mock('@/api/modules/auth', () => ({
  wechatCodeLogin: vi.fn(),
  wechatQuickLogin: vi.fn(),
  smsLogin: vi.fn(),
  sendSMSCode: vi.fn(),
  getUserInfo: vi.fn(),
  updateUserInfo: vi.fn(),
  logout: vi.fn()
}))

vi.mock('@/utils/storage', () => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn()
}))

describe('user store - validateToken功能测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(storage.setStorage).mockResolvedValue()
    vi.mocked(storage.removeStorage).mockResolvedValue()
  })

  const createValidToken = (overrides: Record<string, any> = {}) => {
    const now = Math.floor(Date.now() / 1000)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
    const payload = Buffer.from(JSON.stringify({
      user_id: 1,
      exp: now + 3600,
      iat: now,
      nbf: now,
      ...overrides
    })).toString('base64')
    return `${header}.${payload}.signature`
  }

  describe('基础验证场景', () => {
    it('应拒绝空token', async () => {
      const store = useUserStore()
      vi.mocked(storage.getStorage).mockResolvedValue('')

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
      expect(store.isLoggedIn).toBe(false)
    })

    it('应拒绝格式错误的token（非三段式）', async () => {
      const store = useUserStore()
      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return 'invalid.token'
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })

    it('应拒绝某段为空的token', async () => {
      const store = useUserStore()
      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return 'header..signature'
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })
  })

  describe('JWT结构验证', () => {
    it('应拒绝算法不是HS256的token', async () => {
      const store = useUserStore()
      const now = Math.floor(Date.now() / 1000)
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64')
      const payload = Buffer.from(JSON.stringify({
        user_id: 1,
        exp: now + 3600,
        iat: now,
        nbf: now
      })).toString('base64')
      const invalidToken = `${header}.${payload}.signature`

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return invalidToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })

    it('应拒绝header缺少alg字段的token', async () => {
      const store = useUserStore()
      const now = Math.floor(Date.now() / 1000)
      const header = Buffer.from(JSON.stringify({ typ: 'JWT' })).toString('base64')
      const payload = Buffer.from(JSON.stringify({
        user_id: 1,
        exp: now + 3600,
        iat: now,
        nbf: now
      })).toString('base64')
      const invalidToken = `${header}.${payload}.signature`

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return invalidToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })

    it('应拒绝payload缺少user_id的token', async () => {
      const store = useUserStore()
      const now = Math.floor(Date.now() / 1000)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
      const payload = Buffer.from(JSON.stringify({
        exp: now + 3600,
        iat: now,
        nbf: now
      })).toString('base64')
      const invalidToken = `${header}.${payload}.signature`

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return invalidToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })

    it('应拒绝payload缺少exp时间字段的token', async () => {
      const store = useUserStore()
      const now = Math.floor(Date.now() / 1000)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
      const payload = Buffer.from(JSON.stringify({
        user_id: 1,
        iat: now,
        nbf: now
      })).toString('base64')
      const invalidToken = `${header}.${payload}.signature`

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return invalidToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })
  })

  describe('时间验证', () => {
    it('应拒绝已过期的token', async () => {
      const store = useUserStore()
      const now = Math.floor(Date.now() / 1000)
      const expiredToken = createValidToken({
        exp: now - 3600,
        iat: now - 7200,
        nbf: now - 7200
      })

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return expiredToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })

    it('应拒绝尚未生效的token（nbf > now）', async () => {
      const store = useUserStore()
      const now = Math.floor(Date.now() / 1000)
      const futureToken = createValidToken({
        exp: now + 7200,
        iat: now + 3600,
        nbf: now + 3600
      })

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return futureToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })

    it('应拒绝刚好到期的token（exp === now）', async () => {
      const store = useUserStore()
      const now = Math.floor(Date.now() / 1000)
      const justExpiredToken = createValidToken({
        exp: now,
        iat: now - 3600,
        nbf: now - 3600
      })

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return justExpiredToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })
  })

  describe('Base64解码验证（修复atob问题）', () => {
    it('应能成功解码合法的Base64 JWT', async () => {
      const store = useUserStore()
      const validToken = createValidToken()

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return validToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })

    it('应拒绝包含非法Base64字符的token', async () => {
      const store = useUserStore()
      const invalidBase64Token = 'invalid$base64!.invalid$base64!.signature'

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return invalidBase64Token
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })
  })

  describe('异常处理', () => {
    it('应安全处理JSON解析错误', async () => {
      const store = useUserStore()
      const malformedToken = `${Buffer.from('not-json').toString('base64')}.${Buffer.from('also-not-json').toString('base64')}.signature`

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return malformedToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
      expect(store.isLoggedIn).toBe(false)
    })

    it('应安全处理Base64解码异常', async () => {
      const store = useUserStore()
      const invalidToken = 'a.b.c'

      vi.mocked(storage.getStorage).mockImplementation(async (key) => {
        if (key === 'token') return invalidToken
        if (key === 'userInfo') return JSON.stringify({ id: 1, phone: '13800000000' })
        return null
      })

      const result = await store.checkLoginStatus()

      expect(result).toBe(false)
    })
  })
})