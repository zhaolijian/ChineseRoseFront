# Chinese Rose 前端技术栈

> 最后更新：2025-01-01

## 📋 概述

本文档详细说明了 Chinese Rose（阅记）项目前端的技术栈选型、版本信息和使用场景。

---

## 🎯 核心技术栈

### 1. 跨端框架

#### uni-app 3.x
- **版本**: `3.0.0-3090920231225001`
- **官网**: https://uniapp.dcloud.net.cn/
- **选型原因**:
  - 支持一套代码编译到多个平台（微信小程序、H5、App）
  - 基于 Vue 3 生态，开发体验优秀
  - 丰富的组件库和插件市场
  - 成熟的社区支持和完善的文档

#### Vue 3.4
- **版本**: `3.4.38`
- **官网**: https://cn.vuejs.org/
- **特性**:
  - Composition API（核心开发方式）
  - `<script setup>` 语法糖
  - 响应式系统优化
  - TypeScript 支持完善

### 2. 编程语言

#### TypeScript
- **版本**: `^5.2.2`
- **官网**: https://www.typescriptlang.org/
- **配置**: 严格模式（部分选项）
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `noUnusedLocals: true`
- **优势**:
  - 类型安全，减少运行时错误
  - 更好的 IDE 智能提示
  - 提升代码可维护性

### 3. 状态管理

#### Pinia
- **版本**: `2.1.7`
- **官网**: https://pinia.vuejs.org/
- **选型原因**:
  - Vue 3 官方推荐的状态管理库
  - TypeScript 支持优秀
  - 开发体验更好（无需 mutations）
  - 体积更小，性能更好

**使用场景**:
- 用户认证状态（`useUserStore`）
- 主题配置（`useThemeStore`）
- 全局应用状态（`useAppStore`）

### 4. UI 组件库

#### uView Plus
- **版本**: `^3.2.17`
- **官网**: https://uview-plus.jiangruyi.com/
- **选型原因**:
  - 专为 uni-app 设计的 UI 组件库
  - 支持 Vue 3 + TypeScript
  - 组件丰富，设计规范统一
  - 提供 Scss 变量，支持主题定制

**常用组件**:
- 表单组件：`u-form`、`u-input`、`u-button`
- 布局组件：`u-row`、`u-col`、`u-grid`
- 反馈组件：`u-toast`、`u-modal`、`u-loading`
- 导航组件：`u-navbar`、`u-tabs`、`u-tabbar`

---

## 🛠️ 开发工具链

### 构建工具

#### Vite
- **版本**: `^4.1.4`
- **官网**: https://vitejs.dev/
- **特性**:
  - 快速的冷启动
  - 即时的模块热更新（HMR）
  - 真正的按需编译
  - 内置 TypeScript 支持

**配置亮点**:
```typescript
// vite.config.ts
{
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080'  // 后端代理
    }
  },
  build: {
    minify: 'terser',
    target: 'es2015'
  }
}
```

### 代码质量工具

#### ESLint
- **版本**: `^8.50.0`
- **配置**: Vue 3 + TypeScript 规则
- **插件**:
  - `@typescript-eslint/eslint-plugin`
  - `eslint-plugin-vue`
  - `@vue/eslint-config-typescript`

**命令**:
```bash
npm run lint          # 检查并自动修复
```

#### Vue TSC
- **版本**: `^1.8.19`
- **用途**: Vue 文件的 TypeScript 类型检查
- **命令**:
```bash
npm run type-check    # 类型检查（不生成文件）
```

---

## 🧪 测试框架

### 单元测试

#### Vitest
- **版本**: `^1.0.4`
- **官网**: https://vitest.dev/
- **特性**:
  - 基于 Vite，启动速度快
  - 兼容 Jest API
  - 内置 TypeScript 支持
  - UI 界面可视化

**配置**:
- 测试环境：`happy-dom`（轻量级 DOM 模拟）
- 覆盖率工具：`@vitest/coverage-v8`

**命令**:
```bash
npm run test              # 监听模式
npm run test:run          # 运行一次
npm run test:ui           # UI 界面
npm run test:coverage     # 生成覆盖率报告
```

#### Vue Test Utils
- **版本**: `^2.4.1`
- **用途**: Vue 组件测试工具
- **官网**: https://test-utils.vuejs.org/

### E2E 测试

#### Playwright
- **版本**: `^1.55.0`
- **官网**: https://playwright.dev/
- **用途**: H5 端自动化测试

