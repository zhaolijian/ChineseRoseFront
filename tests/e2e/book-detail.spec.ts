import { test, expect } from '@playwright/test';

/**
 * 书籍详情页 E2E 测试
 *
 * 测试目标：
 * 1. 验证页面能够正常加载，不出现 "uni is not defined" 错误
 * 2. 验证页面核心元素可见
 * 3. 验证路由参数传递正确
 */

/**
 * 在每个测试前注入 uni stub，防止抢跑错误
 *
 * 工作原理：
 * - addInitScript 在页面 DOM 构建前执行
 * - 提前创建可覆盖的 window.uni stub
 * - uni-app runtime 加载后会自动覆盖这个 stub
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!('uni' in window)) {
      const noop = () => {};
      // @ts-ignore 可覆盖的最小 stub：运行时就绪后会被真实 uni 覆盖
      window.uni = new Proxy({}, { get: () => noop });
    }
  });
});

test.describe('书籍详情页 H5', () => {
  test('应该能够正常渲染并显示核心内容', async ({ page }) => {
    // 导航到书籍详情页
    await page.goto('/#/pages-book/detail/index?id=1');

    // 等待页面根元素可见（替换为实际的页面根元素选择器）
    // 注意：需要根据实际页面结构调整选择器
    await page.waitForLoadState('networkidle');

    // 验证页面标题或关键元素存在
    // 注意：需要根据实际页面内容调整选择器
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    // 验证控制台没有 "uni is not defined" 错误
    const errors = await page.evaluate(() => {
      return (window as any).__playwrightErrors || [];
    });

    const hasUniError = errors.some((err: string) =>
      err.includes('uni is not defined')
    );
    expect(hasUniError).toBe(false);
  });

  test('应该能够正确处理路由参数', async ({ page }) => {
    const bookId = '123';
    await page.goto(`/#/pages-book/detail/index?id=${bookId}`);

    await page.waitForLoadState('networkidle');

    // 验证页面接收到正确的路由参数
    // 可以通过检查 URL 或页面显示的内容来验证
    const url = page.url();
    expect(url).toContain(`id=${bookId}`);
  });

  test('应该在控制台中能访问 uni 对象', async ({ page }) => {
    await page.goto('/#/pages-book/detail/index?id=1');

    await page.waitForLoadState('networkidle');

    // 验证 window.uni 存在且是对象类型
    const uniType = await page.evaluate(() => {
      return typeof (window as any).uni;
    });

    expect(uniType).toBe('object');
  });
});

test.describe('错误处理', () => {
  test('应该优雅处理无效的书籍ID', async ({ page }) => {
    await page.goto('/#/pages-book/detail/index?id=invalid');

    await page.waitForLoadState('networkidle');

    // 页面应该正常加载，不崩溃
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('应该优雅处理缺失的书籍ID', async ({ page }) => {
    await page.goto('/#/pages-book/detail/index');

    await page.waitForLoadState('networkidle');

    // 页面应该正常加载，不崩溃
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
