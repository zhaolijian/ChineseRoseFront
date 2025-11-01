<template>
  <!-- 来源：PhoneLoginPage.tsx:68-185 -->
  <view class="phone-login-page">

    <!-- Header: sticky top-0 bg-background -->
    <view class="header" :style="headerPadding">
      <view class="header-content">
        <view
          class="back-button phone-login-header__back"
          role="button"
          tabindex="0"
          @tap="goBack"
          @click="goBack"
        >
          <text class="back-icon">←</text>
        </view>
      </view>
    </view>

    <!-- Container: px-8 py-8 -->
    <view class="phone-container">

      <!-- Title: text-[28px] font-bold mb-12 -->
      <text class="title">手机号登录</text>

      <!-- Form: space-y-4 -->
      <view class="form">

        <!-- 国家/地区选择行 -->
        <view class="form-row">
          <text class="label">国家/地区</text>
          <view class="field">
            <text class="country-code">中国大陆</text>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="divider" />

        <!-- 手机号输入行 -->
        <view class="form-row">
          <text class="label">手机号</text>
          <view class="field phone-input-wrapper">
            <text class="phone-prefix">+86</text>
            <input
              class="input-field"
              data-testid="phone-input"
              type="tel"
              inputmode="numeric"
              v-model="phoneNumber"
              placeholder="填写手机号"
              maxlength="11"
            />
          </view>
        </view>

        <!-- 验证码输入行 -->
        <view class="form-row">
          <text class="label">验证码</text>
          <view class="field verification-field">
            <input
              class="input-field"
              data-testid="code-input"
              type="tel"
              inputmode="numeric"
              v-model="verifyCode"
              placeholder="填写验证码"
              maxlength="6"
            />
            <button
              class="send-code-button"
              data-testid="send-code-button"
              :class="{ disabled: countdown > 0 || !isPhoneValid }"
              type="button"
              :disabled="countdown > 0 || !isPhoneValid"
              @click="sendCode"
              @tap="sendCode"
            >
              {{ sendButtonText }}
            </button>
          </view>
        </view>
      </view>

      <!-- 协议 -->
      <view class="agreement">
        <checkbox-group @change="handleAgreeChange">
          <checkbox
            value="agree"
            :checked="agreed"
            class="agreement-checkbox"
          />
        </checkbox-group>
        <text class="agreement-text">
          我已阅读并同意
          <text class="link" @click="openAgreement('user')">《用户协议》</text>
          和
          <text class="link" @click="openAgreement('privacy')">《隐私政策》</text>
        </text>
      </view>

      <!-- 登录按钮 -->
      <button
        class="login-button"
        data-testid="submit-button"
        :disabled="!canLogin"
        :loading="isSubmitting"
        @click="handleLogin"
      >
        登录
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores'
import { logger, createContext } from '@/utils'
import { isValidPhone } from '@/utils/validate'
import { sendSMSCode } from '@/api/modules/auth'
import { useCountdown } from '@/composables/useCountdown'
import { VERIFY_CODE_COUNTDOWN } from '@/constants'

type AgreementType = 'user' | 'privacy'

const AGREEMENT_URLS: Record<AgreementType, string> = {
  user: import.meta.env.VITE_AGREEMENT_URL_USER || 'https://example.com/user-agreement',
  privacy: import.meta.env.VITE_AGREEMENT_URL_PRIVACY || 'https://example.com/privacy-policy'
}

const userStore = useUserStore()

const phoneNumber = ref('')
const verifyCode = ref('')
const agreed = ref(false)
const isSubmitting = ref(false)
const hasRequestedCode = ref(false)
const { countdown, start: startCountdown, restore: restoreCountdown } = useCountdown()
const normalizedPhone = computed(() => `${phoneNumber.value ?? ''}`.trim())
const normalizedCode = computed(() => `${verifyCode.value ?? ''}`.trim())

// 状态栏高度适配
const headerPadding = computed(() => {
  const info = uni.getSystemInfoSync()
  return `padding-top: ${info.statusBarHeight || 0}px;`
})

// 手机号格式验证
const isPhoneValid = computed(() => {
  return isValidPhone(normalizedPhone.value)
})

// 是否可登录
const canLogin = computed(() => {
  return isPhoneValid.value && normalizedCode.value.length === 6
  // ✅ 移除 && agreed.value，不再作为前置条件
})

