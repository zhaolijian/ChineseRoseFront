<template>
  <view class="test-page">
    <view class="test-section">
      <text class="test-title">颜色测试</text>
      <view class="color-box primary">主色 #00a82d</view>
      <view class="color-box card-bg">卡片背景 #ffffff</view>
      <view class="color-box page-bg">页面背景 #fafafa</view>
    </view>

    <view class="test-section">
      <text class="test-title">字体测试</text>
      <text class="text-xs">超小字号 24rpx</text>
      <text class="text-sm">小字号 28rpx</text>
      <text class="text-base">基准字号 32rpx</text>
      <text class="text-lg">大字号 36rpx</text>
    </view>

    <view class="test-section">
      <text class="test-title">间距测试</text>
      <view class="spacing-demo spacing-2">16rpx间距</view>
      <view class="spacing-demo spacing-4">32rpx间距</view>
      <view class="spacing-demo spacing-6">48rpx间距</view>
    </view>

    <view class="test-section">
      <text class="test-title">圆角测试</text>
      <view class="radius-box radius-sm">小圆角 8rpx</view>
      <view class="radius-box radius-md">中圆角 16rpx</view>
      <view class="radius-box radius-lg">大圆角 20rpx</view>
    </view>

    <view class="test-section">
      <text class="test-title">阴影测试</text>
      <view class="shadow-box shadow-sm">轻阴影</view>
      <view class="shadow-box shadow-md">中阴影</view>
      <view class="shadow-box shadow-lg">重阴影</view>
    </view>
  </view>
</template>

<script setup lang="ts">
// 测试页面
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens/book-detail.scss';

.test-page {
  padding: $book-detail-spacing-4;
  background-color: $book-detail-bg;
}

.test-section {
  margin-bottom: $book-detail-spacing-6;
}

.test-title {
  font-size: $book-detail-font-lg;
  font-weight: $book-detail-font-semibold;
  color: $book-detail-text-primary;
  margin-bottom: $book-detail-spacing-3;
}

// 颜色测试
.color-box {
  width: 200rpx;
  height: 80rpx;
  margin-bottom: $book-detail-spacing-2;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $book-detail-radius-md;

  &.primary {
    background-color: $book-detail-primary;
    color: $book-detail-primary-fg;
  }

  &.card-bg {
    background-color: $book-detail-card-bg;
    border: 1rpx solid $book-detail-border;
  }

  &.page-bg {
    background-color: $book-detail-bg;
    border: 1rpx solid $book-detail-border;
  }
}

// 字体测试
.text-xs { font-size: $book-detail-font-xs; }
.text-sm { font-size: $book-detail-font-sm; }
.text-base { font-size: $book-detail-font-base; }
.text-lg { font-size: $book-detail-font-lg; }

// 间距测试
.spacing-demo {
  background-color: $book-detail-card-bg;
  border-radius: $book-detail-radius-sm;
  padding: $book-detail-spacing-2;

  &.spacing-2 { margin-bottom: $book-detail-spacing-2; }
  &.spacing-4 { margin-bottom: $book-detail-spacing-4; }
  &.spacing-6 { margin-bottom: $book-detail-spacing-6; }
}

// 圆角测试
.radius-box {
  width: 200rpx;
  height: 80rpx;
  background-color: $book-detail-primary;
  margin-bottom: $book-detail-spacing-2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  &.radius-sm { border-radius: $book-detail-radius-sm; }
  &.radius-md { border-radius: $book-detail-radius-md; }
  &.radius-lg { border-radius: $book-detail-radius-lg; }
}

// 阴影测试
.shadow-box {
  width: 200rpx;
  height: 80rpx;
  background-color: $book-detail-card-bg;
  margin-bottom: $book-detail-spacing-4;
  border-radius: $book-detail-radius-md;
  display: flex;
  align-items: center;
  justify-content: center;

  &.shadow-sm { box-shadow: $book-detail-shadow-sm; }
  &.shadow-md { box-shadow: $book-detail-shadow-md; }
  &.shadow-lg { box-shadow: $book-detail-shadow-lg; }
}
</style>
