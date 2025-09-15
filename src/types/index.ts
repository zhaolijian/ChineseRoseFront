// 基础API响应类型 - 与后端保持一致的简化格式
export interface ApiResponse<T = any> {
  code: number      // 0=成功, 10102=token过期, 其他非0=错误
  message: string   // 错误消息
  data: T          // 成功时的数据
  timestamp?: number
}

// 分页请求参数
export interface PageRequest {
  page?: number
  pageSize?: number
  keyword?: string
}

// 分页响应数据
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 用户相关类型
export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  email?: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  code?: string // 微信登录code
  phone?: string // 手机号
  verifyCode?: string // 验证码
}

export interface LoginResponse {
  token: string
  user: User
  expiresIn: number
}

// 书籍相关类型
export interface Book {
  id: number
  title: string
  author: string
  isbn?: string
  publisher?: string
  publishDate?: string
  coverUrl?: string
  description?: string
  status: BookStatus
  readingProgress: number // 阅读进度 0-100
  totalPages?: number
  currentPage?: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export enum BookStatus {
  WANT_READ = 'WANT_READ',
  READING = 'READING', 
  FINISHED = 'FINISHED',
  ABANDONED = 'ABANDONED'
}

export interface CreateBookRequest {
  title: string
  author: string
  isbn?: string
  publisher?: string
  publishDate?: string
  coverUrl?: string
  description?: string
  totalPages?: number
  tags?: string[]
}

// 笔记相关类型
export interface Note {
  id: number
  bookId: number
  title: string
  content: string
  pageNumber?: number
  chapterName?: string
  noteType: NoteType
  tags: string[]
  images: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
  book?: Book // 关联的书籍信息
}

export enum NoteType {
  READING = 'READING', // 阅读笔记
  THOUGHT = 'THOUGHT', // 思考感悟
  QUOTE = 'QUOTE', // 摘录
  SUMMARY = 'SUMMARY' // 总结
}

export interface CreateNoteRequest {
  bookId: number
  title: string
  content: string
  pageNumber?: number
  chapterName?: string
  noteType: NoteType
  tags?: string[]
  images?: string[]
  isPublic?: boolean
}

// OCR相关类型
export interface OCRRequest {
  imageUrl: string
  bookId?: number
  pageNumber?: number
  chapterName?: string
}

export interface OCRResponse {
  text: string
  confidence: number
  regions: OCRRegion[]
}

export interface OCRRegion {
  text: string
  confidence: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

// 思维导图相关类型
export interface MindMap {
  id: number
  bookId: number
  title: string
  content: string // JSON格式的思维导图数据
  thumbnail?: string // 预览图
  createdAt: string
  updatedAt: string
  book?: Book
}

export interface CreateMindMapRequest {
  bookId: number
  title: string
  content: string
  thumbnail?: string
}

// 同步相关类型
export interface SyncStatus {
  lastSyncTime: string
  hasUnsyncedChanges: boolean
  conflictCount: number
  pendingCount: number
}

export interface SyncRequest {
  lastSyncTime?: string
  changes: SyncChange[]
}

export interface SyncChange {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  table: 'books' | 'notes' | 'mindmaps'
  data: any
  timestamp: string
}

// 平台相关类型
export interface PlatformInfo {
  platform: 'mp-weixin' | 'mp-alipay' | 'h5' | 'app-plus'
  isWeixin: boolean
  isAlipay: boolean
  isH5: boolean
  isApp: boolean
  systemInfo?: UniApp.GetSystemInfoResult
}

// 存储相关类型
export interface StorageOptions {
  encrypt?: boolean // 是否加密存储
  expires?: number // 过期时间（秒）
}

// 简化的错误类型 - 与后端错误响应格式一致
export interface RequestError {
  code: number     // 错误码（直接使用数字）
  message: string  // 错误消息
  data?: any      // 可选的额外数据
}

// 导出错误码相关定义
export * from './errorCodes'