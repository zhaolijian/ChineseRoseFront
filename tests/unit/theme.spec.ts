import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

describe('Design tokens', () => {
  // 获取当前文件目录
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const projectRoot = resolve(__dirname, '../..')
  
  const themePath = resolve(projectRoot, 'src/styles/theme.scss')
  const uniPath = resolve(projectRoot, 'src/uni.scss')
  const mixinPath = resolve(projectRoot, 'src/styles/mixins.scss')

  const themeStyles = readFileSync(themePath, 'utf-8')
  const uniStyles = readFileSync(uniPath, 'utf-8')
  const mixinStyles = readFileSync(mixinPath, 'utf-8')

  it('exposes primary color variables', () => {
    // 检查SCSS变量定义
    expect(themeStyles).toContain('"primary": #00a82d')
    expect(themeStyles).toContain('"primary-soft": #e8f3e8')
    expect(themeStyles).toContain('"destructive": #dc2626')
  })

  it('defines typography scale tokens', () => {
    // 检查SCSS变量定义
    expect(themeStyles).toContain('"base": 14px')
    expect(themeStyles).toContain('"2xl": 21px')
    expect(themeStyles).toContain('"medium": 500')
  })

  it('provides spacing and radius utilities in uni.scss', () => {
    expect(uniStyles).toContain('.cr-card')
    expect(uniStyles).toContain('.cr-btn--lg')
    expect(uniStyles).toContain('.cr-navbar--frosted')
  })

  it('exports mixins with rpx fallbacks', () => {
    expect(mixinStyles).toContain('@mixin spacing($property, $scale)')
    expect(mixinStyles).toContain('px-to-rpx')
  })
})
