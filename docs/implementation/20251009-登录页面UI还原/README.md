# Figma设计还原实现文档导航

**目录**: 所有与Figma设计还原相关的文档和资源

---

## 📂 文件结构

```
chinese-rose-front/
├── src/
│   └── styles/
│       └── design-tokens/
│           ├── login.scss                          ✅ 设计令牌（颜色、字体、间距）
│           └── figma-layout-classes.scss          ✅ 布局类映射
│
└── docs/
    └── implementation/
        ├── README.md                              📖 本文档（导航）
        ├── FIGMA_IMPLEMENTATION_SUMMARY.md        📋 总结报告
        ├── figma-to-uniapp-guide.md              📘 完整实现指南（7章节）
        ├── login-pages-implementation-checklist.md 📝 任务清单（65+项）
        └── figma-quick-reference.md              🚀 快速参考卡片（可打印）
```

---

## 🎯 快速导航

### 👨‍💻 我是uni-app开发者，从哪里开始？

**推荐阅读顺序**:

1. **第1步**: 阅读 [快速参考卡片](./figma-quick-reference.md)（5分钟）
   - 了解核心颜色、字体、间距
   - 掌握转换公式
   - 记住关键布局类

2. **第2步**: 阅读 [实现指南](./figma-to-uniapp-guide.md) 第1-2节（10分钟）
   - 理解设计令牌系统
   - 掌握React → Vue3转换规则

3. **第3步**: 打开 [任务清单](./login-pages-implementation-checklist.md)（边开发边勾选）
   - LoginPage: 5个阶段，25+检查项
   - PhoneLoginPage: 8个阶段，40+检查项

4. **开发时**: 随时查阅 [快速参考卡片](./figma-quick-reference.md)
   - 查颜色值
   - 查转换公式
   - 查常见错误

