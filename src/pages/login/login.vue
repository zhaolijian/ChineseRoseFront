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
      <text class="app-desc">您的纸质书笔记整理专家</text>
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
            type="number"
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
            type="number"
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
        @click="handleLogin"
      >
        登录
      </button>

      <!-- 微信登录 -->
      <view class="divider">
        <view class="line"></view>
        <text class="text">其他登录方式</text>
        <view class="line"></view>
      </view>

      <button class="wx-login-btn" @click="handleWechatLogin">
        <u-icon name="weixin-circle-fill" size="24" color="#04C160"></u-icon>
        <text class="wx-text">微信快捷登录</text>
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
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/modules/user'
import { isValidPhone } from '@/utils/validate'

const userStore = useUserStore()

// 状态栏高度
const statusBarHeight = ref(20)

// 表单数据
const phoneNumber = ref('')
const verifyCode = ref('')
const countdown = ref(0)

// 计算属性
const isPhoneValid = computed(() => isValidPhone(phoneNumber.value))
const canLogin = computed(() => isPhoneValid.value && verifyCode.value.length === 6)

// 页面加载
onLoad(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 20
})

// 发送验证码
const sendCode = async () => {
  if (!isPhoneValid.value || countdown.value > 0) return

  try {
    uni.showLoading({ title: '发送中...' })
    
    // TODO: 调用发送验证码API
    // const result = await authApi.sendSmsCode({ phone: phoneNumber.value })
    
    // 模拟发送成功
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uni.hideLoading()
    uni.showToast({
      title: '验证码已发送',
      icon: 'success'
    })

    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '发送失败，请重试',
      icon: 'none'
    })
  }
}

// 手机号登录
const handleLogin = async () => {
  if (!canLogin.value) return

  try {
    uni.showLoading({ title: '登录中...' })

    // 调用登录接口
    const loginData = {
      phone: phoneNumber.value,
      code: verifyCode.value
    }
    
    await userStore.phoneLogin(loginData)

    uni.hideLoading()
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    // 延迟跳转到首页
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }, 1500)
  } catch (error: any) {
    uni.hideLoading()
    uni.showToast({
      title: error.message || '登录失败，请重试',
      icon: 'none'
    })
  }
}

// 微信登录
const handleWechatLogin = async () => {
  // #ifdef MP-WEIXIN
  try {
    uni.showLoading({ title: '登录中...' })
    
    // 微信登录
    await userStore.wechatLogin()
    
    uni.hideLoading()
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }, 1500)
  } catch (error: any) {
    uni.hideLoading()
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    })
  }
  // #endif
  
  // #ifdef H5
  uni.showToast({
    title: 'H5暂不支持微信登录',
    icon: 'none'
  })
  // #endif
}

// 打开协议
const openAgreement = (type: 'user' | 'privacy') => {
  const url = type === 'user' 
    ? '/pages-user/agreement/user' 
    : '/pages-user/agreement/privacy'
  
  // TODO: 跳转到协议页面
  uni.showToast({
    title: '协议页面开发中',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    box-shadow: 0 0 0 2rpx var(--cr-color-primary);
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
  color: var(--cr-color-text-placeholder);
}

.code-btn {
  padding: 12rpx 24rpx;
  background: var(--cr-color-primary);
  color: #fff;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
  white-space: nowrap;
  
  &.disabled {
    background: var(--cr-color-bg-darker);
    color: var(--cr-color-text-tertiary);
  }
}

.login-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, var(--cr-color-primary), var(--cr-color-primary-dark));
  color: #fff;
  font-size: 36rpx;
  font-weight: 500;
  border-radius: 16rpx;
  border: none;
  margin-top: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
  
  &.disabled {
    background: var(--cr-color-bg-darker);
    color: var(--cr-color-text-tertiary);
    box-shadow: none;
  }
  
  &:active:not(.disabled) {
    transform: translateY(2rpx);
    box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
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
    color: var(--cr-color-text-tertiary);
  }
}

.wx-login-btn {
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
  color: var(--cr-color-text-tertiary);
}

.agreement-link {
  color: var(--cr-color-primary);
  margin: 0 4rpx;
}
</style>