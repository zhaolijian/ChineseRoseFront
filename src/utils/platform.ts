/**
 * 平台能力检测工具
 * 支持微信小程序环境和API能力检测
 */

export interface PlatformCapability {
  canUse: boolean
  reason: string
}

/**
 * 版本比较工具函数
 * @param v1 第一个版本号 (如 "2.21.2")
 * @param v2 第二个版本号 (如 "2.20.1")
 * @returns 比较结果：1表示v1>v2，0表示相等，-1表示v1<v2
 */
export function compareVersion(v1: string, v2: string): number {
  if (!v1 || !v2) {
    throw new Error('版本号不能为空')
  }

  // 分割版本号并转换为数字数组
  const parts1 = v1.split('.').map(part => {
    const num = parseInt(part, 10)
    if (isNaN(num)) {
      throw new Error(`无效的版本号格式: ${v1}`)
    }
    return num
  })

  const parts2 = v2.split('.').map(part => {
    const num = parseInt(part, 10)
    if (isNaN(num)) {
      throw new Error(`无效的版本号格式: ${v2}`)
    }
    return num
  })

  // 比较每个版本段
  const maxLength = Math.max(parts1.length, parts2.length)
  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0

    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }

  return 0
}

/**
 * 检测是否为微信小程序环境
 */
function isWechatMiniProgram(): boolean {
  try {
    const systemInfo = uni.getSystemInfoSync()
    // 微信小程序环境的platform通常为：devtools、ios、android等
    // 非微信环境（如H5、App）platform为其他值
    return systemInfo.platform !== undefined &&
           typeof systemInfo.SDKVersion === 'string'
  } catch {
    return false
  }
}

/**
 * 检测微信基础库版本是否满足要求
 * @param requiredVersion 要求的最低版本，默认为2.21.2
 */
function checkSDKVersion(requiredVersion: string = '2.21.2'): { valid: boolean; currentVersion?: string } {
  try {
    const systemInfo = uni.getSystemInfoSync()
    const currentVersion = systemInfo.SDKVersion

    if (!currentVersion) {
      return { valid: false }
    }

    // 使用新的compareVersion函数，>= 0表示当前版本不低于要求版本
    return {
      valid: compareVersion(currentVersion, requiredVersion) >= 0,
      currentVersion
    }
  } catch {
    return { valid: false }
  }
}

/**
 * 检测是否支持微信手机号一键登录
 * 基于2025年最佳实践，综合检测：
 * 1. 编译时条件编译检测
 * 2. 运行时环境检测
 * 3. 基础库版本检测(≥2.21.2)
 * 4. API能力检测
 * @returns true表示支持，false表示不支持
 */
export function canUseWechatPhoneLogin(): boolean {
  // #ifdef MP-WEIXIN
  try {
    // 1. 运行时环境双重检测
    if (process.env.UNI_PLATFORM !== 'mp-weixin') {
      return false
    }

    // 2. uni对象可用性检测
    if (typeof uni === 'undefined') {
      return false
    }

    // 3. 获取系统信息进行基础库版本检测
    let systemInfo: any
    try {
      systemInfo = uni.getSystemInfoSync()
    } catch (error) {
      // 获取系统信息失败，认为不支持
      return false
    }

    if (!systemInfo || !systemInfo.SDKVersion) {
      return false
    }

    // 检查平台是否为微信环境
    const platform = systemInfo.platform || ''
    if (platform !== 'devtools' && platform !== 'ios' && platform !== 'android') {
      return false
    }

    // 4. 基础库版本检测 - 微信小程序getPhoneNumber最低要求2.21.2
    const sdkVersion = systemInfo.SDKVersion
    if (compareVersion(sdkVersion, '2.21.2') < 0) {
      return false
    }

    // 5. API能力检测 - 检测button组件的getPhoneNumber开放能力
    if (!uni.canIUse('button.open-type.getPhoneNumber')) {
      return false
    }

    // 6. 额外检测uni.login能力（双code登录必需）
    if (!uni.canIUse('login')) {
      return false
    }

    return true
  } catch (error) {
    // 任何检测过程中的异常都认为不支持
    return false
  }
  // #endif

  // #ifndef MP-WEIXIN
  // 非微信小程序环境直接返回false
  return false
  // #endif
}

