const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 3
  });
  const page = await context.newPage();

  const apiRequests = [];
  const responses = [];

  // 监听所有请求
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiRequests.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers()
      });
    }
  });

  // 监听所有响应
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const data = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      };

      try {
        const text = await response.text();
        data.body = text.length > 500 ? text.substring(0, 500) + '...' : text;
      } catch (e) {
        data.body = '[无法读取响应体]';
      }

      responses.push(data);
    }
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

  console.log('等待 10 秒收集请求...');
  await page.waitForTimeout(10000);

  console.log('\n========== API 请求报告 ==========\n');

  console.log(`📤 发出的 API 请求 (${apiRequests.length} 个):`);
  apiRequests.forEach((req, i) => {
    console.log(`\n${i + 1}. ${req.method} ${req.url}`);
    console.log(`   Authorization: ${req.headers.authorization || '无'}`);
  });

  console.log(`\n\n📥 收到的 API 响应 (${responses.length} 个):`);
  responses.forEach((res, i) => {
    console.log(`\n${i + 1}. ${res.url}`);
    console.log(`   状态: ${res.status} ${res.statusText}`);
    console.log(`   响应体: ${res.body}`);
  });

  await browser.close();
})();
