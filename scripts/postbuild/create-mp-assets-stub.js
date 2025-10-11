#!/usr/bin/env node
const { existsSync, mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

const targets = [
  resolve('dist/build/mp-weixin/common'),
  resolve('dist/dev/mp-weixin/common')
]

for (const dir of targets) {
  try {
    const file = resolve(dir, 'assets.js')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    if (!existsSync(file)) {
      writeFileSync(
        file,
        "// Auto-generated fallback stub for WeChat devtools expecting common/assets.js\nmodule.exports = {}\n",
        'utf8'
      )
      console.info(`[postbuild] created ${file.replace(process.cwd(), '.')}`)
    }
  } catch (error) {
    console.error(`[postbuild] failed to ensure common/assets.js stub for ${dir}`, error)
    process.exitCode = 1
  }
}
