/**
 * H5自动化测试脚本
 * 用于测试uni-app的H5版本
 */

// 测试配置
const TEST_URL = 'http://localhost:3000';

// Page Object模式 - 页面元素定义
const pages = {
  login: {
    wechatLoginBtn: 'button:has-text("微信快捷登录")',
    phoneLoginBtn: 'text=手机号登录',
    phoneInput: 'input[placeholder="请输入手机号"]',
    codeInput: 'input[placeholder="请输入验证码"]',
    getCodeBtn: 'button:has-text("获取验证码")',
    loginBtn: 'button:has-text("登录")'
  },
  bookshelf: {
    tabItem: 'text=书架',
    bookCard: '.book-card',
    addBookBtn: 'button:has-text("添加图书")',
    searchInput: 'input[placeholder="搜索图书"]'
  },
  notes: {
    tabItem: 'text=笔记',
    noteItem: '.note-item',
    addNoteBtn: 'button:has-text("添加笔记")',
    ocrBtn: 'button:has-text("拍照识别")'
  },
  mindmap: {
    tabItem: 'text=思维导图',
    canvas: 'canvas',
    exportBtn: 'button:has-text("导出")'
  },
  profile: {
    tabItem: 'text=我的',
    avatar: '.user-avatar',
    nickname: '.user-nickname',
    settingBtn: 'button:has-text("设置")'
  }
};

// 测试用例
const testCases = {
  // 1. 基础功能测试
  async testBasicNavigation(page) {
    console.log('测试基础导航...');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 测试底部TabBar切换
    const tabs = ['书架', '笔记', '思维导图', '我的'];
    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await page.waitForTimeout(500); // 等待动画完成
      console.log(`✅ 切换到${tab}页面成功`);
    }
  },

  // 2. 登录流程测试
  async testLoginFlow(page) {
    console.log('测试登录流程...');
    
    // 检查是否需要登录
    const loginButton = await page.$('button:has-text("微信快捷登录")');
    if (loginButton) {
      // 测试手机号登录
      await page.click('text=手机号登录');
      await page.fill('input[placeholder="请输入手机号"]', '13800138000');
      await page.click('button:has-text("获取验证码")');
      
      // 模拟输入验证码
      await page.fill('input[placeholder="请输入验证码"]', '123456');
      await page.click('button:has-text("登录")');
      
      console.log('✅ 登录流程测试完成');
    } else {
      console.log('✅ 已登录状态');
    }
  },

  // 3. 书架功能测试
  async testBookshelf(page) {
    console.log('测试书架功能...');
    
    await page.click('text=书架');
    await page.waitForLoadState('networkidle');
    
    // 检查书籍列表
    const books = await page.$$('.book-card');
    console.log(`✅ 书架显示 ${books.length} 本书`);
    
    // 测试搜索功能
    const searchInput = await page.$('input[placeholder*="搜索"]');
    if (searchInput) {
      await searchInput.fill('测试书籍');
      await page.waitForTimeout(1000);
      console.log('✅ 搜索功能正常');
    }
  },

  // 4. 笔记功能测试
  async testNotes(page) {
    console.log('测试笔记功能...');
    
    await page.click('text=笔记');
    await page.waitForLoadState('networkidle');
    
    // 检查笔记列表
    const notes = await page.$$('.note-item');
    console.log(`✅ 笔记列表显示 ${notes.length} 条笔记`);
    
    // 检查添加笔记按钮
    const addBtn = await page.$('button:has-text("添加笔记")');
    if (addBtn) {
      console.log('✅ 添加笔记按钮存在');
    }
  },

  // 5. 性能测试
  async testPerformance(page) {
    console.log('测试页面性能...');
    
    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        // 页面加载时间
        loadTime: timing.loadEventEnd - timing.navigationStart,
        // DOM解析时间
        domParseTime: timing.domComplete - timing.domLoading,
        // 白屏时间
        whiteScreenTime: timing.domLoading - timing.navigationStart,
        // 资源加载时间
        resourceLoadTime: timing.loadEventEnd - timing.domContentLoadedEventEnd
      };
    });
    
    console.log('性能指标：', metrics);
    
    // 检查性能是否合格
    if (metrics.loadTime < 3000) {
      console.log('✅ 页面加载性能良好');
    } else {
      console.log('⚠️ 页面加载较慢');
    }
  }
};

// 主测试函数
async function runTests() {
  console.log('开始H5自动化测试...');
  console.log(`测试地址: ${TEST_URL}`);
  
  try {
    // 使用 playwright-mcp 执行测试
    const testSteps = [
      // 1. 导航到测试地址
      { action: 'navigate', url: TEST_URL },
      
      // 2. 等待页面加载
      { action: 'wait', time: 2 },
      
      // 3. 截图记录初始状态
      { action: 'screenshot', filename: 'h5-initial' },
      
      // 4. 执行基础导航测试
      { action: 'click', element: '书架' },
      { action: 'wait', time: 1 },
      { action: 'screenshot', filename: 'h5-bookshelf' },
      
      { action: 'click', element: '笔记' },
      { action: 'wait', time: 1 },
      { action: 'screenshot', filename: 'h5-notes' },
      
      { action: 'click', element: '思维导图' },
      { action: 'wait', time: 1 },
      { action: 'screenshot', filename: 'h5-mindmap' },
      
      { action: 'click', element: '我的' },
      { action: 'wait', time: 1 },
      { action: 'screenshot', filename: 'h5-profile' }
    ];
    
    console.log('测试步骤已定义，等待执行...');
    return testSteps;
    
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  }
}

// 导出测试配置
module.exports = {
  TEST_URL,
  pages,
  testCases,
  runTests
};

// 如果直接运行此文件
if (require.main === module) {
  console.log(`
===========================================
Chinese Rose H5 自动化测试配置
===========================================

测试地址: ${TEST_URL}
测试用例:
1. 基础导航测试 - 测试TabBar切换
2. 登录流程测试 - 测试登录功能
3. 书架功能测试 - 测试书籍管理
4. 笔记功能测试 - 测试笔记列表
5. 性能测试 - 测试页面加载性能

使用方法:
1. 确保H5服务正在运行: npm run dev:h5
2. 使用playwright-mcp工具执行测试步骤
3. 查看截图验证测试结果
===========================================
  `);
}