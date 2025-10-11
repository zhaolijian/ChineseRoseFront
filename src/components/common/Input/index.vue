<template>
  <view class="cr-input" :class="inputClasses">
    <slot name="prefix">
      <u-icon v-if="prefixIcon" :name="prefixIcon" class="cr-input__icon" />
    </slot>
    <input
      class="cr-input__field"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      @input="handleInput"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
    />
    <slot name="suffix">
      <u-icon v-if="suffixIcon" :name="suffixIcon" class="cr-input__icon" />
    </slot>
  </view>
  <text v-if="error" class="cr-input__error">{{ error }}</text>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  prefixIcon?: string
  suffixIcon?: string
  maxlength?: number | string
  state?: 'default' | 'success' | 'error'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

const type = props.type ?? 'text'

const handleInput = (event: InputEvent) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const inputClasses = computed(() => ({
  'is-disabled': props.disabled,
  'is-error': !!props.error || props.state === 'error',
  'is-success': props.state === 'success'
}))
</script>

<style lang="scss" scoped>
.cr-input {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16rpx;
  background-color: var(--cr-color-surface);
  border: 1px solid var(--cr-color-border);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  border-radius: var(--cr-radius-md);
  padding: 0 24rpx;
  min-height: 80rpx;

  &:focus-within {
    border-color: var(--cr-color-primary);
    box-shadow: 0 0 0 6rpx rgba(0, 168, 45, 0.25);
  }

  &.is-disabled {
    opacity: 0.6;
  }

  &.is-error {
    border-color: var(--cr-color-destructive);
  }

  &.is-success {
    border-color: var(--cr-color-success);
  }
}

.cr-input__field {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--cr-font-base);
  color: var(--cr-color-foreground);

  &:focus {
    outline: none;
  }
}

.cr-input__icon {
  color: var(--cr-color-muted-foreground);
}

.cr-input__error {
  margin-top: 8rpx;
  display: block;
  font-size: var(--cr-font-sm);
  color: var(--cr-color-destructive);
}
</style>
