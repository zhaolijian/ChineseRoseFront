<template>
  <CrButton
    v-bind="{ ...$attrs, ...props }"
    variant="primary"
    :block="block"
    :disabled="disabled"
    :loading="loading"
    :size="size"
    @click="(event) => emit('click', event)"
  >
    <slot />
  </CrButton>
</template>

<script setup lang="ts">
import CrButton from '@/components/common/Button/index.vue'

const props = defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}>()

const emit = defineEmits<{ (e: 'click', event: Event): void }>()
</script>
