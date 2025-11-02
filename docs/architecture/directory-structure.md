# Chinese Rose 前端项目目录结构规范

> 最后更新：2025-01-01

## 📋 概述

本文档详细说明了 Chinese Rose（阅记）前端项目的目录组织规范、命名约定和最佳实践。

---

## 🌲 项目根目录

```
chinese-rose-front/
├── .vscode/                 # VS Code 配置
├── coverage/                # 测试覆盖率报告
├── dist/                    # 构建输出目录
│   ├── dev/                # 开发构建
│   │   └── mp-weixin/      # 微信小程序开发版
│   └── build/              # 生产构建
│       ├── mp-weixin/      # 微信小程序生产版
│       └── h5/             # H5 生产版
├── docs/                    # 项目文档
├── node_modules/            # 依赖包（.gitignore）
├── scripts/                 # 构建/工具脚本
├── src/                     # 源代码目录（核心）
├── static/                  # 静态资源（不经过编译）
├── tests/                   # 测试文件
├── .env.*                   # 环境配置（.gitignore）
├── .gitignore              # Git 忽略配置
├── index.html              # H5 入口文件
├── manifest.json           # uni-app 应用配置
├── package.json            # 项目依赖配置
├── pages.json              # uni-app 页面配置
├── playwright.config.ts    # E2E 测试配置
├── project.config.json     # 微信小程序配置
├── tsconfig.json           # TypeScript 配置
├── uni.scss                # uni-app 全局样式变量
├── vite.config.ts          # Vite 构建配置
└── vitest.config.ts        # 单元测试配置
```

---

## 📁 核心目录详解

### 1. `src/` 源代码目录

这是项目的核心目录，包含所有业务代码。

```
src/
├── api/                    # API 接口层
│   ├── modules/           # 按模块划分的接口
│   │   ├── auth.ts       # 认证相关
│   │   ├── book.ts       # 书籍相关
│   │   ├── note.ts       # 笔记相关
│   │   └── user.ts       # 用户相关
│   └── index.ts          # API 统一导出
├── assets/                # 编译资源（图片/字体等）
│   ├── cover-default.png
│   └── ...
├── components/            # 公共组件
│   ├── common/           # 通用基础组件
│   │   ├── BackButton.vue
│   │   ├── EmptyState.vue
│   │   └── LoadingSpinner.vue
│   ├── business/         # 业务组件
│   │   ├── BookCard.vue
│   │   └── NoteItem.vue
│   ├── book/             # 书籍相关组件
│   └── create-note-modal/ # 复杂组件（目录）
│       ├── index.vue
│       ├── types.ts
│       └── useModal.ts
├── composables/           # Composition API 复用逻辑
│   ├── useBook.ts        # 书籍相关逻辑
│   ├── useCountdown.ts   # 倒计时逻辑
│   └── ...
├── constants/             # 常量定义
│   ├── file.ts           # 文件相关常量
│   ├── pagination.ts     # 分页常量
│   ├── request.ts        # 请求相关常量
│   ├── storage.ts        # 存储 key 常量
│   ├── ui.ts             # UI 常量
│   ├── validation.ts     # 验证规则常量
│   └── index.ts          # 统一导出
├── pages/                 # 主包页面（TabBar 页面）
│   ├── index/            # 首页（书架）
│   │   └── index.vue
│   ├── login/            # 登录页
│   │   ├── login.vue
│   │   └── phone-login.vue
│   ├── notes/            # 笔记页
│   │   └── index.vue
│   ├── mindmap/          # 思维导图页
│   │   └── index.vue
│   └── profile/          # 个人中心
│       └── index.vue
├── pages-book/           # 书籍分包页面
│   ├── add/
│   │   └── index.vue
│   └── detail/
│       └── index.vue
├── pages-note/           # 笔记分包页面
│   ├── add/
│   │   └── index.vue
│   ├── edit/
│   │   └── index.vue
│   ├── list/
│   │   └── index.vue
│   └── ocr/
│       └── index.vue
├── pages-mindmap/        # 思维导图分包页面
│   ├── create/
│   │   └── index.vue
│   └── view/
│       └── index.vue
├── shims/                # TypeScript 类型声明补丁
│   ├── vue.ts
│   └── vue-shared.ts
├── static/               # src 内静态资源
│   ├── fonts/
│   ├── iconfont/
│   ├── icons/
│   └── images/
├── stores/               # Pinia 状态管理
│   ├── modules/          # 按模块划分的 store
│   │   ├── user.ts      # 用户状态
│   │   ├── app.ts       # 应用状态
│   │   └── theme.ts     # 主题状态
│   └── index.ts          # Store 统一导出
├── styles/               # 全局样式
│   ├── design-tokens/   # 设计令牌
│   │   ├── colors.scss
│   │   ├── spacing.scss
│   │   └── typography.scss
│   ├── modules/         # 模块化样式
│   ├── overrides/       # 第三方库样式覆盖
│   ├── theme.scss       # 主题配置
│   ├── mixins.scss      # 样式混合器
│   ├── effects.scss     # 视觉效果
│   └── uview-override.scss
├── types/                # TypeScript 类型定义
│   ├── index.ts         # 通用类型
│   ├── errorCodes.ts    # 错误码类型
│   └── ...
├── utils/                # 工具函数
│   ├── __tests__/       # 工具函数测试
│   ├── auth-guard.ts    # 路由守卫
│   ├── base64.ts        # Base64 编解码
│   ├── error-handler.ts # 错误处理
│   ├── imageUpload.ts   # 图片上传
│   ├── logger.ts        # 日志工具
│   ├── navigation.ts    # 导航工具
│   ├── platform.ts      # 平台检测
│   ├── request.ts       # HTTP 请求封装
│   ├── storage.ts       # 本地存储封装
│   ├── tabbar.ts        # TabBar 工具
│   ├── validate.ts      # 表单验证
│   └── index.ts         # 工具函数统一导出
├── App.vue               # 应用根组件
├── main.ts               # 应用入口文件
├── manifest.json         # 应用配置清单
├── pages.json            # 页面路由配置
├── env.d.ts              # 环境变量类型声明
├── uni.scss              # uni-app 样式变量
└── vue-polyfill.ts       # Vue 兼容性补丁
```

