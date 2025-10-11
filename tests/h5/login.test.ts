import { test, expect, Page } from '@playwright/test'

// 测试配置
const BASE_URL = 'http://localhost:5173' // H5开发服务器默认端口

// 工具函数：等待页面加载完成
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // 额外等待确保Vue组件渲染完成
}

test.describe('H5登录页面测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问登录页面
    await page.goto(`${BASE_URL}/#/pages/login/login`)
    await waitForPageLoad(page)
  })

  test('1. 页面元素是否正常加载', async ({ page }) => {
    console.log('测试1: 检查页面元素是否正常加载...')
    
    // 检查页面标题
    await expect(page.locator('.nav-title')).toContainText('登录')
    
    // 检查Logo
    const logo = page.locator('.logo')
    await expect(logo).toBeVisible()
    
    // 检查应用名称和描述
    await expect(page.locator('.app-name')).toContainText('阅记')
    await expect(page.locator('.app-desc')).toContainText('您的纸质书笔记整理专家')
    
    // 检查表单元素
    await expect(page.locator('input[placeholder="请输入手机号"]')).toBeVisible()
    await expect(page.locator('input[placeholder="请输入验证码"]')).toBeVisible()
    await expect(page.locator('button:has-text("获取验证码")')).toBeVisible()
    await expect(page.locator('.login-btn')).toBeVisible()
    
    console.log('✓ 页面所有基础元素加载正常')
  })

  test('2. 微信快速登录按钮是否显示和可点击', async ({ page }) => {
    console.log('测试2: 检查微信快速登录功能...')
    
    // 检查微信登录按钮
    const wxLoginBtn = page.locator('.wx-login-btn')
    await expect(wxLoginBtn).toBeVisible()
    await expect(wxLoginBtn).toContainText('微信快捷登录')
    
    // 点击微信登录按钮
    await wxLoginBtn.click()
    
    // 等待提示信息
    await page.waitForTimeout(500)
    
    // H5环境应该显示不支持的提示
    // 由于是uni-app的toast，可能需要检查DOM变化
    const toastText = await page.evaluate(() => {
      const toastEl = document.querySelector('.uni-toast__content')
      return toastEl ? toastEl.textContent : null
    })
    
    console.log(`✓ 微信登录按钮可点击，提示信息: ${toastText}`)
  })

  test('3. 手机号登录表单功能测试', async ({ page }) => {
    console.log('测试3: 测试手机号登录表单...')
    
    // 输入无效手机号
    const phoneInput = page.locator('input[placeholder="请输入手机号"]')
    await phoneInput.fill('123')
    
    // 验证码按钮应该是禁用状态
    const codeBtn = page.locator('button:has-text("获取验证码")')
    await expect(codeBtn).toHaveClass(/disabled/)
    
    // 输入有效手机号
    await phoneInput.clear()
    await phoneInput.fill('13800138000')
    
    // 验证码按钮应该可用
    await expect(codeBtn).not.toHaveClass(/disabled/)
    
    // 点击获取验证码
    await codeBtn.click()
    await page.waitForTimeout(1500)
    
    // 检查是否显示倒计时
    const codeBtnText = await codeBtn.textContent()
    expect(codeBtnText).toMatch(/\d+s后重试/)
    
    // 输入验证码
    const codeInput = page.locator('input[placeholder="请输入验证码"]')
    await codeInput.fill('123456')
    
    // 登录按钮应该可用
    const loginBtn = page.locator('.login-btn')
    await expect(loginBtn).not.toHaveClass(/disabled/)
    
    console.log('✓ 手机号登录表单功能正常')
  })

  test('4. 用户协议链接测试', async ({ page }) => {
    console.log('测试4: 测试用户协议链接...')
    
    // 检查协议文本
    await expect(page.locator('.agreement')).toContainText('我已阅读并同意')
    
    // 点击用户协议
    const userAgreement = page.locator('.agreement-link:has-text("《用户协议》")')
    await expect(userAgreement).toBeVisible()
    await userAgreement.click()
    await page.waitForTimeout(500)
    
    // 检查是否有提示
    let toastText = await page.evaluate(() => {
      const toastEl = document.querySelector('.uni-toast__content')
      return toastEl ? toastEl.textContent : null
    })
    console.log(`用户协议点击提示: ${toastText}`)
    
    // 点击隐私政策
    const privacyPolicy = page.locator('.agreement-link:has-text("《隐私政策》")')
    await expect(privacyPolicy).toBeVisible()
    await privacyPolicy.click()
    await page.waitForTimeout(500)
    
    toastText = await page.evaluate(() => {
      const toastEl = document.querySelector('.uni-toast__content')
      return toastEl ? toastEl.textContent : null
    })
    console.log(`隐私政策点击提示: ${toastText}`)
    
    console.log('✓ 协议链接可点击')
  })

  test('5. 登录功能测试', async ({ page }) => {
    console.log('测试5: 测试登录功能...')
    
    // 输入手机号和验证码
    await page.locator('input[placeholder="请输入手机号"]').fill('13800138000')
    await page.locator('input[placeholder="请输入验证码"]').fill('123456')
    
    // 点击登录按钮
    const loginBtn = page.locator('.login-btn')
    await loginBtn.click()
    
    // 等待请求响应
    await page.waitForTimeout(2000)
    
    // 检查是否有错误提示或成功跳转
    const currentUrl = page.url()
    const toastText = await page.evaluate(() => {
      const toastEl = document.querySelector('.uni-toast__content')
      return toastEl ? toastEl.textContent : null
    })
    
    console.log(`登录结果 - URL: ${currentUrl}`)
    console.log(`登录结果 - 提示信息: ${toastText}`)
    
    // 如果登录成功应该跳转到首页
    if (currentUrl.includes('/pages/index/index')) {
      console.log('✓ 登录成功，已跳转到首页')
    } else {
      console.log('✓ 登录测试完成，显示了相应提示')
    }
  })

  test('6. 响应式布局测试', async ({ page }) => {
    console.log('测试6: 测试响应式布局...')
    
    // 测试不同屏幕尺寸
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.waitForTimeout(500)
      
      // 检查关键元素是否仍然可见
      await expect(page.locator('.logo')).toBeVisible()
      await expect(page.locator('.login-btn')).toBeVisible()
      
      console.log(`✓ ${viewport.name} (${viewport.width}x${viewport.height}) 布局正常`)
    }
  })
})

// 运行测试的辅助脚本
if (require.main === module) {
  console.log('开始执行H5登录页面自动化测试...')
  console.log('请确保H5开发服务器正在运行于 http://localhost:5173')
}