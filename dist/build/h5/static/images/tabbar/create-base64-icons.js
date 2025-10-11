/**
 * 创建base64编码的PNG图标
 * 这是一个临时解决方案，用于快速生成可用的tabbar图标
 */

const fs = require('fs');
const path = require('path');

// 使用1x1像素的透明PNG作为占位图标
const transparentPNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9C, 0x63, 0x60, 0x00, 0x02, 0x00,
  0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
  0xAE, 0x42, 0x60, 0x82
]);

// 图标列表
const icons = ['bookshelf', 'note', 'mindmap', 'profile'];

// 创建占位PNG文件
icons.forEach(iconName => {
  // 正常状态图标
  fs.writeFileSync(path.join(__dirname, `${iconName}.png`), transparentPNG);
  
  // 选中状态图标
  fs.writeFileSync(path.join(__dirname, `${iconName}-active.png`), transparentPNG);
  
  console.log(`✅ 创建了 ${iconName} 图标文件`);
});

console.log('');
console.log('📝 临时图标文件已创建完成！');
console.log('');
console.log('⚠️  注意：这些是透明的占位图标，项目可以运行但图标不可见');
console.log('');
console.log('🎨 接下来的步骤：');
console.log('1. 从 iconfont.cn 下载专业图标');
console.log('2. 使用设计工具制作 81×81px 的PNG图标');
console.log('3. 替换当前的占位图标文件');
console.log('');
console.log('📋 或者切换到 iconfont 字体方案（推荐）：');
console.log('1. 下载字体文件到 static/fonts/iconfont.ttf');
console.log('2. 修改 pages.json 使用 iconfont 配置');