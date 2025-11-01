<template>
  <view class="notes-page">
    <AppNavBar title="笔记" :showBack="false">
      <template #right>
        <u-icon name="search" size="20" class="nav-icon" @click="goToSearch" />
        <u-icon name="plus-circle" size="20" class="nav-icon" @click="goToAddNote" />
      </template>
    </AppNavBar>

    <PageContainer>
      <view class="notes-content" :style="contentStyle">
        <view class="stats-card">
          <view class="stat-item">
            <text class="stat-number">{{ stats.books }}</text>
            <text class="stat-label">本书籍</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-number">{{ stats.notes }}</text>
            <text class="stat-label">条笔记</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-number">{{ stats.mindmaps }}</text>
            <text class="stat-label">个导图</text>
          </view>
        </view>

        <view class="section">
          <view class="section-header">
            <text class="section-title">最近笔记</text>
            <view class="section-action" @click="goToNoteList">
              <text>查看更多</text>
              <u-icon name="arrow-right" size="16" color="#00a82d" />
            </view>
          </view>

          <view v-if="recentNotes.length > 0" class="recent-list">
            <view
              v-for="note in recentNotes"
              :key="note.id"
              class="recent-card"
              :class="`note-card--type-${note.noteType}`"
              @click="goToNoteDetail(note.id)"
            >
              <view class="recent-card__head">
                <view class="note-icon">
                  <u-icon name="book" size="24" color="#ffffff" />
                </view>
                <view class="note-info">
                  <text class="note-title">{{ note.title }}</text>
                  <text class="note-subtitle">{{ note.subtitle }}</text>
                </view>
                <view class="note-meta">
                  <text class="note-count">{{ note.countLabel }}</text>
                  <text class="note-time">{{ note.timeLabel }}</text>
                </view>
              </view>

              <view class="note-progress">
                <view class="progress-label">
                  <text>整理进度</text>
                  <text>{{ note.progress }}%</text>
                </view>
                <view class="progress-bar">
                  <view class="progress-bar__fill" :style="{ width: `${note.progress}%` }" />
                </view>
              </view>

              <view class="note-footer">
                <view class="note-type-tag">
                  <text class="note-type">{{ note.typeLabel }}</text>
                </view>
                <view class="note-tags" v-if="note.tags && note.tags.length">
                  <text
                    v-for="tag in note.tags"
                    :key="tag"
                    class="note-tag"
                  >
                    #{{ tag }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </PageContainer>

    <view class="notes-fab" @click="goToAddNote">
      <text class="fab-icon">+</text>
    </view>

    <TabBar />

    <u-loading-page
      :loading="pageLoading"
      bg-color="#f5f7fa"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import AppNavBar from '@/components/common/AppNavBar.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import TabBar from '@/components/common/TabBar.vue'
import { safeHideTabBar } from '@/utils/tabbar'
import { useBookStore } from '@/stores/modules/book'
import { useNoteStore, type Note } from '@/stores/modules/note'
import { useMindmapStore } from '@/stores/modules/mindmap'
import { logger, createContext } from '@/utils'

interface DisplayNote {
  id: number
  title: string
  subtitle: string
  countLabel: string
  timeLabel: string
  progress: number
  noteType: string
  typeLabel: string
  tags: string[]
}

const bookStore = useBookStore()
const noteStore = useNoteStore()
const mindmapStore = useMindmapStore()

const stats = reactive({
  books: 0,
  notes: 0,
  mindmaps: 0
})

const recentNotes = ref<DisplayNote[]>([])
const loading = ref(false)
const pageLoading = ref(false)

const NOTE_TYPE_LABELS: Record<string, string> = {
  reading: '阅读笔记',
  thought: '思考感悟',
  quote: '摘录',
  summary: '总结',
  default: '笔记'
}

const formattedStats = computed(() => ({
  books: stats.books,
  notes: stats.notes,
  mindmaps: stats.mindmaps
}))
void formattedStats.value

const safeOffset = ref(120)
const contentStyle = computed(() => ({
  marginTop: `${safeOffset.value}rpx`
}))

