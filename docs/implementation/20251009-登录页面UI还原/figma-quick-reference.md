# Figma → uni-app 快速参考卡片

**用途**: 开发时快速查找设计令牌和转换规则

---

## 🎨 核心颜色（来源：globals.css）

| 用途 | Figma | uni-app SCSS | 来源 |
|------|-------|--------------|------|
| **主色** | `--primary: #00a82d` | `map-get($login-colors, primary)` | globals.css:12 |
| **背景** | `--background: #fafafa` | `map-get($login-colors, background)` | globals.css:9 |
| **标题** | `#111827` | `map-get($login-colors, title)` | LoginPage.tsx:32 |
| **边框** | `rgba(0,168,45,0.12)` | `map-get($login-colors, border)` | globals.css:16 |
| **次要文字** | `--muted-foreground: #666666` | `map-get($login-colors, muted-foreground)` | globals.css:15 |
| **Slogan** | `rgba(0,168,45,0.7)` | `map-get($login-colors, slogan)` | LoginPage.tsx:46 |
| **禁用背景** | `#E5E7EB` | `map-get($login-colors, disabled-bg)` | LoginPage.tsx:71 |
| **禁用文字** | `#9CA3AF` | `map-get($login-colors, disabled-text)` | LoginPage.tsx:72 |

---

## 🔤 字体系统

| Tailwind类 | rem值 | rpx值 | SCSS | 用途 |
|-----------|-------|-------|------|------|
| `text-xs` | 0.75rem | 24rpx | `map-get($login-font-sizes, xs)` | 协议文字 |
| `text-sm` | 0.875rem | 28rpx | `map-get($login-font-sizes, sm)` | 小字 |
| `text-base` | 1rem | 32rpx | `map-get($login-font-sizes, base)` | 正文 |
| `text-[28px]` | - | 56rpx | `map-get($login-font-sizes, title)` | 标题 |

**字重**:
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

---

## 📏 间距系统（Tailwind刻度 → rpx）

| Tailwind | 计算 | rpx值 | SCSS | 用途 |
|---------|------|-------|------|------|
| `space-y-1` | 1 * 8 | 8rpx | `map-get($login-spacing, xs)` | 极小间距 |
| `space-y-2` | 2 * 8 | 16rpx | `map-get($login-spacing, sm)` | 小间距 |
| `space-y-3` | 3 * 8 | 24rpx | `map-get($login-spacing, md)` | 中间距 |
| `space-y-4` | 4 * 8 | 32rpx | `map-get($login-spacing, lg)` | 大间距 |
| `space-y-5` | 5 * 8 | 40rpx | `map-get($login-spacing, xl)` | 超大间距 |
| `space-y-6` | 6 * 8 | 48rpx | `map-get($login-spacing, xxl)` | 巨大间距 |
| `px-8` | 8 * 8 | 64rpx | `map-get($login-spacing, xxxl)` | 页面padding |
| `pb-20` | 20 * 8 | 160rpx | - | 底部padding |

---

## 📐 组件尺寸

| 组件 | Tailwind | 计算 | rpx值 | SCSS |
|------|---------|------|-------|------|
| **Logo** | `w-48` | 48 * 8 | 384rpx | `map-get($login-sizes, logo-width)` |
| **按钮高度** | `h-[48px]` | 48 * 2 | 96rpx | `map-get($login-sizes, button-height)` |
| **Checkbox** | `w-4 h-4` | 4 * 8 | 32rpx | `map-get($login-sizes, checkbox-size)` |
| **最大宽度** | `max-w-xs` | 320px * 2 | 640rpx | - |
| **输入框高度** | `h-12` | 12 * 8 | 96rpx | - |
| **表单Label** | `90px` | 90 * 2 | 180rpx | - |

---

## 🔄 转换公式速查

### 间距刻度转换
```
Tailwind刻度 n → n * 8 rpx

示例：
space-y-5 → 5 * 8 = 40rpx
px-8 → 8 * 8 = 64rpx
mb-6 → 6 * 8 = 48rpx
```

### 像素值转换
```
px值 → px * 2 rpx

示例：
text-[28px] → 28 * 2 = 56rpx
h-[48px] → 48 * 2 = 96rpx
90px → 90 * 2 = 180rpx
```

### 边框特殊处理
```
所有边框保持 1rpx（发丝线效果）

示例：
border → 1rpx solid
border-b → border-bottom: 1rpx solid
```

---

## 🏗️ 关键布局类

### Grid布局（PhoneLoginPage表单）
```scss
// Figma: grid grid-cols-[90px_1fr] gap-3
.grid-label-field {
  display: grid;
  grid-template-columns: 180rpx 1fr; // 90px → 180rpx
  gap: 24rpx;                        // gap-3 → 24rpx
  align-items: center;
}
```

### 输入框底边框（PhoneLoginPage）
```scss
// Figma: border-none border-b border-border
.border-bottom-only {
  border: none;
  border-bottom: 1rpx solid rgba(0, 168, 45, 0.12);
  border-radius: 0;
}
```

