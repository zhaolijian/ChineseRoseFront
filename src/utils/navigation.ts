/**
 * 导航工具模块
 * 提供智能跳转和登录后导航功能
 */

import { logger, createContext } from '@/utils'

/**
 * 登录成功后的智能跳转
 * 根据传入的目标URL和页面类型自动选择最合适的跳转方式
 * @param targetUrl 目标页面URL，可选
 */
export function navigateAfterLogin(targetUrl?: string): void {
  const ctx = createContext()

  try {
    if (!targetUrl) {
      // 默认跳转到书架页（tabBar）
      logger.debug(ctx, '[navigateAfterLogin] 无目标URL，跳转到默认首页')
      uni.switchTab({ url: '/pages/index/index' })
      return
    }

    logger.debug(ctx, '[navigateAfterLogin] 准备跳转到目标页面', { targetUrl })

    // 定义项目中的tabBar页面列表（需要与pages.json保持一致）
    const tabBarPages = [
      '/pages/index/index',   // 书架首页
      '/pages/notes/index',   // 笔记首页
      '/pages/profile/index'  // 个人中心
    ]

    // 提取页面路径（去除查询参数）
    const path = targetUrl.split('?')[0]

    if (tabBarPages.includes(path)) {
      // 如果是tabBar页面，使用switchTab
      logger.debug(ctx, '[navigateAfterLogin] 目标为tabBar页面，使用switchTab跳转')
      uni.switchTab({
        url: targetUrl,
        success() {
          logger.info(ctx, '[navigateAfterLogin] tabBar页面跳转成功', { targetUrl })
        },
        fail(error) {
          logger.error(ctx, '[navigateAfterLogin] tabBar页面跳转失败', { targetUrl, error })
          // 降级到reLaunch
          uni.reLaunch({ url: targetUrl })
        }
      })
    } else {
      // 如果是普通页面，使用reLaunch清空页面栈
      logger.debug(ctx, '[navigateAfterLogin] 目标为普通页面，使用reLaunch跳转')
      uni.reLaunch({
        url: targetUrl,
        success() {
          logger.info(ctx, '[navigateAfterLogin] 普通页面跳转成功', { targetUrl })
        },
        fail(error) {
          logger.error(ctx, '[navigateAfterLogin] 普通页面跳转失败', { targetUrl, error })
        }
      })
    }
  } catch (error) {
    logger.error(ctx, '[navigateAfterLogin] 跳转过程异常', { targetUrl, error })
    // 发生异常时使用最安全的跳转方式
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

/**
 * 检查是否为tabBar页面
 * @param url 页面路径
 * @returns true表示是tabBar页面
 */
export function isTabBarPage(url: string): boolean {
  if (!url) return false

  const path = url.split('?')[0]
  const tabBarPages = ['/pages/index/index', '/pages/notes/index', '/pages/profile/index']

  return tabBarPages.includes(path)
}

/**
 * 智能导航到目标页面
 * 自动选择最适合的跳转方式
 * @param url 目标页面URL
 * @param options 跳转选项
 */
export interface NavigateOptions {
  /** 失败时的降级跳转方式 */
  fallback?: 'reLaunch' | 'redirectTo' | 'navigateTo'
  /** 是否显示loading */
  showLoading?: boolean
  /** loading文本 */
  loadingText?: string
}

export function smartNavigate(url: string, options: NavigateOptions = {}): Promise<void> {
  const ctx = createContext()
  const { fallback = 'reLaunch', showLoading = false, loadingText = '跳转中...' } = options

  return new Promise((resolve, reject) => {
    if (!url) {
      const error = new Error('跳转URL不能为空')
      logger.error(ctx, '[smartNavigate] URL参数错误', { url })
      reject(error)
      return
    }

    if (showLoading) {
      uni.showLoading({ title: loadingText, mask: true })
    }

    const hideLoadingAndResolve = () => {
      if (showLoading) {
        uni.hideLoading()
      }
      resolve()
    }

    const hideLoadingAndReject = (error: any) => {
      if (showLoading) {
        uni.hideLoading()
      }
      reject(error)
    }

    try {
      if (isTabBarPage(url)) {
        // tabBar页面使用switchTab
        logger.debug(ctx, '[smartNavigate] 使用switchTab跳转到tabBar页面', { url })
        uni.switchTab({
          url,
          success() {
            logger.info(ctx, '[smartNavigate] switchTab跳转成功', { url })
            hideLoadingAndResolve()
          },
          fail(error) {
            logger.warn(ctx, '[smartNavigate] switchTab失败，使用fallback方式', { url, error, fallback })
            executeNavigation(url, fallback, hideLoadingAndResolve, hideLoadingAndReject)
          }
        })
      } else {
        // 普通页面使用fallback方式
        logger.debug(ctx, '[smartNavigate] 使用fallback方式跳转到普通页面', { url, fallback })
        executeNavigation(url, fallback, hideLoadingAndResolve, hideLoadingAndReject)
      }
    } catch (error) {
      logger.error(ctx, '[smartNavigate] 跳转过程异常', { url, error })
      hideLoadingAndReject(error)
    }
  })
}

/**
 * 执行具体的导航操作
 */
function executeNavigation(
  url: string,
  method: 'reLaunch' | 'redirectTo' | 'navigateTo',
  onSuccess: () => void,
  onFail: (error: any) => void
) {
  const ctx = createContext()
  const options = {
    url,
    success() {
      logger.info(ctx, `[executeNavigation] ${method}跳转成功`, { url })
      onSuccess()
    },
    fail(error: any) {
      logger.error(ctx, `[executeNavigation] ${method}跳转失败`, { url, error })
      onFail(error)
    }
  }

  switch (method) {
    case 'reLaunch':
      uni.reLaunch(options)
      break
    case 'redirectTo':
      uni.redirectTo(options)
      break
    case 'navigateTo':
      uni.navigateTo(options)
      break
    default: {
      const error = new Error(`不支持的跳转方法: ${method}`)
      logger.error(ctx, '[executeNavigation] 跳转方法不支持', { method })
      onFail(error)
      break
    }
  }
}

/**
 * 获取页面参数中的目标跳转URL
 * 用于登录页面获取登录成功后要跳转的目标页面
 * @param options onLoad传入的options参数
 * @returns 解码后的目标URL
 */
export function getTargetUrlFromQuery(options: any): string | undefined {
  const ctx = createContext()

  try {
    if (!options || !options.redirect) {
      logger.debug(ctx, '[getTargetUrlFromQuery] 无redirect参数')
      return undefined
    }

    // URL解码
    const targetUrl = decodeURIComponent(options.redirect)
    logger.debug(ctx, '[getTargetUrlFromQuery] 解析到目标URL', {
      rawRedirect: options.redirect,
      targetUrl
    })

    // 基础验证：确保是本应用内的页面
    if (!targetUrl.startsWith('/pages')) {
      logger.warn(ctx, '[getTargetUrlFromQuery] 目标URL不是有效的页面路径', { targetUrl })
      return undefined
    }

    return targetUrl
  } catch (error) {
    logger.error(ctx, '[getTargetUrlFromQuery] 解析目标URL失败', { options, error })
    return undefined
  }
}
