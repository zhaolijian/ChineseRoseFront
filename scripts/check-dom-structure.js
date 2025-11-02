const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 3
  });
  const page = await context.newPage();

  // 注入 uni stub
  await page.addInitScript(() => {
    if (!('uni' in window)) {
      const noop = () => {};
      window.uni = new Proxy({}, { get: () => noop });
    }
  });

  console.log('正在打开书籍详情页...');
  await page.goto('http://127.0.0.1:3000/#/pages-book/detail/index?id=1');

  await page.waitForTimeout(5000);

  console.log('\n========== DOM 结构分析 ==========\n');

  // 检查 app 根节点
  const appEl = await page.$('#app');
  console.log(`#app 元素存在: ${!!appEl}`);

  // 获取 body 的 HTML
  const bodyHTML = await page.evaluate(() => {
    const app = document.querySelector('#app');
    return app ? app.innerHTML.substring(0, 1000) : document.body.innerHTML.substring(0, 1000);
  });

  console.log('\nDOM 内容 (前 1000 字符):');
  console.log(bodyHTML);

  // 检查是否有 vue 组件
  const hasVueApp = await page.evaluate(() => {
    return !!document.querySelector('[data-v-app]') || !!document.querySelector('.book-detail-page');
  });

  console.log(`\nVue 应用已挂载: ${hasVueApp}`);

  // 检查路由信息
  const routeInfo = await page.evaluate(() => {
    return {
      hash: window.location.hash,
      href: window.location.href
    };
  });

  console.log('\n路由信息:');
  console.log(`  Hash: ${routeInfo.hash}`);
  console.log(`  Href: ${routeInfo.href}`);

  await browser.close();
})();