---

## 🎯 目录设计原则

### 1. 按功能模块分包

**主包** (`pages/`):
- TabBar 页面
- 登录页等高频页面
- 应用首次启动必需的页面

**分包** (`pages-**/`):
- 按业务模块划分（book、note、mindmap）
- 降低主包体积
- 按需加载，提升性能

**分包配置示例**:
```json
// pages.json
{
  "subPackages": [
    {
      "root": "pages-book",
      "pages": [
        {
          "path": "add/index",
          "style": { "navigationBarTitleText": "添加书籍" }
        }
      ]
    }
  ]
}
```

### 2. 组件分层设计

#### 三层组件架构

```
components/
├── common/           # 通用层（最底层）
│   └── Button.vue   # 纯 UI，无业务逻辑，可跨项目复用
├── business/         # 业务层（中间层）
│   └── BookCard.vue # 包含业务逻辑，项目特定
└── [module]/         # 模块层（顶层）
    └── BookShelf.vue # 特定模块组件
```

**分层原则**:
- **通用组件**: 不包含业务逻辑，可直接复用到其他项目
- **业务组件**: 包含项目特定业务逻辑
- **模块组件**: 仅在特定模块内使用

#### 复杂组件目录化

当组件包含多个文件时，使用目录结构：

```
components/create-note-modal/
├── index.vue          # 组件主文件
├── types.ts           # 类型定义
├── useModal.ts        # 组合式 API
├── styles.scss        # 样式（可选）
└── __tests__/         # 测试文件
    └── index.spec.ts
```

### 3. API 接口层设计

**目录结构**:
```
api/
├── modules/
│   ├── auth.ts       # 认证模块
│   ├── book.ts       # 书籍模块
│   ├── note.ts       # 笔记模块
│   └── user.ts       # 用户模块
└── index.ts          # 统一导出
```

**单文件示例** (`api/modules/auth.ts`):
```typescript
import request from '@/utils/request'

export interface LoginParams {
  phone: string
  code: string
}

export interface LoginResponse {
  token: string
  userInfo: UserInfo
}

// 发送验证码
export const sendSmsCode = (phone: string) => {
  return request.post('/v1/auth/sms/send', { phone })
}

// 手机号登录
export const loginByPhone = (data: LoginParams) => {
  return request.post<LoginResponse>('/v1/auth/phone/login', data)
}
```

**统一导出** (`api/index.ts`):
```typescript
export * from './modules/auth'
export * from './modules/book'
export * from './modules/note'
export * from './modules/user'
```

### 4. 状态管理设计

**Store 模块化**:
```
stores/
├── modules/
│   ├── user.ts       # 用户状态
│   ├── app.ts        # 应用状态
│   └── theme.ts      # 主题状态
└── index.ts          # Store 实例化和导出
```

**Store 示例** (`stores/modules/user.ts`):
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)

  // 操作
  const setToken = (newToken: string) => {
    token.value = newToken
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    logout
  }
})
```

### 5. 工具函数设计

**分类原则**:
- 每个工具模块职责单一
- 必须包含完整的类型定义
- 核心工具需要单元测试

**示例** (`utils/validate.ts`):
```typescript
/**
 * 验证手机号格式
 * @param phone 手机号
 * @returns 是否有效
 */
export const isValidPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证验证码格式
 * @param code 验证码
 * @returns 是否有效
 */
