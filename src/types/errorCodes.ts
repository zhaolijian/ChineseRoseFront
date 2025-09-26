/**
 * 前端错误码枚举
 * 与后端 pkg/errors/code.go 保持一致
 */

// ================== 错误码枚举类型定义 ==================
/**
 * 错误码枚举 - 提供类型安全的错误码常量
 * 使用枚举确保类型安全，同时保持数字常量的兼容性
 */
export enum ErrorCode {
  // ================== 成功状态 ==================
  SUCCESS = 0,

  // ================== 客户端错误 (1xxxx) ==================
  
  // 1000x - 通用客户端错误
  ERR_BAD_REQUEST = 10001,      // 请求参数错误
  ERR_UNAUTHORIZED = 10002,     // 未授权
  ERR_FORBIDDEN = 10003,        // 禁止访问
  ERR_NOT_FOUND = 10004,        // 资源不存在
  ERR_METHOD_NOT_ALLOW = 10005, // 方法不允许
  ERR_NOT_ACCEPTABLE = 10006,   // 不可接受的请求
  ERR_REQUEST_TIMEOUT = 10007,  // 请求超时
  ERR_CONFLICT = 10008,         // 请求冲突
  ERR_TOO_MANY_REQUESTS = 10009, // 请求过于频繁

  // 1001x - 认证授权错误
  ERR_INVALID_TOKEN = 10101,     // 无效的令牌
  ERR_TOKEN_EXPIRED = 10102,     // 令牌已过期
  ERR_TOKEN_MALFORMED = 10103,   // 令牌格式错误
  ERR_REFRESH_REQUIRED = 10104,  // 需要刷新令牌
  ERR_INSUFFICIENT_SCOPE = 10105, // 权限不足
  ERR_UNI_LOGIN_FAILED = 10106,  // uni.login调用失败
  ERR_WX_CODE_EMPTY = 10107,     // 微信登录code为空
  ERR_PHONE_LOGIN_FAILED = 10108, // 手机号登录失败
  ERR_OPERATION_IN_PROGRESS = 10109, // 操作正在进行中

  // 1002x - 参数验证错误
  ERR_INVALID_PARAM = 10201,     // 参数验证失败
  ERR_MISSING_PARAM = 10202,     // 缺少必需参数
  ERR_INVALID_FORMAT = 10203,    // 参数格式错误
  ERR_PARAM_OUT_OF_RANGE = 10204, // 参数超出范围
  ERR_INVALID_REQUEST = 10205,   // 无效的请求格式
  ERR_INVALID_PARAMS = 10206,    // 无效参数（通用）

  // 1003x - 存储相关错误
  ERR_STORAGE_FAILED = 10301,    // 存储操作失败

  // ================== 业务逻辑错误 (2xxxx) ==================

  // 2001x - 用户相关错误
  ERR_USER_NOT_FOUND = 20101,        // 用户不存在
  ERR_USER_DISABLED = 20102,         // 用户已被禁用
  ERR_USER_ALREADY_EXISTS = 20103,   // 用户已存在
  ERR_USER_INVALID_STATUS = 20104,   // 用户状态无效
  ERR_PHONE_ALREADY_EXISTS = 20105,  // 手机号已存在
  ERR_EMAIL_ALREADY_EXISTS = 20106,  // 邮箱已存在
  ERR_INVALID_CREDENTIALS = 20107,   // 凭据无效
  ERR_ACCOUNT_LOCKED = 20108,        // 账户已锁定
  ERR_VERIFY_CODE_INVALID = 20109,   // 验证码无效
  ERR_VERIFY_CODE_EXPIRED = 20110,   // 验证码已过期
  ERR_ALREADY_LOGGED_IN = 20111,     // 用户已登录

