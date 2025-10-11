# ⚠️ 禁止修改清单 - 100%精确还原Figma

**任何修改都是严重错误！必须完全按照Figma源代码实现！**

## 设计原则

本文档记录了Figma Make设计文件中的精确内容。**任何开发者都不得擅自修改文案、DOM顺序或元素结构**。

- ✅ 允许：Tailwind类名 → uni-app样式转换
- ❌ 禁止：修改文字、调整顺序、删除元素、添加元素、"优化"设计

---

## LoginPage - 禁止修改的内容

### 文案（逐字对照）

| 元素 | 精确文案 | 禁止修改为 |
|------|---------|-----------|
| 页面标题 | `欢迎来到阅记` | ❌ 欢迎使用阅记 |
| Slogan | `• 阅有所记  学有所成 •` | ❌ 让纸质阅读更智能 |
| 主按钮 | `一键登录` | - |
| 次按钮 | `其他手机号登录` | ❌ 使用手机号登录 |
| 协议文字 | `我已阅读并同意《用户协议》和《隐私政策》` | - |

**注意事项**：
- Slogan中的 `•` 是全角圆点，不是减号或破折号
- Slogan中有两个空格：`阅有所记  学有所成`（学有所成前有两个空格）

### DOM顺序（必须严格遵守）

```html
<view class="login-page">
  <view class="content-container">
    <!-- 1. 欢迎文字区域 -->
    <view class="welcome-section">
      <text class="title">欢迎来到阅记</text>
    </view>

    <!-- 2. Logo区域 -->
    <view class="logo-section">
      <image
        src="/static/images/yueji_logo_book_sprout_2x.png"
        mode="aspectFit"
        class="logo-image"
      />
    </view>

    <!-- 3. Slogan区域 -->
    <view class="slogan-section">
      <text class="slogan">• 阅有所记  学有所成 •</text>
    </view>

    <!-- 4. 登录操作栈 -->
    <view class="login-stack">
      <!-- 4.1 一键登录按钮 -->
      <button class="primary-button">一键登录</button>

      <!-- 4.2 协议复选框（必须在一行内） -->
      <view class="agreement-row">
        <checkbox class="agreement-checkbox" />
        <text class="agreement-text">
          我已阅读并同意《用户协议》和《隐私政策》
        </text>
      </view>

      <!-- 4.3 其他手机号登录按钮 -->
      <button class="secondary-button">其他手机号登录</button>
    </view>
  </view>
</view>
```

**DOM顺序验证清单**：
1. ✅ 第1项：欢迎文字
2. ✅ 第2项：Logo
3. ✅ 第3项：Slogan
4. ✅ 第4项：一键登录按钮
5. ✅ 第5项：协议复选框（一行内）
6. ✅ 第6项：其他手机号登录按钮

### 图片资源

| 元素 | 文件路径 | 说明 |
|------|---------|------|
| Logo | `/static/images/yueji_logo_book_sprout_2x.png` | 使用2x版本，适配小程序 |

**禁止使用的路径**：
- ❌ `/static/logo.png`
- ❌ `/assets/logo.png`
- ❌ 其他任何路径

### 关键样式规范

| 元素 | 样式规范 | uni-app实现 |
|------|---------|------------|
| 标题 | `font-size: 28px; color: #111827; font-weight: bold;` | `font-size: 56rpx; color: #111827; font-weight: bold;` |
| Slogan | `font-size: 14px; color: rgba(primary, 0.7);` | `font-size: 28rpx; opacity: 0.7;` |
| 协议 | `display: flex; flex-direction: row; align-items: flex-start;` | `display: flex; flex-direction: row; align-items: flex-start;` |

### 布局规则清单（防止错位和换行）

#### Logo显示规范
```scss
.logo {
  width: 384rpx;  // w-48 → 48 * 8 = 384rpx
  height: 384rpx; // 保持正方形
  mode: aspectFit; // 保持比例
}
```
**内联style必须设置**：`style="width: 384rpx; height: 384rpx;"`
**原因**：小程序中单靠CSS可能无法正确显示图片

