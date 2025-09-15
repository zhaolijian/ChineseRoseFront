# 阅记uni-app开发指南

## 🚀 快速开始

### 1. 环境准备
- 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（可选，推荐）
- Node.js >= 16.0.0

### 2. 项目启动
```bash
# 安装依赖
npm install

# 开发模式 - 微信小程序
npm run dev:mp-weixin

# 开发模式 - H5
npm run dev:h5

# 开发模式 - APP
npm run dev:app

# 代码规范检查
npm run lint

# 类型检查
npm run type-check
```

### 3. 微信开发者工具配置
1. 导入项目：选择 `dist/dev/mp-weixin` 目录
2. 设置项目配置：
   - 不校验合法域名
   - 不校验TLS版本
   - 不校验安全域名
3. 预览调试：模拟器选择 iPhone X

## 📱 项目结构

```
chinese-rose-front/
├── src/                    # 源代码目录
│   ├── App.vue            # 应用入口
│   ├── main.ts            # 主入口文件
│   ├── manifest.json      # 应用配置
│   ├── pages.json         # 页面路由配置
│   ├── pages/             # 页面目录
│   │   ├── index/         # 首页（书架）
│   │   └── login/         # 登录页
│   ├── pages-book/        # 书籍相关页面
│   ├── pages-note/        # 笔记相关页面
│   ├── pages-mindmap/     # 思维导图页面
│   ├── pages-user/        # 用户相关页面
│   ├── components/        # 组件目录
│   │   ├── business/      # 业务组件
│   │   └── common/        # 通用组件
│   ├── stores/            # Pinia状态管理
│   │   ├── index.ts       # store入口
│   │   └── modules/       # 模块化store
│   ├── api/               # API接口
│   │   ├── index.ts       # API入口
│   │   └── modules/       # 模块化API
│   ├── utils/             # 工具函数
│   │   ├── request.ts     # 网络请求
│   │   └── storage.ts     # 存储管理
│   ├── types/             # TypeScript类型定义
│   ├── styles/            # 全局样式
│   └── static/            # 静态资源
│       └── images/        # 图片资源
├── dist/                  # 编译输出目录
│   ├── dev/               # 开发构建
│   └── build/             # 生产构建
├── package.json           # 项目依赖
├── vite.config.ts         # Vite配置
├── tsconfig.json          # TypeScript配置
└── .eslintrc.js           # ESLint配置
```

## 🛠️ 技术栈

### 核心框架
- **uni-app**: 跨平台应用开发框架
- **Vue 3**: 渐进式JavaScript框架
- **TypeScript**: JavaScript的超集
- **Vite**: 新一代前端构建工具

### 状态管理
- **Pinia**: Vue 3官方推荐的状态管理库

### UI组件库
- **uView Plus**: uni-app生态UI组件库

### 开发工具
- **ESLint**: 代码规范检查
- **vue-tsc**: Vue TypeScript类型检查

## 🔧 开发规范

### 代码规范
- 使用 TypeScript 进行类型约束
- 使用 ESLint 进行代码规范检查
- 遵循 Vue 3 Composition API 开发模式
- 组件化开发，提高代码复用性

### 命名规范
- 页面/组件：PascalCase (BookDetail.vue)
- 文件夹：kebab-case (pages-book)
- 方法：camelCase (loadBooks)
- 常量：UPPER_SNAKE_CASE (MAX_PAGE_SIZE)
- Store：camelCase (useBookStore)

### 目录规范
- `pages/` - 主页面，对应tabBar页面
- `pages-*/` - 分包页面，按业务模块分类
- `components/` - 组件文件，按业务和通用分类
- `stores/` - Pinia状态管理，按业务模块分类
- `api/` - API接口，按业务模块分类
- `utils/` - 工具函数，纯函数无副作用

### 文件结构规范
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 1. 导入
import { ref, reactive, onMounted } from 'vue'
import { useStore } from '@/stores/modules/example'

// 2. 类型定义
interface ExampleType {
  id: number
  name: string
}

// 3. 状态管理
const store = useStore()

// 4. 响应式数据
const data = ref<ExampleType[]>([])
const loading = ref(false)

// 5. 生命周期
onMounted(() => {
  // 初始化逻辑
})

// 6. 方法定义
const handleClick = () => {
  // 事件处理
}
</script>

<style lang="scss" scoped>
/* 组件样式 */
</style>
```

## 🔧 配置说明

### 后端服务地址
- 开发环境：`http://localhost:8080`
- 生产环境：需要配置实际服务器地址（在vite.config.ts中配置代理）

### 多平台配置
项目支持以下平台：
- 微信小程序 (mp-weixin)
- H5 (h5)
- APP (app)

### AppID 配置
1. 开发环境：使用测试AppID
2. 生产环境：需要在 `src/manifest.json` 中配置正式AppID

## 📦 依赖包说明

### 核心依赖
- `@dcloudio/uni-app`: uni-app框架核心
- `vue`: Vue 3框架
- `pinia`: 状态管理
- `uview-plus`: UI组件库

### 开发依赖
- `@dcloudio/vite-plugin-uni`: uni-app Vite插件
- `typescript`: TypeScript支持
- `eslint`: 代码规范检查
- `vue-tsc`: Vue TypeScript检查

## 🎨 UI组件使用

项目集成了 uView Plus 组件库，可直接使用：

```vue
<template>
  <!-- 按钮组件 -->
  <u-button type="primary">主要按钮</u-button>
  
  <!-- 单元格组件 -->
  <u-cell title="单元格" value="内容"></u-cell>
  
  <!-- 搜索组件 -->
  <u-search v-model="value" placeholder="搜索关键词"></u-search>
</template>
```

## 🔍 调试技巧

### 开发环境调试
```bash
# 启动开发服务
npm run dev:mp-weixin

# 在微信开发者工具中导入 dist/dev/mp-weixin 目录
```

### 真机调试
1. 确保后端服务可访问
2. 在微信开发者工具中预览
3. 使用手机微信扫码测试

### 多端调试
```bash
# H5调试
npm run dev:h5

# APP调试（需要HBuilderX）
npm run dev:app
```

## 📝 开发流程

### 1. 功能开发
1. 在对应的pages目录创建页面
2. 在components目录创建组件
3. 在stores目录创建状态管理
4. 在api目录创建接口调用
5. 本地调试验证

### 2. 代码规范
```bash
# 检查代码规范
npm run lint

# 类型检查
npm run type-check
```

### 3. 构建发布
```bash
# 构建微信小程序
npm run build:mp-weixin

# 构建H5
npm run build:h5

# 构建APP
npm run build:app
```

## ❓ 常见问题

### Q: 编译失败，提示找不到模块
A: 检查是否正确安装依赖，运行 `npm install`

### Q: 微信开发者工具中页面空白
A: 检查是否导入了正确的目录 `dist/dev/mp-weixin`

### Q: API请求失败
A: 检查后端服务是否启动，微信开发者工具是否开启了"不校验合法域名"

### Q: TypeScript类型错误
A: 运行 `npm run type-check` 检查类型问题

### Q: 组件样式异常
A: 检查是否正确引入uView Plus，确认组件使用方式

## 🔗 相关文档

- [uni-app官方文档](https://uniapp.dcloud.net.cn/)
- [Vue 3官方文档](https://cn.vuejs.org/)
- [Pinia官方文档](https://pinia.vuejs.org/zh/)
- [uView Plus文档](https://uiadmin.net/uview-plus/)
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)