  // 2002x - 书籍相关错误
  ERR_BOOK_NOT_FOUND = 20201,        // 书籍不存在
  ERR_BOOK_ALREADY_EXISTS = 20202,   // 书籍已存在
  ERR_BOOK_INVALID_STATUS = 20203,   // 书籍状态无效
  ERR_ISBN_NOT_FOUND = 20204,        // ISBN信息未找到
  ERR_ISBN_INVALID = 20205,          // ISBN格式无效
  ERR_BOOK_PERM_DENIED = 20206,      // 书籍权限不足
  ERR_BOOK_QUOTA_EXCEEDED = 20207,   // 书籍数量超限

  // 2003x - 笔记相关错误
  ERR_NOTE_NOT_FOUND = 20301,        // 笔记不存在
  ERR_NOTE_ALREADY_EXISTS = 20302,   // 笔记已存在
  ERR_NOTE_INVALID_TYPE = 20303,     // 笔记类型无效
  ERR_NOTE_PERM_DENIED = 20304,      // 笔记权限不足
  ERR_NOTE_QUOTA_EXCEEDED = 20305,   // 笔记数量超限
  ERR_NOTE_CONTENT_TOO_LONG = 20306, // 笔记内容过长

  // 2004x - OCR相关错误
  ERR_OCR_FAILED = 20401,            // OCR识别失败
  ERR_OCR_UNSUPPORTED_FORMAT = 20402, // OCR不支持的格式
  ERR_OCR_IMAGE_TOO_LARGE = 20403,   // OCR图片过大
  ERR_OCR_IMAGE_TOO_SMALL = 20404,   // OCR图片过小
  ERR_OCR_NO_TEXT_FOUND = 20405,     // OCR未识别到文字
  ERR_OCR_QUOTA_EXCEEDED = 20406,    // OCR配额已超限
  ERR_OCR_SERVICE_UNAVAIL = 20407,   // OCR服务不可用
  ERR_OCR_TIMEOUT = 20408,           // OCR识别超时
  ERR_OCR_VK_NOT_SUPPORTED = 20409,  // 设备不支持VisionKit OCR
  ERR_OCR_IMAGE_PROCESS_ERROR = 20410, // OCR图片处理失败
  ERR_OCR_RECOGNITION_FAILED = 20411, // OCR文字识别失败

  // 2005x - AI服务相关错误
  ERR_AI_FAILED = 20501,             // AI处理失败
  ERR_AI_QUOTA_EXCEEDED = 20502,     // AI配额已超限
  ERR_AI_SERVICE_UNAVAIL = 20503,    // AI服务不可用
  ERR_AI_CONTENT_FILTERED = 20504,   // AI内容被过滤
  ERR_AI_RESPONSE_INVALID = 20505,   // AI响应无效

  // 2006x - 同步相关错误
  ERR_SYNC_FAILED = 20601,           // 同步失败
  ERR_SYNC_CONFLICT = 20602,         // 同步冲突
  ERR_SYNC_VERSION_MISMATCH = 20603, // 同步版本不匹配
  ERR_SYNC_DATA_CORRUPTED = 20604,   // 同步数据损坏
  ERR_SYNC_QUOTA_EXCEEDED = 20605,   // 同步配额超限

  // 2007x - 存储相关错误
  ERR_STORAGE_UPLOAD_FAILED = 20701,   // 上传失败
  ERR_STORAGE_DOWNLOAD_FAILED = 20702, // 下载失败
  ERR_STORAGE_FILE_NOT_FOUND = 20703,  // 文件不存在
  ERR_STORAGE_QUOTA_EXCEEDED = 20704,  // 存储配额超限
  ERR_STORAGE_INVALID_FORMAT = 20705,  // 文件格式无效
  ERR_STORAGE_FILE_TOO_LARGE = 20706,  // 文件过大

