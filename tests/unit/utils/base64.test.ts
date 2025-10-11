import { describe, it, expect, vi } from 'vitest'
import { base64Decode, base64Encode } from '@/utils/base64'

describe('base64工具测试', () => {
  describe('base64Decode', () => {
    it('应该正确解码标准Base64字符串', () => {
      const base64 = 'SGVsbG8gV29ybGQ='
      const expected = 'Hello World'
      expect(base64Decode(base64)).toBe(expected)
    })

    it('应该正确解码没有填充的Base64字符串', () => {
      const base64 = 'SGVsbG8gV29ybGQ'
      const expected = 'Hello World'
      expect(base64Decode(base64)).toBe(expected)
    })

    it('应该正确解码Base64URL格式（JWT常用）', () => {
      // JWT header的例子
      const base64url = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      const expected = '{"alg":"HS256","typ":"JWT"}'
      expect(base64Decode(base64url)).toBe(expected)
    })

    it('应该正确处理包含-和_的Base64URL字符串', () => {
      // 包含特殊字符的Base64URL
      const base64url = 'dGVzdC1zdHJpbmdfZm9yLWJhc2U2NHVybA'
      const expected = 'test-string_for-base64url'
      expect(base64Decode(base64url)).toBe(expected)
    })

    it('应该正确解码JWT payload示例', () => {
      // 真实的JWT payload示例
      const base64url = 'eyJ1c2VyX2lkIjoxLCJleHAiOjE3MDAwMDAwMDAsImlhdCI6MTcwMDAwMDAwMCwibmJmIjoxNzAwMDAwMDAwfQ'
      const expected = '{"user_id":1,"exp":1700000000,"iat":1700000000,"nbf":1700000000}'
      expect(base64Decode(base64url)).toBe(expected)
    })

    // 注意：base64主要用于JWT token解码，不需要处理中文
    // JWT的header和payload都是ASCII字符

    it('应该处理空字符串', () => {
      expect(base64Decode('')).toBe('')
    })
  })

  describe('base64Encode', () => {
    it('应该正确编码字符串为Base64', () => {
      const str = 'Hello World'
      const expected = 'SGVsbG8gV29ybGQ='
      expect(base64Encode(str)).toBe(expected)
    })

    it('应该正确编码JSON对象', () => {
      const obj = { alg: 'HS256', typ: 'JWT' }
      const str = JSON.stringify(obj)
      const encoded = base64Encode(str)
      const decoded = base64Decode(encoded)
      expect(decoded).toBe(str)
    })

  })

  describe('validateToken场景测试', () => {
    it('应该能够解析真实的JWT token', () => {
      // 创建一个模拟的JWT token
      const header = { alg: 'HS256', typ: 'JWT' }
      const payload = {
        user_id: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000)
      }

      // 使用标准btoa创建base64url（测试环境）
      const headerB64 = btoa(JSON.stringify(header))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      const payloadB64 = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      // 解码并验证
      const decodedHeader = JSON.parse(base64Decode(headerB64))
      const decodedPayload = JSON.parse(base64Decode(payloadB64))

      expect(decodedHeader).toEqual(header)
      expect(decodedPayload.user_id).toBe(1)
      expect(decodedPayload.exp).toBeGreaterThan(0)
    })
  })
})