<template>
  <view>
    <u-skeleton :loading="true" :animate="true" :title="title" :rows="rows" :avatar="avatar" />
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'list' | 'card'
  rows?: number
  title?: boolean
  avatar?: boolean
}>(), {
  variant: 'list',
  rows: 3,
  title: true,
  avatar: false
})

// 当前封装直接透传，variant 预留用于后续布局差异（如卡片骨架）
</script>

<style scoped></style>

<!-- 最小用法示例：
<LoadingSkeleton variant="list" :rows="4" />
-->