const loadDashboard = async (refresh = false) => {
  const ctx = createContext()
  try {
    loading.value = true
    if (refresh) pageLoading.value = true

    const [bookResult, noteResult, mindmapResult] = await Promise.allSettled([
      bookStore.fetchBooks(1, { limit: 12 }),
      noteStore.fetchNotes(1, { pageSize: 10, sortBy: 'updatedAt', sortOrder: 'desc' }),
      mindmapStore.fetchMindmaps(1, { limit: 12 })
    ])

    if (bookResult.status === 'fulfilled') {
      stats.books = bookResult.value.total ?? bookStore.bookCount
    } else {
      logger.warn(ctx, '[NotesDashboard] 获取书籍统计失败', bookResult.reason)
    }

    if (noteResult.status === 'fulfilled') {
      const response = noteResult.value
      stats.notes = response.total ?? noteStore.total
      recentNotes.value = formatRecentNotes(response.list)
    } else {
      logger.warn(ctx, '[NotesDashboard] 获取笔记列表失败', noteResult.reason)
      recentNotes.value = []
    }

    if (mindmapResult.status === 'fulfilled') {
      stats.mindmaps = mindmapResult.value.total ?? mindmapStore.total
    } else {
      logger.warn(ctx, '[NotesDashboard] 获取导图统计失败', mindmapResult.reason)
    }
  } catch (error) {
    logger.error(ctx, '[NotesDashboard] 加载面板数据失败', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
    pageLoading.value = false
  }
}

const formatRecentNotes = (list: Note[]): DisplayNote[] => {
  return list.slice(0, 5).map((note) => {
    const title = note.title || '无标题笔记'
    const subtitle = note.chapter || note.bookTitle || '未关联书籍'
    const tagCount = note.tags?.length ?? 0
    const countLabel = tagCount > 0 ? `${tagCount} 个标签` : '无标签'
    const timeLabel = formatRelativeTime(note.updatedAt || note.createdAt)
    const noteType = note.noteType || 'default'
    const progress = extractProgress(note)
    return {
      id: note.id,
      title,
      subtitle,
      countLabel,
      timeLabel,
      progress,
      noteType,
      typeLabel: NOTE_TYPE_LABELS[noteType] || NOTE_TYPE_LABELS.default,
      tags: (note.tags || []).slice(0, 3)
    }
  })
}

const extractProgress = (note: Note): number => {
  const raw = (note as any).progress
  if (typeof raw === 'number') {
    return Math.max(0, Math.min(100, Math.round(raw)))
  }
  const length = note.content?.length ?? 0
  if (length === 0) return 0
  const approx = Math.min(100, Math.round((length % 500) / 500 * 100))
  return approx <= 0 ? 15 : approx
}

const formatRelativeTime = (input?: string): string => {
  if (!input) return ''
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ''

  const diff = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < week) return `${Math.floor(diff / day)} 天前`

  return date.toLocaleDateString()
}

const goToSearch = () => {
  uni.navigateTo({
    url: '/pages-note/list/list'
  })
}

const goToAddNote = () => {
  uni.navigateTo({
    url: '/pages-note/add/add'
  })
}

const goToNoteDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages-note/edit/edit?id=${id}`
  })
}

const goToNoteList = () => {
  uni.navigateTo({
    url: '/pages-note/list/list'
  })
}

const computeSafeOffset = () => {
  try {
    const info = uni.getSystemInfoSync?.()
    if (!info) return
    const windowWidth = info.windowWidth || 375
    const statusBarHeight = info.statusBarHeight || 0
    const menuRect = uni.getMenuButtonBoundingClientRect?.()
    // 统一与书架页面的计算逻辑：capsuleBottom + 6
    const capsuleBottom = menuRect?.bottom ?? (statusBarHeight + 44)
    const px = capsuleBottom + 6
    const rpx = Math.round((px * 750) / windowWidth)
    safeOffset.value = Math.max(rpx, 60)
  } catch (error) {
    logger.warn(createContext(), '[NotesDashboard] 获取系统信息失败', error)
  }
}

onMounted(async () => {
  await loadDashboard(true)
  safeHideTabBar()
  computeSafeOffset()
})

onShow(async () => {
  safeHideTabBar()
  computeSafeOffset()
  await loadDashboard(true)
})

onPullDownRefresh(async () => {
  await loadDashboard(true)
  uni.stopPullDownRefresh()
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens/notes.scss';

.notes-page {
  min-height: 100vh;
  background: map-get($notes-colors, background);
  padding-bottom: calc(map-get($notes-spacing, bottom-safe) + constant(safe-area-inset-bottom));
  padding-bottom: calc(map-get($notes-spacing, bottom-safe) + env(safe-area-inset-bottom));
}

.nav-icon {
  color: map-get($notes-colors, primary);
  margin-left: map-get($notes-spacing, sm);
}

.notes-content {
  display: flex;
  flex-direction: column;
  gap: map-get($notes-spacing, xl);
  padding: map-get($notes-layout, list-padding-y) map-get($notes-layout, list-padding-x);
  margin-top: map-get($notes-spacing, xl);
}

.stats-card {
  background: map-get($notes-colors, card-background);
  border-radius: map-get($notes-radius, xl);
  padding: map-get($notes-spacing, xl);
  box-shadow: map-get($notes-shadows, card);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: map-get($notes-spacing, xl);
}

.stat-item {
  flex: 1;
  text-align: center;

  .stat-number {
    display: block;
    font-size: map-get($notes-font-sizes, lg);
    font-weight: map-get($notes-font-weights, bold);
    color: map-get($notes-colors, title);
    margin-bottom: map-get($notes-spacing, xs);
  }

  .stat-label {
    display: block;
    font-size: map-get($notes-font-sizes, xs);
    color: map-get($notes-colors, secondary-text);
  }
}

.stat-divider {
  width: 1rpx;
  height: 72rpx;
  background: map-get($notes-colors, divider);
}

.section {
  display: flex;
  flex-direction: column;
  gap: map-get($notes-spacing, md);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: map-get($notes-font-sizes, lg);
  font-weight: map-get($notes-font-weights, semibold);
  color: map-get($notes-colors, title);
}

.section-action {
  display: inline-flex;
  align-items: center;
  gap: map-get($notes-spacing, xs);
  font-size: map-get($notes-font-sizes, sm);
  color: map-get($notes-colors, primary);
}

.section-empty {
  padding-top: map-get($notes-spacing, xl);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: map-get($notes-spacing, md);
}

.recent-card {
  background: map-get($notes-colors, card-background);
  border-radius: map-get($notes-radius, lg);
  padding: map-get($notes-spacing, xl);
  box-shadow: map-get($notes-shadows, card);
  transition: transform map-get($notes-transitions, fast), box-shadow map-get($notes-transitions, normal);

  &:active {
    transform: map-get($notes-card-states, active, transform);
    box-shadow: map-get($notes-card-states, active, shadow);
  }
}

.recent-card__head {
  display: flex;
  align-items: center;
  gap: map-get($notes-spacing, md);
  margin-bottom: map-get($notes-spacing, md);
}

.note-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: map-get($notes-radius, md);
  background: map-get($notes-colors, primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: map-get($notes-spacing, xs);
}

.note-title {
  font-size: map-get($notes-font-sizes, base);
  font-weight: map-get($notes-font-weights, semibold);
  color: map-get($notes-colors, title);
}

.note-subtitle {
  font-size: map-get($notes-font-sizes, sm);
  color: map-get($notes-colors, muted-foreground);
}

.note-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: map-get($notes-spacing, xs);
  min-width: 160rpx;
}

.note-count,
.note-time {
  font-size: map-get($notes-font-sizes, xs);
  color: map-get($notes-colors, secondary-text);
}

.note-progress {
  display: flex;
  flex-direction: column;
  gap: map-get($notes-spacing, xs);
  margin-bottom: map-get($notes-spacing, md);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: map-get($notes-font-sizes, xs);
  color: map-get($notes-colors, secondary-text);
}

.progress-bar {
  width: 100%;
  height: 12rpx;
  background: map-get($notes-colors, filter-background);
  border-radius: map-get($notes-radius, pill);
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  border-radius: map-get($notes-radius, pill);
  background: map-get($notes-colors, primary);
  transition: width map-get($notes-transitions, normal);
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: map-get($notes-spacing, md);
}

.note-type-tag {
  padding: map-get($notes-spacing, xs) map-get($notes-spacing, sm);
  border-radius: map-get($notes-radius, sm);
  background: map-get($notes-colors, primary-light);
}

.note-type {
  font-size: map-get($notes-font-sizes, xs);
  color: map-get($notes-colors, primary);
}

.note-tags {
  display: flex;
  gap: map-get($notes-spacing, xs);
  flex-wrap: wrap;
}

.note-tag {
  font-size: map-get($notes-font-sizes, xxs);
  color: map-get($notes-colors, secondary-text);
}

.notes-fab {
  position: fixed;
  left: 50%;
  bottom: calc(#{map-get($notes-layout, fab-bottom)} + constant(safe-area-inset-bottom));
  bottom: calc(#{map-get($notes-layout, fab-bottom)} + env(safe-area-inset-bottom));
  width: map-get($notes-sizes, fab-size);
  height: map-get($notes-sizes, fab-size);
  border-radius: map-get($notes-radius, full);
  background: map-get($notes-fab-states, default, background);
  box-shadow: map-get($notes-fab-states, default, shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-50%);
  z-index: 999;
  transition: transform map-get($notes-transitions, fast), box-shadow map-get($notes-transitions, normal), background-color map-get($notes-transitions, normal);

  &:active {
    transform: translateX(-50%) #{map-get($notes-fab-states, active, transform)};
    box-shadow: map-get($notes-fab-states, active, shadow);
  }
}

 

.fab-icon {
  font-size: 48rpx;
  font-weight: map-get($notes-font-weights, bold);
  color: #ffffff;
  line-height: 1;
}

@each $type, $config in $notes-types {
  .note-card--type-#{$type} {
    .note-icon {
      background: rgba(red(map-get($config, color)), green(map-get($config, color)), blue(map-get($config, color)), 0.16);
    }
    .note-type {
      color: map-get($config, color);
    }
    .note-type-tag {
      background: rgba(red(map-get($config, color)), green(map-get($config, color)), blue(map-get($config, color)), 0.12);
    }
    .progress-bar__fill {
      background: map-get($config, color);
    }
  }
}

.note-card--type-default {
  .note-icon {
    background: map-get($notes-colors, primary);
  }
}
</style>
