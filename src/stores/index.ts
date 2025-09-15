import { createPinia } from 'pinia'

// 创建pinia实例
const pinia = createPinia()

// 导出store模块
export { useUserStore } from './modules/user'
export { useBookStore } from './modules/book'

export default pinia