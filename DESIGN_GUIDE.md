# 设计令牌与通用组件基线（uni-app + uView Plus）

本指南固化“翡翠绿/青绿”体系主题与组件映射，确保 UI 统一、专业、可持续演进。页面与组件必须仅引用本指南中的令牌和通用组件，禁止直写色值/魔法数字。

## 一、设计令牌（src/uni.scss）
- 主色：Primary 600 `#059669`、Hover/弱强调 500 `#10B981`、Active 700 `#047857`、浅背景 50 `#ECFDF5`
- 语义：Success `#16A34A`、Warning `#F59E0B`、Error `#DC2626`、Info `#0EA5E9`
- 中性：TextStrong `#111827`、Text `#374151`、Subtext `#6B7280`、Border `#E5E7EB`、Divider `#F3F4F6`、BG `#F9FAFB`、Surface `#FFFFFF`
- 形态：圆角 Base `12rpx` / Card `16rpx`；阴影 sm `0 4rpx 12rpx rgba(17,24,39,0.06)` / md `0 8rpx 20rpx rgba(17,24,39,0.08)`
- 字号：Title `34rpx`、Subtitle `28rpx`、Body `26rpx`、Caption `24rpx`
- uView 变量：`$u-primary/$u-success/$u-warning/$u-error/$u-info`、`$u-text-color/$u-content-color/$u-border-color/$u-bg-color`

常用工具类：
- 容器：`.cr-page-bg`、`.cr-container`
- 卡片：`.cr-card` + `.cr-card--padded`
- 按钮尺寸：`.cr-btn .cr-btn--{sm,md,lg}`（配合 PrimaryButton）
- 输入容器：`.cr-input`
- 顶栏毛玻璃：`.cr-navbar--frosted`

使用方式：`src/App.vue` 已配置 `@import '@/uni.scss'` 优先覆盖 uView 主题。

## 二、组件映射
- Button → `PrimaryButton`（封装 `u-button`）
- Input/Textarea → `u-input`/`u--textarea`（外层使用 `.cr-input`）
- Tabs → `u-tabs`
- Dialog/Drawer → `u-modal`/`u-popup`
- Toast → `u-toast`
- Badge/Avatar → `u-badge`/`u-avatar`
- Skeleton → `LoadingSkeleton`（封装 `u-skeleton`）

## 三、通用组件最小用法

1) AppNavBar
```vue
<AppNavBar title="页面标题">
  <template #right><u-icon name="more" /></template>
</AppNavBar>
```

2) PageContainer
```vue
<PageContainer>
  <view class="cr-card cr-card--padded">内容</view>
</PageContainer>
```

3) PrimaryButton
```vue
<PrimaryButton size="lg" @click="submit">主要操作</PrimaryButton>
```

4) Card
```vue
<Card title="统计" subtitle="近7天">
  <view>主体内容</view>
</Card>
```

5) EmptyState
```vue
<EmptyState icon="data" title="暂无数据" description="去创建你的第一条数据吧" actionText="去创建" @action="goCreate" />
```

6) LoadingSkeleton
```vue
<LoadingSkeleton variant="list" :rows="4" />
```

## 四、迁移示例（登录页片段）
- 将内联渐变与硬编码像素改为通用按钮/输入与 rpx 尺寸：
```vue
<!-- 替换前：自定义 style + u-button -->
<u-button type="primary" :custom-style="{ background: 'linear-gradient(...)', height: '50px' }">登录</u-button>

<!-- 替换后：统一按钮尺寸与主题色 -->
<PrimaryButton size="lg">登录</PrimaryButton>
```
```vue
<!-- 输入容器：统一圆角/边框/高度 -->
<view class="cr-input"><u-input v-model="phone" placeholder="请输入手机号" /></view>
```

## 五、替换位说明
- 页面骨架与空态统一：优先使用 `LoadingSkeleton` 与 `EmptyState`，避免全屏 Loading 遮罩导致抖动。
- 顶栏统一：优先 `AppNavBar`。已有自绘导航栏按需替换，保持功能不变。
- 列表卡片：统一使用 `.cr-card`，避免手写 box-shadow 与 border。
- 图标：统一 `u-icon` + 项目 iconfont；默认中性色，活跃态 `text-primary`。

## 六、验证清单
- 主题变量：`$u-primary` 生效（按钮/标签等主色为 #059669）。
- 空态/加载/错误：可在列表页触发并样式统一。
- 端到端：登录→首页→思维导图主链路可用；401 能正确清理会话并跳转登录。

## 七、已知事项 / 技术债登记
- 登录页与首页/思维导图页仍存在旧样式（渐进替换中）。
- TabBar `selectedColor` 暂未改为主色；将于“步骤5”统一更新 pages.json 与图标资源。

责任人：前端（uni-app）
截止期：第一期组件基线落地后 1 天内完成三页替换与 TabBar 统一。

