const { chromium } = require('@playwright/test');

async function quickTest() {
  console.log('开始测试H5登录页面...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    timeout: 10000 
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  
  const page = await context.newPage();
  
  console.log('1. 尝试访问页面...');
  try {
    await page.goto('http://localhost:3000/#/pages/login/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log('✓ 页面访问成功');
  } catch (error) {
    console.log('✗ 页面访问失败:', error.message);
    await browser.close();
    return;
  }
  
  // 等待关键元素加载
  console.log('\n2. 检查页面元素...');
  
  // 检查导航标题
  try {
    await page.waitForSelector('.nav-title', { timeout: 5000 });
    const title = await page.textContent('.nav-title');
    console.log(`✓ 导航标题: "${title}"`);
  } catch (e) {
    console.log('✗ 导航标题未找到');
  }
  
  // 检查Logo
  try {
    await page.waitForSelector('.logo', { timeout: 5000 });
    console.log('✓ Logo图片存在');
  } catch (e) {
    console.log('✗ Logo未找到');
  }
  
  // 检查应用名称
  try {
    const appName = await page.textContent('.app-name');
    console.log(`✓ 应用名称: "${appName}"`);
  } catch (e) {
    console.log('✗ 应用名称未找到');
  }
  
  // 检查手机号输入框
  try {
    await page.waitForSelector('input[placeholder="请输入手机号"]', { timeout: 5000 });
    console.log('✓ 手机号输入框存在');
  } catch (e) {
    console.log('✗ 手机号输入框未找到');
  }
  
  // 检查微信登录按钮
  try {
    await page.waitForSelector('.wx-login-btn', { timeout: 5000 });
    const wxText = await page.textContent('.wx-login-btn');
    console.log(`✓ 微信登录按钮: "${wxText.trim()}"`);
  } catch (e) {
    console.log('✗ 微信登录按钮未找到');
  }
  
  // 截图
  console.log('\n3. 保存页面截图...');
  await page.screenshot({ path: 'login-page-screenshot.png' });
  console.log('✓ 截图已保存为 login-page-screenshot.png');
  
  await browser.close();
  console.log('\n测试完成！');
}

quickTest().catch(console.error);