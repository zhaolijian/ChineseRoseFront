<template>
  <!-- 来源：LoginPage.tsx:26-90 -->
  <view class="login-page">
    <!-- Container: flex-1 flex flex-col items-center justify-center px-8 pt-6 pb-20 -->
    <view class="login-container">

      <!-- Header: text-center mb-8 -->
      <view class="header">
        <!-- Title: text-[#111827] text-[28px] font-bold mb-6 -->
        <text class="title">欢迎来到阅记</text>

        <!-- Logo: w-48 h-auto mb-6 -->
        <image
          class="logo"
          src="/static/images/yueji_logo_book_sprout_2x.png"
          mode="aspectFit"
          style="width: 384rpx; height: 384rpx;"
        />

        <!-- Slogan: text-primary/70 text-sm font-medium -->
        <text class="slogan">• 阅有所记  学有所成 •</text>
      </view>

      <!-- LoginStack: flex flex-col items-center space-y-5 px-8 -->
      <view class="login-stack">

        <!-- WeChat Button: w-full max-w-xs h-[48px] bg-primary -->
        <button
          class="wechat-button"
          open-type="getPhoneNumber"
          :loading="isLoggingIn"
          @getphonenumber="handleGetPhoneNumber"
        >
          一键登录
        </button>

        <!-- Agreement: flex items-start space-x-3 w-full max-w-xs -->
        <view class="agreement">
          <checkbox-group @change="handleAgreeChange">
            <checkbox value="agree" :checked="agreed" class="agreement-checkbox" />
          </checkbox-group>
          <text class="agreement-text">
            我已阅读并同意
            <text class="link" @click="openAgreement('user')">《用户协议》</text>
            和
            <text class="link" @click="openAgreement('privacy')">《隐私政策》</text>
          </text>
        </view>

        <!-- Phone Login Button: Ghost Button variant -->
        <button
          class="phone-login-button"
          @click="goToPhoneLogin"
        >
          其他手机号登录
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores'
import { logger, createContext } from '@/utils'

const userStore = useUserStore()
const agreed = ref(false)
const isLoggingIn = ref(false)

// 处理协议勾选
const handleAgreeChange = (e: any) => {
  agreed.value = e.detail.value.includes('agree')
}

// 微信一键登录（来源：LoginPage.tsx handleWeChatLogin + 2025微信最佳实践）
const handleGetPhoneNumber = async (e: any) => {
  const ctx = createContext()

  // 检查协议勾选
  if (!agreed.value) {
    uni.showToast({
      title: '请先勾选用户协议和隐私政策',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // #ifdef MP-WEIXIN
  try {
    // 检查用户是否授权手机号
    if (!e.detail.code) {
      logger.warn(ctx, '[LoginPage] 用户拒绝授权手机号')
      uni.showToast({
        title: '需要授权手机号才能一键登录',
        icon: 'none'
      })
      return
    }

    isLoggingIn.value = true
    logger.info(ctx, '[LoginPage] 开始微信一键登录')

    // Step 1: 获取登录凭证code
    const loginRes = await uni.login({ provider: 'weixin' })
    if (!loginRes.code) {
      throw new Error('获取登录凭证失败')
    }
    logger.debug(ctx, '[LoginPage] 获取loginCode成功')

    // Step 2: 获取手机号code（从按钮事件中）
    const phoneCode = e.detail.code
    logger.debug(ctx, '[LoginPage] 获取phoneCode成功')

    // Step 3: 调用后端一键登录接口
    logger.info(ctx, '[LoginPage] 调用微信一键登录接口')

    await userStore.wechatQuickLogin(loginRes.code, phoneCode)

    uni.showToast({ title: '登录成功', icon: 'success' })
    logger.info(ctx, '[LoginPage] 一键登录成功')

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 500)

  } catch (error: any) {
    logger.error(ctx, '[LoginPage] 微信登录失败', error)
    uni.showToast({
      title: error?.message || '登录失败，请重试',
      icon: 'none'
    })
  } finally {
    isLoggingIn.value = false
  }
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '请在微信小程序中使用',
    icon: 'none'
  })
  // #endif
}

// 打开协议
const openAgreement = (type: 'user' | 'privacy') => {
  const url = type === 'user'
    ? import.meta.env.VITE_AGREEMENT_URL_USER || 'https://example.com/user-agreement'
    : import.meta.env.VITE_AGREEMENT_URL_PRIVACY || 'https://example.com/privacy-policy'

  uni.navigateTo({
    url: `/pages/webview/index?url=${encodeURIComponent(url)}`
  })
}

// 跳转手机号登录
const goToPhoneLogin = () => {
  uni.navigateTo({
    url: '/pages/login/phone-login'
  })
}
</script>

<style lang="scss" scoped>
// 导入设计令牌
@import '@/styles/design-tokens/login.scss';

// 页面容器（来源：LoginPage.tsx:26）
.login-page {
  min-height: 100vh;
  background: map-get($login-colors, background); // 来源：globals.css:9 --background
  display: flex;
  flex-direction: column;
}

// 主容器（来源：LoginPage.tsx:29）
.login-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx 64rpx 160rpx; // 来源：pt-6 px-8 pb-20
}