const sendButtonText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}s`
  }
  return hasRequestedCode.value ? '重新发送' : '获取验证码'
})

watch(countdown, (value) => {
  if (value > 0) {
    hasRequestedCode.value = true
  }
})

// 发送验证码
const sendCode = async () => {
  const ctx = createContext()

  if (!isPhoneValid.value) return
  if (countdown.value > 0) return
  const phone = normalizedPhone.value

  try {
    logger.info(ctx, '[PhoneLoginPage] 发送验证码', { phone })

    uni.showLoading({ title: '发送中...' })
    await sendSMSCode(phone)

    hasRequestedCode.value = true
    startCountdown(VERIFY_CODE_COUNTDOWN)
    uni.showToast({ title: '验证码已发送', icon: 'success' })

    logger.info(ctx, '[PhoneLoginPage] 验证码发送成功')
  } catch (error: any) {
    logger.error(ctx, '[PhoneLoginPage] 发送验证码失败', error)
    uni.showToast({ title: error?.message || '发送失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const syncCountdownState = () => {
  restoreCountdown()
  if (countdown.value > 0) {
    hasRequestedCode.value = true
  }
}

onLoad(syncCountdownState)
onShow(syncCountdownState)

// 处理登录
const handleLogin = async () => {
  const ctx = createContext()

  if (!canLogin.value) return

  // ✅ 添加协议校验（在表单校验之后）
  if (!agreed.value) {
    uni.showToast({
      title: '请先勾选用户协议和隐私政策',
      icon: 'none',
      duration: 2000
    })
    return
  }

  try {
    isSubmitting.value = true
    const phone = normalizedPhone.value
    const code = normalizedCode.value
    logger.info(ctx, '[PhoneLoginPage] 开始手机号登录', { phone })

    uni.showLoading({ title: '登录中...' })

    const result = await userStore.loginWithPhone({
      phone,
      code
    })

    if (!result?.success) {
      throw new Error(result?.message || '登录失败')
    }

    uni.showToast({ title: '登录成功', icon: 'success' })

    logger.info(ctx, '[PhoneLoginPage] 登录成功')

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 500)

  } catch (error: any) {
    logger.error(ctx, '[PhoneLoginPage] 登录失败', error)
    uni.showToast({ title: error?.message || '登录失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
    isSubmitting.value = false
  }
}

// 协议勾选
const handleAgreeChange = (e: any) => {
  agreed.value = e.detail.value.includes('agree')
}

// 通过 checkbox-group 的 change 事件统一更新，不再在 checkbox 上做二次切换，避免瞬间又被反转

// 打开协议
const openAgreement = (type: AgreementType) => {
  const url = AGREEMENT_URLS[type]
  uni.navigateTo({
    url: `/pages/webview/index?url=${encodeURIComponent(url)}`
  })
}

// 返回
const goBack = () => {
  uni.navigateBack({ delta: 1 })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens/login.scss';

// 页面容器
.phone-login-page {
  min-height: 100vh;
  background: map-get($login-colors, background); // 来源：#fafafa (globals.css:9)
}

// 头部（来源：PhoneLoginPage.tsx:69-77）
.header {
  position: sticky;
  top: 0;
  background: map-get($login-colors, background);
  z-index: 100;
  width: 100%; // ✅ 确保header占满宽度
}

.header-content {
  padding: 48rpx 64rpx; // 来源：py-6 px-8
  display: flex;
  align-items: center;
  justify-content: flex-start; // 左对齐
  gap: 16rpx; // 来源：space-x-2 → 2 * 8 = 16rpx
  width: 100%; // ✅ 添加：确保容器占满宽度
}

.back-button {
  background: transparent;
  padding: 0;
  border: none;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start; // ✅ 改为左对齐
  width: auto; // ✅ 自动宽度，不撑满
  min-width: 48rpx; // ✅ 最小宽度保证可点击
}

.back-icon {
  font-size: 48rpx; // 来源：w-6 → 6 * 8 = 48rpx
  color: map-get($login-colors, title); // ✅ 使用设计令牌 #111827
  line-height: 1;
}

// 主容器（来源：PhoneLoginPage.tsx:80）
.phone-container {
  padding: 64rpx; // 来源：px-8 py-8 → 8 * 8 = 64rpx
}

// 标题（来源：PhoneLoginPage.tsx:82）
.title {
  text-align: center; // 居中显示
  font-size: map-get($login-font-sizes, title); // 来源：56rpx (text-[28px] → 28 * 2)
  font-weight: map-get($login-font-weights, bold); // 来源：font-bold → 700
  color: #111827; // 来源：text-[#111827]
  margin-bottom: 96rpx; // 来源：mb-12 → 12 * 8 = 96rpx
  display: block;
}

// 表单容器（来源：PhoneLoginPage.tsx:85）
.form {
  display: flex;
  flex-direction: column;
  gap: 32rpx; // 来源：space-y-4 → 4 * 8 = 32rpx（使用gap替代space-y）
}

// 表单行（关键！来源：PhoneLoginPage.tsx:88,100,114）
.form-row {
  display: grid;
  grid-template-columns: 160rpx 1fr; // ✅ 从180rpx改为160rpx，内容左移
  gap: 24rpx; // 来源：gap-3 → 3 * 8 = 24rpx
  align-items: center;
}

.label {
  font-size: map-get($login-font-sizes, base); // 来源：32rpx (text-base)
  color: map-get($login-colors, foreground);   // 来源：#333333
  text-align: left;
}

.field {
  display: flex;
  align-items: center;
}

// 分隔线（来源：PhoneLoginPage.tsx:99）
.divider {
  width: 100%;
  height: 1rpx; // 发丝线效果
  background: map-get($login-colors, border); // 来源：rgba(0,168,45,0.12)
}

// 国家代码（来源：PhoneLoginPage.tsx:93）
.country-code {
  font-size: map-get($login-font-sizes, base); // 来源：32rpx
  color: map-get($login-colors, foreground);   // 来源：#333333
}

// +86前缀（来源：PhoneLoginPage.tsx:107-112）
.phone-prefix {
  font-size: map-get($login-font-sizes, base); // 来源：32rpx
  color: map-get($login-colors, foreground);   // 来源：#333333
  margin-right: 16rpx; // 来源：space-x-2 → 2 * 8 = 16rpx
}

.phone-input-wrapper {
  display: flex;
  align-items: center;
}

// 输入框（关键！来源：PhoneLoginPage.tsx:107-112,121-126）
.input-field {
  flex: 1;
  background: transparent; // 来源：bg-transparent
  border: none;
  border-bottom: 1rpx solid map-get($login-colors, border); // 来源：border-b border-border
  border-radius: 0; // 来源：rounded-none
  padding-left: 16rpx; // ✅ 从24rpx改为16rpx
  padding-right: 16rpx; // ✅ 添加右边距，视觉更平衡
  height: 96rpx; // 来源：h-12 → 12 * 8 = 96rpx
  font-size: map-get($login-font-sizes, base); // 来源：32rpx
  color: map-get($login-colors, foreground);   // 来源：#333333

  &::placeholder {
    color: map-get($login-colors, muted-foreground); // 来源：#666666
  }

  &:focus {
    border-bottom-color: map-get($login-colors, primary); // 来源：#00a82d
    outline: none;
  }
}

// 验证码输入区域
.verification-field {
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding-right: 16rpx; // ✅ 添加右侧留白，按钮与边界有间隔
}

.send-code-button {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: auto;
  height: auto;
  padding: 0;
  line-height: 1.2;
  background: transparent;
  color: map-get($login-colors, primary);
  font-size: map-get($login-font-sizes, base);
  border: none;
  white-space: nowrap;
  border-radius: 0;
  box-shadow: none;
  font-weight: map-get($login-font-weights, medium);

  &::after {
    border: none;
  }

  &.disabled {
    color: map-get($login-colors, muted-foreground);
    pointer-events: none;
  }
}

button.send-code-button {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

// 登录按钮（来源：PhoneLoginPage.tsx:167-179）
// 注意：登录按钮必须在协议下面
.login-button {
  width: 100%;
  height: map-get($login-sizes, button-height); // 来源：96rpx (h-[48px] → 48 * 2)
  background: map-get($login-colors, primary);  // 来源：#00a82d
  color: white;
  border-radius: 16rpx; // 来源：rounded-lg → 8px * 2 = 16rpx
  border: none;
  font-size: map-get($login-font-sizes, base); // 来源：32rpx
  font-weight: map-get($login-font-weights, medium); // 来源：font-medium → 500
  margin-top: 48rpx; // 来源：mt-6 → 6 * 8 = 48rpx
  transition: all 0.2s ease-in-out;

  &[disabled] {
    background: map-get($login-colors, disabled-bg);   // 来源：#E5E7EB
    color: map-get($login-colors, disabled-text);      // 来源：#9CA3AF
    opacity: 0.6;
  }
}

// 协议区域（来源：PhoneLoginPage.tsx:153-165）
.agreement {
  display: flex;
  align-items: flex-start;
  flex-wrap: nowrap; // 防止换行
  gap: 24rpx; // 来源：space-x-3 → 3 * 8 = 24rpx
  padding: 0; // 移除padding，确保左对齐
  margin-top: 48rpx; // 来源：mt-6 → 6 * 8 = 48rpx
}

.agreement-checkbox {
  width: 32rpx;  // 来源：w-4 → 4 * 8 = 32rpx
  height: 32rpx;
  margin-top: 4rpx; // 来源：mt-0.5 → 0.5 * 8 = 4rpx
  transform: scale(0.8); // 微信小程序checkbox默认较大，缩小到设计尺寸
}

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
</style>
