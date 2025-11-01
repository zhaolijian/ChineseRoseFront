#!/usr/bin/env node

/**
 * 环境配置检查脚本
 * 用于验证小程序真机联调配置是否正确
 */

const fs = require('fs')
const path = require('path')

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkEnvFile() {
  log('\n=== 检查环境配置文件 ===\n', 'bold')

  const envPath = path.join(__dirname, '..', '.env.development')

  if (!fs.existsSync(envPath)) {
    log('❌ 未找到 .env.development 文件', 'red')
    log('\n建议：复制 .env.example 为 .env.development', 'yellow')
    return false
  }

  log('✅ 找到 .env.development 文件', 'green')

  const content = fs.readFileSync(envPath, 'utf-8')

  // 检查必要的配置项
  const checks = [
    {
      key: 'VITE_API_BASE',
      regex: /VITE_API_BASE=(.+)/,
      required: true,
      name: 'API基础地址'
    },
    {
      key: 'VITE_API_BASE_MP_DEV',
      regex: /VITE_API_BASE_MP_DEV=(.+)/,
      required: true,
      name: '小程序开发工具地址'
    },
    {
      key: 'VITE_API_BASE_MP_DEVICE',
      regex: /VITE_API_BASE_MP_DEVICE=(.+)/,
      required: false,
      name: '小程序真机联调地址'
    }
  ]

  let hasError = false

  checks.forEach(check => {
    const match = content.match(check.regex)

    if (!match) {
      if (check.required) {
        log(`❌ 缺少配置: ${check.key}`, 'red')
        hasError = true
      } else {
        log(`⚠️  未配置: ${check.key} (真机联调需要)`, 'yellow')
      }
      return
    }

    const value = match[1].trim()

    if (!value || value === '') {
      if (check.required) {
        log(`❌ ${check.key} 配置为空`, 'red')
        hasError = true
      } else {
        log(`⚠️  ${check.key} 未配置 (真机联调时需要)`, 'yellow')
      }
    } else {
      log(`✅ ${check.key}=${value}`, 'green')

      // 检查真机配置的格式
      if (check.key === 'VITE_API_BASE_MP_DEVICE') {
        if (value.includes('127.0.0.1') || value.includes('localhost')) {
          log(`   ⚠️  真机联调不能使用 127.0.0.1 或 localhost`, 'yellow')
          log(`   💡 请使用局域网IP，例如: http://192.168.31.88:8080/api`, 'blue')
        } else if (!value.startsWith('http://') && !value.startsWith('https://')) {
          log(`   ⚠️  地址应该以 http:// 或 https:// 开头`, 'yellow')
        } else if (!value.includes(':8080')) {
          log(`   ⚠️  确认端口号是否正确`, 'yellow')
        } else {
          log(`   💡 配置看起来正确！`, 'blue')
        }
      }
    }
  })

  return !hasError
}

function getLocalIP() {
  log('\n=== 获取本机局域网IP ===\n', 'bold')

  const os = require('os')
  const networkInterfaces = os.networkInterfaces()

  const ips = []

  Object.keys(networkInterfaces).forEach(name => {
    networkInterfaces[name].forEach(iface => {
      // 跳过内部和非IPv4地址
      if (iface.internal || iface.family !== 'IPv4') {
        return
      }

      ips.push({
        name,
        address: iface.address
      })
    })
  })

  if (ips.length === 0) {
    log('❌ 未找到有效的局域网IP地址', 'red')
    return
  }

  log('找到以下网络接口:', 'blue')
  ips.forEach(ip => {
    log(`  ${ip.name}: ${ip.address}`, 'green')
  })

  log('\n建议配置（复制以下内容到 .env.development）:', 'blue')
  const suggestedIP = ips[0].address
  log(`VITE_API_BASE_MP_DEVICE=http://${suggestedIP}:8080/api`, 'yellow')
}

function checkBackend() {
  log('\n=== 检查后端服务 ===\n', 'bold')

  const http = require('http')

  const testUrls = [
    'http://127.0.0.1:8080/health',
    'http://localhost:8080/health'
  ]

  testUrls.forEach(url => {
    http.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        log(`✅ 后端服务运行中: ${url}`, 'green')
      } else {
        log(`⚠️  ${url} 返回状态码: ${res.statusCode}`, 'yellow')
      }
    }).on('error', (err) => {
      log(`❌ 后端服务未响应: ${url}`, 'red')
      log(`   错误: ${err.message}`, 'red')
    })
  })

  // 等待请求完成
  setTimeout(() => {
    log('\n💡 提示: 确保后端配置监听 0.0.0.0:8080（而非 127.0.0.1:8080）', 'blue')
    log('查看配置: cat config/app.yaml | grep host\n', 'blue')
  }, 1000)
}

function printSummary() {
  log('\n=== 真机联调检查清单 ===\n', 'bold')
  log('[ ] 1. 配置了 VITE_API_BASE_MP_DEVICE', 'blue')
  log('[ ] 2. 使用局域网IP（非127.0.0.1）', 'blue')
  log('[ ] 3. 后端监听 0.0.0.0:8080', 'blue')
  log('[ ] 4. 手机和电脑在同一WiFi', 'blue')
  log('[ ] 5. 重新编译小程序', 'blue')
  log('\n详细指南: docs/deployment/device-debug-guide.md\n', 'yellow')
}

// 主函数
function main() {
  log('\n' + '='.repeat(50), 'bold')
  log('Chinese Rose - 环境配置检查工具', 'bold')
  log('='.repeat(50) + '\n', 'bold')

  checkEnvFile()
  getLocalIP()
  checkBackend()
  printSummary()
}

main()
