# 阅记小程序开发指南

## 🚀 快速开始

### 1. 环境准备
- 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- Node.js >= 16.0.0

### 2. 项目启动
```bash
# 安装依赖
npm install

# 代码规范检查
npm run lint
```

### 3. 微信开发者工具配置
1. 导入项目：选择项目根目录
2. 构建 npm 包：工具 -> 构建 npm
3. 预览调试：模拟器选择 iPhone X

## 📱 项目结构

```
chinese-rose-front/
├── app.js                 # 应用入口
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置
├── pages/                 # 页面目录
│   ├── index/            # 首页（书架）
│   ├── login/            # 登录页
│   ├── note-add/         # 笔记添加
│   ├── mindmap/          # 思维导图
│   └── ...
├── components/           # 组件目录
│   ├── business/         # 业务组件
│   └── common/           # 通用组件
├── utils/                # 工具函数
│   ├── request.js        # 网络请求
│   ├── auth.js           # 认证管理
│   ├── storage.js        # 存储管理
│   └── logger.js         # 日志工具
├── services/             # 业务服务
│   ├── book.js           # 书籍服务
│   ├── note.js           # 笔记服务
│   └── ocr.js            # OCR服务
└── images/               # 图片资源
```

## 🛠️ 开发规范

### 代码规范
- 使用 ESLint 进行代码规范检查
- 遵循小程序官方开发指南
- 组件化开发，提高代码复用性

### 命名规范
- 页面：kebab-case (note-add)
- 组件：kebab-case (book-card)
- 方法：camelCase (loadBooks)
- 常量：UPPER_SNAKE_CASE (MAX_PAGE_SIZE)

### 目录规范
- `pages/` - 页面文件，每个页面一个文件夹
- `components/` - 组件文件，按业务和通用分类
- `utils/` - 工具函数，纯函数无副作用
- `services/` - 业务服务，封装API调用

## 🔧 配置说明

### 后端服务地址
开发环境：`http://localhost:8080`
生产环境：需要配置实际服务器地址

### 服务器域名配置
需要在微信小程序管理后台配置以下域名：
- request 合法域名：你的后端服务域名
- uploadFile 合法域名：图片上传服务域名
- downloadFile 合法域名：文件下载服务域名

### AppID 配置
当前使用测试 AppID，正式发布需要：
1. 注册微信小程序账号
2. 获取正式 AppID
3. 修改 `project.config.json` 中的 `appid`

## 📦 依赖包说明

### 核心依赖
- `@vant/weapp`: UI 组件库，提供丰富的小程序组件

### 开发依赖
- `eslint`: 代码规范检查工具
- `eslint-config-standard`: 标准代码规范配置

## 🎨 UI 组件使用

项目集成了 Vant Weapp 组件库，可直接使用：

```xml
<!-- 按钮组件 -->
<van-button type="primary">主要按钮</van-button>

<!-- 单元格组件 -->
<van-cell title="单元格" value="内容" />

<!-- 搜索组件 -->
<van-search value="{{ value }}" placeholder="搜索关键词" />
```

## 🔍 调试技巧

### 日志调试
使用封装的 Logger 工具：
```js
const Logger = require('../utils/logger.js')

Logger.info('信息日志')
Logger.error('错误日志', error)
Logger.debug('调试日志', data)
```

### 网络调试
- 开发者工具 Network 面板查看请求
- 使用 charles 等工具抓包调试
- 检查服务器域名白名单配置

### 真机调试
- 使用开发者工具真机调试功能
- 查看真机 console 日志
- 测试不同机型兼容性

## 📝 开发流程

### 1. 功能开发
1. 创建页面/组件文件
2. 实现界面和逻辑
3. 编写单元测试
4. 本地调试验证

### 2. 代码规范
```bash
# 检查代码规范
npm run lint

# 自动修复规范问题
npm run lint:fix
```

### 3. 提交代码
1. 确保代码规范检查通过
2. 确保功能测试通过
3. 编写清晰的 commit 信息

### 4. 发布流程
1. 在开发者工具中上传代码
2. 在小程序管理后台提交审核
3. 审核通过后发布上线

## ❓ 常见问题

### Q: 组件显示异常
A: 检查是否构建了 npm 包，工具 -> 构建 npm

### Q: 网络请求失败
A: 检查服务器域名是否已配置白名单

### Q: 真机预览白屏
A: 检查 AppID 是否正确，是否开启了调试模式

### Q: 样式异常
A: 检查 rpx 单位使用，确保适配不同屏幕

## 🔗 相关文档

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Vant Weapp 组件文档](https://vant-ui.github.io/vant-weapp/)
- [小程序云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)