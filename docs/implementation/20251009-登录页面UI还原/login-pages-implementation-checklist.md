# 登录页面实现任务清单

**目标**: 基于Figma Make设计100%精确还原LoginPage和PhoneLoginPage

**开发者**: uni-app-developer
**参考文档**: [figma-to-uniapp-guide.md](./figma-to-uniapp-guide.md)

---

## 📁 文件清单

### 必读文件（按顺序）

1. **设计令牌** ✅ 已完成
   - `/src/styles/design-tokens/login.scss`
   - `/src/styles/design-tokens/figma-layout-classes.scss`

2. **实现指南** ✅ 已完成
   - `/docs/implementation/figma-to-uniapp-guide.md`

3. **待创建页面**
   - `/src/pages/login/index.vue` (LoginPage)
   - `/src/pages/login/phone.vue` (PhoneLoginPage)

---

## ✅ 实现任务（LoginPage）

### 阶段1: 页面结构
- [ ] 创建 `/src/pages/login/index.vue`
- [ ] 导入设计令牌 `@import '@/styles/design-tokens/login.scss'`
- [ ] 搭建页面容器（min-h-screen bg-background flex flex-col）
- [ ] 搭建主容器（flex-1 flex flex-col items-center justify-center）

### 阶段2: Header区域
- [ ] 标题：`欢迎使用阅记` (text-[28px] font-bold text-[#111827])
- [ ] Logo图片：`w-48` (384rpx)
- [ ] Slogan：`让纸质阅读更智能` (text-primary/70 text-sm font-medium)
- [ ] 间距：mb-8, mb-6正确应用

### 阶段3: LoginStack区域
- [ ] 容器：flex flex-col items-center space-y-5 → gap: 40rpx
- [ ] 微信按钮：
  - [ ] 尺寸：w-full max-w-xs h-[48px] (640rpx x 96rpx)
  - [ ] 颜色：bg-primary (#00a82d)
  - [ ] 禁用状态：bg-gray-200 text-gray-400
  - [ ] 过渡动画：transition-all duration-200
- [ ] 协议勾选：
  - [ ] 布局：flex items-start space-x-3 (gap: 24rpx)
  - [ ] Checkbox尺寸：w-4 h-4 (32rpx)
  - [ ] 文字：text-xs text-gray-500
  - [ ] 链接：text-primary underline
- [ ] 手机登录链接：text-primary text-sm underline

### 阶段4: 状态管理
- [ ] 定义 `agreed` ref
- [ ] 实现 `handleAgreeChange` 方法
- [ ] 实现 `handleWeChatLogin` 方法（调用uni.login）
- [ ] 实现 `openAgreement` 方法（路由跳转）
- [ ] 实现 `goToPhoneLogin` 方法（路由跳转）

### 阶段5: 样式验证
- [ ] 所有颜色值与 `login.scss` 一致
- [ ] 所有间距值符合转换公式（px → rpx）
- [ ] 按钮禁用状态样式正确
- [ ] gap替代space-y（微信小程序兼容）

---

## ✅ 实现任务（PhoneLoginPage）

### 阶段1: 页面结构
- [ ] 创建 `/src/pages/login/phone.vue`
- [ ] 导入设计令牌
- [ ] 搭建页面容器（min-h-screen bg-background）

### 阶段2: Header区域
- [ ] 容器：sticky top-0 bg-background py-6 px-8
- [ ] 返回按钮：variant="ghost" size="icon"
- [ ] 标题：`手机号登录` (text-base font-medium)
- [ ] 布局：flex items-center space-x-2 (gap: 16rpx)

### 阶段3: 主容器
- [ ] 容器：px-8 py-8 (64rpx)
- [ ] 标题：`欢迎回来` (text-[28px] font-bold mb-12)

### 阶段4: 表单区域（关键！）
- [ ] 表单容器：space-y-4 (gap: 32rpx)
- [ ] **国家/地区选择行**：
  - [ ] Grid布局：`grid-cols-[90px_1fr]` (180rpx 1fr)
  - [ ] gap-3 (24rpx)
  - [ ] Label：`国家/地区`
  - [ ] Field：`中国大陆 +86`
- [ ] **分隔线**：
  - [ ] width: 100%, height: 1rpx
  - [ ] background: border色 rgba(0,168,45,0.12)
- [ ] **手机号输入行**：
  - [ ] Grid布局同上
  - [ ] Input样式：
    - [ ] `border: none`
    - [ ] `border-bottom: 1rpx solid rgba(0,168,45,0.12)`
    - [ ] `border-radius: 0`
    - [ ] `padding-left: 24rpx`
    - [ ] `height: 96rpx`
  - [ ] Placeholder：`请输入手机号`
  - [ ] maxlength: 11
- [ ] **验证码输入行**：
  - [ ] Grid布局同上
  - [ ] Input + Button布局：flex items-center space-x-3 (gap: 24rpx)
  - [ ] 获取验证码按钮：variant="ghost"
  - [ ] 倒计时显示：`${countdown}秒后重试`

### 阶段5: 登录按钮
- [ ] 尺寸：w-full h-[48px] (96rpx)
- [ ] 颜色：bg-primary (#00a82d)
- [ ] 禁用状态：bg-gray-200 text-gray-400
- [ ] margin-top: 48rpx

### 阶段6: 协议区域
- [ ] 布局：flex items-start space-x-3 px-4 (gap: 24rpx, padding: 0 32rpx)
- [ ] Checkbox尺寸：32rpx
- [ ] 文字样式：text-xs text-gray-500
- [ ] 链接样式：text-primary underline

### 阶段7: 状态管理
- [ ] 定义 `phone`, `code`, `agreed`, `countdown` ref
- [ ] 实现 `isPhoneValid` computed（正则验证）
- [ ] 实现 `canLogin` computed
- [ ] 实现 `sendCode` 方法（TODO：后端API）
- [ ] 实现 `handleLogin` 方法（TODO：后端API）
- [ ] 实现倒计时逻辑：
  - [ ] watch countdown
  - [ ] setInterval 递减
  - [ ] onUnmounted 清理定时器

### 阶段8: 样式验证
- [ ] Grid布局精确：180rpx 1fr, gap: 24rpx
- [ ] 输入框仅底边框样式正确
- [ ] 分隔线高度1rpx（发丝线）
- [ ] 所有间距符合设计令牌

---

## 🧪 验证清单（两个页面共用）

### 设计令牌验证
```bash
# 运行验证脚本（如有）
npm run lint:style
```

- [ ] **颜色100%一致**
  - [ ] 主色 #00a82d
  - [ ] 背景色 #fafafa
  - [ ] 标题色 #111827
  - [ ] 边框色 rgba(0,168,45,0.12)

- [ ] **字体尺寸精确**
  - [ ] 标题 56rpx (text-[28px])
  - [ ] 基础 32rpx (text-base)
  - [ ] 小字 28rpx (text-sm)

- [ ] **间距转换正确**
  - [ ] space-y-5 → gap: 40rpx
  - [ ] px-8 → padding: 0 64rpx
  - [ ] mb-6 → margin-bottom: 48rpx

### 功能验证
- [ ] 协议勾选状态控制按钮禁用
- [ ] 手机号格式验证正确（`/^1[3-9]\d{9}$/`）
- [ ] 验证码倒计时60秒正确
- [ ] 定时器清理正确（无内存泄漏）
- [ ] 路由跳转正常
- [ ] 微信登录流程可触发（TODO：后端对接）

### 布局验证（关键！）
- [ ] **Grid布局精确**
  - [ ] PhoneLoginPage表单行：180rpx 1fr
  - [ ] gap: 24rpx
  - [ ] align-items: center

- [ ] **输入框底边框精确**
  - [ ] border: none
  - [ ] border-bottom: 1rpx solid rgba(0,168,45,0.12)
  - [ ] border-radius: 0
  - [ ] padding-left: 24rpx

- [ ] **使用gap替代space-y**（微信小程序兼容）
  - [ ] LoginStack: gap: 40rpx
  - [ ] PhoneLoginPage Form: gap: 32rpx
  - [ ] 确认无 `> * + *` 选择器

### 样式细节验证
- [ ] 按钮禁用状态：bg-gray-200, text-gray-400, opacity: 0.6
- [ ] 过渡动画：transition: all 0.2s ease-in-out
- [ ] Logo宽度：384rpx (w-48)
- [ ] 按钮高度：96rpx (h-[48px])
- [ ] Checkbox尺寸：32rpx (w-4 h-4)

---

## 📦 依赖检查

### 必需依赖
- [ ] Vue 3.x
- [ ] Pinia（如需全局状态）
- [ ] uni-app API（uni.login, uni.showToast）

### 可选依赖
- [ ] uView UI（如使用u-button等组件）
- [ ] VueUse（如使用useIntervalFn等工具）

---

## 🚀 开发流程

### Step 1: 准备工作
1. 阅读 `figma-to-uniapp-guide.md` 第1-2节（设计令牌 + 转换规则）
2. 检查设计令牌文件是否存在
3. 配置开发环境（HBuilderX或CLI）

### Step 2: LoginPage实现
1. 按照「实现任务（LoginPage）」逐项完成
2. 每完成一个阶段，对照Figma截图验证
3. 运行验证清单

### Step 3: PhoneLoginPage实现
1. 按照「实现任务（PhoneLoginPage）」逐项完成
2. **特别注意Grid布局和输入框样式**
3. 测试倒计时逻辑
4. 运行验证清单

### Step 4: 联调测试
1. 页面跳转逻辑
2. 微信登录流程（模拟）
3. 手机号登录流程（模拟）
4. TODO标记后端对接点

### Step 5: 最终验证
1. 运行完整验证清单
2. 截图对比Figma设计
3. 提交代码前review

---

## 📌 重要提醒

### ⚠️ 禁止事项
- ❌ 不要猜测颜色值或间距
- ❌ 不要添加Figma中不存在的样式
- ❌ 不要使用space-y-*（用gap替代）
- ❌ 不要跳过验证清单

### ✅ 必须遵守
- ✅ 所有样式决策必须标注Figma来源（注释）
- ✅ 所有尺寸必须使用设计令牌
- ✅ Grid布局必须精确还原（180rpx 1fr）
- ✅ 输入框样式必须仅底边框（border-bottom-only）

---

## 📞 获取帮助

- **设计疑问** → 询问 `frontend-ui-designer`
- **技术疑问** → 询问 `uni-app-expert`
- **架构疑问** → 询问 `software-architect`
- **后端对接** → 询问 `backend-senior-developer`

---

**祝开发顺利！请严格按照Figma设计100%精确还原。**
