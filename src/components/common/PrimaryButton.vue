<template>
  <u-button
    class="cr-btn"
    :class="sizeClass"
    type="primary"
    :loading="loading"
    :disabled="disabled"
    :plain="plain"
    :custom-style="buttonStyle"
    @click="onClick"
    v-bind="$attrs"
  >
    <slot />
  </u-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Size = 'sm' | 'md' | 'lg'

const props = defineProps<{
  size?: Size
  loading?: boolean
  disabled?: boolean
  block?: boolean
  plain?: boolean
}>()

const emit = defineEmits<{ (e:'click'):void }>()

const sizeClass = computed(() => {
  const s = props.size || 'md'
  return {
    'cr-btn--sm': s === 'sm',
    'cr-btn--md': s === 'md',
    'cr-btn--lg': s === 'lg'
  }
})

const buttonStyle = computed(() => {
  return props.block ? 'width:100%;' : ''
})

function onClick() { emit('click') }
</script>

<style lang="scss" scoped>
/* 尺寸样式由 uni.scss 提供，这里仅做类名占位 */
</style>

<!-- 最小用法示例：
<PrimaryButton size="lg" @click="submit">主要按钮</PrimaryButton>
-->

