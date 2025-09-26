import request from '@/utils/request'
// 请求返回直接为 data 载荷，失败抛错（见 utils/request.ts）

// 微信登录参数
export interface WeChatLoginData {
  code: string
  nickname: string
  avatar: string
  gender: number
}

// 手机登录参数
export interface PhoneLoginData {
  phone: string
  code: string
}

// 登录响应数据
export interface LoginResponse {
  token: string
  user: {
    id: number
    phone?: string
    nickname?: string
    avatar?: string
    openid?: string
    createdAt?: string
    updatedAt?: string
  }
}

// 用户信息 - 匹配后端响应结构
export interface UserInfo {
  id: number
  phone?: string
  nickname?: string
  avatar_url?: string  // 后端字段名为 avatar_url，不是 avatar
  openid?: string
  created_at?: string  // 后端字段名为 created_at，不是 createdAt
  updated_at?: string
}

/**
 * 微信code登录（仅获取openid，不含手机号）
 */
export const wechatCodeLogin = (data: WeChatLoginData): Promise<LoginResponse> => {
  return request.post<LoginResponse>('/v1/auth/wechat/code', { code: data.code })
}

/**
 * 短信验证码登录
 */
export const smsLogin = (data: PhoneLoginData): Promise<LoginResponse> => {
  return request.post<LoginResponse>('/v1/auth/phone/sms', data)
}

/**
 * 发送短信验证码
 */
export const sendSMSCode = (phone: string): Promise<{ message: string }> => {
  return request.post<{ message: string }>('/v1/auth/code/sms', { phone })
}

/**
 * 获取用户信息
 */
export const getUserInfo = (): Promise<UserInfo> => {
  return request.get<UserInfo>('/v1/users/profile')
}

/**
 * 更新用户信息
 */
export const updateUserInfo = (data: Partial<UserInfo>): Promise<UserInfo> => {
  return request.put<UserInfo>('/v1/users/profile', data)
}

/**
 * 退出登录
 */
export const logout = (): Promise<void> => {
  return request.post('/v1/auth/logout')
}

/**
 * 刷新token
 */
export const refreshToken = (): Promise<{ token: string }> => {
  return request.post<{ token: string }>('/v1/auth/refresh-token')
}

/**
 * 微信手机号快捷登录参数
 */
export interface WechatPhoneLoginData {
  code: string          // wx.login获取的code
  encryptedData: string // getPhoneNumber获取的加密数据
  iv: string           // getPhoneNumber获取的初始向量
}

/**
 * 微信手机号快捷登录
 */
export const wechatPhoneLogin = (data: WechatPhoneLoginData): Promise<LoginResponse> => {
  return request.post<LoginResponse>('/v1/auth/wechat/phone', data)
}