#### 协议换行控制
```scss
.agreement {
  display: flex;
  flex-wrap: nowrap;  // ← 必须！防止换行
  align-items: flex-start;
  gap: 24rpx;
  max-width: 640rpx;
}

.agreement-text {
  flex: 1;  // ← 必须！自适应宽度
  white-space: nowrap;  // ← 必须！强制单行
  word-break: keep-all;  // 防止中文换行
}
```
**验证方法**：协议文字必须在一行内完整显示"我已阅读并同意《用户协议》和《隐私政策》"

---

## PhoneLoginPage - 禁止修改的内容

### 文案（逐字对照）

| 元素 | 精确文案 | 禁止修改为 |
|------|---------|-----------|
| 页面标题 | `手机号登录` | ❌ 登录 / 请登录 |
| 国家地区 | `中国大陆` | - |
| 手机号前缀 | `+86` | - |
| 手机号提示 | `填写手机号` | ❌ 请输入手机号 |
| 验证码提示 | `填写验证码` | ❌ 请输入验证码 |
| 验证码按钮 | `获取验证码` / `${countdown}s` | - |
| 登录按钮 | `登录` | - |
| 协议文字 | `我已阅读并同意《用户协议》和《隐私政策》` | - |

**严禁添加的文案**：
- ❌ `欢迎回来`
- ❌ `请输入`
- ❌ 任何其他自作主张的文案

### DOM顺序（必须严格遵守）

```html
<view class="phone-login-page">
  <!-- 1. 导航栏（仅返回按钮） -->
  <view class="navbar">
    <button class="back-button" @click="goBack">
      <text>←</text>
    </button>
  </view>

  <!-- 2. 主内容区域 -->
  <view class="main-content">
    <!-- 2.1 标题（居中，大字） -->
    <text class="page-title">手机号登录</text>

    <!-- 2.2 表单区域 -->
    <view class="form-container">
      <!-- 国家/地区行 -->
      <view class="form-row">
        <text class="form-label">国家/地区</text>
        <view class="form-value">
          <text>中国大陆</text>
          <text class="arrow">→</text>
        </view>
      </view>

      <!-- 分割线 -->
      <view class="divider"></view>

      <!-- 手机号行 -->
      <view class="form-row">
        <text class="form-label">手机号</text>
        <view class="form-input-wrapper">
          <text class="phone-prefix">+86</text>
          <input
            class="form-input"
            placeholder="填写手机号"
            type="number"
          />
        </view>
      </view>

      <!-- 验证码行 -->
      <view class="form-row">
        <text class="form-label">验证码</text>
        <view class="form-input-wrapper">
          <input
            class="form-input"
            placeholder="填写验证码"
            type="number"
          />
          <button class="code-button">获取验证码</button>
        </view>
      </view>
    </view>

    <!-- 2.3 协议复选框 -->
    <view class="agreement-section">
      <checkbox class="agreement-checkbox" />
      <text class="agreement-text">
        我已阅读并同意《用户协议》和《隐私政策》
      </text>
    </view>

    <!-- 2.4 登录按钮（必须在协议下面） -->
    <view class="button-section">
      <button class="login-button">登录</button>
    </view>
  </view>
</view>
```

**DOM顺序验证清单**：
1. ✅ 导航栏（仅返回按钮，无标题）
2. ✅ 页面标题「手机号登录」（居中）
3. ✅ 表单区域
   - 3.1 ✅ 国家/地区行
   - 3.2 ✅ 分割线
   - 3.3 ✅ 手机号行（+86在输入框内）
   - 3.4 ✅ 验证码行
4. ✅ 协议复选框
5. ✅ 登录按钮

