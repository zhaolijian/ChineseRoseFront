const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 3
  });
  const page = await context.newPage();

  const consoleMessages = [];
  const errors = [];
  const requests = [];

  // 监听控制台消息
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  // 监听页面错误
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  // 监听请求失败
  page.on('requestfailed', request => {
    requests.push({
      url: request.url(),
      failure: request.failure().errorText
    });
  });

  // 注入 uni stub
  await page.addInitScript(() => {
    if (!('uni' in window)) {
      const noop = () => {};
      window.uni = new Proxy({}, { get: () => noop });
    }
  });

  console.log('正在打开书籍详情页...');
  await page.goto('http://127.0.0.1:3000/#/pages-book/detail/index?id=1');

  console.log('等待页面加载...');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    console.log('⚠️  networkidle 超时');
  });

  await page.waitForTimeout(3000);

  // 检查页面内容
  const bodyText = await page.textContent('body');
  const hasContent = bodyText && bodyText.trim().length > 100;

  console.log('\n========== 诊断报告 ==========\n');

  console.log(`页面是否有内容: ${hasContent ? '✓' : '✗'}`);
  console.log(`Body 文本长度: ${bodyText ? bodyText.trim().length : 0}\n`);

  if (errors.length > 0) {
    console.log('🔴 控制台错误:');
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    console.log('');
  } else {
    console.log('✓ 没有控制台错误\n');
  }

  if (requests.length > 0) {
    console.log('🔴 请求失败:');
    requests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.url}`);
      console.log(`     错误: ${req.failure}`);
    });
    console.log('');
  } else {
    console.log('✓ 所有请求成功\n');
  }

  // 显示最近的控制台消息
  console.log('📝 最近的控制台消息 (最多10条):');
  consoleMessages.slice(-10).forEach((msg, i) => {
    console.log(`  [${msg.type}] ${msg.text}`);
  });

  await browser.close();
})();
