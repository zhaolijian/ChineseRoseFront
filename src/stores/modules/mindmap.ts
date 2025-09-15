import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { ApiResponse } from '@/types/api'

// 思维导图相关类型定义
export interface MindmapNode {
  id: string
  text: string
  level: number
  parentId?: string
  children?: MindmapNode[]
  style?: {
    color?: string
    backgroundColor?: string
    fontSize?: number
  }
}

export interface Mindmap {
  id: number
  title?: string
  bookId: number
  bookTitle?: string
  thumbnail?: string
  nodeCount?: number
  nodes: MindmapNode[]
  createdAt: string
  updatedAt?: string
  syncStatus?: 'synced' | 'pending' | 'error'
}

export interface CreateMindmapRequest {
  title?: string
  bookId: number
  nodes?: MindmapNode[]
}

export interface UpdateMindmapRequest {
  id: number
  title?: string
  nodes?: MindmapNode[]
}

export interface MindmapsResponse {
  mindmaps: Mindmap[]
  total: number
  hasMore: boolean
}

export const useMindmapStore = defineStore('mindmap', () => {
  // 状态
  const mindmaps = ref<Mindmap[]>([])
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const loading = ref(false)
  
  // 当前选中的思维导图
  const currentMindmap = ref<Mindmap | null>(null)
  
  // 搜索状态
  const searchKeyword = ref('')
  const searchResults = ref<Mindmap[]>([])
  
  // 同步状态
  const syncStatus = ref<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const lastSyncTime = ref<string>('')
  
  // Actions
  
  /**
   * 获取思维导图列表
   */
  const fetchMindmaps = async (page = 1): Promise<MindmapsResponse> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // const response = await mindmapApi.getMindmaps({
      //   page,
      //   pageSize: pageSize.value
      // })
      
      // 模拟API响应
      const mockResponse: MindmapsResponse = {
        mindmaps: [
          {
            id: 1,
            title: '《示例书籍》知识结构',
            bookId: 1,
            bookTitle: '《示例书籍》',
            nodeCount: 15,
            nodes: [
              {
                id: 'root',
                text: '中心主题',
                level: 0,
                children: [
                  {
                    id: 'node1',
                    text: '分支1',
                    level: 1,
                    parentId: 'root'
                  },
                  {
                    id: 'node2', 
                    text: '分支2',
                    level: 1,
                    parentId: 'root'
                  }
                ]
              }
            ],
            createdAt: new Date().toISOString(),
            syncStatus: 'synced'
          }
        ],
        total: 1,
        hasMore: false
      }
      
      if (page === 1) {
        mindmaps.value = mockResponse.mindmaps
        currentPage.value = 1
      } else {
        mindmaps.value.push(...mockResponse.mindmaps)
        currentPage.value = page
      }
      
      total.value = mockResponse.total
      
      return mockResponse
    } catch (error) {
      console.error('获取思维导图列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取思维导图详情
   */
  const fetchMindmapDetail = async (id: number): Promise<Mindmap> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // const response = await mindmapApi.getMindmapDetail(id)
      
      // 模拟API响应
      const mockMindmap: Mindmap = {
        id,
        title: '思维导图详情示例',
        bookId: 1,
        bookTitle: '《示例书籍》',
        nodeCount: 10,
        nodes: [
          {
            id: 'root',
            text: '中心主题',
            level: 0,
            children: []
          }
        ],
        createdAt: new Date().toISOString(),
        syncStatus: 'synced'
      }
      
      currentMindmap.value = mockMindmap
      return mockMindmap
    } catch (error) {
      console.error('获取思维导图详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 创建思维导图
   */
  const createMindmap = async (mindmapData: CreateMindmapRequest): Promise<Mindmap> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // const response = await mindmapApi.createMindmap(mindmapData)
      
      // 模拟创建成功
      const newMindmap: Mindmap = {
        id: Date.now(),
        ...mindmapData,
        nodes: mindmapData.nodes || [
          {
            id: 'root',
            text: '中心主题',
            level: 0
          }
        ],
        nodeCount: mindmapData.nodes?.length || 1,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending'
      }
      
      // 添加到列表前面
      mindmaps.value.unshift(newMindmap)
      total.value += 1
      
      return newMindmap
    } catch (error) {
      console.error('创建思维导图失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 更新思维导图
   */
  const updateMindmap = async (mindmapData: UpdateMindmapRequest): Promise<Mindmap> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // const response = await mindmapApi.updateMindmap(mindmapData.id, mindmapData)
      
      // 模拟更新成功
      const index = mindmaps.value.findIndex(mindmap => mindmap.id === mindmapData.id)
      if (index > -1) {
        const updatedMindmap = {
          ...mindmaps.value[index],
          ...mindmapData,
          nodeCount: mindmapData.nodes?.length || mindmaps.value[index].nodeCount,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending' as const
        }
        mindmaps.value[index] = updatedMindmap
        
        if (currentMindmap.value?.id === mindmapData.id) {
          currentMindmap.value = updatedMindmap
        }
        
        return updatedMindmap
      }
      
      throw new Error('思维导图不存在')
    } catch (error) {
      console.error('更新思维导图失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 删除思维导图
   */
  const deleteMindmap = async (id: number): Promise<void> => {
    try {
      loading.value = true
      
      // TODO: 调用实际API
      // await mindmapApi.deleteMindmap(id)
      
      // 从列表中移除
      const index = mindmaps.value.findIndex(mindmap => mindmap.id === id)
      if (index > -1) {
        mindmaps.value.splice(index, 1)
        total.value -= 1
      }
      
      // 清除当前思维导图
      if (currentMindmap.value?.id === id) {
        currentMindmap.value = null
      }
    } catch (error) {
      console.error('删除思维导图失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 搜索思维导图
   */
  const searchMindmaps = async (keyword: string): Promise<Mindmap[]> => {
    try {
      loading.value = true
      searchKeyword.value = keyword
      
      if (!keyword.trim()) {
        searchResults.value = []
        return []
      }
      
      // TODO: 调用实际API
      // const response = await mindmapApi.searchMindmaps(keyword)
      
      // 模拟搜索结果
      const results = mindmaps.value.filter(mindmap => 
        mindmap.title?.includes(keyword) || 
        mindmap.bookTitle?.includes(keyword) ||
        mindmap.nodes.some(node => node.text.includes(keyword))
      )
      
      searchResults.value = results
      return results
    } catch (error) {
      console.error('搜索思维导图失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取用户思维导图统计
   */
  const getUserMindmapCount = async (): Promise<number> => {
    try {
      // TODO: 调用实际API
      // const response = await mindmapApi.getUserMindmapCount()
      
      // 返回模拟数据
      return mindmaps.value.length
    } catch (error) {
      console.error('获取思维导图统计失败:', error)
      return 0
    }
  }
  
  /**
   * 生成思维导图预览图
   */
  const generateThumbnail = async (id: number): Promise<string> => {
    try {
      // TODO: 调用实际API生成预览图
      // const response = await mindmapApi.generateThumbnail(id)
      
      // 返回模拟预览图URL
      return '/static/images/mindmap-placeholder.png'
    } catch (error) {
      console.error('生成预览图失败:', error)
      throw error
    }
  }
  
  /**
   * 同步思维导图
   */
  const syncMindmaps = async (): Promise<void> => {
    try {
      syncStatus.value = 'syncing'
      
      // TODO: 实现思维导图同步逻辑
      // await mindmapApi.syncMindmaps()
      
      // 模拟同步成功
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 更新所有思维导图的同步状态
      mindmaps.value.forEach(mindmap => {
        if (mindmap.syncStatus === 'pending') {
          mindmap.syncStatus = 'synced'
        }
      })
      
      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'
    } catch (error) {
      console.error('同步思维导图失败:', error)
      syncStatus.value = 'error'
      throw error
    }
  }
  
  /**
   * 清空搜索结果
   */
  const clearSearch = () => {
    searchKeyword.value = ''
    searchResults.value = []
  }
  
  /**
   * 重置状态
   */
  const reset = () => {
    mindmaps.value = []
    currentMindmap.value = null
    currentPage.value = 1
    total.value = 0
    loading.value = false
    clearSearch()
    syncStatus.value = 'idle'
  }
  
  return {
    // 状态
    mindmaps,
    currentPage,
    pageSize,
    total,
    loading,
    currentMindmap,
    searchKeyword,
    searchResults,
    syncStatus,
    lastSyncTime,
    
    // Actions
    fetchMindmaps,
    fetchMindmapDetail,
    createMindmap,
    updateMindmap,
    deleteMindmap,
    searchMindmaps,
    getUserMindmapCount,
    generateThumbnail,
    syncMindmaps,
    clearSearch,
    reset
  }
})

export type MindmapStore = ReturnType<typeof useMindmapStore>