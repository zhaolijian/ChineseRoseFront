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

// 用户信息
export interface UserInfo {
  id: number
  phone?: string
  nickname?: string
  avatar?: string
  openid?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 微信登录
 */
export const wechatLogin = (data: WeChatLoginData): Promise<LoginResponse> => {
  // 后端：POST /api/v1/auth/login 仅需 code，昵称头像可后续绑定
  return request.post<LoginResponse>('/v1/auth/login', { code: data.code })
}

/**
 * 手机号登录
 */
export const phoneLogin = (data: PhoneLoginData): Promise<LoginResponse> => {
  // 后端暂未提供手机号直登，保留接口占位
  return request.post<LoginResponse>('/v1/auth/phone/login', data)
}

/**
 * 发送短信验证码
 */
export const sendSMSCode = (phone: string): Promise<{ sent: boolean }> => {
  return request.post<{ sent: boolean }>('/v1/auth/code/send', { phone })
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
