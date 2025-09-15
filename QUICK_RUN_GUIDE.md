# 阅记uni-app快速运行指南

## 前置条件
- ✅ 后端服务已启动：http://localhost:8080
- ❌ 微信开发者工具未安装

## 项目技术架构
- **框架**: uni-app (Vue 3 + TypeScript + Pinia + uView Plus + Vite)
- **平台**: 微信小程序、H5、APP多端支持
- **构建**: 编译后在 `dist/dev/mp-weixin` 目录

## 微信开发者工具安装

1. **下载地址**：
   https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
   
2. **选择版本**：
   - 选择 macOS 版本（稳定版）
   - 下载完成后双击安装

3. **登录开发者工具**：
   - 打开微信开发者工具
   - 使用微信扫码登录

## uni-app项目编译运行

### 1. 安装依赖（如未安装）
```bash
cd /Users/zhaolijian/Projects/chinese-rose-front
npm install
```

### 2. 编译项目
```bash
# 编译微信小程序（开发模式）
npm run dev:mp-weixin

# 看到以下输出表示编译成功：
# DONE Build complete.
# 运行方式：打开 微信开发者工具, 导入 dist/dev/mp-weixin 运行。
```

### 3. 导入微信开发者工具

1. **打开开发者工具**，选择"小程序"

2. **导入项目**：
   - 项目目录：`/Users/zhaolijian/Projects/chinese-rose-front/dist/dev/mp-weixin`
   - AppID：留空或使用测试号
   - 后端服务：本地模式

3. **项目设置**（重要！）：
   - 点击右上角"详情"
   - 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
   - 勾选"启用调试"

4. **编译运行**：
   - 点击编译按钮或按 Cmd+B
   - 如有报错，查看控制台并修复

## 核心功能测试

### 1. 页面导航
- 默认首页为书架页面（pages/index/index）
- 查看页面结构和基础功能

### 2. 微信登录功能
- 点击"微信登录"按钮
- 测试用户信息获取
- 检查登录状态管理

### 3. 书架功能
- 查看空状态提示
- 测试"添加书籍"弹窗
- 验证手动添加书籍功能

### 4. 状态管理
- 检查Pinia store是否正常工作
- 验证用户状态持久化

## 开发模式功能

### 1. 热重载
- 修改 `src/` 下的文件
- 自动重新编译到 `dist/dev/mp-weixin`
- 开发者工具自动刷新

### 2. TypeScript支持
- 类型检查：`npm run type-check`
- 代码规范：`npm run lint`

### 3. 多端开发
```bash
# H5预览
npm run dev:h5
# 然后访问 http://localhost:3000

# APP开发（需HBuilderX）
npm run dev:app
```

## 常见问题

### 1. 编译失败
- 确保已正确安装依赖：`npm install`
- 检查Node.js版本 >= 16.0.0
- 清理缓存：删除 `node_modules` 和 `package-lock.json` 重新安装

### 2. 微信开发者工具导入失败
- 确保导入的是编译后的目录：`dist/dev/mp-weixin`
- 不是源码目录 `src/`
- 检查目录中是否有 `app.json` 文件

### 3. 网络请求失败
- 确保后端服务运行在 http://localhost:8080
- 检查开发者工具中"不校验合法域名"是否勾选
- 查看控制台网络请求错误

### 4. 页面空白或组件异常
- 检查控制台是否有Vue/TypeScript错误
- 确认uView Plus组件是否正确引入
- 验证路由配置是否正确

### 5. 热重载不生效
- 重新运行 `npm run dev:mp-weixin`
- 在开发者工具中手动点击编译
- 检查文件监听是否被阻塞

## 项目结构说明

```
dist/dev/mp-weixin/           # 编译输出（导入此目录）
├── app.json                  # 小程序配置
├── app.js                    # 应用入口
├── app.wxss                  # 全局样式
├── pages/                    # 页面文件
├── static/                   # 静态资源
└── ...
```

## 真机调试

1. 确保手机和电脑在同一网络
2. 点击工具栏"预览"按钮
3. 使用手机微信扫描二维码
4. 在手机上测试功能

## 构建生产版本

```bash
# 构建生产版本
npm run build:mp-weixin

# 输出目录：dist/build/mp-weixin
```

## 当前开发状态

- ✅ uni-app项目架构已搭建
- ✅ Vue 3 + TypeScript + Pinia技术栈
- ✅ uView Plus UI组件库集成
- ✅ 基础页面和路由配置
- ✅ tabBar图标已生成
- ✅ 编译系统正常工作
- ⏳ 等待在微信开发者工具中验证运行

## 下一步

1. 安装并打开微信开发者工具
2. 编译项目：`npm run dev:mp-weixin`
3. 导入编译后的目录：`dist/dev/mp-weixin`
4. 测试核心功能和页面导航
5. 验证与后端API的集成
6. 完善剩余功能模块

## 技术支持

如遇到问题，请检查：
1. uni-app官方文档：https://uniapp.dcloud.net.cn/
2. 微信小程序开发文档：https://developers.weixin.qq.com/miniprogram/dev/
3. 项目DEVELOPMENT.md文件中的详细说明