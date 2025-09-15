import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import { wechatLogin as apiWechatLogin, phoneLogin, sendSMSCode as apiSendSMSCode, getUserInfo, updateUserInfo as apiUpdateUserInfo, logout as apiLogout } from '@/api/modules/auth'
import type { WeChatLoginData, PhoneLoginData, LoginResponse, UserInfo } from '@/api/modules/auth'
import type { ApiResponse } from '@/types'

// 重新导出类型，便于外部使用
export type { UserInfo, WeChatLoginData, PhoneLoginData, LoginResponse }

// Store特有的参数类型
export interface WeChatLoginParams {
  code: string
  userInfo: any
}


export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string>('')
  
  // 计算属性
  const isLoggedIn = computed(() => {
    return !!token.value && !!userInfo.value
  })
  
  const userNickname = computed(() => {
    return userInfo.value?.nickname || userInfo.value?.phone || '用户'
  })
  
  const userAvatar = computed(() => {
    return userInfo.value?.avatar || '/static/images/default-avatar.png'
  })
  
  // 初始化 - 修复异步获取问题
  const initUserInfo = async () => {
    try {
      const savedToken = await getStorage('token')
      const savedUserInfo = await getStorage('userInfo')
      
      if (savedToken && savedUserInfo) {
        token.value = savedToken
        userInfo.value = savedUserInfo
        console.log('[User Store] 初始化用户信息成功, token:', savedToken ? '已设置' : '未设置')
      } else {
        console.log('[User Store] 无本地用户信息')
      }
    } catch (error) {
      console.error('[User Store] 初始化用户信息失败:', error)
    }
  }
  
  // 保存用户信息
  const saveUserInfo = (newToken: string, newUserInfo: UserInfo) => {
    token.value = newToken
    userInfo.value = newUserInfo
    
    setStorage('token', newToken)
    setStorage('userInfo', newUserInfo)
  }
  
  // 清除用户信息
  const clearUserInfo = () => {
    token.value = ''
    userInfo.value = null
    
    removeStorage('token')
    removeStorage('userInfo')
  }
  
  // 微信登录
  const loginWithWeChat = async (params: WeChatLoginParams): Promise<ApiResponse> => {
    try {
      const data = await apiWechatLogin({
        code: params.code,
        nickname: params.userInfo.nickName,
        avatar: params.userInfo.avatarUrl,
        gender: params.userInfo.gender
      })
      saveUserInfo(data.token, data.user)
      return { code: 0, message: '登录成功', data, success: true }
    } catch (error: any) {
      console.error('微信登录失败:', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: null,
        success: false
      }
    }
  }
  
  // TDD优化版微信登录 - 支持测试和用户体验
  const wechatLogin = async (): Promise<void> => {
    console.log('🔍 [微信登录] 开始登录流程')
    
    // 显示loading状态
    uni.showLoading({ title: '登录中...' })
    
    try {
      // 步骤1: 调用uni.login()获取code
      console.log('📱 [步骤1] 获取微信登录code')
      
      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: (res) => {
            console.log('✅ [uni.login] 调用成功:', res)
            resolve(res)
          },
          fail: (error) => {
            console.error('❌ [uni.login] 调用失败:', error)
            reject(new Error(`uni.login失败: ${error.errMsg || JSON.stringify(error)}`))
          }
        })
      })
      
      if (!loginRes.code) {
        throw new Error('❌ 未获取到微信登录code')
      }
      
      // 步骤2: 调用后端API进行登录
      console.log('📱 [步骤2] 调用后端登录接口')
      
      const loginData = {
        code: loginRes.code,
        nickname: '调试用户',
        avatar: '',
        gender: 0
      }
      
      console.log('📤 [API请求] 发送登录请求:', loginData)
      
      const apiResult = await apiWechatLogin(loginData)
      
      console.log('✅ [API响应] 后端登录成功:', apiResult)
      
      // 保存登录信息
      saveUserInfo(apiResult.token, apiResult.user)
      
      console.log('💾 [本地存储] 用户信息已保存')
      console.log('🎉 [微信登录] 完整流程成功!')
      
      // 隐藏loading
      uni.hideLoading()
      
    } catch (error: any) {
      console.error('💥 [微信登录] 流程失败:', error.message)
      
      // 隐藏loading
      uni.hideLoading()
      
      // 显示用户友好的错误提示
      let errorMessage = '登录失败，请重试'
      
      if (error.message?.includes('Network Error') || 
          error.message?.includes('timeout') || 
          error.message?.includes('连接') ||
          error.message?.includes('ECONNREFUSED')) {
        errorMessage = '🌐 网络连接失败，请检查：\n1. 后端服务是否已启动 (localhost:8080)\n2. 网络是否正常'
      } else if (error.message?.includes('404')) {
        errorMessage = '🔗 API接口未找到，请检查：\n1. 后端路由是否正确配置\n2. 接口地址是否正确'
      } else if (error.message?.includes('Cannot read properties of undefined')) {
        errorMessage = '🔧 后端API调用失败: ' + error.message
      }
      
      // 显示错误提示
      uni.showToast({
        title: errorMessage,
        icon: 'none'
      })
      
      throw new Error(errorMessage)
    }
  }
  
  // 手机号登录
  const loginWithPhone = async (params: PhoneLoginData): Promise<ApiResponse> => {
    try {
      const data = await phoneLogin(params)
      saveUserInfo(data.token, data.user)
      return { code: 0, message: '登录成功', data, success: true }
    } catch (error: any) {
      console.error('手机登录失败:', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: null,
        success: false
      }
    }
  }
  
  // 发送短信验证码
  const sendSMSCode = async (phone: string): Promise<ApiResponse> => {
    try {
      await apiSendSMSCode(phone)
      return { code: 0, message: '验证码发送成功', data: { sent: true }, success: true }
    } catch (error: any) {
      console.error('发送验证码失败:', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: null,
        success: false
      }
    }
  }
  
  // 获取用户信息
  const fetchUserInfo = async (): Promise<ApiResponse<UserInfo>> => {
    try {
      const data = await getUserInfo()
      userInfo.value = data
      setStorage('userInfo', data)
      return { code: 0, message: '获取成功', data, success: true }
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: {} as UserInfo,
        success: false
      }
    }
  }
  
  // 更新用户信息
  const updateUserInfo = async (updates: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> => {
    try {
      const data = await apiUpdateUserInfo(updates)
      userInfo.value = { ...userInfo.value, ...data }
      setStorage('userInfo', userInfo.value)
      return { code: 0, message: '更新成功', data, success: true }
    } catch (error: any) {
      console.error('更新用户信息失败:', error)
      return {
        code: -1,
        message: error.message || '网络错误',
        data: {} as UserInfo,
        success: false
      }
    }
  }
  
  // 退出登录
  const logout = async (): Promise<void> => {
    try {
      // 调用后端退出接口（可选）
      await apiLogout()
    } catch (error) {
      console.error('退出登录接口调用失败:', error)
    } finally {
      // 清除本地存储
      clearUserInfo()
    }
  }
  
  // 检查登录状态
  const checkLoginStatus = async (): Promise<boolean> => {
    // 🔧 修复：先从本地存储初始化用户信息
    await initUserInfo()
    
    if (!token.value) {
      console.log('[User Store] 无token，用户未登录')
      return false
    }
    
    try {
      console.log('[User Store] 验证token有效性')
      const result = await fetchUserInfo()
      if (result.success) {
        console.log('[User Store] token验证成功，用户已登录')
        return true
      } else {
        console.log('[User Store] token验证失败:', result.message)
        clearUserInfo()
        return false
      }
    } catch (error) {
      console.error('[User Store] 检查登录状态失败:', error)
      clearUserInfo()
      return false
    }
  }
  
  return {
    // 状态
    userInfo,
    token,
    
    // 计算属性
    isLoggedIn,
    userNickname,
    userAvatar,
    
    // 方法
    initUserInfo,
    loginWithWeChat,
    wechatLogin, // 调试版微信登录
    loginWithPhone,
    sendSMSCode,
    fetchUserInfo,
    updateUserInfo,
    logout,
    checkLoginStatus,
    clearUserInfo
  }
})
