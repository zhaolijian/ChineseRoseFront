#!/usr/bin/env node

/**
 * 微信小程序环境验证脚本
 * 用于检查开发环境是否正确配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 定义颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// 输出函数
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n${'='.repeat(50)}`)
};

// 检查结果统计
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// 检查函数
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log.success(`${description}: 已找到`);
    results.passed++;
    return true;
  } else {
    log.error(`${description}: 未找到 - ${filePath}`);
    results.failed++;
    return false;
  }
}

function checkJsonConfig(filePath, key, expectedValue, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);
    
    // 支持嵌套键
    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
      value = value[k];
    }
    
    if (value === expectedValue) {
      log.success(`${description}: ${value}`);
      results.passed++;
      return true;
    } else {
      log.warning(`${description}: ${value} (期望: ${expectedValue})`);
      results.warnings++;
      return false;
    }
  } catch (error) {
    log.error(`读取配置失败: ${filePath}`);
    results.failed++;
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'ignore' });
    log.success(`${description}: 已安装`);
    results.passed++;
    return true;
  } catch (error) {
    log.error(`${description}: 未安装或不可用`);
    results.failed++;
    return false;
  }
}

function checkNodeModules() {
  const nodeModulesPath = path.join(__dirname, '../node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    log.success('依赖包已安装');
    results.passed++;
    return true;
  } else {
    log.error('依赖包未安装，请运行: npm install');
    results.failed++;
    return false;
  }
}

function checkApiConnection() {
  const requestPath = path.join(__dirname, '../src/utils/request.ts');
  if (fs.existsSync(requestPath)) {
    const content = fs.readFileSync(requestPath, 'utf8');
    const match = content.match(/this\.baseURL = ['"]([^'"]+)['"]\s*\/\/ 开发期/);
    if (match) {
      log.info(`API地址配置: ${match[1]}`);
      log.warning('请确保后端服务运行在此地址');
      results.warnings++;
    }
  }
}

function checkDistDirectory() {
  const distPath = path.join(__dirname, '../dist/dev/mp-weixin');
  if (fs.existsSync(distPath)) {
    log.success('小程序构建目录存在');
    log.info(`导入路径: ${distPath}`);
    results.passed++;
    return true;
  } else {
    log.warning('小程序未构建，请运行: npm run dev:mp-weixin');
    results.warnings++;
    return false;
  }
}

// 主函数
async function main() {
  console.log(colors.bright + '\n🔍 微信小程序环境验证工具\n' + colors.reset);

  // 1. 检查项目结构
  log.section('1. 项目结构检查');
  checkFileExists(path.join(__dirname, '../src/manifest.json'), 'manifest.json');
  checkFileExists(path.join(__dirname, '../src/pages.json'), 'pages.json');
  checkFileExists(path.join(__dirname, '../src/App.vue'), 'App.vue');
  checkFileExists(path.join(__dirname, '../src/main.ts'), 'main.ts');

  // 2. 检查配置
  log.section('2. 小程序配置检查');
  checkJsonConfig(
    path.join(__dirname, '../src/manifest.json'),
    'mp-weixin.appid',
    'wx630471360fc88823',
    '小程序AppID'
  );

  // 3. 检查开发环境
  log.section('3. 开发环境检查');
  checkCommand('node --version', 'Node.js');
  checkCommand('npm --version', 'npm');
  checkNodeModules();

  // 4. 检查API配置
  log.section('4. API连接配置');
  checkApiConnection();

  // 5. 检查构建状态
  log.section('5. 构建状态检查');
  checkDistDirectory();

  // 6. 检查必要的图片资源
  log.section('6. 资源文件检查');
  checkFileExists(path.join(__dirname, '../src/static/images/logo.png'), 'Logo图片');
  checkFileExists(path.join(__dirname, '../src/static/images/tabbar/bookshelf.png'), 'TabBar图标');

  // 7. 输出总结
  log.section('验证结果总结');
  console.log(`${colors.green}通过: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}警告: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}失败: ${results.failed}${colors.reset}`);

  if (results.failed === 0) {
    console.log(`\n${colors.green}✅ 环境检查通过！${colors.reset}`);
    console.log('\n下一步操作：');
    console.log('1. 确保后端服务正在运行');
    console.log('2. 运行 npm run dev:mp-weixin 构建小程序');
    console.log('3. 在微信开发者工具中导入 dist/dev/mp-weixin 目录');
  } else {
    console.log(`\n${colors.red}❌ 环境检查未通过，请修复上述问题${colors.reset}`);
  }

  // 额外提示
  console.log('\n💡 提示：');
  console.log('- 开发环境请在微信开发者工具中勾选"不校验合法域名"');
  console.log('- 使用固定验证码 123456 进行测试');
  console.log('- 真机调试时需要使用局域网IP替代127.0.0.1');
}

// 执行主函数
main().catch(error => {
  console.error('验证脚本执行失败:', error);
  process.exit(1);
});