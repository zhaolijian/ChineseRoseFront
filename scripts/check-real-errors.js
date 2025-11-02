const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // 非无头模式
  const context = await browser.newContext({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 3
  });
  const page = await context.newPage();

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      errors.push(text);
      console.log(`❌ [ERROR] ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`⚠️  [WARN] ${text}`);
    } else if (type === 'log' || type === 'info') {
      console.log(`ℹ️  [${type.toUpperCase()}] ${text}`);
    }
  });

  page.on('pageerror', error => {
    const msg = `Page Error: ${error.message}\n${error.stack}`;
    errors.push(msg);
    console.log(`💥 ${msg}`);
  });

  console.log('打开首页: http://127.0.0.1:3000/#/pages/index/index\n');
  await page.goto('http://127.0.0.1:3000/#/pages/index/index');

  console.log('\n等待 15 秒观察...\n');
  await page.waitForTimeout(15000);

  console.log('\n========== 错误汇总 ==========');
  console.log(`总错误数: ${errors.length}`);
  console.log(`总警告数: ${warnings.length}`);

  console.log('\n按任意键关闭浏览器...');
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  await browser.close();
})();
