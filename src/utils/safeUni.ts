/**
 * 安全的 uni-app API 访问封装
 * 用于避免在 uni runtime 初始化前访问 uni 对象导致的 "uni is not defined" 错误
 *
 * 使用场景：
 * 1. 模块顶层代码中需要访问 uni 对象
 * 2. E2E 测试环境中的页面初始化
 * 3. SSR/预渲染场景
 *
 * @example
 * ```ts
 * import { getUni } from '@/utils/safeUni';
 *
 * // 在模块顶层安全调用
 * const goToDetail = (id: string) => {
 *   getUni().navigateTo({ url: `/pages-book/detail/index?id=${id}` });
 * };
 * ```
 */

// 类型声明：uni 是 uni-app 提供的全局对象
declare const uni: any;

type UniLike = Record<string, any>;

/**
 * 创建一个可覆盖的 uni API stub
 * 使用 Proxy 确保任何 API 调用都不会抛出错误
 */
function createStub(): UniLike {
  const noop = () => {};
  return new Proxy({}, {
    get: () => noop
  });
}

/**
 * 获取 uni 对象的安全访问器
 *
 * 运行时逻辑：
 * - uni runtime 已就绪 → 返回真实 uni 对象
 * - uni runtime 未就绪 → 返回安全 stub，避免抛出异常
 *
 * @returns uni 对象或安全 stub
 */
export function getUni(): UniLike {
  // 运行时就绪后返回真实 uni，否则提供安全 stub，避免模块顶层抢跑
  return typeof uni !== 'undefined' ? uni : createStub();
}

/**
 * 检查 uni runtime 是否已就绪
 *
 * @returns true 表示 uni 对象可用
 */
export function isUniReady(): boolean {
  return typeof uni !== 'undefined';
}

/**
 * 统一获取平台标识
 *
 * 优先级：
 * 1. 编译期常量（UNI_PLATFORM）
 * 2. 浏览器环境识别为 h5
 * 3. 兜底返回 unknown
 *
 * @returns 平台标识：h5 | mp-weixin | mp-alipay | app | unknown
 */
export function getPlatform(): string {
  // 由 @dcloudio/vite-plugin-uni 注入（H5/小程序编译期就有）
  // @ts-ignore
  const compileTimePlatform = (import.meta as any)?.env?.UNI_PLATFORM ?? (process as any)?.env?.UNI_PLATFORM;
  if (compileTimePlatform) {
    return compileTimePlatform;
  }

  // 兜底：浏览器环境视为 H5
  if (typeof navigator !== 'undefined') {
    return 'h5';
  }

  return 'unknown';
}