### 垂直栈（使用gap替代space-y）
```scss
// Figma: flex flex-col space-y-5
.stack-gap-xl {
  display: flex;
  flex-direction: column;
  gap: 40rpx; // space-y-5 → 40rpx
}

// ⚠️ 微信小程序不支持 > * + * 选择器，必须用gap！
```

### Flex水平布局
```scss
// Figma: flex items-center space-x-3
.flex-row-gap-md {
  display: flex;
  align-items: center;
  gap: 24rpx; // space-x-3 → 24rpx
}
```

---

## 🎯 常用样式组合

### 页面容器
```scss
// Figma: min-h-screen bg-background flex flex-col
.page-container {
  min-height: 100vh;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}
```

### 标题样式
```scss
// Figma: text-[28px] font-bold text-[#111827] mb-6
.page-title {
  font-size: 56rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 48rpx;
}
```

### 按钮基础样式
```scss
// Figma: w-full max-w-xs h-[48px] bg-primary rounded-lg
.primary-button {
  width: 100%;
  max-width: 640rpx;
  height: 96rpx;
  background: #00a82d;
  border-radius: 16rpx;
  color: white;
  transition: all 0.2s ease-in-out;

  &:disabled {
    background: #E5E7EB;
    color: #9CA3AF;
    opacity: 0.6;
  }
}
```

### 输入框样式
```scss
// Figma: bg-transparent border-none border-b pl-3 h-12
.input-field {
  background: transparent;
  border: none;
  border-bottom: 1rpx solid rgba(0, 168, 45, 0.12);
  border-radius: 0;
  padding-left: 24rpx;
  height: 96rpx;

  &::placeholder {
    color: #666666;
  }

  &:focus {
    border-bottom-color: #00a82d;
    outline: none;
  }
}
```

---

## 📱 微信小程序兼容性

### ✅ 支持的特性
- `display: grid` (基础库 2.7.0+)
- `gap` (基础库 2.7.0+)
- `rgba()` 颜色
- `transition` 过渡动画

### ❌ 不支持的特性
- `> * + *` 选择器（space-y-* 的实现方式）
- `:has()` 选择器
- 复杂的CSS Grid布局（需测试）

### ⚠️ 替代方案
```scss
// ❌ 不要用（Tailwind默认实现）
.space-y-5 > * + * {
  margin-top: 20px;
}

// ✅ 使用gap替代
.stack {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}
```

---

## 🔍 调试技巧

### 1. 检查颜色值
```javascript
// 在浏览器控制台验证
console.log(getComputedStyle(element).backgroundColor)
// 应该输出 rgb(0, 168, 45) 或 rgba(...)
```

### 2. 检查间距值
```javascript
// 检查gap是否生效
console.log(getComputedStyle(element).gap)
// 应该输出 20px（40rpx在750px设计稿下）
```

### 3. 检查Grid布局
```javascript
// 检查grid-template-columns
console.log(getComputedStyle(element).gridTemplateColumns)
// 应该输出 90px 1fr（180rpx在750px设计稿下）
```

---

## 📝 注释模板

### 颜色注释
```scss
// 来源：globals.css:12 --primary
color: #00a82d;
```

### 间距注释
```scss
// 来源：LoginPage.tsx:57 space-y-5
gap: 40rpx;
```

### 布局注释
```scss
// 来源：PhoneLoginPage.tsx:88 grid-cols-[90px_1fr]
grid-template-columns: 180rpx 1fr;
```

---

## 🚨 常见错误

### 错误1: 使用space-y-*
```scss
// ❌ 错误
.container {
  > * + * {
    margin-top: 40rpx;
  }
}

// ✅ 正确
.container {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}
```

### 错误2: 边框宽度错误
```scss
// ❌ 错误（不是发丝线）
border-bottom: 2rpx solid rgba(0, 168, 45, 0.12);

// ✅ 正确（发丝线效果）
border-bottom: 1rpx solid rgba(0, 168, 45, 0.12);
```

### 错误3: Grid列宽度错误
```scss
// ❌ 错误（没有转换px）
grid-template-columns: 90px 1fr;

// ✅ 正确（px → rpx）
grid-template-columns: 180rpx 1fr;
```

### 错误4: 颜色值不准确
```scss
// ❌ 错误（猜测的颜色）
color: #00a830;

// ✅ 正确（精确的Figma颜色）
color: #00a82d; // globals.css:12
```

---

## 📚 相关文档

- **完整实现指南**: [figma-to-uniapp-guide.md](./figma-to-uniapp-guide.md)
- **任务清单**: [login-pages-implementation-checklist.md](./login-pages-implementation-checklist.md)
- **设计令牌**: `/src/styles/design-tokens/login.scss`
- **布局类**: `/src/styles/design-tokens/figma-layout-classes.scss`

---

**打印提示**: 可以打印本文档作为开发时的快速参考卡片