// 头部区域（来源：LoginPage.tsx:31）
.header {
  text-align: center;
  margin-bottom: 64rpx; // 来源：mb-8 → 8 * 8 = 64rpx
}

// 标题（来源：LoginPage.tsx:32）
.title {
  color: map-get($login-colors, title);      // 来源：#111827
  font-size: map-get($login-font-sizes, title); // 来源：56rpx (text-[28px] → 28 * 2)
  font-weight: map-get($login-font-weights, bold); // 来源：font-bold → 700
  margin-bottom: 48rpx; // 来源：mb-6 → 6 * 8 = 48rpx
  display: block;
}

// Logo（来源：LoginPage.tsx:40-41）
.logo {
  width: map-get($login-sizes, logo-width); // 来源：384rpx (w-48 → 48 * 8 = 384rpx)
  height: auto;
  margin-bottom: 48rpx; // 来源：mb-6 → 48rpx
}

// Slogan（来源：LoginPage.tsx:46）
.slogan {
  color: map-get($login-colors, slogan);       // 来源：rgba(0,168,45,0.7)
  font-size: map-get($login-font-sizes, sm);   // 来源：28rpx (text-sm)
  font-weight: map-get($login-font-weights, medium); // 来源：font-medium → 500
  display: block;
}

// 登录栈容器（来源：LoginPage.tsx:57）
.login-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx; // 来源：space-y-5 → 5 * 8 = 40rpx（使用gap替代space-y，微信小程序兼容）
  padding: 0 64rpx; // 来源：px-8 → 64rpx
}

// 微信登录按钮（来源：LoginPage.tsx:60-68）
.wechat-button {
  width: 100%;
  max-width: 640rpx; // 来源：max-w-xs → 320px * 2 = 640rpx
  height: map-get($login-sizes, button-height); // 来源：96rpx (h-[48px] → 48 * 2)
  background: map-get($login-colors, primary);  // 来源：globals.css:12 #00a82d
  color: white;
  border-radius: 16rpx; // 来源：rounded-lg → 8px * 2 = 16rpx
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx; // 来源：space-x-2 → 2 * 8 = 16rpx
  font-size: map-get($login-font-sizes, base); // 来源：32rpx (text-base)
  font-weight: map-get($login-font-weights, medium); // 来源：font-medium → 500
  transition: all 0.2s ease-in-out; // 来源：transition-all duration-200

  // 禁用状态（来源：LoginPage.tsx:64-66）
  &[disabled] {
    background: map-get($login-colors, disabled-bg);   // 来源：#E5E7EB
    color: map-get($login-colors, disabled-text);      // 来源：#9CA3AF
    opacity: 0.6;
  }
}

// 协议勾选区（来源：LoginPage.tsx:71-82）
.agreement {
  display: flex;
  align-items: flex-start;
  flex-wrap: nowrap; // 防止换行
  gap: 24rpx; // 来源：space-x-3 → 3 * 8 = 24rpx
  width: 100%;
  max-width: 640rpx; // 来源：max-w-xs
}

.agreement-checkbox {
  width: 32rpx;  // 来源：w-4 → 4 * 8 = 32rpx
  height: 32rpx; // 来源：h-4 → 32rpx
  margin-top: 4rpx; // 来源：mt-0.5 → 0.5 * 8 = 4rpx
  transform: scale(0.8); // 微信小程序checkbox默认较大，缩小到设计尺寸
}

// 协议文字（来源：LoginPage.tsx:76-82）
.agreement-text {
  flex: 1; // 自适应宽度
  font-size: map-get($login-font-sizes, xs); // 来源：24rpx (text-xs)
  color: map-get($login-colors, gray-text);  // 来源：#6b7280
  line-height: 1.5;
  text-align: left;
  word-break: keep-all; // 防止中文换行
  white-space: nowrap; // 强制单行

  .link {
    color: map-get($login-colors, primary); // 来源：#00a82d
    text-decoration: underline;
  }
}

// Ghost Button样式（来源：LoginPage.tsx:93-95 variant="ghost"）
.phone-login-button {
  // 布局
  width: 100%;
  max-width: 640rpx; // 来源：max-w-xs → 320px * 2
  padding: 16rpx 32rpx; // 来源：px-4 py-2

  // 外观
  background: transparent; // 来源：variant="ghost" → 透明背景
  border: none;
  border-radius: 16rpx; // 来源：rounded-lg → 8px * 2

  // 文字样式
  color: map-get($login-colors, primary); // #00a82d
  font-size: map-get($login-font-sizes, sm); // 28rpx
  font-weight: map-get($login-font-weights, medium); // 500
  text-decoration: none; // ✅ 无下划线（核心修复！）
  text-align: center;

  // 交互效果
  transition: all 0.2s ease-in-out;

  // Hover状态（H5端生效）
  &:hover {
    background: rgba(0, 168, 45, 0.1);
  }

  // 移除uni-app默认button样式
  &::after {
    border: none;
  }
}
</style>
