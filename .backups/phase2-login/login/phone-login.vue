<template>
  <view class="phone-login-page">
    <view class="header" :style="statusBarPadding">
      <view class="nav-bar">
        <view class="back-icon" @click="handleBack">
          <u-icon name="arrow-left" size="22" color="#fff"></u-icon>
        </view>
        <text class="title">手机号登录</text>
      </view>
    </view>

    <view class="form-container">
      <view class="section">
        <view class="label">国家 / 地区</view>
        <view class="row" @click="handleSelectRegion">
          <text class="value">中国大陆</text>
          <u-icon name="arrow-right" size="20" color="rgba(255,255,255,0.6)"></u-icon>
        </view>
      </view>

      <view class="section">
        <view class="label">手机号</view>
        <view class="input-wrapper">
          <text class="code">+86</text>
          <input
            class="input"
            type="number"
            maxlength="11"
            placeholder="填写手机号"
            placeholder-class="placeholder"
            v-model="phoneNumber"
          />
        </view>
      </view>

      <view class="section">
        <view class="label">验证码</view>
        <view class="input-wrapper">
          <input
            class="input"
            type="number"
            maxlength="6"
            placeholder="填写验证码"
            placeholder-class="placeholder"
            v-model="verifyCode"
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

      <view class="agreement">
        <checkbox-group @change="handleAgreementChange">
          <label class="agreement-row">
            <checkbox :checked="agreedToTerms" color="#ffffff" class="agreement-checkbox" />
            <view class="agreement-text-wrapper">
              <text class="agreement-text">我已阅读并同意</text>
              <text class="agreement-link" @click.stop="openAgreement('user')">《用户协议》</text>
              <text class="agreement-text">和</text>
              <text class="agreement-link" @click.stop="openAgreement('privacy')">《隐私政策》</text>
            </view>
          </label>
        </checkbox-group>
      </view>

      <button
        class="submit-btn"
        :class="{ disabled: !canLogin }"
        :disabled="!canLogin"
        @click="handlePhoneLogin"
      >
        确定
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/modules/user'
import { useCountdown } from '@/composables/useCountdown'
import { logger, createContext } from '@/utils'
import { isValidPhone } from '@/utils/validate'
import { sendSMSCode } from '@/api/modules/auth'
import { VERIFY_CODE_COUNTDOWN, NAVIGATE_DELAY } from '@/constants'

const userStore = useUserStore()

const phoneNumber = ref('')
const verifyCode = ref('')
const agreedToTerms = ref(false)

const { countdown, start: startCountdown, restore: restoreCountdown } = useCountdown()

const statusBarPadding = computed(() => {
  const info = uni.getSystemInfoSync()
  return `padding-top: ${info.statusBarHeight || 0}px;`
})

const isPhoneValid = computed(() => isValidPhone(phoneNumber.value))
const isDevMode = import.meta.env.DEV
const devBypassCode = import.meta.env.VITE_DEV_LOGIN_CODE || '000000'

const canLogin = computed(() => {
  if (!agreedToTerms.value) {
    return false
  }
  if (isDevMode && verifyCode.value === devBypassCode) {
    return phoneNumber.value.trim().length >= 6
  }
  return isPhoneValid.value && verifyCode.value.length === 6
})

onLoad(() => {
  restoreCountdown()
})

onShow(() => {
  restoreCountdown()
})

const handleBack = () => {
  uni.navigateBack({ delta: 1 })
}

const handleSelectRegion = () => {
  uni.showToast({ title: '暂不支持切换地区', icon: 'none' })
}

const handleAgreementChange = (e: any) => {
  agreedToTerms.value = e.detail.value.length > 0
}

const openAgreement = (type: 'user' | 'privacy') => {
  const target = type === 'user' ? '用户协议' : '隐私政策'
  uni.showToast({ title: `${target}开发中`, icon: 'none' })
}

const sendCode = async () => {
  const ctx = createContext()
  if (!isPhoneValid.value || countdown.value > 0) {
    logger.debug(ctx, '[phone-login] 手机号无效或倒计时未结束')
    return
  }

  try {
    logger.info(ctx, '[phone-login] 开始发送验证码', { phone: phoneNumber.value })
    uni.showLoading({ title: '发送中...' })
    const result = await sendSMSCode(phoneNumber.value)
    uni.hideLoading()
    uni.showToast({ title: result.message || '验证码已发送', icon: 'success' })
    startCountdown(VERIFY_CODE_COUNTDOWN)
  } catch (error: any) {
    logger.error(ctx, '[phone-login] 发送验证码失败', error)
    uni.hideLoading()
    uni.showToast({ title: error.message || '发送失败，请重试', icon: 'none' })
  }
}

