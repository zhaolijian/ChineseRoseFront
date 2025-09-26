<template>
  <view class="login-page">
    <!-- 顶部状态栏占位 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 导航栏 -->
    <view class="nav-bar">
      <text class="nav-title">登录</text>
    </view>
    
    <!-- Logo区域 -->
    <view class="logo-container">
      <image class="logo" src="/static/images/logo.png" mode="aspectFit" />
      <text class="app-name">阅记</text>
      <text class="app-desc">阅有所记，学有所成</text>
    </view>

    <!-- 登录表单 -->
    <view class="form-container">
      <!-- 手机号输入 -->
      <view class="input-group">
        <view class="input-wrapper">
          <u-icon name="phone" size="20" color="#666"></u-icon>
          <input 
            v-model="phoneNumber" 
            class="input"
            type="tel"
            maxlength="11"
            placeholder="请输入手机号"
            placeholder-class="placeholder"
          />
        </view>
      </view>

      <!-- 验证码输入 -->
      <view class="input-group">
        <view class="input-wrapper">
          <u-icon name="lock" size="20" color="#666"></u-icon>
          <input 
            v-model="verifyCode" 
            class="input"
            type="text"
            maxlength="6"
            placeholder="请输入验证码"
            placeholder-class="placeholder"
          />
          <button 
            class="code-btn"
            :class="{ disabled: countdown > 0 || !isPhoneValid }"
            :disabled="countdown > 0 || !isPhoneValid"
            @click="sendCode"
          >
            {{ countdown > 0 ? `${countdown}s后重试` : '获取验证码' }}
          </button>
        </view>
      </view>

      <!-- 登录按钮 -->
      <button 
        class="login-btn"
        :class="{ disabled: !canLogin }"
        :disabled="!canLogin"
        @click="handlePhoneLogin"
      >
        登录
      </button>

      <!-- 微信登录 -->
      <view class="divider">
        <view class="line"></view>
        <text class="text">其他登录方式</text>
        <view class="line"></view>
      </view>

      <button 
        class="wechat-login-btn" 
        open-type="getPhoneNumber"
        @getphonenumber="handleGetPhoneNumber"
      >
        <u-icon name="weixin-circle-fill" size="24" color="#04C160"></u-icon>
        <text class="wx-text">一键登录</text>
      </button>

      <!-- 用户协议 -->
      <view class="agreement">
        <text class="agreement-text">登录即表示您同意</text>
        <text class="agreement-link" @click="openAgreement('user')">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link" @click="openAgreement('privacy')">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/modules/user'
import { isValidPhone } from '@/utils/validate'
import { useCountdown } from '@/composables/useCountdown'
import { logger, createContext } from '@/utils'
import { VERIFY_CODE_COUNTDOWN, NAVIGATE_DELAY } from '@/constants'
import { sendSMSCode } from '@/api/modules/auth'

const userStore = useUserStore()

// 状态栏高度
const statusBarHeight = ref(20)

// 表单数据
const phoneNumber = ref('')
const verifyCode = ref('')

// 使用倒计时 composable
const { countdown, start: startCountdown, restore: restoreCountdown } = useCountdown()

// 计算属性
const isPhoneValid = computed(() => isValidPhone(phoneNumber.value))
const canLogin = computed(() => isPhoneValid.value && verifyCode.value.length === 6)

// 页面加载
onLoad(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 20
  
  // 恢复倒计时状态
  restoreCountdown()
})

// 页面显示（从后台返回时触发）
onShow(() => {
  // 恢复倒计时状态，确保从后台返回时倒计时准确
  restoreCountdown()
})

// 发送验证码
const sendCode = async () => {
  const ctx = createContext() // 函数开始时创建一次context
  
  if (!isPhoneValid.value || countdown.value > 0) {
    logger.debug(ctx, '[sendCode] 手机号无效或倒计时未结束')
    return
  }

  try {
    logger.info(ctx, `[sendCode] 开始发送验证码，手机号: ${phoneNumber.value}`)
    uni.showLoading({ title: '发送中...' })
    
    // 调用发送验证码API
    const result = await sendSMSCode(phoneNumber.value)
    
    uni.hideLoading()
    uni.showToast({
      title: result.message || '验证码已发送',
      icon: 'success'
    })

    // 开始倒计时
    startCountdown(VERIFY_CODE_COUNTDOWN)
    logger.info(ctx, '[sendCode] 验证码发送成功，已启动倒计时')
  } catch (error: any) {
    logger.error(ctx, '[sendCode] 发送验证码失败', error)
    uni.hideLoading()
    uni.showToast({
      title: error.message || '发送失败，请重试',
      icon: 'none'
    })
  }
}

// 手机号登录
const handlePhoneLogin = async () => {
  const ctx = createContext() // 函数开始时创建一次context
  
  if (!canLogin.value) {
    logger.debug(ctx, '[handlePhoneLogin] 登录条件不满足')
    return
  }

  try {
    logger.info(ctx, '[handlePhoneLogin] 开始手机号登录')
    uni.showLoading({ title: '登录中...' })

    // 调用登录接口
    const loginData = {
      phone: phoneNumber.value,
      code: verifyCode.value
    }
    
    logger.debug(ctx, '[handlePhoneLogin] 调用登录接口', { phone: phoneNumber.value })
    const result = await userStore.loginWithPhone(loginData)
    
    if (!result.success) {
      throw new Error(result.message || '登录失败')
    }

    uni.hideLoading()
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    logger.info(ctx, '[handlePhoneLogin] 登录成功，准备跳转到首页')
    // 延迟跳转到首页
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }, NAVIGATE_DELAY)
  } catch (error: any) {
    logger.error(ctx, '[handlePhoneLogin] 登录失败', error)
    uni.hideLoading()
    uni.showToast({
      title: error.message || '登录失败，请重试',
      icon: 'none'
    })
  }
}