  // 2009x - 通用业务错误
  ERR_ALREADY_EXISTS = 20901,          // 资源已存在
  ERR_OPERATION_FAILED = 20902,        // 操作失败
  ERR_INVALID_INPUT = 20903,           // 输入数据无效
  ERR_CONFLICT_ERROR = 20904,          // 数据冲突
  ERR_QUOTA_EXCEEDED = 20905,          // 配额已超限
  ERR_EXPORT_FAILED = 20906,           // 导出失败
  ERR_GENERATE_FAILED = 20907,         // 生成失败
  ERR_PROCESSING_FAILED = 20908,       // 处理失败
  ERR_VALIDATION_FAILED = 20909,       // 验证失败
  ERR_BUSINESS_RULE_VIOLATED = 20910,  // 业务规则违反

  // ================== 服务器错误 (5xxxx) ==================

  // 5000x - 通用服务器错误
  ERR_INTERNAL_SERVER = 50001,     // 服务器内部错误
  ERR_SERVICE_UNAVAILABLE = 50002, // 服务不可用
  ERR_SERVICE_TIMEOUT = 50003,     // 服务超时
  ERR_SERVICE_OVERLOAD = 50004,    // 服务过载
  ERR_MAINTENANCE_MODE = 50005,    // 维护模式

  // 5001x - 数据库错误
  ERR_DATABASE_ERROR = 50101,      // 数据库错误
  ERR_DATABASE_TIMEOUT = 50102,    // 数据库超时
  ERR_DATABASE_CONN_FAILED = 50103, // 数据库连接失败
  ERR_DATABASE_DEADLOCK = 50104,   // 数据库死锁
  ERR_DATABASE_CONSTRAINT = 50105, // 数据库约束违反

  // 5002x - 缓存错误
  ERR_CACHE_ERROR = 50201,         // 缓存错误
  ERR_CACHE_TIMEOUT = 50202,       // 缓存超时
  ERR_CACHE_CONN_FAILED = 50203,   // 缓存连接失败
  ERR_CACHE_KEY_NOT_FOUND = 50204, // 缓存键不存在

  // 5003x - 外部服务错误
  ERR_EXTERNAL_SERVICE = 50301,    // 外部服务错误
  ERR_EXTERNAL_TIMEOUT = 50302,    // 外部服务超时
  ERR_EXTERNAL_UNAVAIL = 50303,    // 外部服务不可用
  ERR_EXTERNAL_AUTH = 50304,       // 外部服务认证失败
  ERR_EXTERNAL_QUOTA = 50305,      // 外部服务配额超限

  // 5004x - 配置错误
  ERR_CONFIG_ERROR = 50401,        // 配置错误
  ERR_CONFIG_MISSING = 50402,      // 配置缺失
  ERR_CONFIG_INVALID = 50403,      // 配置无效

  // ================== 系统级错误 (9xxxx) ==================

  // 9000x - 系统错误
  ERR_SYSTEM_ERROR = 90001,        // 系统错误
  ERR_SYSTEM_PANIC = 90002,        // 系统恐慌
  ERR_SYSTEM_OUT_OF_MEMORY = 90003, // 内存不足
  ERR_SYSTEM_DISK_FULL = 90004,    // 磁盘空间不足
  ERR_SYSTEM_OVERLOAD = 90005,     // 系统过载
}

// ================== 向后兼容的常量导出 ==================
// 为了保持向后兼容性，从枚举导出常用的错误码常量
export const SUCCESS = ErrorCode.SUCCESS

// 常用的认证相关错误码
export const ERR_UNAUTHORIZED = ErrorCode.ERR_UNAUTHORIZED
export const ERR_TOKEN_EXPIRED = ErrorCode.ERR_TOKEN_EXPIRED
export const ERR_INVALID_TOKEN = ErrorCode.ERR_INVALID_TOKEN
export const ERR_FORBIDDEN = ErrorCode.ERR_FORBIDDEN

// 常用的业务错误码
export const ERR_BAD_REQUEST = ErrorCode.ERR_BAD_REQUEST
export const ERR_NOT_FOUND = ErrorCode.ERR_NOT_FOUND
export const ERR_OPERATION_FAILED = ErrorCode.ERR_OPERATION_FAILED
export const ERR_INVALID_PARAM = ErrorCode.ERR_INVALID_PARAM