5. **完成后**: 运行 [验证清单](./login-pages-implementation-checklist.md#验证清单)
   - 65+验证项
   - 确保100%还原Figma

---

### 🎨 我是UI设计师，想了解实现细节？

**推荐阅读**:

1. [总结报告](./FIGMA_IMPLEMENTATION_SUMMARY.md) - 了解整体设计决策
2. [实现指南](./figma-to-uniapp-guide.md) 第3-4节 - 查看完整的Vue3代码
3. [设计令牌文件](../../src/styles/design-tokens/login.scss) - 查看提取的令牌

---

### 🏗️ 我是架构师，关注技术方案？

**推荐阅读**:

1. [总结报告](./FIGMA_IMPLEMENTATION_SUMMARY.md) - 关键设计决策
2. [实现指南](./figma-to-uniapp-guide.md) 第2节 - 转换规则
3. [实现指南](./figma-to-uniapp-guide.md) 第6节 - 常见问题FAQ

---

## 📚 文档详细说明

### 1. 总结报告（FIGMA_IMPLEMENTATION_SUMMARY.md）

**用途**: 快速了解整个实现方案的全貌

**内容**:
- 交付成果清单（设计令牌、实现指南、验证清单）
- 关键设计决策（转换公式、兼容性、Grid布局、输入框样式）
- 设计令牌统计（颜色、字体、间距、尺寸）
- 验证清单摘要（65+验证项）
- 下一步行动（交接、开发、验收）
- 重要提醒（禁止事项、强调事项）

**适合人群**: 所有角色（快速了解项目现状）

---

### 2. 完整实现指南（figma-to-uniapp-guide.md）

**用途**: 详细的实现步骤和完整代码

**章节结构**:
1. **设计令牌系统**（文件位置、核心令牌、转换公式）
2. **React TSX → Vue3转换规则**（组件、状态、副作用、样式）
3. **LoginPage实现方案**（完整Vue3 SFC代码）
4. **PhoneLoginPage实现方案**（完整Vue3 SFC代码）
5. **验证清单**（设计令牌、布局、功能、样式细节）
6. **常见问题FAQ**（4个高频问题）
7. **后续优化建议**（性能、无障碍、用户体验）

**特色**:
- ✅ 每个样式都标注Figma来源（如`// 来源：globals.css:12`）
- ✅ 完整的Vue3 SFC代码（template + script + style）
- ✅ 详细的转换规则（useState → ref、useEffect → watch）
- ✅ 清晰的验证标准（40+验证项）

**适合人群**: 开发者（详细阅读并实现）

---

### 3. 任务清单（login-pages-implementation-checklist.md）

**用途**: 清单式任务分解，边开发边勾选

**内容**:
- **文件清单**（必读文件、待创建页面）
- **LoginPage实现任务**（5个阶段，25+检查项）
  - 阶段1: 页面结构
  - 阶段2: Header区域
  - 阶段3: LoginStack区域
  - 阶段4: 状态管理
  - 阶段5: 样式验证
- **PhoneLoginPage实现任务**（8个阶段，40+检查项）
  - 阶段1: 页面结构
  - 阶段2: Header区域
  - 阶段3: 主容器
  - 阶段4: 表单区域（Grid布局、输入框）
  - 阶段5: 登录按钮
  - 阶段6: 协议区域
  - 阶段7: 状态管理（倒计时）
  - 阶段8: 样式验证
- **验证清单**（65+验证项）
- **开发流程**（5步）

**特色**:
- ✅ Checkbox式清单（可勾选）
- ✅ 阶段式分解（循序渐进）
- ✅ 完整验证清单（设计令牌、功能、布局、样式）

**适合人群**: 开发者（开发时逐项勾选）

---

### 4. 快速参考卡片（figma-quick-reference.md）

**用途**: 开发时快速查找颜色、间距、布局

**内容**:
- **核心颜色速查表**（8种颜色 + Figma来源）
- **字体系统速查表**（4种尺寸 + Tailwind映射）
- **间距系统速查表**（8种间距 + 转换公式）
- **组件尺寸速查表**（5种尺寸）
- **转换公式速查**（间距刻度、像素值、边框）
- **关键布局类**（Grid、输入框、栅格、Flex）
- **常用样式组合**（页面容器、标题、按钮、输入框）
- **微信小程序兼容性**（支持/不支持特性）
- **调试技巧**（console验证方法）
- **常见错误**（4种错误 + 正确写法对比）

**特色**:
- 📋 表格形式（快速查找）
- 🔍 调试技巧（验证方法）
- ⚠️ 常见错误（避坑指南）
- 🖨️ 可打印（作为参考卡片）

**适合人群**: 开发者（开发时随时查阅）

---

## 🎨 设计令牌文件

### login.scss

**路径**: `/src/styles/design-tokens/login.scss`

**内容**:
- `$login-colors`: 9种颜色（primary、background、border等）
- `$login-font-sizes`: 5种字体大小（24rpx - 56rpx）
- `$login-font-weights`: 4种字体粗细（400 - 700）
- `$login-spacing`: 7种间距（8rpx - 160rpx）
- `$login-sizes`: 5种组件尺寸（Logo、按钮、Checkbox等）
- `$login-radius`: 4种圆角（4rpx - 24rpx）
- SCSS辅助函数（login-color、login-spacing等）
- CSS变量导出（:root）

**使用方式**:
```scss
// 在.vue文件中导入
@import '@/styles/design-tokens/login.scss';

// 使用颜色
color: map-get($login-colors, primary); // #00a82d

// 使用间距
gap: map-get($login-spacing, xl); // 40rpx

// 使用字体大小
font-size: map-get($login-font-sizes, title); // 56rpx
```

---

### figma-layout-classes.scss

**路径**: `/src/styles/design-tokens/figma-layout-classes.scss`

**内容**:
- Flexbox布局类（7种）
- Spacing栅格类（2种）
- Grid布局类（1种，关键！）
- 宽度限制类（3种）
- 文本对齐类（2种）
- 边框样式类（2种，输入框关键！）
- 按钮变体类
- 输入框样式
- 内边距类（9种）
- 外边距类（5种）
- 禁用状态类
- 过渡动画类
- 分隔线类

**使用方式**:
```vue
<!-- 方式1: 使用预定义类 -->
<template>
  <view class="grid-label-field">
    <text class="label">手机号</text>
    <input class="input-field border-bottom-only" />
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/design-tokens/figma-layout-classes.scss';
</style>

<!-- 方式2: 直接写样式（参考类的实现） -->
<template>
  <view style="display: grid; grid-template-columns: 180rpx 1fr; gap: 24rpx">
    ...
  </view>
</template>
```

---

## 🔍 关键信息速查

### 转换公式
```
Tailwind刻度 n → n * 8 rpx
px值 → px * 2 rpx
边框保持 1rpx（发丝线）
```

### 核心颜色
```
主色: #00a82d
背景: #fafafa
标题: #111827
边框: rgba(0, 168, 45, 0.12)
```

### 关键尺寸
```
Logo宽度: 384rpx (w-48)
按钮高度: 96rpx (h-[48px])
表单Label: 180rpx (90px)
Checkbox: 32rpx (w-4 h-4)
```

### 关键布局
```scss
// Grid布局（PhoneLoginPage表单）
grid-template-columns: 180rpx 1fr;
gap: 24rpx;

// 输入框底边框（PhoneLoginPage输入框）
border: none;
border-bottom: 1rpx solid rgba(0, 168, 45, 0.12);

// 垂直栅格（替代space-y-*）
display: flex;
flex-direction: column;
gap: 40rpx;
```

---

## ⚠️ 重要提醒

### 禁止事项
- ❌ 不要猜测颜色值或间距
- ❌ 不要添加Figma中不存在的样式
- ❌ 不要使用space-y-*（用gap替代）
- ❌ 不要跳过验证清单

### 必须遵守
- ✅ 所有样式决策必须标注Figma来源
- ✅ 所有尺寸必须使用设计令牌
- ✅ Grid布局必须精确（180rpx 1fr）
- ✅ 输入框必须仅底边框（border-bottom-only）

---

## 📞 获取帮助

- **设计疑问** → 询问 `frontend-ui-designer`
- **技术疑问** → 询问 `uni-app-expert`
- **架构疑问** → 询问 `software-architect`
- **后端对接** → 询问 `backend-senior-developer`

---

## 🎉 开始开发

1. 阅读 [快速参考卡片](./figma-quick-reference.md)（5分钟）
2. 阅读 [实现指南](./figma-to-uniapp-guide.md) 第1-2节（10分钟）
3. 打开 [任务清单](./login-pages-implementation-checklist.md)（边开发边勾选）
4. 开始实现 LoginPage 和 PhoneLoginPage
5. 运行验证清单（65+验证项）

**祝开发顺利！请严格按照Figma设计100%精确还原。**