// 处理微信手机号授权
const handleGetPhoneNumber = async (e: any) => {
  const ctx = createContext() // 函数开始时创建一次context
  
  // 检查授权结果
  if (e.detail.errMsg !== 'getPhoneNumber:ok') {
    // 用户拒绝授权
    logger.warn(ctx, '[handleGetPhoneNumber] 用户拒绝授权手机号')
    uni.showToast({
      title: '需要授权手机号才能登录',
      icon: 'none'
    })
    return
  }

  // 获取加密数据
  const { encryptedData, iv } = e.detail
  if (!encryptedData || !iv) {
    logger.error(ctx, '[handleGetPhoneNumber] 获取手机号加密数据失败', e.detail)
    uni.showToast({
      title: '获取手机号失败，请重试',
      icon: 'none'
    })
    return
  }

  try {
    logger.info(ctx, '[handleGetPhoneNumber] 开始获取微信code')
    uni.showLoading({ 
      title: '登录中...', 
      mask: true 
    })

    // 先调用 wx.login 获取 code
    const loginRes = await uni.login({
      provider: 'weixin'
    })
    
    if (!loginRes.code) {
      throw new Error('获取微信code失败')
    }
    
    logger.debug(ctx, '[handleGetPhoneNumber] 成功获取微信code，准备调用后端接口')

    // 调用微信手机号一键登录
    await userStore.wechatLogin({
      code: loginRes.code,
      encryptedData,
      iv
    })

    uni.hideLoading()
    logger.info(ctx, '[handleGetPhoneNumber] 微信手机号一键登录成功')
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    // 延迟跳转到首页
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }, NAVIGATE_DELAY)
  } catch (error: any) {
    logger.error(ctx, '[handleGetPhoneNumber] 微信手机号登录失败', error)
    uni.hideLoading()
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    })
  }
}


// 打开协议
const openAgreement = (type: 'user' | 'privacy') => {
  // TODO: 实现用户协议和隐私政策页面 - 记录在TECH_DEBT.md [2025-09-19] [项目:chinese-rose-front]
  const target = type === 'user' ? '用户协议' : '隐私政策'
  uni.showToast({
    title: `${target}开发中`,
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  }
}

.status-bar {
  background: transparent;
}

.nav-bar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.nav-title {
  color: #fff;
  font-size: 18px;
  font-weight: 500;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  position: relative;
  z-index: 1;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.app-name {
  margin-top: 24rpx;
  font-size: 48rpx;
  font-weight: 600;
  color: #fff;
  letter-spacing: 4rpx;
}

.app-desc {
  margin-top: 12rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.form-container {
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 60rpx 40rpx;
  flex: 1;
  position: relative;
  z-index: 2;
  box-shadow: 0 -10rpx 40rpx rgba(0, 0, 0, 0.1);
}

.input-group {
  margin-bottom: 32rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  height: 96rpx;
  background: var(--cr-color-bg);
  border-radius: 16rpx;
  padding: 0 24rpx;
  transition: all 0.3s;
  
  &:focus-within {
    background: #fff;
    box-shadow: 0 0 0 2rpx var(--cr-color-primary-600);
  }
}

.input {
  flex: 1;
  height: 100%;
  margin-left: 16rpx;
  font-size: 32rpx;
  color: var(--cr-color-text);
  background: transparent;
}

.placeholder {
  color: var(--cr-color-subtext);
}

.code-btn {
  padding: 12rpx 24rpx;
  background: var(--cr-color-primary-600);
  color: #fff;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
  white-space: nowrap;
  
  &.disabled {
    background: var(--cr-color-bg);
    color: var(--cr-color-subtext);
  }
}

.login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, var(--cr-color-primary-600), var(--cr-color-primary-700));
  color: #fff;
  font-size: 36rpx;
  font-weight: 500;
  border-radius: 16rpx;
  border: none;
  margin-top: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(46, 125, 50, 0.3);
  
  &.disabled {
    background: var(--cr-color-bg);
    color: var(--cr-color-subtext);
    box-shadow: none;
  }
  
  &:active:not(.disabled) {
    transform: translateY(2rpx);
    box-shadow: 0 4rpx 16rpx rgba(46, 125, 50, 0.3);
  }
}

.divider {
  display: flex;
  align-items: center;
  margin: 60rpx 0 40rpx;
  
  .line {
    flex: 1;
    height: 1rpx;
    background: var(--cr-color-border);
  }
  
  .text {
    margin: 0 24rpx;
    font-size: 28rpx;
    color: var(--cr-color-subtext);
  }
}

.wechat-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 96rpx;
  background: #fff;
  border: 2rpx solid var(--cr-color-border);
  border-radius: 16rpx;
  font-size: 32rpx;
  color: var(--cr-color-text);
  
  &:active {
    background: var(--cr-color-bg);
  }
}

.wx-text {
  margin-left: 12rpx;
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 60rpx;
  font-size: 24rpx;
}

.agreement-text {
  color: var(--cr-color-subtext);
}

.agreement-link {
  color: var(--cr-color-primary-600);
  margin: 0 4rpx;
}
</style>
