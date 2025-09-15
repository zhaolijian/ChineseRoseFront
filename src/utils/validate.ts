/**
 * 表单验证工具
 */

/**
 * 验证手机号格式
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证密码强度
 */
export function isValidPassword(password: string): boolean {
  // 至少8位，包含字母和数字
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
  return passwordRegex.test(password)
}

/**
 * 验证验证码格式
 */
export function isValidCode(code: string): boolean {
  const codeRegex = /^\d{6}$/
  return codeRegex.test(code)
}