**严禁的顺序**：
- ❌ 登录按钮在协议上面
- ❌ 标题在导航栏内
- ❌ +86在国家/地区行

### 关键样式规范

| 元素 | 样式规范 | uni-app实现 |
|------|---------|------------|
| 页面标题 | `text-align: center; font-size: 28px; color: #111827; font-weight: bold;` | `text-align: center; font-size: 56rpx; color: #111827; font-weight: bold;` |
| +86前缀 | 在手机号输入框内，左侧显示 | `<text>+86</text><input />` |
| 表单标签 | `width: 90px;` | `width: 180rpx;` |
| 表单布局 | `grid-template-columns: 90px 1fr;` | `display: flex; .label { width: 180rpx; }` |

### 布局规则清单（防止错位和换行）

#### Header导航栏对齐
```scss
.header-content {
  padding: 48rpx 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;  // ← 必须！左对齐
  gap: 16rpx;
}

.back-button {
  // 自动靠左，无需额外margin
}
```
**验证方法**：返回按钮"←"必须在左上角，不能居中

#### 协议左对齐规范
```scss
.agreement {
  display: flex;
  flex-wrap: nowrap;  // ← 必须！防止换行
  align-items: flex-start;
  gap: 24rpx;
  padding: 0;  // ← 必须！移除padding确保左对齐
  margin-top: 48rpx;
}

.agreement-text {
  flex: 1;  // ← 必须！自适应宽度
  white-space: nowrap;  // ← 必须！强制单行
  word-break: keep-all;  // 防止中文换行
}
```
**验证方法**：
1. 协议checkbox与表单左对齐（无左侧偏移）
2. 协议文字在一行内完整显示

---

## ⚠️ 严格禁止的行为

### 文案修改
❌ 修改任何文字内容（包括标点符号）
❌ 替换同义词（例如：`填写` → `请输入`）
❌ 添加或删除空格
❌ 修改全角/半角符号
❌ "优化"或"改进"文案表述

### 结构修改
❌ 调整任何元素的顺序
❌ 删除任何元素
❌ 添加任何元素（如"欢迎回来"）
❌ 合并或拆分元素
❌ 改变嵌套层级

### 样式修改
❌ 修改字体大小（除rpx转换外）
❌ 修改颜色值
❌ 修改对齐方式
❌ 修改间距值（除rpx转换外）

### 唯一允许的修改
✅ Tailwind类名 → uni-app样式转换
✅ React组件 → Vue3组件转换
✅ HTML标签 → uni-app标签转换
✅ 事件处理方式转换

---

## 🛠️ 修复指导（给uni-app-developer）

### LoginPage修复清单

**文件路径**: `/Users/zhaolijian/Projects/chinese-rose-front/src/pages/login/index.vue`

#### 必须修复的问题
- [ ] **修复标题文字**：`欢迎来到阅记`（不是"欢迎使用阅记"）
- [ ] **修复Slogan**：`• 阅有所记  学有所成 •`（注意•符号和双空格）
- [ ] **修复Logo路径**：`/static/images/yueji_logo_book_sprout_2x.png`
- [ ] **修复按钮文字**：`其他手机号登录`（不是"使用手机号登录"）
- [ ] **修复协议布局**：必须在一行内展示，使用flex布局
- [ ] **验证DOM顺序**：欢迎→Logo→Slogan→一键登录→协议→其他手机号登录

#### 验证方法
```bash
# 1. 搜索错误的文案
grep -r "欢迎使用阅记" src/pages/login/
grep -r "让纸质阅读更智能" src/pages/login/
grep -r "使用手机号登录" src/pages/login/

# 2. 验证正确的文案
grep -r "欢迎来到阅记" src/pages/login/
grep -r "• 阅有所记  学有所成 •" src/pages/login/
grep -r "其他手机号登录" src/pages/login/

# 3. 验证Logo路径
grep -r "yueji_logo_book_sprout_2x.png" src/pages/login/
```

