<template>
  <view class="dropdown-mask" v-if="open" @tap="onClose"></view>
  <view class="dropdown" v-if="open" :style="wrapperStyle">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ open: boolean; x: number; y: number; width?: number }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const onClose = () => emit('close')
const wrapperStyle = computed(() => ({
  left: props.x + 'px',
  top: props.y + 'px',
  width: (props.width || 200) + 'px'
}))
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens/book-detail.scss';

.dropdown-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0);
  z-index: $book-detail-z-dropdown-mask;
}
.dropdown {
  position: fixed;
  z-index: $book-detail-z-dropdown;
  background: $book-detail-surface-float;
  border: 1rpx solid $book-detail-border-light;
  border-radius: $book-detail-radius-lg;
  box-shadow: $book-detail-shadow-elev-3;
  padding: $book-detail-spacing-1;
}
</style>
