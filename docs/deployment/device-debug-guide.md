# 小程序真机联调配置指南

## 概述

本指南帮助开发者配置小程序真机联调环境，解决真机无法访问后端服务的问题。

## 问题背景

小程序在真机运行时，`127.0.0.1` 指向手机自身，无法访问开发电脑上的后端服务。因此需要配置局域网IP地址。

## 快速配置（3步）

### 1️⃣ 获取电脑的局域网IP地址

#### macOS / Linux
```bash
# 方法1：使用 ifconfig
ifconfig | grep "inet " | grep -v 127.0.0.1

# 方法2：使用 ipconfig（macOS）
ipconfig getifaddr en0  # WiFi
ipconfig getifaddr en1  # 有线网络
```

示例输出：
```
inet 192.168.31.88 netmask 0xffffff00 broadcast 192.168.31.255
```

从输出中提取IP地址：`192.168.31.88`

#### Windows
```cmd
# 打开命令提示符（CMD），运行：
ipconfig

# 查找 "无线局域网适配器 WLAN" 或 "以太网适配器" 部分
# 找到 IPv4 地址
```

示例输出：
```
无线局域网适配器 WLAN:
   IPv4 地址 . . . . . . . . . . . . : 192.168.31.88
```

### 2️⃣ 配置环境变量

编辑项目根目录下的 `.env.development` 文件：

```bash
# 小程序真机联调地址（请替换为你的电脑局域网IP）
VITE_API_BASE_MP_DEVICE=http://192.168.31.88:8080/api
```

**重要提示**：
- 将 `192.168.31.88` 替换为你在步骤1中获取的IP地址
- 保持端口号 `:8080` 和路径 `/api` 不变
- **保存后需要重新编译小程序**

### 3️⃣ 确保后端监听所有网卡

确认后端服务配置为监听 `0.0.0.0:8080`（而非 `127.0.0.1:8080`）：

```yaml
# config/app.yaml
server:
  host: "0.0.0.0"  # ✅ 正确：允许局域网访问
  # host: "127.0.0.1"  # ❌ 错误：仅本机访问
  port: 8080
```

重启后端服务。

## 环境判断逻辑

前端代码会自动判断运行环境：

```typescript
// 1. 微信开发者工具环境
//    → 使用 VITE_API_BASE_MP_DEV=http://127.0.0.1:8080/api

// 2. 真机环境
//    → 使用 VITE_API_BASE_MP_DEVICE=http://你的IP:8080/api

// 3. H5环境
//    → 使用代理 /api
```

## 验证配置

### 1. 查看控制台日志

在微信开发者工具的"真机调试"模式下，查看Console日志：

```
✅ 正确的日志：
[setBaseURL] 真机环境，使用配置的局域网API基址: http://192.168.31.88:8080/api

❌ 错误的日志：
[setBaseURL] 真机环境未配置API地址！
```

### 2. 测试网络请求

1. 打开小程序登录页
2. 尝试发送验证码或登录
3. 查看Network面板，确认请求地址为：
   ```
   http://192.168.31.88:8080/api/v1/auth/phone/code
   ```

### 3. 检查后端日志

后端应该能看到来自手机IP的请求日志：
```
[INFO] [Auth] 发送验证码请求 phone=138****1234 client_ip=192.168.31.100
```

## 常见问题

### Q1: 真机显示"网络配置错误"

**原因**：未配置 `VITE_API_BASE_MP_DEVICE` 环境变量

**解决方法**：
1. 检查 `.env.development` 文件是否正确配置
2. 确认IP地址格式正确
3. 重新编译小程序（`npm run dev:mp-weixin`）

### Q2: 请求超时 `net::ERR_TIMED_OUT`

**可能原因**：
1. 后端未启动
2. 后端监听 `127.0.0.1` 而非 `0.0.0.0`
3. 防火墙阻止了8080端口
4. 手机和电脑不在同一WiFi网络

**解决方法**：
```bash
# 1. 检查后端是否运行
curl http://localhost:8080/health

# 2. 检查后端监听地址
# macOS/Linux
lsof -i :8080
# 应该看到 *:8080 (监听所有网卡)

# Windows
netstat -ano | findstr :8080

# 3. 允许防火墙通过（macOS）
# 系统设置 → 安全性与隐私 → 防火墙 → 允许应用程序

# 4. 确认网络连接
ping 192.168.31.88  # 从手机访问电脑IP
```

### Q3: 开发者工具可以，真机不行

**原因**：开发者工具走的是本地代理，真机走的是直连

**检查清单**：
- [ ] IP地址是否正确（不要用 `127.0.0.1` 或 `localhost`）
- [ ] 后端是否监听 `0.0.0.0`
- [ ] 手机和电脑在同一WiFi网络
- [ ] 防火墙是否允许8080端口

### Q4: 如何临时测试不同的IP地址？

可以在开发者工具的 Console 中临时修改：

```javascript
// 仅用于临时测试，刷新后失效
localStorage.setItem('debug_api_base', 'http://新IP:8080/api')
location.reload()
```

但建议还是修改 `.env.development` 文件。

## 网络环境切换

### 在公司和家里切换开发环境

**方案1：创建多个环境文件**

```bash
# 公司环境
.env.development.office
VITE_API_BASE_MP_DEVICE=http://192.168.1.100:8080/api

# 家里环境
.env.development.home
VITE_API_BASE_MP_DEVICE=http://192.168.31.88:8080/api
```

使用时复制到 `.env.development`：
```bash
cp .env.development.office .env.development
npm run dev:mp-weixin
```

**方案2：使用脚本自动切换**

创建 `scripts/switch-env.sh`：
```bash
#!/bin/bash
# 使用方法: ./scripts/switch-env.sh office

ENV=$1
if [ -z "$ENV" ]; then
  echo "用法: ./scripts/switch-env.sh [office|home]"
  exit 1
fi

cp ".env.development.$ENV" .env.development
echo "✅ 已切换到 $ENV 环境"
cat .env.development | grep VITE_API_BASE_MP_DEVICE
```

## 高级配置

### 支持多个开发者协作

团队成员可以各自配置自己的IP：

```bash
# 开发者A
VITE_API_BASE_MP_DEVICE=http://192.168.31.88:8080/api

# 开发者B
VITE_API_BASE_MP_DEVICE=http://192.168.31.99:8080/api
```

### 使用动态域名（适合IP经常变化的场景）

如果WiFi IP经常变化，可以考虑：

1. **使用本地DNS服务**（如 dnsmasq）
2. **配置路由器静态IP**
3. **使用花生壳等动态域名服务**（内网穿透）

## 安全提示

⚠️ **重要**：`.env.development` 中的配置仅用于开发环境

- 不要提交包含真实IP的 `.env.development` 到Git仓库
- 项目的 `.gitignore` 已忽略该文件
- 生产环境使用 `VITE_API_BASE` 配置正式域名

## 相关文档

- [配置说明](./config-guide.md)
- [快速开始](./quick-start.md)
- [小程序开发指南](../uni-app/technical-solution.md)

## 技术支持

如遇到问题，请提供以下信息：

1. 控制台完整日志（包含 `[setBaseURL]` 相关日志）
2. Network请求截图
3. 后端监听地址（`lsof -i :8080` 输出）
4. 手机和电脑IP地址
5. 是否在同一WiFi网络

联系开发团队或查阅项目Issues。