export const isValidSmsCode = (code: string): boolean => {
  return /^\d{6}$/.test(code)
}
```

---

## 📂 特殊目录说明

### 1. `tests/` 测试目录

```
tests/
├── unit/                 # 单元测试
│   ├── components/      # 组件测试
│   ├── composables/     # 组合式函数测试
│   ├── stores/          # Store 测试
│   └── utils/           # 工具函数测试
├── e2e/                 # E2E 测试
│   ├── h5/             # H5 端测试
│   └── miniprogram/    # 小程序端测试
├── automation/          # 自动化测试
└── setup.ts             # 测试环境配置
```

**测试文件命名**:
- 单元测试: `*.spec.ts` 或 `*.test.ts`
- E2E 测试: `*.e2e.ts`

### 2. `docs/` 文档目录

```
docs/
├── architecture/        # 架构设计文档
│   ├── tech-stack.md
│   └── directory-structure.md
├── deployment/          # 部署文档
├── miniprogram/         # 小程序相关文档
├── technical/           # 技术专题文档
└── implementation/      # 实现文档
```

### 3. `scripts/` 脚本目录

```
scripts/
├── patches/             # 补丁脚本
│   ├── fix-vue-demi-hasInjectionContext.js
│   └── patch-vue-tsc.js
├── postbuild/           # 构建后处理脚本
│   └── create-mp-assets-stub.js
├── check-env.js         # 环境检查
└── verify-miniprogram-env.js  # 小程序环境验证
```

---

## 📝 命名规范

### 1. 文件命名

| 类型 | 规则 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `BookCard.vue` |
| TypeScript 文件 | kebab-case | `use-countdown.ts` |
| 样式文件 | kebab-case | `login-tokens.scss` |
| 测试文件 | 原文件名 + .spec/.test | `validate.spec.ts` |
| 目录 | kebab-case | `pages-book/` |

### 2. 代码命名

| 类型 | 规则 | 示例 |
|------|------|------|
| 组件名 | PascalCase | `BookCard` |
| Composable | use + PascalCase | `useCountdown` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 函数/变量 | camelCase | `getUserInfo` |
| 类型/接口 | PascalCase | `UserInfo`, `LoginParams` |
| Enum | PascalCase (值用 UPPER_SNAKE_CASE) | `ErrorCode.NOT_FOUND` |

### 3. 路由路径

| 类型 | 规则 | 示例 |
|------|------|------|
| 主包页面 | `pages/[module]/[name]` | `pages/login/login` |
| 分包页面 | `pages-[module]/[name]/index` | `pages-book/add/index` |

---

## 🎨 样式组织规范

### 1. 全局样式架构

```
src/styles/
├── design-tokens/          # 设计令牌（最底层）
│   ├── colors.scss        # 颜色变量
│   ├── spacing.scss       # 间距变量
│   └── typography.scss    # 字体变量
├── mixins.scss            # 样式混合器
├── theme.scss             # 主题配置
├── effects.scss           # 视觉效果
├── uview-override.scss    # uView 覆盖
└── modules/               # 模块化样式
    └── [module].scss
```

### 2. 组件样式

**优先级**:
1. 使用设计令牌变量
2. 使用 uView 组件默认样式
3. 必要时使用局部样式覆盖

**示例**:
```vue
<style lang="scss" scoped>
@import '@/styles/design-tokens/colors.scss';

.book-card {
  background: var(--color-bg-primary);  // 使用设计令牌
  padding: var(--spacing-md);
}
</style>
```

---

## 📋 最佳实践

### 1. 导入路径

**优先使用别名**:
```typescript
// ✅ 推荐
import { useUserStore } from '@/stores'
import { isValidPhone } from '@/utils/validate'

// ❌ 不推荐
import { useUserStore } from '../../../stores'
```

### 2. 统一导出

**每个目录应有 `index.ts`**:
```typescript
// api/index.ts
export * from './modules/auth'
export * from './modules/book'

// utils/index.ts
export * from './validate'
export * from './storage'
```

### 3. 类型优先

**所有 API 接口必须定义类型**:
```typescript
// ✅ 推荐
export interface BookListParams {
  page: number
  pageSize: number
  keyword?: string
}

export const getBookList = (params: BookListParams) => {
  return request.get<BookListResponse>('/v1/books', { params })
}
```

### 4. 组件拆分

**单一职责原则**:
- 组件代码不超过 300 行
- 复杂逻辑提取为 Composable
- UI 逻辑与业务逻辑分离

---

## 🔍 目录清理规范

### 定期清理项

- [ ] 未使用的组件
- [ ] 废弃的工具函数
- [ ] 过期的测试快照
- [ ] 无效的样式文件
- [ ] 冗余的类型定义

### 保持整洁

- 删除调试代码
- 移除注释掉的代码
- 统一代码格式（运行 `npm run lint`）

---

## 📚 相关文档

- [技术栈说明](./tech-stack.md)
- [开发指南](../DEVELOPMENT.md)
- [代码审查清单](../../CODE_REVIEW.md)

---

## 📌 附录：快速查找

### 我想添加...

- **新页面** → `src/pages/` 或 `src/pages-*/`
- **新组件** → `src/components/`
- **新 API** → `src/api/modules/`
- **新工具函数** → `src/utils/`
- **新状态** → `src/stores/modules/`
- **新类型** → `src/types/`
- **新样式** → `src/styles/`
- **新常量** → `src/constants/`

### 我想修改...

- **页面路由** → `src/pages.json`
- **应用配置** → `src/manifest.json`
- **环境变量** → `.env.*`
- **构建配置** → `vite.config.ts`
- **TypeScript 配置** → `tsconfig.json`
- **全局样式变量** → `src/uni.scss`
