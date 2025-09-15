<template>
  <view class="app-navbar">
    <u-navbar
      :title="title"
      :bgColor="bgColor"
      :autoBack="showBack"
      :leftIcon="showBack ? 'arrow-left' : ''"
      leftIconSize="20"
      leftIconColor="#374151"
      :placeholder="true"
      :border="false"
      @leftClick="onBack"
    >
      <template #right>
        <slot name="right" />
      </template>
    </u-navbar>
  </view>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  title?: string
  showBack?: boolean
  transparent?: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const bgColor = computed(() => props.transparent ? 'transparent' : 'rgba(255,255,255,0.85)')

function onBack() {
  emit('back')
  // 默认后退
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}
</script>

<style lang="scss" scoped>
.app-navbar {
  .u-navbar__content {
    @extend .cr-navbar--frosted;
  }
}
</style>

<!-- 最小用法示例：
<AppNavBar title="登录" :showBack="false">
  <template #right>
    <u-icon name="more" size="20" class="cr-icon" />
  </template>
</AppNavBar>
-->
