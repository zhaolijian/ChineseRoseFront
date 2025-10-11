<template>
  <button
    class="cr-btn"
    :class="[
      `cr-btn--variant-${currentVariant}`,
      `cr-btn--size-${currentSize}`,
      { 'cr-btn--block': block, 'is-loading': loading }
    ]"
    type="button"
    :disabled="disabled || loading"
    :aria-disabled="String(disabled || loading)"
    @click="handleClick"
  >
    <span v-if="loading" class="cr-btn__spinner" data-testid="spinner"></span>
    <span class="cr-btn__label"><slot /></span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const props = defineProps<{
  variant?: Variant
  size?: Size
  block?: boolean
  disabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{ (e: 'click', event: Event): void }>()

const currentVariant = computed<Variant>(() => props.variant ?? 'primary')
const currentSize = computed<Size>(() => props.size ?? 'md')
const block = computed(() => props.block ?? false)
const disabled = computed(() => props.disabled ?? false)
const loading = computed(() => props.loading ?? false)

const handleClick = (event: Event) => {
  if (disabled.value || loading.value) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<style lang="scss" scoped>
.cr-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 0 32rpx;
  min-height: 84rpx;
  font-size: 28rpx;
  font-weight: var(--cr-font-weight-medium);
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  border: 1px solid transparent;
  cursor: pointer;
  position: relative;
  border-radius: var(--cr-radius-pill);

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 6rpx rgba(0, 168, 45, 0.35);
  }

  &:active {
    transform: translateY(1rpx) scale(0.99);
  }

  &[disabled] {
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }
}

.cr-btn--block {
  width: 100%;
}

.cr-btn--size-sm {
  min-height: 72rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
}

.cr-btn--size-md {
  min-height: 84rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
}

.cr-btn--size-lg {
  min-height: 96rpx;
  padding: 0 40rpx;
  font-size: 32rpx;
}

.cr-btn--size-icon {
  min-height: 72rpx;
  width: 72rpx;
  padding: 0;
}

.cr-btn--variant-primary {
  background: var(--cr-color-primary);
  color: var(--cr-color-primary-foreground);
  box-shadow: var(--cr-shadow-sm);

  &:hover:not([disabled]) {
    background: #008621;
  }
}

.cr-btn--variant-secondary {
  background: var(--cr-color-secondary);
  color: var(--cr-color-secondary-foreground);
  border-color: var(--cr-color-border);

  &:hover:not([disabled]) {
    background: var(--cr-color-primary-soft);
  }
}

.cr-btn--variant-ghost {
  background: transparent;
  color: var(--cr-color-primary);
  border-color: transparent;

  &:hover:not([disabled]) {
    background: var(--cr-color-primary-soft);
    color: #008621;
  }
}

.cr-btn--variant-outline {
  background: var(--cr-color-surface);
  color: var(--cr-color-foreground);
  border-color: var(--cr-color-border);

  &:hover:not([disabled]) {
    background: var(--cr-color-primary-soft);
  }
}

.cr-btn--variant-destructive {
  background: var(--cr-color-destructive);
  color: var(--cr-color-destructive-foreground);
  box-shadow: var(--cr-shadow-sm);

  &:hover:not([disabled]) {
    background: #b91c1c;
  }
}

.cr-btn--variant-link {
  background: transparent;
  color: var(--cr-color-primary);
  border-color: transparent;
  min-height: auto;
  padding: 0;

  &:hover:not([disabled]) {
    text-decoration: underline;
  }
}

.cr-btn__spinner {
  width: 24rpx;
  height: 24rpx;
  border-radius: 999px;
  border: 4rpx solid rgba(255, 255, 255, 0.6);
  border-top-color: var(--cr-color-primary-foreground);
  animation: cr-btn-spin 0.8s linear infinite;
}

.cr-btn.is-loading {
  pointer-events: none;
}

@keyframes cr-btn-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