---

### PhoneLoginPage修复清单

**文件路径**: `/Users/zhaolijian/Projects/chinese-rose-front/src/pages/login/phone.vue`

#### 必须修复的问题
- [ ] **删除"欢迎回来"文字**（Figma设计中不存在）
- [ ] **修复标题样式**：`手机号登录` 必须居中，56rpx大字
- [ ] **修复+86位置**：必须在手机号输入框内，不是在国家/地区行
- [ ] **修复元素顺序**：表单→协议→登录按钮（登录按钮必须在协议下面）
- [ ] **修复导航栏**：只保留返回按钮，不显示标题
- [ ] **验证DOM顺序**：导航→标题→表单→协议→登录按钮

#### 验证方法
```bash
# 1. 搜索错误的文案
grep -r "欢迎回来" src/pages/login/phone.vue

# 2. 验证DOM顺序（使用行号）
# 标题应该在导航栏之外
# +86应该在手机号输入框内
# 登录按钮应该在协议复选框之后
```

---

## 📋 Figma源代码参考（只读）

### LoginPage.tsx核心代码

```tsx
// 第33-35行：标题
<div className="mb-8 text-center">
  <h1 className="text-[#111827] text-[28px] font-bold mb-6">
    欢迎来到阅记
  </h1>
</div>

// 第40-42行：Logo
<div className="mb-6 flex justify-center">
  <img src={exampleImage} alt="阅记Logo" className="w-48 h-auto" />
</div>

// 第46-50行：Slogan
<div className="mb-8 text-center">
  <span className="text-primary/70 text-sm font-medium">
    • 阅有所记  学有所成 •
  </span>
</div>

// 第60-62行：一键登录按钮
<Button>一键登录</Button>

// 第79-84行：协议复选框（一行内）
<div className="w-full max-w-xs flex items-start space-x-3 py-2">
  <Checkbox />
  <label>我已阅读并同意《用户协议》和《隐私政策》</label>
</div>

// 第93-95行：其他手机号登录按钮
<Button variant="ghost">其他手机号登录</Button>
```

### PhoneLoginPage.tsx核心代码

```tsx
// 第82-84行：页面标题（居中大字）
<h1 className="text-center mb-12 text-[#111827] text-[28px] font-bold">
  手机号登录
</h1>

// 第107-113行：手机号行（+86在输入框内）
<div className="grid grid-cols-[90px_1fr] gap-3 items-center">
  <label>手机号</label>
  <div className="flex items-center space-x-2">
    <span>+86</span>
    <Input placeholder="填写手机号" />
  </div>
</div>

// 第118-126行：验证码行
<div className="grid grid-cols-[90px_1fr] gap-3 items-center">
  <label>验证码</label>
  <div className="flex items-center space-x-3">
    <Input placeholder="填写验证码" />
    <Button>获取验证码</Button>
  </div>
</div>

// 第153-164行：协议复选框
<div className="flex items-start space-x-3 py-6 px-4">
  <Checkbox />
  <label>我已阅读并同意《用户协议》和《隐私政策》</label>
</div>

// 第169-177行：登录按钮（在协议下面）
<div className="mt-6 px-4">
  <Button>登录</Button>
</div>
```

**注意**：Figma设计中**没有**"欢迎回来"文字！

---

## 🔒 版本控制

| 版本 | 日期 | 修改说明 | 修改人 |
|------|------|---------|--------|
| v1.0 | 2025-10-09 | 初始版本，记录Figma Make设计精确内容 | frontend-ui-designer |

---

## 📞 问题上报流程

如果发现任何与本文档不符的实现，请立即：

1. **停止开发**，不要提交代码
2. **对照本文档**，逐字检查差异
3. **联系frontend-ui-designer**，确认是否需要修改本文档
4. **获得批准后**，才能修改实现代码

**禁止擅自修改设计！禁止"优化"设计！禁止自作主张！**
