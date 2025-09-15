<template>
  <view class="page-container cr-page-bg" :style="customStyle">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  padding?: number | string
  customStyle?: string | Record<string, any>
}>()

const customStyle = computed(() => {
  const base = typeof props.customStyle === 'string' ? props.customStyle : ''
  const pad = props.padding !== undefined ? props.padding : '24rpx'
  return `padding:${pad};${base}`
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
}
</style>

<!-- 最小用法示例：
<PageContainer>
  <view class="cr-card cr-card--padded">内容</view>
</PageContainer>
-->
