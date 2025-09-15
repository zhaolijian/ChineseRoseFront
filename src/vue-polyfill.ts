/**
 * Vue 3 兼容性修复
 * 解决 uni-app 与 Vue 3 版本不匹配的问题
 */

// 如果 Vue 缺少某些导出，我们提供兼容性补丁
import * as Vue from 'vue'

// 检查并补充缺失的导出
if (!(Vue as any).injectHook) {
  console.warn('Vue.injectHook not found, using compatibility patch')
  ;(Vue as any).injectHook = () => {}
}

if (!(Vue as any).isInSSRComponentSetup) {
  console.warn('Vue.isInSSRComponentSetup not found, using compatibility patch')
  ;(Vue as any).isInSSRComponentSetup = () => false
}

// 导出修复后的 Vue
export * from 'vue'