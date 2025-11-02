// 这是一个用于生成tabbar图标的脚本
// 在实际项目中，应该使用设计工具创建专业的图标

const fs = require('fs');
const path = require('path');

// 创建简单的SVG图标，然后可以转换为PNG
const icons = {
  bookshelf: {
    normal: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="32" height="4" fill="#7A7E83"/>
      <rect x="8" y="20" width="32" height="4" fill="#7A7E83"/>
      <rect x="8" y="28" width="32" height="4" fill="#7A7E83"/>
      <rect x="10" y="32" width="6" height="8" fill="#7A7E83"/>
      <rect x="18" y="32" width="6" height="8" fill="#7A7E83"/>
      <rect x="26" y="32" width="6" height="8" fill="#7A7E83"/>
      <rect x="34" y="32" width="6" height="8" fill="#7A7E83"/>
    </svg>`,
    active: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="32" height="4" fill="#00a82d"/>
      <rect x="8" y="20" width="32" height="4" fill="#00a82d"/>
      <rect x="8" y="28" width="32" height="4" fill="#00a82d"/>
      <rect x="10" y="32" width="6" height="8" fill="#00a82d"/>
      <rect x="18" y="32" width="6" height="8" fill="#00a82d"/>
      <rect x="26" y="32" width="6" height="8" fill="#00a82d"/>
      <rect x="34" y="32" width="6" height="8" fill="#00a82d"/>
    </svg>`
  },
  note: {
    normal: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#7A7E83"/>
      <rect x="16" y="16" width="16" height="2" fill="white"/>
      <rect x="16" y="20" width="16" height="2" fill="white"/>
      <rect x="16" y="24" width="12" height="2" fill="white"/>
    </svg>`,
    active: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#00a82d"/>
      <rect x="16" y="16" width="16" height="2" fill="white"/>
      <rect x="16" y="20" width="16" height="2" fill="white"/>
      <rect x="16" y="24" width="12" height="2" fill="white"/>
    </svg>`
  },
  mindmap: {
    normal: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="6" fill="#7A7E83"/>
      <circle cx="12" cy="12" r="4" fill="#7A7E83"/>
      <circle cx="36" cy="12" r="4" fill="#7A7E83"/>
      <circle cx="12" cy="36" r="4" fill="#7A7E83"/>
      <circle cx="36" cy="36" r="4" fill="#7A7E83"/>
      <line x1="24" y1="24" x2="12" y2="12" stroke="#7A7E83" stroke-width="2"/>
      <line x1="24" y1="24" x2="36" y2="12" stroke="#7A7E83" stroke-width="2"/>
      <line x1="24" y1="24" x2="12" y2="36" stroke="#7A7E83" stroke-width="2"/>
      <line x1="24" y1="24" x2="36" y2="36" stroke="#7A7E83" stroke-width="2"/>
    </svg>`,
    active: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="6" fill="#00a82d"/>
      <circle cx="12" cy="12" r="4" fill="#00a82d"/>
      <circle cx="36" cy="12" r="4" fill="#00a82d"/>
      <circle cx="12" cy="36" r="4" fill="#00a82d"/>
      <circle cx="36" cy="36" r="4" fill="#00a82d"/>
      <line x1="24" y1="24" x2="12" y2="12" stroke="#00a82d" stroke-width="2"/>
      <line x1="24" y1="24" x2="36" y2="12" stroke="#00a82d" stroke-width="2"/>
      <line x1="24" y1="24" x2="12" y2="36" stroke="#00a82d" stroke-width="2"/>
      <line x1="24" y1="24" x2="36" y2="36" stroke="#00a82d" stroke-width="2"/>
    </svg>`
  },
  profile: {
    normal: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="18" r="8" fill="#7A7E83"/>
      <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="#7A7E83"/>
    </svg>`,
    active: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="18" r="8" fill="#00a82d"/>
      <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="#00a82d"/>
    </svg>`
  }
};

// 将SVG保存为文件（开发环境中可以手动转换为PNG）
Object.keys(icons).forEach(iconName => {
  // 保存正常状态图标SVG
  fs.writeFileSync(
    path.join(__dirname, `${iconName}.svg`),
    icons[iconName].normal
  );
  
  // 保存激活状态图标SVG
  fs.writeFileSync(
    path.join(__dirname, `${iconName}-active.svg`),
    icons[iconName].active
  );
});

console.log('SVG图标文件已生成，请使用工具将其转换为PNG格式');