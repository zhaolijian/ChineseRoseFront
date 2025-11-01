/**
 * 跨平台Base64工具
 * 解决小程序环境不支持atob/btoa的问题
 */

/**
 * Base64解码 - 跨平台兼容
 * 支持标准Base64和Base64URL格式
 * @param str Base64编码的字符串
 * @returns 解码后的字符串
 */
export function base64Decode(str: string): string {
  // 将base64url转换为标准base64
  let base64String = str.replace(/-/g, '+').replace(/_/g, '/')
  
  // 添加填充字符
  const padding = base64String.length % 4
  if (padding > 0) {
    base64String += '='.repeat(4 - padding)
  }

  // #ifdef MP-WEIXIN
  // 小程序环境：使用uni.base64ToArrayBuffer
  try {
    const arrayBuffer = uni.base64ToArrayBuffer(base64String)
    const uint8Array = new Uint8Array(arrayBuffer)

    // 将Uint8Array转换为字符串
    let result = ''
    for (let i = 0; i < uint8Array.length; i++) {
      result += String.fromCharCode(uint8Array[i])
    }
    return result
  } catch (error) {
    console.error('[base64Decode] 小程序解码失败，降级到手动解码:', error)
    // 降级到手动解码
    return manualBase64Decode(base64String)
  }
  // #endif

  // 兜底方案：手动实现Base64解码
  return manualBase64Decode(base64String)
}

/**
 * Base64编码 - 跨平台兼容
 * @param str 原始字符串
 * @returns Base64编码的字符串
 */
export function base64Encode(str: string): string {
  // #ifdef MP-WEIXIN
  // 小程序环境：使用uni.arrayBufferToBase64
  try {
    const uint8Array = new Uint8Array(str.length)
    for (let i = 0; i < str.length; i++) {
      uint8Array[i] = str.charCodeAt(i)
    }
    return uni.arrayBufferToBase64(uint8Array.buffer)
  } catch (error) {
    console.error('[base64Encode] 小程序编码失败:', error)
    throw new Error('Base64编码失败')
  }
  // #endif

  // 兜底方案：手动实现Base64编码
  return manualBase64Encode(str)
}

/**
 * 手动实现Base64解码（兜底方案）
 */
function manualBase64Decode(str: string): string {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let bits = 0
  let buffer = 0

  for (let i = 0; i < str.length; i++) {
    if (str[i] === '=') break

    const charIndex = base64Chars.indexOf(str[i])
    if (charIndex === -1) continue

    buffer = (buffer << 6) | charIndex
    bits += 6

    if (bits >= 8) {
      bits -= 8
      result += String.fromCharCode((buffer >> bits) & 0xFF)
    }
  }

  return result
}

/**
 * 手动实现Base64编码（兜底方案）
 */
function manualBase64Encode(str: string): string {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0

  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const b = i < str.length ? str.charCodeAt(i++) : 0
    const c = i < str.length ? str.charCodeAt(i++) : 0

    const bitmap = (a << 16) | (b << 8) | c

    result += base64Chars[(bitmap >> 18) & 0x3F]
    result += base64Chars[(bitmap >> 12) & 0x3F]
    result += i - 1 < str.length ? base64Chars[(bitmap >> 6) & 0x3F] : '='
    result += i < str.length ? base64Chars[bitmap & 0x3F] : '='
  }

  return result
}
