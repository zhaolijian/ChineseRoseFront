/**
 * TabBar相关工具函数
 */

// TabBar页面路由列表
const TAB_BAR_ROUTES = [
  'pages/index/index',
  'pages/notes/index', 
  'pages/mindmap/index',
  'pages/profile/index'
]

/**
 * 安全地隐藏TabBar
 * 只在当前页面是TabBar页面时才执行隐藏操作
 */
export const safeHideTabBar = () => {
  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    // @ts-ignore
    const route = currentPage?.route
    
    // 检查是否是TabBar页面
    if (route && TAB_BAR_ROUTES.includes(route)) {
      uni.hideTabBar({ animation: false })
      console.log('[TabBar] 隐藏原生TabBar成功')
    } else {
      console.log('[TabBar] 当前页面非TabBar页面，跳过隐藏操作')
    }
  } catch (e) {
    console.warn('[TabBar] 隐藏TabBar失败:', e)
  }
}

/**
 * 安全地显示TabBar
 */
export const safeShowTabBar = () => {
  try {
    uni.showTabBar({ animation: false })
    console.log('[TabBar] 显示原生TabBar成功')
  } catch (e) {
    console.warn('[TabBar] 显示TabBar失败:', e)
  }
}

/**
 * 检查当前页面是否是TabBar页面
 */
export const isTabBarPage = (): boolean => {
  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    // @ts-ignore
    const route = currentPage?.route
    return route && TAB_BAR_ROUTES.includes(route)
  } catch (e) {
    console.warn('[TabBar] 检查TabBar页面失败:', e)
    return false
  }
}