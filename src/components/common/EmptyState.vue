<template>
  <view class="empty-state">
    <u-icon v-if="icon" :name="icon" size="64" class="icon" />
    <image v-else-if="image" :src="image" mode="aspectFit" class="image" />
    <text class="title">{{ title }}</text>
    <text v-if="description" class="desc">{{ description }}</text>
    <PrimaryButton v-if="actionText" size="md" @click="$emit('action')">{{ actionText }}</PrimaryButton>
  </view>
  
</template>

<script setup lang="ts">
import PrimaryButton from './PrimaryButton.vue'

defineProps<{
  icon?: string
  image?: string
  title: string
  description?: string
  actionText?: string
}>()

defineEmits<{ (e:'action'): void }>()
</script>

<style lang="scss" scoped>
.empty-state { 
  padding: 60rpx 24rpx; text-align: center; color: var(--cr-color-subtext);
  display: flex; flex-direction: column; align-items: center; gap: 24rpx;
}
.icon { color: var(--cr-color-subtext); }
.image { width: 200rpx; height: 200rpx; }
.title { font-size: var(--cr-font-subtitle); color: var(--cr-color-text-strong); font-weight: 600; }
.desc  { font-size: var(--cr-font-caption); }
</style>

<!-- 最小用法示例：
<EmptyState icon="data" title="暂无数据" description="去创建你的第一条数据吧" actionText="去创建" @action="goCreate" />
-->

