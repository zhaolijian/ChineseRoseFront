/**
 * 请求相关常量
 */

/**
 * 默认请求超时时间（毫秒）
 */
export const DEFAULT_REQUEST_TIMEOUT = 10000

/**
 * 文件上传超时时间（毫秒）
 */
export const UPLOAD_TIMEOUT = 30000

/**
 * 重定向节流时间（毫秒）
 * 防止多个请求同时触发跳转导致 uni.reLaunch 报错
 */
export const REDIRECT_THROTTLE_TIME = 1500

/**
 * 请求重试次数
 */
export const REQUEST_RETRY_COUNT = 3

/**
 * 请求重试延迟（毫秒）
 */
export const REQUEST_RETRY_DELAY = 1000