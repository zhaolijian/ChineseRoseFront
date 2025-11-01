<template>
  <view class="cr-tabbar" :style="barStyle">
    <view class="cr-tabbar__inner">
      <view
        v-for="item in items"
        :key="item.path"
        class="cr-tabbar__item"
        :class="{ active: currentPath === item.path }"
        @click="switchTo(item.path)"
      >
        <view class="cr-tabbar__button">
          <image
            class="cr-tabbar__icon"
            :src="currentPath === item.path ? item.activeIcon : item.icon"
            mode="widthFix"
          />
          <text class="cr-tabbar__text">{{ item.text }}</text>
        </view>
      </view>
    </view>
    <view class="cr-tabbar__safe" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const props = defineProps<{
  /** 手动指定当前选中路径（可选） */
  modelValue?: string
}>()

const items = [
  {
    path: '/pages/index/index',
    text: '书架',
    icon: '/static/images/tabbar/bookshelf.png',
    activeIcon: '/static/images/tabbar/bookshelf-active.png'
  },
  {
    path: '/pages/notes/index',
    text: '笔记',
    icon: '/static/images/tabbar/note.png',
    activeIcon: '/static/images/tabbar/note-active.png'
  },
  {
    path: '/pages/profile/index',
    text: '我的',
    icon: '/static/images/tabbar/profile.png',
    activeIcon: '/static/images/tabbar/profile-active.png'
  }
]

const currentPath = ref('')

const resolveCurrent = () => {
  if (props.modelValue) {
    currentPath.value = props.modelValue
    return
  }
  const pages = getCurrentPages()
  if (pages && pages.length) {
    // @ts-ignore
    const route = '/' + (pages[pages.length - 1] as any).route
    currentPath.value = route
  }
}

onMounted(() => {
  resolveCurrent()
})
// #ifdef MP
// 小程序每次显示时同步
// @ts-ignore
onShow(() => {
  resolveCurrent()
})
// #endif

watchEffect(() => {
  if (props.modelValue) currentPath.value = props.modelValue
})

function switchTo(path: string) {
  if (path === currentPath.value) return
  uni.switchTab({ url: path })
}

const barStyle = ''
</script>

<style lang="scss" scoped>
.cr-tabbar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.96);
  backdrop-filter: saturate(160%) blur(16rpx);
  -webkit-backdrop-filter: saturate(160%) blur(16rpx);
  border-top: 1rpx solid var(--cr-color-divider);
  z-index: 1000;
}
.cr-tabbar__inner {
  display: flex;
  height: 100rpx;
  align-items: center;
  justify-content: space-evenly;
  position: relative;
}
.cr-tabbar__item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--cr-color-subtext);
}
.cr-tabbar__button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.cr-tabbar__item.active .cr-tabbar__button {
  background: rgba(0, 168, 45, 0.12);
}
.cr-tabbar__icon {
  width: 44rpx;
  height: 44rpx;
}
.cr-tabbar__text {
  font-size: 22rpx;
  margin-top: 8rpx;
  color: #6b7280;
}
.cr-tabbar__item.active .cr-tabbar__text {
  color: #00a82d;
}
.cr-tabbar__safe {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}
</style>
