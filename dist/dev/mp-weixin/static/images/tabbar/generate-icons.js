/**
 * TabBar图标生成脚本
 * 基于调研的最佳实践：81px × 81px PNG格式
 * 
 * 运行方式：
 * 1. 安装依赖: npm install sharp
 * 2. 运行脚本: node generate-icons.js
 * 
 * 注意：这是一个临时解决方案，实际项目中应该：
 * 1. 从 iconfont.cn 获取专业设计的图标
 * 2. 使用设计工具导出为 81px × 81px 的PNG
 * 3. 确保文件大小 < 40KB
 */

const fs = require('fs');
const path = require('path');

// 创建简单的SVG图标
const createSVGIcon = (paths, color = '#7A7E83') => `
<svg width="81" height="81" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
  <g fill="${color}" stroke="none">
    ${paths}
  </g>
</svg>`;

// 图标路径定义（简化版本，实际应使用专业设计）
const iconPaths = {
  bookshelf: `
    <rect x="15" y="25" width="51" height="6" rx="2"/>
    <rect x="15" y="35" width="51" height="6" rx="2"/>
    <rect x="15" y="45" width="51" height="6" rx="2"/>
    <rect x="18" y="51" width="9" height="15" rx="1"/>
    <rect x="30" y="51" width="9" height="15" rx="1"/>
    <rect x="42" y="51" width="9" height="15" rx="1"/>
    <rect x="54" y="51" width="9" height="15" rx="1"/>
  `,
  note: `
    <rect x="20" y="15" width="41" height="51" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="28" y1="30" x2="53" y2="30" stroke="currentColor" stroke-width="2"/>
    <line x1="28" y1="38" x2="53" y2="38" stroke="currentColor" stroke-width="2"/>
    <line x1="28" y1="46" x2="48" y2="46" stroke="currentColor" stroke-width="2"/>
    <line x1="28" y1="54" x2="45" y2="54" stroke="currentColor" stroke-width="2"/>
  `,
  mindmap: `
    <circle cx="40.5" cy="40.5" r="8"/>
    <circle cx="25" cy="25" r="5"/>
    <circle cx="56" cy="25" r="5"/>
    <circle cx="25" cy="56" r="5"/>
    <circle cx="56" cy="56" r="5"/>
    <line x1="40.5" y1="40.5" x2="25" y2="25" stroke="currentColor" stroke-width="2"/>
    <line x1="40.5" y1="40.5" x2="56" y2="25" stroke="currentColor" stroke-width="2"/>
    <line x1="40.5" y1="40.5" x2="25" y2="56" stroke="currentColor" stroke-width="2"/>
    <line x1="40.5" y1="40.5" x2="56" y2="56" stroke="currentColor" stroke-width="2"/>
  `,
  profile: `
    <circle cx="40.5" cy="30" r="12"/>
    <path d="M20 66c0-11.046 9.954-20 20.5-20s20.5 8.954 20.5 20" stroke="currentColor" stroke-width="3" fill="none"/>
  `
};

// 生成SVG文件
Object.entries(iconPaths).forEach(([name, paths]) => {
  // 正常状态
  const normalSVG = createSVGIcon(paths, '#7A7E83');
  fs.writeFileSync(path.join(__dirname, `${name}.svg`), normalSVG);
  
  // 选中状态
  const activeSVG = createSVGIcon(paths, '#4A90E2');
  fs.writeFileSync(path.join(__dirname, `${name}-active.svg`), activeSVG);
});

console.log('SVG图标已生成！');
console.log('');
console.log('下一步：');
console.log('1. 安装 sharp: npm install sharp');
console.log('2. 将SVG转换为81px × 81px的PNG格式');
console.log('3. 或使用在线工具: https://convertio.co/zh/svg-png/');
console.log('');
console.log('注意：实际项目中应该使用专业设计的图标');

// 如果有sharp库，自动转换为PNG
try {
  const sharp = require('sharp');
  
  Object.keys(iconPaths).forEach(async (name) => {
    try {
      // 转换正常状态
      await sharp(path.join(__dirname, `${name}.svg`))
        .resize(81, 81)
        .png()
        .toFile(path.join(__dirname, `${name}.png`));
      
      // 转换选中状态
      await sharp(path.join(__dirname, `${name}-active.svg`))
        .resize(81, 81)
        .png()
        .toFile(path.join(__dirname, `${name}-active.png`));
      
      console.log(`✅ ${name} 图标PNG已生成`);
    } catch (error) {
      console.log(`❌ ${name} 转换失败:`, error.message);
    }
  });
} catch (error) {
  console.log('💡 要自动生成PNG，请安装 sharp: npm install sharp');
}