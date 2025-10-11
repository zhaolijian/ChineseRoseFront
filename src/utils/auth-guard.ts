/**
 * ADR-007: 统一登录守卫工具
 *
 * 提供统一的登录检查和引导机制
 */

import { useUserStore } from '@/stores/modules/user'

/**
 * 登录守卫：检查登录状态，未登录时引导登录
 * @param actionName 操作名称（用于提示文案）
 * @returns true-已登录可继续，false-未登录已引导
 */
export const ensureLoggedIn = async (actionName = '此操作'): Promise<boolean> => {
  const userStore = useUserStore()

  if (userStore.isLoggedIn) {
    return true  // 已登录，允许继续
  }

  // 未登录：显示友好的登录引导Modal
  return new Promise((resolve) => {
    uni.showModal({
      title: '需要登录',
      content: `${actionName}需要登录，是否立即登录？`,
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/login/login' })
        }
        resolve(false)
      }
    })
  })
}
