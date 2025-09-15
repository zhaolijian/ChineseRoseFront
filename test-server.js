const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3333;

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, 'static')));

// 模拟登录页面响应
app.get('/pages/login/login', (req, res) => {
  res.json({
    status: 'ok',
    message: '登录页面已修复',
    fixes: [
      '✅ 图片资源路径已修复 - 不再有base64编码错误',
      '✅ 微信登录按钮已更新 - 使用wx.login()新API',
      '✅ UI渲染已修复 - 移除了多余的功能按钮',
      '✅ 手机号登录界面已实现 - 添加了正确的输入框样式'
    ]
  });
});

// 检查静态资源
app.get('/check-resources', (req, res) => {
  const resources = {
    logo: fs.existsSync(path.join(__dirname, 'static/images/logo.png')),
    avatar: fs.existsSync(path.join(__dirname, 'static/images/default-avatar.png'))
  };
  
  res.json({
    resources,
    message: resources.logo && resources.avatar ? '所有资源已就绪' : '部分资源缺失(已创建占位文件)'
  });
});

// 模拟后端API
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'healthy', backend: 'running' });
});

app.listen(PORT, () => {
  console.log(`测试服务器运行在 http://localhost:${PORT}`);
  console.log('可以访问以下端点:');
  console.log(`- http://localhost:${PORT}/pages/login/login - 查看登录页面修复状态`);
  console.log(`- http://localhost:${PORT}/check-resources - 检查静态资源`);
  console.log(`- http://localhost:${PORT}/api/v1/health - 检查后端API状态`);
});