// 用户相关错误码
export const ERR_USER_NOT_FOUND = ErrorCode.ERR_USER_NOT_FOUND
export const ERR_PHONE_ALREADY_EXISTS = ErrorCode.ERR_PHONE_ALREADY_EXISTS
export const ERR_INVALID_CREDENTIALS = ErrorCode.ERR_INVALID_CREDENTIALS
export const ERR_VERIFY_CODE_INVALID = ErrorCode.ERR_VERIFY_CODE_INVALID
export const ERR_VERIFY_CODE_EXPIRED = ErrorCode.ERR_VERIFY_CODE_EXPIRED
export const ERR_ACCOUNT_LOCKED = ErrorCode.ERR_ACCOUNT_LOCKED

// 注意：其他错误码请直接使用 ErrorCode 枚举访问，如：ErrorCode.ERR_BOOK_NOT_FOUND

/**
 * 用户友好的错误消息映射
 * 针对不同业务场景提供更好的用户体验
 */
export const ERROR_MESSAGES = {
  // 认证相关
  [ErrorCode.ERR_UNAUTHORIZED]: '请先登录',
  [ErrorCode.ERR_TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCode.ERR_INVALID_TOKEN]: '登录状态异常，请重新登录',
  [ErrorCode.ERR_FORBIDDEN]: '您没有权限执行此操作',
  [ErrorCode.ERR_UNI_LOGIN_FAILED]: '微信登录调用失败，请重试',
  [ErrorCode.ERR_WX_CODE_EMPTY]: '获取微信授权码失败，请重试',
  [ErrorCode.ERR_PHONE_LOGIN_FAILED]: '手机号登录失败，请重试',
  [ErrorCode.ERR_OPERATION_IN_PROGRESS]: '操作正在进行中，请稍后',

  // 用户相关
  [ErrorCode.ERR_USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.ERR_PHONE_ALREADY_EXISTS]: '手机号已被注册',
  [ErrorCode.ERR_INVALID_CREDENTIALS]: '账号或密码错误',
  [ErrorCode.ERR_VERIFY_CODE_INVALID]: '验证码错误',
  [ErrorCode.ERR_VERIFY_CODE_EXPIRED]: '验证码已过期，请重新获取',
  [ErrorCode.ERR_ACCOUNT_LOCKED]: '账户已被锁定，请联系客服',
  [ErrorCode.ERR_ALREADY_LOGGED_IN]: '您已经登录，如需切换账号请先退出',
  
  // 书籍相关
  [ErrorCode.ERR_BOOK_NOT_FOUND]: '书籍不存在或已删除',
  [ErrorCode.ERR_BOOK_ALREADY_EXISTS]: '书籍已存在，不可重复添加',
  [ErrorCode.ERR_BOOK_QUOTA_EXCEEDED]: '书籍数量已达上限',
  [ErrorCode.ERR_ISBN_NOT_FOUND]: '未找到该ISBN对应的书籍信息',
  [ErrorCode.ERR_ISBN_INVALID]: 'ISBN格式不正确',

  // 笔记相关
  [ErrorCode.ERR_NOTE_NOT_FOUND]: '笔记不存在或已删除',
  [ErrorCode.ERR_NOTE_QUOTA_EXCEEDED]: '笔记数量已达上限',
  [ErrorCode.ERR_NOTE_CONTENT_TOO_LONG]: '笔记内容过长，请精简后重试',

  // OCR相关
  [ErrorCode.ERR_OCR_FAILED]: 'OCR识别失败，请重试',
  [ErrorCode.ERR_OCR_UNSUPPORTED_FORMAT]: '不支持该图片格式',
  [ErrorCode.ERR_OCR_IMAGE_TOO_LARGE]: '图片过大，请压缩后重试',
  [ErrorCode.ERR_OCR_IMAGE_TOO_SMALL]: '图片过小，无法识别文字',
  [ErrorCode.ERR_OCR_NO_TEXT_FOUND]: '图片中未识别到文字',
  [ErrorCode.ERR_OCR_QUOTA_EXCEEDED]: 'OCR识别次数已用完，请明天再试',
  [ErrorCode.ERR_OCR_SERVICE_UNAVAIL]: 'OCR服务暂时不可用，请稍后重试',
  [ErrorCode.ERR_OCR_TIMEOUT]: 'OCR识别超时，网络可能不稳定，请重试',
  [ErrorCode.ERR_OCR_VK_NOT_SUPPORTED]: '当前设备不支持OCR功能，建议手动输入文字内容',
  [ErrorCode.ERR_OCR_IMAGE_PROCESS_ERROR]: '图片处理失败，可能图片格式不支持，请重试',
  [ErrorCode.ERR_OCR_RECOGNITION_FAILED]: '文字识别失败，图片可能模糊或文字不清晰，请重试',

  // AI服务相关
  [ErrorCode.ERR_AI_FAILED]: 'AI处理失败，请重试',
  [ErrorCode.ERR_AI_QUOTA_EXCEEDED]: 'AI服务使用次数已达上限',
  [ErrorCode.ERR_AI_SERVICE_UNAVAIL]: 'AI服务暂时不可用，请稍后重试',
  [ErrorCode.ERR_AI_CONTENT_FILTERED]: '内容包含敏感信息，无法处理',

  // 存储相关
  [ErrorCode.ERR_STORAGE_UPLOAD_FAILED]: '文件上传失败，请检查网络后重试',
  [ErrorCode.ERR_STORAGE_DOWNLOAD_FAILED]: '文件下载失败，请检查网络后重试',
  [ErrorCode.ERR_STORAGE_FILE_NOT_FOUND]: '文件不存在或已删除',
  [ErrorCode.ERR_STORAGE_QUOTA_EXCEEDED]: '存储空间已满，请清理后重试',
  [ErrorCode.ERR_STORAGE_INVALID_FORMAT]: '文件格式不支持',
  [ErrorCode.ERR_STORAGE_FILE_TOO_LARGE]: '文件太大，请选择小于10M的文件',

  // 网络和服务器错误
  [ErrorCode.ERR_TOO_MANY_REQUESTS]: '请求过于频繁，请稍后再试',
  [ErrorCode.ERR_REQUEST_TIMEOUT]: '请求超时，请检查网络连接',
  [ErrorCode.ERR_SERVICE_UNAVAILABLE]: '服务暂时不可用，请稍后重试',
  [ErrorCode.ERR_MAINTENANCE_MODE]: '系统正在维护中，请稍后访问',

  // 通用错误
  [ErrorCode.ERR_INVALID_PARAM]: '参数错误，请检查输入信息',
  [ErrorCode.ERR_INVALID_PARAMS]: '参数错误，请检查输入信息',
  [ErrorCode.ERR_STORAGE_FAILED]: '数据保存失败，请重试',
  [ErrorCode.ERR_OPERATION_FAILED]: '操作失败，请重试',
} as const

