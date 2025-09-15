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
        <text class="iconfont cr-tabbar__icon" v-if="useIconfont">{{ item.glyph }}</text>
        <u-icon v-else :name="item.uIcon" size="22" :color="currentPath === item.path ? activeColor : iconColor" />
        <text class="cr-tabbar__text">{{ item.text }}</text>
      </view>
    </view>
    <view class="cr-tabbar__safe" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const props = withDefaults(defineProps<{
  /** 手动指定当前选中路径（可选） */
  modelValue?: string
  /** 是否使用 iconfont.ttf （默认true） */
  useIconfont?: boolean
}>(), {
  useIconfont: true
})

const activeColor = '#059669'
const iconColor = '#6B7280'

const items = [
  { path: '/pages/index/index',   text: '书架', glyph: '\ue653', uIcon: 'home' },
  { path: '/pages/notes/index',   text: '笔记', glyph: '\ue60a', uIcon: 'file-text' },
  { path: '/pages/mindmap/index', text: '导图', glyph: '\ue631', uIcon: 'grid' },
  { path: '/pages/profile/index', text: '我的', glyph: '\ue6d0', uIcon: 'account' },
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
/* 字体文件临时注释，等待 iconfont.ttf 文件
@font-face {
  font-family: 'iconfont';
  src: url('@/static/fonts/iconfont.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: auto;
}
*/

.cr-tabbar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.96);
  backdrop-filter: saturate(160%) blur(16rpx);
  -webkit-backdrop-filter: saturate(160%) blur(16rpx);
  border-top: 1rpx solid var(--cr-color-divider);
  z-index: 1000;
}
.cr-tabbar__inner { display: flex; height: 100rpx; align-items: center; justify-content: space-around; }
.cr-tabbar__item { display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--cr-color-subtext); }
.cr-tabbar__item.active { color: var(--cr-color-primary-600); }
.cr-tabbar__icon { font-family: 'iconfont'; font-size: 44rpx; line-height: 1; }
.cr-tabbar__text { font-size: 22rpx; margin-top: 6rpx; }
.cr-tabbar__safe { height: constant(safe-area-inset-bottom); height: env(safe-area-inset-bottom); }
</style>

