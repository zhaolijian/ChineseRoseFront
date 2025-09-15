<template>
  <view class="cr-card" :class="{ 'cr-card--padded': padded }">
    <view v-if="title || $slots.header" class="card-header">
      <view class="card-title-area">
        <text class="card-title" v-if="title">{{ title }}</text>
        <text class="card-subtitle" v-if="subtitle">{{ subtitle }}</text>
        <slot name="header" />
      </view>
      <view class="card-actions">
        <slot name="actions" />
      </view>
    </view>
    <view class="card-body">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  title?: string
  subtitle?: string
  padded?: boolean
}>()
</script>

<style lang="scss" scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 24rpx 0 24rpx;
}
.card-title { font-size: var(--cr-font-subtitle); color: var(--cr-color-text-strong); font-weight: 600; }
.card-subtitle { font-size: var(--cr-font-caption); color: var(--cr-color-subtext); margin-left: 12rpx; }
.card-actions { display: flex; align-items: center; gap: 16rpx; }
.card-body { padding: 24rpx; }
</style>

<!-- 最小用法示例：
<Card title="统计" subtitle="近7天">
  <view>主体内容</view>
</Card>
-->

