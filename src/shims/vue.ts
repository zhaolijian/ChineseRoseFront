import * as VueRuntime from '@dcloudio/uni-h5-vue/dist/vue.runtime.esm.js'

// 透出原始运行时的所有导出
export * from '@dcloudio/uni-h5-vue/dist/vue.runtime.esm.js'

// Vue 的 runtime 模块本身没有默认导出，这里与官方包保持一致，导出整个运行时对象
export default VueRuntime

// uni-app 依赖的 API，在旧版 runtime 中缺失，这里做兼容补充
const runtimeAny = VueRuntime as unknown as Record<string, unknown>

export const isInSSRComponentSetup =
  (runtimeAny.isInSSRComponentSetup as (() => boolean) | undefined) ??
  (() => false)

export const hasInjectionContext =
  (runtimeAny.hasInjectionContext as (() => boolean) | undefined) ??
  (() => {
    const getCurrentInstance = runtimeAny.getCurrentInstance as
      | (() => unknown | null)
      | undefined
    return typeof getCurrentInstance === 'function' && !!getCurrentInstance()
  })
