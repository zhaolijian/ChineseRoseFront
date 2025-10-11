#!/usr/bin/env node
// Ensures vue-demi exports hasInjectionContext for uni-app mp builds.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const target = resolve(__dirname, '../../node_modules/vue-demi/lib/index.mjs')

let source
try {
  source = readFileSync(target, 'utf8')
} catch (error) {
  console.warn('[patch] vue-demi not found, skip hasInjectionContext patch')
  process.exit(0)
}

const exportSnippet = `export const hasInjectionContext = Vue.hasInjectionContext || (() => {\n  const getCurrentInstance = Vue.getCurrentInstance\n  return typeof getCurrentInstance === 'function' && !!getCurrentInstance()\n})\n\n`

if (source.includes('export const hasInjectionContext')) {
  process.exit(0)
}

const marker = 'function install() {}\n\n'
const idx = source.indexOf(marker)
if (idx === -1) {
  console.warn('[patch] Unexpected vue-demi lib/index.mjs structure, skip patch')
  process.exit(0)
}

const patched = source.slice(0, idx + marker.length) + exportSnippet + source.slice(idx + marker.length)
writeFileSync(target, patched, 'utf8')
console.info('[patch] Injected hasInjectionContext fallback into vue-demi/lib/index.mjs')
