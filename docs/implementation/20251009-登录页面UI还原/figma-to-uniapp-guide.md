# Figma Make → uni-app 实现指南

**文档版本**: v1.0
**更新日期**: 2025-10-09
**Figma源**: https://www.figma.com/make/WpRJCjULqwmrE5OhPHT9Ql

---

## 📋 目录

1. [设计令牌系统](#1-设计令牌系统)
2. [React TSX → Vue3 转换规则](#2-react-tsx--vue3-转换规则)
3. [LoginPage 实现方案](#3-loginpage-实现方案)
4. [PhoneLoginPage 实现方案](#4-phoneloginpage-实现方案)
5. [验证清单](#5-验证清单)

---

## 1. 设计令牌系统

### 1.1 文件位置

```
/Users/zhaolijian/Projects/chinese-rose-front/src/styles/design-tokens/
├── login.scss                    # 颜色、字体、间距、尺寸
└── figma-layout-classes.scss     # 布局类（flex、grid、spacing）
```

### 1.2 核心设计令牌（来源：globals.css）

| 令牌类型 | Figma值 | uni-app值 | 来源 |
|---------|---------|-----------|------|
| **主色** | `--primary: #00a82d` | `$login-colors.primary` | globals.css:12 |
| **背景色** | `--background: #fafafa` | `$login-colors.background` | globals.css:9 |
| **标题色** | `#111827` | `$login-colors.title` | LoginPage.tsx:32 |
| **边框色** | `rgba(0,168,45,0.12)` | `$login-colors.border` | globals.css:16 |
| **标题字号** | `text-[28px]` | `56rpx` | LoginPage.tsx:32 |
| **按钮高度** | `h-[48px]` | `96rpx` | LoginPage.tsx:68 |
| **Logo宽度** | `w-48` (192px) | `384rpx` | LoginPage.tsx:40-41 |

### 1.3 Tailwind → rpx 转换公式

```yaml
# 间距刻度转换（n → n * 8rpx）
space-y-5 (20px) → gap: 40rpx
px-8 (32px) → padding: 0 64rpx
mb-6 (24px) → margin-bottom: 48rpx

# 像素值转换（px → px * 2 rpx）
text-[28px] → font-size: 56rpx
h-[48px] → height: 96rpx
w-48 (192px) → width: 384rpx

# 边框特殊处理（保持发丝线）
border-b → border-bottom: 1rpx solid rgba(0,168,45,0.12)
```

---

## 2. React TSX → Vue3 转换规则

### 2.1 组件结构转换

#### 2.1.1 基础组件映射

| React (Figma Make) | uni-app Vue3 | 说明 |
|-------------------|--------------|------|
| `<div>` | `<view>` | 容器组件 |
| `<img>` | `<image>` | 图片组件 |
| `<input>` | `<input>` | 输入框（保持） |
| `<button>` | `<button>` 或 `<u-button>` | 按钮组件 |
| `<span>` | `<text>` | 文本组件 |

#### 2.1.2 className → class 转换

```yaml
React TSX:
  <div className="flex flex-col items-center space-y-5">

Vue3 Template:
  <view class="stack-gap-xl">
  <!-- 或直接写内联样式 -->
  <view style="display: flex; flex-direction: column; gap: 40rpx">
```

**重要提醒**: 微信小程序不支持`> * + *`选择器，必须用`gap`替代`space-y-*`

### 2.2 状态管理转换

#### 2.2.1 useState → ref

```typescript
// React (Figma Make)
const [agreed, setAgreed] = useState(false)
const [phone, setPhone] = useState('')

// Vue3 Composition API
import { ref } from 'vue'
const agreed = ref(false)
const phone = ref('')
```

#### 2.2.2 事件处理转换

```typescript
// React
onClick={() => setAgreed(!agreed)}
onChange={(e) => setPhone(e.target.value)}

// Vue3
@click="agreed = !agreed"
@input="phone = $event.detail.value"
```

### 2.3 副作用处理转换

#### 2.3.1 useEffect → watch + onMounted

```typescript
// React (PhoneLoginPage.tsx:145-155)
useEffect(() => {
  if (countdown > 0) {
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }
}, [countdown])

// Vue3 Composition API
import { ref, watch, onUnmounted } from 'vue'

let timer: number | null = null

watch(countdown, (val) => {
  if (val > 0) {
    timer = setInterval(() => {
      countdown.value--
    }, 1000)
  } else if (timer) {
    clearInterval(timer)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
```

### 2.4 样式转换

#### 2.4.1 Tailwind → uni-app SCSS

```scss
// Figma: className="max-w-xs h-[48px] w-full"
// uni-app:
.login-button {
  max-width: 640rpx;  // max-w-xs (320px → 640rpx)
  height: 96rpx;      // h-[48px] (48px → 96rpx)
  width: 100%;        // w-full
}
```

#### 2.4.2 Grid布局精确转换（关键！）

```scss
// Figma: grid grid-cols-[90px_1fr] gap-3
// uni-app:
.form-row {
  display: grid;
  grid-template-columns: 180rpx 1fr; // 90px → 180rpx
  gap: 24rpx;                        // gap-3 (12px → 24rpx)
  align-items: center;
}
```

#### 2.4.3 输入框底边框（关键！）

```scss
// Figma: border-none border-b border-border
// uni-app:
.input-field {
  border: none;
  border-bottom: 1rpx solid rgba(0, 168, 45, 0.12); // globals.css --border
  border-radius: 0; // rounded-none
}
```

---

## 3. LoginPage 实现方案

### 3.1 组件结构（完整对应TSX）

```vue
<template>
  <!-- 来源：LoginPage.tsx:26-90 -->
  <view class="login-page">
    <!-- Container: flex-1 flex flex-col items-center justify-center px-8 pt-6 pb-20 -->
    <view class="login-container">

      <!-- Header: text-center mb-8 -->
      <view class="header">
        <!-- Title: text-[#111827] text-[28px] font-bold mb-6 -->
        <text class="title">欢迎使用阅记</text>

        <!-- Logo: w-48 h-auto mb-6 -->
        <image
          class="logo"
          src="/static/images/logo.png"
          mode="aspectFit"
        />

        <!-- Slogan: text-primary/70 text-sm font-medium -->
        <text class="slogan">让纸质阅读更智能</text>
      </view>

      <!-- LoginStack: flex flex-col items-center space-y-5 px-8 -->
      <view class="login-stack">

        <!-- WeChat Button: w-full max-w-xs h-[48px] bg-primary -->
        <button
          class="wechat-button"
          :disabled="!agreed"
          @click="handleWeChatLogin"
        >
          <image class="wechat-icon" src="/static/icons/wechat.svg" />
          <text>微信一键登录</text>
        </button>

        <!-- Agreement: flex items-start space-x-3 w-full max-w-xs -->
        <view class="agreement">
          <checkbox-group @change="handleAgreeChange">
            <checkbox value="agree" :checked="agreed" />
          </checkbox-group>
          <text class="agreement-text">
            我已阅读并同意
            <text class="link" @click="openAgreement('user')">《用户协议》</text>
            和
            <text class="link" @click="openAgreement('privacy')">《隐私政策》</text>
          </text>
        </view>

        <!-- Phone Login Link -->
        <text class="phone-link" @click="goToPhoneLogin">
          使用手机号登录
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const agreed = ref(false)

// 处理协议勾选
const handleAgreeChange = (e: any) => {
  agreed.value = e.detail.value.includes('agree')
}

// 微信登录
const handleWeChatLogin = async () => {
  if (!agreed.value) return

  try {
    // 调用微信登录API
    const res = await uni.login({ provider: 'weixin' })
    // TODO: 发送code到后端换取token
    console.log('微信登录code:', res.code)
  } catch (error) {
    uni.showToast({ title: '登录失败', icon: 'none' })
  }
}

// 打开协议
const openAgreement = (type: 'user' | 'privacy') => {
  router.push(`/pages/agreement/${type}`)
}

// 跳转手机号登录
const goToPhoneLogin = () => {
  router.push('/pages/login/phone')
}
</script>

<style lang="scss" scoped>
// 导入设计令牌
@import '@/styles/design-tokens/login.scss';

// 页面容器（来源：LoginPage.tsx:26）
.login-page {
  min-height: 100vh;
  background: map-get($login-colors, background); // globals.css:9 --background
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
  padding: 48rpx 64rpx 160rpx; // pt-6 px-8 pb-20
}

// 头部区域（来源：LoginPage.tsx:31）
.header {
  text-align: center;
  margin-bottom: 64rpx; // mb-8 → 64rpx
}

// 标题（来源：LoginPage.tsx:32）
.title {
  color: map-get($login-colors, title);      // #111827
  font-size: map-get($login-font-sizes, title); // 56rpx
  font-weight: map-get($login-font-weights, bold); // 700
  margin-bottom: 48rpx; // mb-6 → 48rpx
  display: block;
}

// Logo（来源：LoginPage.tsx:40-41）
.logo {
  width: map-get($login-sizes, logo-width); // 384rpx
  height: auto;
  margin-bottom: 48rpx; // mb-6 → 48rpx
}

// Slogan（来源：LoginPage.tsx:46）
.slogan {
  color: map-get($login-colors, slogan);       // rgba(0,168,45,0.7)
  font-size: map-get($login-font-sizes, sm);   // 28rpx
  font-weight: map-get($login-font-weights, medium); // 500
  display: block;
}

// 登录栈容器（来源：LoginPage.tsx:57）
.login-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx; // space-y-5 → 40rpx
  padding: 0 64rpx; // px-8 → 64rpx
}

// 微信登录按钮（来源：LoginPage.tsx:60-68）
.wechat-button {
  width: 100%;
  max-width: 640rpx; // max-w-xs → 640rpx
  height: map-get($login-sizes, button-height); // 96rpx
  background: map-get($login-colors, primary);  // #00a82d
  color: white;
  border-radius: 16rpx; // rounded-lg
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx; // space-x-2
  font-size: map-get($login-font-sizes, base); // 32rpx
  font-weight: map-get($login-font-weights, medium); // 500
  transition: all 0.2s ease-in-out; // transition-all duration-200

  // 禁用状态（来源：LoginPage.tsx:64-66）
  &:disabled {
    background: map-get($login-colors, disabled-bg);   // #E5E7EB
    color: map-get($login-colors, disabled-text);      // #9CA3AF
    opacity: 0.6;
  }

  .wechat-icon {
    width: 48rpx; // w-6 → 48rpx
    height: 48rpx;
  }
}

// 协议勾选区（来源：LoginPage.tsx:71-82）
.agreement {
  display: flex;
  align-items: flex-start;
  gap: 24rpx; // space-x-3 → 24rpx
  width: 100%;
  max-width: 640rpx; // max-w-xs

  checkbox {
    width: 32rpx;  // w-4 → 32rpx
    height: 32rpx; // h-4 → 32rpx
    margin-top: 4rpx; // mt-0.5 → 4rpx
  }
}

// 协议文字（来源：LoginPage.tsx:76-82）
.agreement-text {
  font-size: map-get($login-font-sizes, xs); // 24rpx
  color: map-get($login-colors, gray-text);  // #6b7280
  line-height: 1.5;
  text-align: left;

  .link {
    color: map-get($login-colors, primary); // #00a82d
    text-decoration: underline;
  }
}

// 手机号登录链接（来源：LoginPage.tsx:87）
.phone-link {
  color: map-get($login-colors, primary);    // #00a82d
  font-size: map-get($login-font-sizes, sm); // 28rpx
  text-decoration: underline;
  cursor: pointer;
}
</style>
```

---

## 4. PhoneLoginPage 实现方案

### 4.1 组件结构（完整对应TSX）

```vue
<template>
  <!-- 来源：PhoneLoginPage.tsx:68-185 -->
  <view class="phone-login-page">

    <!-- Header: sticky top-0 bg-background -->
    <view class="header">
      <button class="back-button" @click="goBack">
        <image src="/static/icons/arrow-left.svg" />
      </button>
      <text class="header-title">手机号登录</text>
    </view>

    <!-- Container: px-8 py-8 -->
    <view class="phone-container">

      <!-- Title: text-[28px] font-bold mb-12 -->
      <text class="title">欢迎回来</text>

      <!-- Form: space-y-4 -->
      <view class="form">

        <!-- 国家/地区选择行 -->
        <view class="form-row">
          <text class="label">国家/地区</text>
          <view class="field">
            <text class="country-code">中国大陆 +86</text>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="divider" />

        <!-- 手机号输入行 -->
        <view class="form-row">
          <text class="label">手机号</text>
          <view class="field">
            <input
              class="input-field"
              type="number"
              v-model="phone"
              placeholder="请输入手机号"
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
              type="number"
              v-model="code"
              placeholder="请输入验证码"
              maxlength="6"
            />
            <button
              class="send-code-button"
              :disabled="countdown > 0 || !isPhoneValid"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
            </button>
          </view>
        </view>
      </view>

      <!-- 登录按钮 -->
      <button
        class="login-button"
        :disabled="!canLogin"
        @click="handleLogin"
      >
        登录
      </button>

      <!-- 协议 -->
      <view class="agreement">
        <checkbox-group @change="handleAgreeChange">
          <checkbox value="agree" :checked="agreed" />
        </checkbox-group>
        <text class="agreement-text">
          我已阅读并同意
          <text class="link" @click="openAgreement('user')">《用户协议》</text>
          和
          <text class="link" @click="openAgreement('privacy')">《隐私政策》</text>
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const phone = ref('')
const code = ref('')
const agreed = ref(false)
const countdown = ref(0)

let timer: number | null = null

// 手机号格式验证
const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(phone.value)
})

// 是否可登录
const canLogin = computed(() => {
  return isPhoneValid.value && code.value.length === 6 && agreed.value
})

// 倒计时逻辑（来源：PhoneLoginPage.tsx:145-155）
watch(countdown, (val) => {
  if (val > 0) {
    timer = setInterval(() => {
      countdown.value--
    }, 1000)
  } else if (timer) {
    clearInterval(timer)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 发送验证码
const sendCode = async () => {
  if (!isPhoneValid.value) return

  try {
    // TODO: 调用后端API发送验证码
    console.log('发送验证码到:', phone.value)
    countdown.value = 60
    uni.showToast({ title: '验证码已发送', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '发送失败', icon: 'none' })
  }
}

// 处理登录
const handleLogin = async () => {
  if (!canLogin.value) return

  try {
    // TODO: 调用后端登录API
    console.log('登录:', { phone: phone.value, code: code.value })
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '登录失败', icon: 'none' })
  }
}

// 协议勾选
const handleAgreeChange = (e: any) => {
  agreed.value = e.detail.value.includes('agree')
}

// 打开协议
const openAgreement = (type: 'user' | 'privacy') => {
  router.push(`/pages/agreement/${type}`)
}

// 返回
const goBack = () => {
  router.back()
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens/login.scss';

// 页面容器
.phone-login-page {
  min-height: 100vh;
  background: map-get($login-colors, background); // #fafafa
}

// 头部（来源：PhoneLoginPage.tsx:69-77）
.header {
  position: sticky;
  top: 0;
  background: map-get($login-colors, background);
  padding: 48rpx 64rpx; // py-6 px-8
  display: flex;
  align-items: center;
  gap: 16rpx; // space-x-2

  .back-button {
    background: transparent;
    padding: 0;

    image {
      width: 48rpx; // w-6 → 48rpx
      height: 48rpx;
    }
  }

  .header-title {
    font-size: map-get($login-font-sizes, base); // 32rpx
    font-weight: map-get($login-font-weights, medium); // 500
  }
}

// 主容器（来源：PhoneLoginPage.tsx:80）
.phone-container {
  padding: 64rpx; // px-8 py-8
}

// 标题（来源：PhoneLoginPage.tsx:82）
.title {
  font-size: map-get($login-font-sizes, title); // 56rpx
  font-weight: map-get($login-font-weights, bold); // 700
  color: map-get($login-colors, foreground); // #333333
  margin-bottom: 96rpx; // mb-12 → 96rpx
  display: block;
}

// 表单容器（来源：PhoneLoginPage.tsx:85）
.form {
  display: flex;
  flex-direction: column;
  gap: 32rpx; // space-y-4 → 32rpx
}

// 表单行（关键！来源：PhoneLoginPage.tsx:88,100,114）
.form-row {
  display: grid;
  grid-template-columns: 180rpx 1fr; // grid-cols-[90px_1fr]
  gap: 24rpx; // gap-3 → 24rpx
  align-items: center;

  .label {
    font-size: map-get($login-font-sizes, base); // 32rpx
    color: map-get($login-colors, foreground);   // #333333
    text-align: left;
  }

  .field {
    display: flex;
    align-items: center;
  }
}

// 分隔线（来源：PhoneLoginPage.tsx:99）
.divider {
  width: 100%;
  height: 1rpx; // 发丝线
  background: map-get($login-colors, border); // rgba(0,168,45,0.12)
}

// 国家代码（来源：PhoneLoginPage.tsx:93）
.country-code {
  font-size: map-get($login-font-sizes, base); // 32rpx
  color: map-get($login-colors, foreground);   // #333333
}

// 输入框（关键！来源：PhoneLoginPage.tsx:107-112,121-126）
.input-field {
  flex: 1;
  background: transparent; // bg-transparent
  border: none;
  border-bottom: 1rpx solid map-get($login-colors, border); // border-b
  border-radius: 0; // rounded-none
  padding-left: 24rpx; // pl-3 → 24rpx
  padding-right: 0;
  height: 96rpx; // h-12 → 96rpx
  font-size: map-get($login-font-sizes, base); // 32rpx
  color: map-get($login-colors, foreground);   // #333333

  &::placeholder {
    color: map-get($login-colors, muted-foreground); // #666666
  }

  &:focus {
    border-bottom-color: map-get($login-colors, primary); // #00a82d
    outline: none;
  }
}

// 验证码输入区域
.verification-field {
  display: flex;
  align-items: center;
  gap: 24rpx; // space-x-3

  .send-code-button {
    flex-shrink: 0;
    background: transparent;
    color: map-get($login-colors, primary); // #00a82d
    font-size: map-get($login-font-sizes, sm); // 28rpx
    padding: 0;
    white-space: nowrap;

    &:disabled {
      color: map-get($login-colors, muted-foreground); // #666666
      opacity: 0.6;
    }
  }
}

// 登录按钮（来源：PhoneLoginPage.tsx:167-179）
.login-button {
  width: 100%;
  height: map-get($login-sizes, button-height); // 96rpx
  background: map-get($login-colors, primary);  // #00a82d
  color: white;
  border-radius: 16rpx; // rounded-lg
  font-size: map-get($login-font-sizes, base); // 32rpx
  font-weight: map-get($login-font-weights, medium); // 500
  margin-top: 48rpx; // mt-6 → 48rpx
  transition: all 0.2s ease-in-out;

  &:disabled {
    background: map-get($login-colors, disabled-bg);   // #E5E7EB
    color: map-get($login-colors, disabled-text);      // #9CA3AF
    opacity: 0.6;
  }
}

// 协议区域（来源：PhoneLoginPage.tsx:153-165）
.agreement {
  display: flex;
  align-items: flex-start;
  gap: 24rpx; // space-x-3
  padding: 0 32rpx; // px-4
  margin-top: 48rpx; // mt-6

  checkbox {
    width: 32rpx;
    height: 32rpx;
    margin-top: 4rpx; // mt-0.5
  }
}

.agreement-text {
  font-size: map-get($login-font-sizes, xs); // 24rpx
  color: map-get($login-colors, gray-text);  // #6b7280
  line-height: 1.5;
  text-align: left;

  .link {
    color: map-get($login-colors, primary); // #00a82d
    text-decoration: underline;
  }
}
</style>
```

---

## 5. 验证清单

### 5.1 设计令牌验证

- [ ] **颜色完全一致**
  - [ ] 主色 `#00a82d` (globals.css:12)
  - [ ] 背景色 `#fafafa` (globals.css:9)
  - [ ] 边框色 `rgba(0,168,45,0.12)` (globals.css:16)
  - [ ] 标题色 `#111827` (LoginPage.tsx:32)

- [ ] **字体尺寸精确**
  - [ ] 标题 `56rpx` (text-[28px] → 28*2)
  - [ ] 基础字号 `32rpx` (text-base → 16*2)
  - [ ] 小字号 `28rpx` (text-sm → 14*2)

- [ ] **间距完全匹配**
  - [ ] space-y-5 → `gap: 40rpx` (20px → 40rpx)
  - [ ] px-8 → `padding: 0 64rpx` (32px → 64rpx)
  - [ ] mb-6 → `margin-bottom: 48rpx` (24px → 48rpx)

### 5.2 布局结构验证

- [ ] **Grid布局正确**
  - [ ] 表单行使用 `grid-template-columns: 180rpx 1fr`
  - [ ] gap值为 `24rpx` (gap-3)
  - [ ] label宽度精确 `180rpx` (90px → 180rpx)

- [ ] **输入框样式正确**
  - [ ] 仅底边框 `border-bottom: 1rpx solid rgba(0,168,45,0.12)`
  - [ ] 无其他边框 `border: none`
  - [ ] 无圆角 `border-radius: 0`
  - [ ] 左内边距 `padding-left: 24rpx`

- [ ] **使用gap替代space-y**
  - [ ] 所有垂直栈使用 `gap` 而非 `space-y-*`
  - [ ] 微信小程序兼容性确认

### 5.3 功能逻辑验证

- [ ] **状态管理**
  - [ ] useState → ref 转换正确
  - [ ] 事件处理转换正确

- [ ] **副作用处理**
  - [ ] useEffect → watch 转换正确
  - [ ] 倒计时逻辑正确（60秒）
  - [ ] 定时器清理正确（onUnmounted）

- [ ] **表单验证**
  - [ ] 手机号格式验证 `/^1[3-9]\d{9}$/`
  - [ ] 验证码长度验证 `length === 6`
  - [ ] 协议勾选验证

### 5.4 样式细节验证

- [ ] **按钮禁用状态**
  - [ ] 背景色 `#E5E7EB`
  - [ ] 文字色 `#9CA3AF`
  - [ ] 透明度 `0.6`

- [ ] **过渡动画**
  - [ ] `transition: all 0.2s ease-in-out`

- [ ] **图标尺寸**
  - [ ] Logo宽度 `384rpx` (w-48)
  - [ ] 返回箭头 `48rpx` (w-6)
  - [ ] 微信图标 `48rpx` (w-6)

---

## 6. 常见问题（FAQ）

### Q1: 为什么要用gap替代space-y-*?
**A**: 微信小程序不支持`> * + *`选择器，Tailwind的`space-y-*`会编译成这种选择器导致失效。必须使用`gap`。

### Q2: grid布局在微信小程序中兼容吗？
**A**: 兼容！`display: grid` 和 `grid-template-columns` 在微信小程序基础库 2.7.0+ 已完全支持。

### Q3: 为什么border保持1rpx而不是2rpx？
**A**: 为了实现"发丝线"效果（极细边框），在高分辨率屏幕上显示为物理像素的1px。

### Q4: 如何验证实现是否100%还原Figma？
**A**:
1. 使用设计令牌文件中的注释查找来源
2. 对比Figma Make源文件（globals.css、LoginPage.tsx、PhoneLoginPage.tsx）
3. 运行验证清单中的所有检查项

---

## 7. 后续优化建议

1. **性能优化**
   - 使用computed缓存计算结果
   - 图片懒加载
   - 节流/防抖处理

2. **无障碍优化**
   - 添加aria-label
   - 键盘导航支持

3. **用户体验优化**
   - 添加加载状态
   - 优化错误提示
   - 添加触觉反馈（振动）

---

**文档维护**: 当Figma设计更新时，必须同步更新本文档和设计令牌文件。
