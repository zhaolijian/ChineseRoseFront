import request from '@/utils/request'

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

export interface MindmapListParams {
  page?: number
  pageSize?: number
  keyword?: string
  bookId?: number
}

export interface MindmapListResponse {
  mindmaps: Mindmap[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface CreateMindmapPayload {
  title?: string
  bookId: number
  nodes?: MindmapNode[]
}

export interface UpdateMindmapPayload {
  title?: string
  nodes?: MindmapNode[]
}

export const getMindmaps = (params: MindmapListParams = {}): Promise<MindmapListResponse> => {
  return request.get<MindmapListResponse>('/v1/mindmaps', params)
}

export const getMindmapDetail = (id: number): Promise<Mindmap> => {
  return request.get<Mindmap>(`/v1/mindmaps/${id}`)
}

export const createMindmap = (payload: CreateMindmapPayload): Promise<Mindmap> => {
  return request.post<Mindmap>('/v1/mindmaps', payload)
}

export const updateMindmap = (id: number, payload: UpdateMindmapPayload): Promise<Mindmap> => {
  return request.put<Mindmap>(`/v1/mindmaps/${id}`, payload)
}

export const deleteMindmap = (id: number): Promise<void> => {
  return request.delete(`/v1/mindmaps/${id}`)
}

export const searchMindmaps = (keyword: string, params: Omit<MindmapListParams, 'keyword'> = {}): Promise<MindmapListResponse> => {
  return request.get<MindmapListResponse>('/v1/mindmaps/search', { keyword, ...params })
}

export const syncMindmaps = (): Promise<void> => {
  return request.post('/v1/mindmaps/sync')
}

export const generateMindmapThumbnail = (id: number): Promise<{ url: string }> => {
  return request.post<{ url: string }>(`/v1/mindmaps/${id}/thumbnail`)
}

export const getMindmapStats = (): Promise<{ total: number }> => {
  return request.get<{ total: number }>('/v1/mindmaps/stats')
}