/**
 * 获取微信手机号登录能力详细信息（用于调试和用户提示）
 * @returns 检测结果详情
 */
export function getWechatPhoneLoginCapability(): PlatformCapability {
  // #ifdef MP-WEIXIN
  try {
    // 1. 运行时环境检测
    if (process.env.UNI_PLATFORM !== 'mp-weixin') {
      return {
        canUse: false,
        reason: '当前不在微信小程序环境，无法使用微信手机号登录'
      }
    }

    // 2. uni对象可用性检测
    if (typeof uni === 'undefined') {
      return {
        canUse: false,
        reason: 'uni对象不可用，可能处于非uni-app环境'
      }
    }

    // 3. 检测微信小程序环境
    if (!isWechatMiniProgram()) {
      return {
        canUse: false,
        reason: '当前不在微信小程序环境，无法使用微信手机号登录'
      }
    }

    // 4. 检测基础库版本
    const versionCheck = checkSDKVersion('2.21.2')
    if (!versionCheck.valid) {
      return {
        canUse: false,
        reason: `微信基础库版本过低（当前：${versionCheck.currentVersion || '未知'}，要求：≥2.21.2）`
      }
    }

    // 5. 检测API能力
    if (!uni.canIUse('button.open-type.getPhoneNumber')) {
      return {
        canUse: false,
        reason: '设备不支持微信手机号授权API'
      }
    }

    // 6. 检测login API能力
    if (!uni.canIUse('login')) {
      return {
        canUse: false,
        reason: '设备不支持微信登录API'
      }
    }

    // 所有检测通过
    return {
      canUse: true,
      reason: '支持微信手机号一键登录'
    }
  } catch (error) {
    return {
      canUse: false,
      reason: '平台检测失败：' + (error instanceof Error ? error.message : '未知错误')
    }
  }
  // #endif

  // #ifndef MP-WEIXIN
  return {
    canUse: false,
    reason: '非微信小程序环境'
  }
  // #endif
}

/**
 * 检测是否为tabBar页面
 * @param url 页面路径
 * @returns true表示是tabBar页面，false表示普通页面
 */
export function isTabBarPage(url: string): boolean {
  if (!url) return false

  // 提取页面路径（去除查询参数）
  const path = url.split('?')[0]

  // 定义项目中的tabBar页面列表（基于实际pages.json配置）
  const tabBarPages = [
    '/pages/index/index',    // 首页
    '/pages/notes/index',    // 笔记页
    '/pages/profile/index'   // 个人中心
  ]

  return tabBarPages.includes(path)
}

/**
 * 智能页面跳转
 * 根据目标页面类型自动选择最适合的跳转方式
 * @param url 目标页面路径
 * @param options 跳转选项
 */
export function smartNavigate(url: string, options: {
  fallback?: 'reLaunch' | 'redirectTo' | 'navigateTo'
} = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('跳转URL不能为空'))
      return
    }

    const { fallback = 'reLaunch' } = options

    if (isTabBarPage(url)) {
      // tabBar页面使用switchTab
      uni.switchTab({
        url,
        success: () => resolve(),
        fail: (error) => {
          // switchTab失败时使用fallback方式
          console.warn('switchTab失败，使用fallback跳转方式:', error)
          executeJump(url, fallback, resolve, reject)
        }
      })
    } else {
      // 普通页面使用fallback方式
      executeJump(url, fallback, resolve, reject)
    }
  })
}

/**
 * 执行具体的跳转操作
 * @param url 目标URL
 * @param method 跳转方法
 * @param resolve Promise resolve回调
 * @param reject Promise reject回调
 */
function executeJump(
  url: string,
  method: 'reLaunch' | 'redirectTo' | 'navigateTo',
  resolve: () => void,
  reject: (error: any) => void
) {
  const jumpOptions = {
    url,
    success: () => resolve(),
    fail: (error: any) => reject(error)
  }

  switch (method) {
    case 'reLaunch':
      uni.reLaunch(jumpOptions)
      break
    case 'redirectTo':
      uni.redirectTo(jumpOptions)
      break
    case 'navigateTo':
      uni.navigateTo(jumpOptions)
      break
    default:
      reject(new Error(`不支持的跳转方法: ${method}`))
  }
}