/**
 * 获取用户友好的错误消息
 * @param code 错误码
 * @param defaultMessage 默认消息（后端返回的message）
 * @returns 用户友好的错误消息
 */
export function getFriendlyErrorMessage(code: number, defaultMessage?: string): string {
  // 优先使用预定义的用户友好消息
  if (ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES]) {
    return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES]
  }
  
  // 其次使用后端返回的消息
  if (defaultMessage) {
    return defaultMessage
  }
  
  // 根据错误码范围提供通用消息
  if (code >= 10000 && code < 20000) {
    return '请求参数有误，请检查后重试'
  } else if (code >= 20000 && code < 50000) {
    return '操作失败，请重试'
  } else if (code >= 50000) {
    return '服务暂时不可用，请稍后重试'
  }
  
  return '未知错误，请重试'
}

/**
 * 判断是否为需要重新登录的错误
 * @param code 错误码
 * @returns 是否需要重新登录
 */
export function isAuthError(code: number): boolean {
  return [
    ERR_UNAUTHORIZED,
    ERR_TOKEN_EXPIRED,
    ERR_INVALID_TOKEN,
    ERR_TOKEN_MALFORMED,
    ERR_REFRESH_REQUIRED,
    ErrorCode.ERR_UNI_LOGIN_FAILED,
    ErrorCode.ERR_WX_CODE_EMPTY,
    ErrorCode.ERR_PHONE_LOGIN_FAILED
  ].includes(code)
}