const handlePhoneLogin = async () => {
  const ctx = createContext()
  const isDevBypass = isDevMode && verifyCode.value === devBypassCode
  if (!canLogin.value && !isDevBypass) {
    logger.debug(ctx, '[phone-login] 登录条件不满足')
    return
  }

  try {
    logger.info(ctx, '[phone-login] 开始手机号登录', { phone: phoneNumber.value, devBypass: isDevBypass })
    uni.showLoading({ title: '登录中...' })

    let result
    if (isDevBypass) {
      result = await userStore.devBypassLogin(phoneNumber.value)
    } else {
      result = await userStore.loginWithPhone({ phone: phoneNumber.value, code: verifyCode.value })
    }

    if (!result.success) {
      throw new Error(result.message || '登录失败')
    }

    uni.hideLoading()
    uni.showToast({ title: isDevBypass ? '开发模式登录成功' : '登录成功', icon: 'success' })

    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, NAVIGATE_DELAY)
  } catch (error: any) {
    uni.hideLoading()
    logger.error(ctx, '[phone-login] 登录失败', error)
    uni.showToast({ title: error.message || '登录失败，请重试', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/login-tokens.scss';

.phone-login-page {
  min-height: 100vh;
  background: map-get($login-bg, page);
  color: map-get($cr-colors, text-primary);
}

.header {
  padding: 0 map-get($cr-spacing, xl);
  // 使用页面渐变背景
}

.nav-bar {
  display: flex;
  align-items: center;
  gap: map-get($cr-spacing, md);
  padding: map-get($cr-spacing, xl) 0 map-get($cr-spacing, lg);
}

.back-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: map-get($cr-radius, base);
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: map-get($cr-font-size, xl);
  font-weight: map-get($cr-font-weight, semibold);
  color: #ffffff;
}

.form-container {
  margin-top: map-get($cr-spacing, xl);
  padding: 0 map-get($cr-spacing, xl) map-get($cr-spacing, xxxl);
}

.section {
  margin-bottom: map-get($cr-spacing, xl);
  display: flex;
  align-items: center;
  gap: map-get($cr-spacing, md);
}

.label {
  font-size: map-get($cr-font-size, base);
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
  width: 120rpx; // 固定宽度对齐
}

.row,
.input-wrapper {
  flex: 1; // 占据剩余空间
  background: rgba(255, 255, 255, 0.15); // 半透明白色，适配绿色背景
  border-radius: map-get($cr-radius, md);
  padding: map-get($cr-spacing, md) map-get($cr-spacing, lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: map-get($cr-spacing, md);
}

.row {
  min-height: 88rpx; // 从96rpx改为88rpx
}


.value {
  font-size: map-get($cr-font-size, md);
  color: #ffffff;
}

.input-wrapper {
  min-height: 88rpx; // 从96rpx改为88rpx
}

.code {
  font-size: map-get($cr-font-size, md);
  color: #ffffff;
}

.input {
  flex: 1;
  font-size: map-get($cr-font-size, md);
  color: #ffffff;
}

.placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.code-btn {
  padding: map-get($cr-spacing, sm) map-get($cr-spacing, lg);
  background: #ffffff;
  color: map-get($cr-colors, primary);
  font-size: map-get($cr-font-size, sm);
  border-radius: map-get($cr-radius, sm);
  border: none;
}

.code-btn.disabled {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.3);
}


.agreement {
  margin-top: map-get($cr-spacing, xl);
  color: map-get($cr-colors, text-secondary);
}

.agreement-row {
  display: flex;
  align-items: flex-start;
  gap: map-get($cr-spacing, sm);
}

.agreement-checkbox {
  margin-top: 6rpx;
  transform: scale(0.85); // 缩小以匹配文字大小
}

.agreement-text-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  font-size: map-get($cr-font-size, caption); // 从sm改为caption
}


.agreement-text {
  color: rgba(255, 255, 255, 0.8); // 白色半透明
}

.agreement-link {
  color: #ffffff; // 纯白色
  text-decoration: underline;
}

.submit-btn {
  margin-top: map-get($cr-spacing, xxl);
  width: 100%;
  height: 88rpx; // 从96rpx改为88rpx
  border-radius: map-get($cr-radius, md);
  background: #ffffff; // 白色按钮
  color: map-get($cr-colors, primary); // 品牌色文字
  font-size: map-get($cr-font-size, lg);
  font-weight: map-get($cr-font-weight, semibold);
  border: none;
}

.submit-btn.disabled {
  opacity: 0.4;
}
</style>
