<template>
  <view class="cr-book-cover-wrapper" :style="wrapperStyle">
    <view class="cr-book-cover" :style="coverStyle">
      <image
        v-if="src"
        class="cr-book-cover__img"
        :src="src"
        mode="scaleToFill"
        :lazy-load="true"
      />
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  src?: string
  width?: number
  ratio?: number
  radius?: number
  padding?: number
  bgColor?: string
  shadow?: boolean
}>(), {
  width: 120,
  ratio: 3 / 4,
  radius: 16,
  padding: 12,
  bgColor: '#F5F7FA',
  shadow: true
})

// 计算容器高度（用于外部引用，如需要）
const height = computed(() => {
  const r = Number(props.ratio) > 0 ? Number(props.ratio) : 3 / 4
  return Math.round(props.width / r)
})

// 外层wrapper样式：固定宽度
const wrapperStyle = computed(() => ({
  width: `${props.width}rpx`,
  flexShrink: '0'
}))

// 内层cover样式：使用padding-top撑开高度
const coverStyle = computed(() => {
  const r = Number(props.ratio) > 0 ? Number(props.ratio) : 3 / 4
  const paddingTopPercent = (1 / r) * 100  // 3/4 → 133.33%

  const styles: Record<string, string> = {
    paddingTop: `${paddingTopPercent}%`,
    borderRadius: `${props.radius}rpx`,
    background: props.bgColor
  }

  if (props.shadow) {
    styles.boxShadow = '0 8rpx 24rpx rgba(0,0,0,0.06)'
  }

  return styles
})

const src = computed(() => props.src || '')

// 暴露高度供父组件使用
const heightExpose = computed(() => height.value)
defineExpose({ height: heightExpose })
</script>

<style scoped lang="scss">
.cr-book-cover-wrapper {
  position: relative;
  flex-shrink: 0;
}

.cr-book-cover {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.cr-book-cover__img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.cr-book-cover__placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2f6;
  border-radius: inherit;
}

.cr-book-cover__placeholder-text {
  font-size: 24rpx;
  color: #98a2b3;
}
</style>
