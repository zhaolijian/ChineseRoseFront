// API模块统一导出
export * from './modules/auth'
export * from './modules/book'
export * from './modules/note'

// 为了向后兼容，也提供命名空间导出
import * as authApi from './modules/auth'
import * as bookApi from './modules/book'
import * as noteApi from './modules/note'

export {
  authApi,
  bookApi,
  noteApi
}