#### miniprogram-automator
- **版本**: `^0.12.1`
- **用途**: 微信小程序自动化测试

---

## 📦 工具库

### 加密工具

#### crypto-js
- **版本**: `^4.2.0`
- **用途**:
  - 密码加密（SHA256）
  - 敏感数据加密
  - Token 签名

### HTTP 请求

#### uni.request（封装）
- **文件**: `src/utils/request.ts`
- **特性**:
  - 统一的请求/响应拦截
  - 自动携带 Token
  - 错误统一处理
  - 请求日志记录

---

## 🎨 样式方案

### CSS 预处理器

#### Sass/SCSS
- **版本**: `^1.69.5`
- **用途**:
  - 主题变量定义
  - 公共混合器（mixins）
  - 设计令牌（Design Tokens）

### 设计系统

**目录**: `src/styles/`

```
styles/
├── design-tokens/        # 设计令牌
│   ├── colors.scss      # 颜色系统
│   ├── spacing.scss     # 间距系统
│   └── typography.scss  # 排版系统
├── modules/             # 功能模块样式
├── overrides/           # 第三方库覆盖
├── theme.scss           # 主题配置
├── mixins.scss          # 公共混合器
└── uview-override.scss  # uView 覆盖
```

**特性**:
- Figma 设计令牌映射
- 支持亮色/暗色主题
- 统一的设计变量

---

## 🌐 多端适配

### 平台支持

| 平台 | 状态 | 优先级 | 说明 |
|------|------|--------|------|
| 微信小程序 | ✅ 支持 | P0 | 主要发布平台 |
| H5 | ✅ 支持 | P1 | 开发调试、移动端浏览器 |
| App | 🚧 规划中 | P2 | 后续支持 |

### 平台差异处理

#### 条件编译
```vue
<!-- #ifdef MP-WEIXIN -->
<button open-type="getUserInfo">微信授权</button>
<!-- #endif -->

<!-- #ifdef H5 -->
<button @click="h5Login">H5 登录</button>
<!-- #endif -->
```

#### 平台检测工具
```typescript
// src/utils/platform.ts
export const isH5 = (): boolean
export const isMP = (): boolean
export const isApp = (): boolean
```

---

## 📐 开发规范

### 路径别名

```typescript
// tsconfig.json
{
  "paths": {
    "@/*": ["src/*"],
    "@/components/*": ["src/components/*"],
    "@/pages/*": ["src/pages/*"],
    "@/utils/*": ["src/utils/*"],
    "@/api/*": ["src/api/*"],
    "@/stores/*": ["src/stores/*"],
    "@/types/*": ["src/types/*"]
  }
}
```

### 代码规范

- **组件命名**: PascalCase（如 `BookCard.vue`）
- **文件命名**: kebab-case（如 `use-countdown.ts`）
- **常量命名**: UPPER_SNAKE_CASE（如 `API_BASE_URL`）
- **组件使用**: Composition API + `<script setup>`

### Git 提交规范

```bash
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链相关
```

---

## 🔧 环境变量

### 文件说明

| 文件 | 用途 | 示例 |
|------|------|------|
| `.env.development` | 本地开发 | 本地 API 地址 |
| `.env.production` | 生产环境 | 线上 API 地址 |
| `.env.h5` | H5 特定配置 | 平台标识 |

### 使用方式

```typescript
// 访问环境变量
const apiBase = import.meta.env.VITE_API_BASE
const isProduction = import.meta.env.PROD
```

---

## 🚀 快速启动

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev:mp-weixin    # 微信小程序
npm run dev:h5           # H5 开发
```

### 生产构建
```bash
npm run build:mp-weixin  # 微信小程序
npm run build:h5         # H5 构建
```

### 代码检查
```bash
npm run lint             # ESLint 检查
npm run type-check       # TypeScript 检查
```

### 测试
```bash
npm run test             # 单元测试
npm run test:coverage    # 测试覆盖率
```

---

## 📚 相关文档

- [项目目录结构](./directory-structure.md)
- [开发指南](../DEVELOPMENT.md)
- [设计规范](../DESIGN_GUIDE.md)
- [小程序环境配置](../miniprogram/environment-setup-guide.md)

---

## 🔗 外部资源

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [Vue 3 中文文档](https://cn.vuejs.org/)
- [TypeScript 中文文档](https://www.tslang.cn/)
- [Pinia 中文文档](https://pinia.vuejs.org/zh/)
- [uView Plus 文档](https://uview-plus.jiangruyi.com/)
- [Vitest 文档](https://vitest.dev/)
