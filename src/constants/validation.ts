/**
 * 验证相关常量
 */

/**
 * 手机号正则表达式
 */
export const PHONE_REGEX = /^1[3-9]\d{9}$/

/**
 * 验证码长度
 */
export const VERIFY_CODE_LENGTH = 6

/**
 * 验证码倒计时时间（秒）
 */
export const VERIFY_CODE_COUNTDOWN = 60

/**
 * 密码最小长度
 */
export const PASSWORD_MIN_LENGTH = 6

/**
 * 密码最大长度
 */
export const PASSWORD_MAX_LENGTH = 20

/**
 * 用户昵称最小长度
 */
export const NICKNAME_MIN_LENGTH = 2

/**
 * 用户昵称最大长度
 */
export const NICKNAME_MAX_LENGTH = 20

/**
 * 笔记内容最大长度
 */
export const NOTE_CONTENT_MAX_LENGTH = 5000

/**
 * 书籍名称最大长度
 */
export const BOOK_NAME_MAX_LENGTH = 100

/**
 * 标签最大长度
 */
export const TAG_MAX_LENGTH = 20

/**
 * ISBN正则表达式（支持10位和13位，可包含连字符）
 */
export const ISBN_REGEX = /^(?:\d{9}[\dXx]|\d{13}|\d{3}-?\d{1,5}-?\d{1,7}-?\d{1,7}-?[\dXx])$/

/**
 * 书籍页数最小值
 */
export const BOOK_PAGES_MIN = 1

/**
 * 书籍页数最大值
 */
export const BOOK_PAGES_MAX = 10000

/**
 * 出版年份最小值
 */
export const PUBLISH_YEAR_MIN = 1900

/**
 * 作者名称最大长度
 */
export const AUTHOR_NAME_MAX_LENGTH = 50

/**
 * 出版社名称最大长度
 */
export const PUBLISHER_NAME_MAX_LENGTH = 100

/**
 * 书籍描述最大长度
 */
export const BOOK_DESCRIPTION_MAX_LENGTH = 500
