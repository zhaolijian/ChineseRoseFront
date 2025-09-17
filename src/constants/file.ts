/**
 * 文件相关常量
 */

/**
 * 图片最大大小（字节）
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * 头像最大大小（字节）
 */
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

/**
 * 支持的图片格式
 */
export const SUPPORTED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp']

/**
 * 支持的图片 MIME 类型
 */
export const SUPPORTED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
]

/**
 * 压缩图片的默认质量
 */
export const IMAGE_COMPRESS_QUALITY = 0.8

/**
 * 缩略图尺寸
 */
export const THUMBNAIL_SIZE = {
  width: 200,
  height: 200
}