import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getMindmaps,
  getMindmapDetail as apiGetMindmapDetail,
  createMindmap as apiCreateMindmap,
  updateMindmap as apiUpdateMindmap,
  deleteMindmap as apiDeleteMindmap,
  searchMindmaps as apiSearchMindmaps,
  syncMindmaps as apiSyncMindmaps,
  generateMindmapThumbnail,
  getMindmapStats,
  type Mindmap,
  type MindmapListParams,
  type MindmapListResponse,
  type CreateMindmapPayload,
  type UpdateMindmapPayload
} from '@/api/modules/mindmap'
import { logger, createContext } from '@/utils'

export type { Mindmap } from '@/api/modules/mindmap'

export const useMindmapStore = defineStore('mindmap', () => {
  const mindmaps = ref<Mindmap[]>([])
  const currentMindmap = ref<Mindmap | null>(null)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const hasMore = ref(true)
  const loading = ref(false)

  const searchKeyword = ref('')
  const searchResults = ref<Mindmap[]>([])

  const syncStatus = ref<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const lastSyncTime = ref('')

  const lastParams = ref<MindmapListParams>({})

  const fetchMindmaps = async (page = 1, params: MindmapListParams = {}): Promise<MindmapListResponse> => {
    const ctx = createContext()
    try {
      loading.value = true
      lastParams.value = { ...params }
      const response = await getMindmaps({
        page,
        pageSize: pageSize.value,
        ...params
      })

      if (page === 1) {
        mindmaps.value = [...response.mindmaps]
      } else {
        mindmaps.value.push(...response.mindmaps)
      }

      currentPage.value = response.page
      total.value = response.total
      hasMore.value = response.hasMore

      logger.debug(ctx, '[MindmapStore] 获取列表成功', { page, params, total: total.value })
      return response
    } catch (error) {
      logger.error(ctx, '[MindmapStore] 获取列表失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchMindmapDetail = async (id: number): Promise<Mindmap> => {
    const ctx = createContext()
    try {
      loading.value = true
      const mindmap = await apiGetMindmapDetail(id)
      currentMindmap.value = mindmap

      const index = mindmaps.value.findIndex(item => item.id === id)
      if (index !== -1) {
        mindmaps.value[index] = mindmap
      }

      logger.debug(ctx, '[MindmapStore] 获取详情成功', { id })
      return mindmap
    } catch (error) {
      logger.error(ctx, '[MindmapStore] 获取详情失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createMindmap = async (payload: CreateMindmapPayload): Promise<Mindmap> => {
    const ctx = createContext()
    try {
      loading.value = true
      const mindmap = await apiCreateMindmap(payload)
      mindmaps.value.unshift(mindmap)
      total.value += 1
      logger.info(ctx, '[MindmapStore] 创建思维导图成功', { id: mindmap.id })
      return mindmap
    } catch (error) {
      logger.error(ctx, '[MindmapStore] 创建思维导图失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateMindmap = async (id: number, payload: UpdateMindmapPayload): Promise<Mindmap> => {
    const ctx = createContext()
    try {
      loading.value = true
      const updated = await apiUpdateMindmap(id, payload)

      const index = mindmaps.value.findIndex(item => item.id === id)
      if (index !== -1) {
        mindmaps.value[index] = updated
      }

      if (currentMindmap.value?.id === id) {
        currentMindmap.value = updated
      }

      logger.info(ctx, '[MindmapStore] 更新思维导图成功', { id })
      return updated
    } catch (error) {
      logger.error(ctx, '[MindmapStore] 更新思维导图失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteMindmap = async (id: number): Promise<void> => {
    const ctx = createContext()
    try {
      loading.value = true
      await apiDeleteMindmap(id)
      mindmaps.value = mindmaps.value.filter(item => item.id !== id)
      total.value = Math.max(0, total.value - 1)

      if (currentMindmap.value?.id === id) {
        currentMindmap.value = null
      }

      logger.info(ctx, '[MindmapStore] 删除思维导图成功', { id })
    } catch (error) {
      logger.error(ctx, '[MindmapStore] 删除思维导图失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const searchMindmaps = async (keyword: string, params: Omit<MindmapListParams, 'keyword'> = {}): Promise<Mindmap[]> => {
    const ctx = createContext()
    const trimmed = keyword.trim()
    searchKeyword.value = trimmed

    if (!trimmed) {
      searchResults.value = []
      logger.debug(ctx, '[MindmapStore] 搜索关键字为空，返回空结果')
      return []
    }

    try {
      loading.value = true
      const response = await apiSearchMindmaps(trimmed, params)
      searchResults.value = response.mindmaps
      logger.debug(ctx, '[MindmapStore] 搜索成功', { keyword: trimmed, count: response.mindmaps.length })
      return response.mindmaps
    } catch (error) {
      logger.error(ctx, '[MindmapStore] 搜索失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const clearSearch = () => {
    searchKeyword.value = ''
    searchResults.value = []
  }

  const getUserMindmapCount = async (): Promise<number> => {
    const ctx = createContext()
    try {
      const result = await getMindmapStats()
      logger.debug(ctx, '[MindmapStore] 获取统计成功', result)
      return result.total
    } catch (error) {
      logger.error(ctx, '[MindmapStore] 获取统计失败', error)
      return total.value
    }
  }

  const generateThumbnail = async (id: number): Promise<string> => {
    const ctx = createContext()
    try {
      const { url } = await generateMindmapThumbnail(id)
      logger.debug(ctx, '[MindmapStore] 生成缩略图成功', { id, url })
      return url
    } catch (error) {
      logger.error(ctx, '[MindmapStore] 生成缩略图失败', error)
      throw error
    }
  }

  const syncMindmaps = async (): Promise<void> => {
    const ctx = createContext()
    try {
      syncStatus.value = 'syncing'
      await apiSyncMindmaps()
      await fetchMindmaps(1, lastParams.value)
      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'
      logger.info(ctx, '[MindmapStore] 同步成功')
    } catch (error) {
      syncStatus.value = 'error'
      logger.error(ctx, '[MindmapStore] 同步失败', error)
      throw error
    }
  }

  const reset = () => {
    mindmaps.value = []
    currentMindmap.value = null
    currentPage.value = 1
    total.value = 0
    hasMore.value = true
    loading.value = false
    searchKeyword.value = ''
    searchResults.value = []
    syncStatus.value = 'idle'
    lastParams.value = {}
  }

  return {
    mindmaps,
    currentMindmap,
    currentPage,
    pageSize,
    total,
    hasMore,
    loading,
    searchKeyword,
    searchResults,
    syncStatus,
    lastSyncTime,
    fetchMindmaps,
    fetchMindmapDetail,
    createMindmap,
    updateMindmap,
    deleteMindmap,
    searchMindmaps,
    clearSearch,
    getUserMindmapCount,
    generateThumbnail,
    syncMindmaps,
    reset
  }
})

export type MindmapStore = ReturnType<typeof useMindmapStore>
