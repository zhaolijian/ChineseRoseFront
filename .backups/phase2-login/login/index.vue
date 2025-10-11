<template>
  <view class="login-page">
    <!-- Logo区域 -->
    <view class="logo-section">
      <image src="/static/images/logo.png" mode="widthFix" class="logo" />
      <text class="slogan">{{ slogan }}</text>
    </view>

    <!-- 一键登录按钮 -->
    <u-button
      type="primary"
      size="large"
      :disabled="!agreed"
      @click="handleWechatLogin"
      class="login-button"
    >
      微信一键登录
    </u-button>

    <!-- 手机号登录入口 -->
    <view class="phone-login-link" @click="navigateToPhoneLogin">
      <text>使用手机号登录</text>
      <u-icon name="arrow-right" />
    </view>

    <!-- 用户协议 -->
    <view class="agreement">
      <u-checkbox v-model="agreed" shape="circle" />
      <text class="agreement-text">
        我已阅读并同意
        <text class="link" @click="openUserAgreement">《用户协议》</text>
        和
        <text class="link" @click="openPrivacyPolicy">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores'

// 组件内部UI状态
const agreed = ref(false)
const slogan = ref('记录每一次阅读的感动')

// 全局业务状态
const userStore = useUserStore()

// 微信一键登录
const handleWechatLogin = () => {
  if (!agreed.value) {
    uni.showToast({
      title: '请先同意用户协议',
      icon: 'none'
    })
    return
  }

  // #ifdef MP-WEIXIN
  uni.login({
    provider: 'weixin',
    success: (res) => {
      // 调用后端登录接口
      userStore.wechatQuickLogin(res.code)
    },
    fail: () => {
      uni.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    }
  })
  // #endif
}

// 跳转到手机号登录
const navigateToPhoneLogin = () => {
  uni.navigateTo({
    url: '/pages/login/phone-login'
  })
}

// 打开用户协议
const openUserAgreement = () => {
  uni.navigateTo({
    url: '/pages/webview/index?url=https://example.com/user-agreement'
  })
}

// 打开隐私政策
const openPrivacyPolicy = () => {
  uni.navigateTo({
    url: '/pages/webview/index?url=https://example.com/privacy-policy'
  })
}
</script>

<style scoped lang="scss">
@import '@/styles/design-tokens/login.scss';

.login-page {
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom); // 安全区域
  background: var(--background-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx 64rpx 0; // px-8 → 64rpx
}

.logo-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .logo {
    width: 384rpx; // w-48 → 384rpx
    margin-bottom: 64rpx; // mb-8 → 64rpx
  }

  .slogan {
    font-size: 56rpx; // text-[28px] → 56rpx
    font-weight: 500;
    color: var(--text-primary);
  }
}

.login-button {
  width: 100%;
  margin-bottom: 64rpx; // mb-8 → 64rpx
}

.phone-login-link {
  display: flex;
  align-items: center;
  color: var(--primary-color);
  font-size: 32rpx;
  margin-bottom: 64rpx;

  text {
    margin-right: 8rpx;
  }
}

.agreement {
  display: flex;
  align-items: flex-start;
  font-size: 28rpx;
  color: var(--text-secondary);

  .agreement-text {
    margin-left: 16rpx;
  }

  .link {
    color: var(--primary-color);
  }
}
</style>