/**
 * 判断是否为网络错误
 * @param code 错误码
 * @returns 是否为网络错误
 */
export function isNetworkError(code: number): boolean {
  return [
    ERR_REQUEST_TIMEOUT,
    ERR_SERVICE_TIMEOUT,
    ERR_EXTERNAL_TIMEOUT,
    ERR_SERVICE_UNAVAILABLE,
    ERR_EXTERNAL_UNAVAIL
  ].includes(code)
}

/**
 * 判断是否为服务器内部错误
 * @param code 错误码
 * @returns 是否为服务器内部错误
 */
export function isServerError(code: number): boolean {
  return code >= 50000 && code < 90000
}

/**
 * 判断是否为业务逻辑错误
 * @param code 错误码
 * @returns 是否为业务逻辑错误
 */
export function isBusinessError(code: number): boolean {
  return code >= 20000 && code < 50000
}

/**
 * 判断是否为客户端错误
 * @param code 错误码
 * @returns 是否为客户端错误
 */
export function isClientError(code: number): boolean {
  return code >= 10000 && code < 20000
}

/**
 * 判断是否为系统错误
 * @param code 错误码
 * @returns 是否为系统错误
 */
export function isSystemError(code: number): boolean {
  return code >= 90000
}

/**
 * 判断是否为配额相关错误
 * @param code 错误码
 * @returns 是否为配额相关错误
 */
export function isQuotaError(code: number): boolean {
  return [
    ErrorCode.ERR_BOOK_QUOTA_EXCEEDED,
    ErrorCode.ERR_NOTE_QUOTA_EXCEEDED,
    ErrorCode.ERR_OCR_QUOTA_EXCEEDED,
    ErrorCode.ERR_AI_QUOTA_EXCEEDED,
    ErrorCode.ERR_SYNC_QUOTA_EXCEEDED,
    ErrorCode.ERR_STORAGE_QUOTA_EXCEEDED,
    ErrorCode.ERR_QUOTA_EXCEEDED
  ].includes(code)
}

/**
 * 判断是否为权限相关错误
 * @param code 错误码
 * @returns 是否为权限相关错误
 */
export function isPermissionError(code: number): boolean {
  return [
    ErrorCode.ERR_FORBIDDEN,
    ErrorCode.ERR_BOOK_PERM_DENIED,
    ErrorCode.ERR_NOTE_PERM_DENIED,
    ErrorCode.ERR_INSUFFICIENT_SCOPE
  ].includes(code)
}

/**
 * 获取错误码类别
 * @param code 错误码
 * @returns 错误码类别
 */
export function getErrorCategory(code: number): string {
  if (code === 0) return 'success'
  if (isClientError(code)) return 'client'
  if (isBusinessError(code)) return 'business'
  if (isServerError(code)) return 'server'
  if (isSystemError(code)) return 'system'
  return 'unknown'
}

/**
 * 错误码类型守护函数 - 使用枚举进行类型守护
 * @param code 错误码
 * @returns 是否为有效的错误码
 */
export function isValidErrorCode(code: number): code is ErrorCode {
  return Object.values(ErrorCode).includes(code)
}