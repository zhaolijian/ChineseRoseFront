const puppeteer = require('puppeteer');

async function runTests() {
  console.log('==========================================');
  console.log('H5登录页面自动化测试');
  console.log('==========================================\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667 }); // iPhone SE size
  
  const results = [];
  
  try {
    // 测试1: 页面加载
    console.log('测试1: 检查页面是否能正常加载...');
    await page.goto('http://localhost:5173/#/pages/login/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    
    // 检查页面标题
    const title = await page.$eval('.nav-title', el => el.textContent).catch(() => null);
    results.push({
      test: '页面标题显示',
      result: title === '登录',
      message: title ? `标题显示为: ${title}` : '未找到标题元素'
    });
    
    // 检查Logo
    const logo = await page.$('.logo');
    results.push({
      test: 'Logo显示',
      result: !!logo,
      message: logo ? 'Logo元素存在' : 'Logo元素未找到'
    });
    
    // 检查应用名称
    const appName = await page.$eval('.app-name', el => el.textContent).catch(() => null);
    results.push({
      test: '应用名称显示',
      result: appName === '阅记',
      message: appName ? `应用名称: ${appName}` : '未找到应用名称'
    });
    
    // 测试2: 微信登录按钮
    console.log('\n测试2: 检查微信快速登录按钮...');
    const wxButton = await page.$('.wx-login-btn');
    const wxButtonText = wxButton ? await page.$eval('.wx-login-btn', el => el.textContent) : null;
    results.push({
      test: '微信登录按钮',
      result: !!wxButton && wxButtonText.includes('微信'),
      message: wxButtonText ? `按钮文本: ${wxButtonText}` : '未找到微信登录按钮'
    });
    
    // 点击微信登录按钮
    if (wxButton) {
      await wxButton.click();
      await page.waitForTimeout(1000);
      
      // 检查toast提示
      const toastContent = await page.evaluate(() => {
        const toast = document.querySelector('.uni-toast__content');
        return toast ? toast.textContent : null;
      });
      results.push({
        test: '微信登录点击响应',
        result: !!toastContent,
        message: toastContent ? `提示信息: ${toastContent}` : '无提示信息'
      });
    }
    
    // 测试3: 手机号输入框
    console.log('\n测试3: 检查手机号登录功能...');
    const phoneInput = await page.$('input[placeholder="请输入手机号"]');
    const codeInput = await page.$('input[placeholder="请输入验证码"]');
    
    results.push({
      test: '手机号输入框',
      result: !!phoneInput,
      message: phoneInput ? '手机号输入框存在' : '未找到手机号输入框'
    });
    
    results.push({
      test: '验证码输入框',
      result: !!codeInput,
      message: codeInput ? '验证码输入框存在' : '未找到验证码输入框'
    });
    
    // 输入手机号
    if (phoneInput) {
      await phoneInput.type('13800138000');
      const codeButton = await page.$('button:has-text("获取验证码")');
      results.push({
        test: '获取验证码按钮',
        result: !!codeButton,
        message: codeButton ? '获取验证码按钮存在' : '未找到获取验证码按钮'
      });
    }
    
    // 测试4: 用户协议
    console.log('\n测试4: 检查用户协议...');
    const agreementText = await page.$eval('.agreement', el => el.textContent).catch(() => null);
    results.push({
      test: '用户协议文本',
      result: !!agreementText && agreementText.includes('用户协议'),
      message: agreementText ? '协议文本显示正常' : '未找到协议文本'
    });
    
  } catch (error) {
    console.error('测试过程中出错:', error.message);
  } finally {
    await browser.close();
  }
  
  // 输出测试结果
  console.log('\n\n==========================================');
  console.log('测试结果总结');
  console.log('==========================================');
  
  let passed = 0;
  let failed = 0;
  
  results.forEach((result, index) => {
    const status = result.result ? '✓ 通过' : '✗ 失败';
    console.log(`${index + 1}. ${result.test}: ${status}`);
    console.log(`   ${result.message}`);
    
    if (result.result) passed++;
    else failed++;
  });
  
  console.log('\n------------------------------------------');
  console.log(`总计: ${results.length} 项测试`);
  console.log(`通过: ${passed} 项`);
  console.log(`失败: ${failed} 项`);
  console.log(`通过率: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('==========================================\n');
}

// 运行测试
runTests().catch(console.error);