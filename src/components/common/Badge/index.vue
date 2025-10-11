<template>
  <text class="cr-badge" :class="[`cr-badge--${variant}`]">
    <slot />
  </text>
</template>

<script setup lang="ts">
const props = defineProps<{
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}>()

const variant = computed(() => props.variant ?? 'default')
</script>

<style lang="scss" scoped>
.cr-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  font-size: var(--cr-font-xs);
  font-weight: var(--cr-font-weight-medium);
  border: 1rpx solid transparent;
  line-height: 1.4;
}

.cr-badge--default {
  background-color: var(--cr-color-primary);
  color: var(--cr-color-primary-foreground);
}

.cr-badge--secondary {
  background-color: var(--cr-color-secondary);
  color: var(--cr-color-secondary-foreground);
}

.cr-badge--outline {
  background-color: transparent;
  color: var(--cr-color-foreground);
  border-color: var(--cr-color-border);
}

.cr-badge--destructive {
  background-color: var(--cr-color-destructive);
  color: var(--cr-color-destructive-foreground);
}
</style>
