# 小程序开发常见问题解决方案

## 🔧 开发环境问题

### 1. 无法连接到本地后端服务

**问题表现**：
- 请求失败，提示"request:fail"
- 网络错误或连接超时

**解决方案**：

1. **检查后端服务是否启动**
```bash
# 确认后端服务运行中
cd /Users/zhaolijian/Projects/chinese-rose-backend
go run cmd/api/main.go
```

2. **开发者工具设置**
- 详情 → 本地设置
- ✅ 勾选"不校验合法域名"

3. **使用局域网IP**（真机调试必须）
```typescript
// 修改 src/utils/request.ts
// #ifdef MP-WEIXIN
this.baseURL = 'http://192.168.1.100:8080/api' // 替换为你的局域网IP
// #endif
```

4. **防火墙设置**
```bash
# macOS 允许端口访问
sudo pfctl -d  # 临时关闭防火墙测试
```

### 2. 登录后立即退出

**问题表现**：
- 登录成功但马上跳转回登录页
- Token验证失败

**解决方案**：

1. **检查Token存储**
```javascript
// 在开发者工具Console中检查
const token = wx.getStorageSync('chinese_rose_token')
console.log('Token:', token)
```

2. **检查API响应格式**
- 确保后端返回格式正确
- code必须为0表示成功

3. **检查Token过期时间**
- 后端JWT配置是否正确
- 前端Token过期判断逻辑

### 3. 页面白屏或加载失败

**问题表现**：
- 页面空白
- 样式丢失

**解决方案**：

1. **检查编译输出**
```bash
# 重新编译
npm run dev:mp-weixin
```

2. **清理缓存**
- 开发者工具：工具 → 清除缓存 → 清除所有缓存

3. **检查路径配置**
- pages.json中的路径是否正确
- 静态资源路径是否正确

## 📱 真机调试问题

### 1. 真机无法访问本地服务

**解决方案**：

1. **确保同一网络**
- 手机和电脑连接同一WiFi
- 关闭手机代理设置

2. **使用正确的IP**
```bash
# 查看本机IP
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# 更新request.ts中的baseURL
```

3. **开启调试模式**
- 开发版本会自动忽略域名校验
- 体验版需要在小程序设置中开启调试

### 2. 真机上图片不显示

**解决方案**：

1. **检查图片路径**
```html
<!-- 错误 -->
<image src="../../static/images/logo.png" />

<!-- 正确 -->
<image src="/static/images/logo.png" />
```

2. **图片大小限制**
- 单张图片建议不超过300KB
- 使用webp格式减小体积

3. **使用CDN**
- 将图片上传到腾讯云COS
- 使用CDN地址访问

## 🚀 性能优化问题

### 1. 首屏加载慢

**解决方案**：

1. **启用分包加载**
```json
// pages.json
"subPackages": [
  {
    "root": "pages-book",
    "pages": [...]
  }
]
```

2. **减小主包体积**
- 将非首屏组件放入分包
- 压缩图片资源

3. **预加载分包**
```json
"preloadRule": {
  "pages/index/index": {
    "network": "all",
    "packages": ["pages-book"]
  }
}
```

### 2. 列表滚动卡顿

**解决方案**：

1. **使用虚拟列表**
```vue
<scroll-view
  scroll-y
  :throttle="false"
  :enhanced="true"
  :bounces="false"
>
  <!-- 内容 -->
</scroll-view>
```

2. **图片懒加载**
```vue
<image 
  lazy-load
  mode="aspectFill"
  :src="item.cover"
/>
```

3. **减少数据绑定**
- 只绑定必要的数据
- 使用计算属性缓存

## 🔐 安全相关问题

### 1. 敏感信息泄露

**问题**：AppSecret等敏感信息不应出现在前端代码

**解决方案**：
- 所有敏感操作在后端完成
- 前端只传递必要参数
- 使用环境变量管理密钥

### 2. 请求被篡改

**解决方案**：

1. **启用请求签名**
```typescript
// 已在后端实现API签名验证
// 前端自动添加签名头
```

2. **使用HTTPS**
- 生产环境必须使用HTTPS
- 配置有效的SSL证书

## 📋 提审相关问题

### 1. 审核被拒：无法体验完整功能

**解决方案**：
- 提供测试账号：13800138000
- 说明验证码：123456
- 录制操作视频

### 2. 审核被拒：涉及UGC内容

**解决方案**：
- 实现内容审核机制
- 添加举报功能
- 完善用户协议

### 3. 审核被拒：权限使用不明确

**解决方案**：

1. **更新权限说明**
```json
// manifest.json
"permission": {
  "scope.camera": {
    "desc": "拍照识别纸质书笔记，需要使用您的相机"
  }
}
```

2. **使用时再申请**
```javascript
// 点击拍照按钮时才申请权限
wx.authorize({
  scope: 'scope.camera',
  success() {
    // 用户同意
  },
  fail() {
    // 引导用户开启
    wx.openSetting()
  }
})
```

## 🛠️ 调试技巧

### 1. 使用vConsole
```javascript
// app.js
if (process.env.NODE_ENV === 'development') {
  const vConsole = new VConsole()
}
```

### 2. 远程调试
- 真机调试 → 打开调试
- 可在电脑上看到真机console

### 3. 性能分析
- 开发者工具 → Audits
- 查看性能评分和优化建议

### 4. 网络监控
- Network面板查看请求
- 检查请求时间和大小

## 💡 最佳实践

### 1. 错误边界处理
```vue
<template>
  <view v-if="!hasError">
    <!-- 正常内容 -->
  </view>
  <view v-else>
    <!-- 错误提示 -->
  </view>
</template>
```

### 2. 统一错误处理
```typescript
// 在request.ts中已实现
// 自动处理网络错误和业务错误
```

### 3. 版本管理
- 使用Git管理代码
- 小程序版本与后端API版本对应
- 保留最近3个版本供回退

### 4. 监控上报
```javascript
// 错误上报
wx.onError((error) => {
  // 上报到监控平台
  console.error('小程序错误', error)
})
```

## 📞 获取帮助

如果以上方案无法解决您的问题：

1. **查看日志**
   - 开发者工具Console
   - 后端服务日志
   - 真机调试日志

2. **搜索文档**
   - [uni-app文档](https://uniapp.dcloud.net.cn/)
   - [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/)

3. **社区求助**
   - uni-app论坛
   - 微信开放社区

---

*持续更新中...*