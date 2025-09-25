import { describe, it, expect } from 'vitest'
import { 
  BOOK_NAME_MAX_LENGTH,
  BOOK_PAGES_MIN,
  BOOK_PAGES_MAX,
  PUBLISH_YEAR_MIN
} from '@/constants/validation'

// 定义简化的表单接口
interface BookForm {
  title: string      // 唯一必填项
  author?: string    // 选填
  coverUrl?: string  // 选填
  pages?: number     // 选填
  publisher?: string // 选填
  publishYear?: number // 选填
}

// 验证函数
const validateBookForm = (form: BookForm): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  
  // 标题验证（必填）
  if (!form.title || form.title.trim() === '') {
    errors.title = '请输入书名'
  } else if (form.title.length > BOOK_NAME_MAX_LENGTH) {
    errors.title = `书名长度不能超过${BOOK_NAME_MAX_LENGTH}个字符`
  }
  
  // 页数验证（选填，但如果填写必须是正整数）
  if (form.pages !== undefined && form.pages !== null) {
    if (!Number.isInteger(form.pages) || form.pages < BOOK_PAGES_MIN || form.pages > BOOK_PAGES_MAX) {
      errors.pages = `页数必须是${BOOK_PAGES_MIN}-${BOOK_PAGES_MAX}之间的正整数`
    }
  }
  
  // 出版年份验证（选填，但如果填写必须在合理范围）
  if (form.publishYear !== undefined && form.publishYear !== null) {
    const currentYear = new Date().getFullYear()
    if (!Number.isInteger(form.publishYear) || form.publishYear < PUBLISH_YEAR_MIN || form.publishYear > currentYear) {
      errors.publishYear = `出版年份必须在${PUBLISH_YEAR_MIN}年至${currentYear}年之间`
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

describe('简化的书籍表单验证', () => {
  describe('书名验证', () => {
    it('应该验证书名是必填项', () => {
      const form: BookForm = { title: '' }
      const result = validateBookForm(form)
      
      expect(result.valid).toBe(false)
      expect(result.errors.title).toBe('请输入书名')
    })
    
    it('应该验证书名不能只有空格', () => {
      const form: BookForm = { title: '   ' }
      const result = validateBookForm(form)
      
      expect(result.valid).toBe(false)
      expect(result.errors.title).toBe('请输入书名')
    })
    
    it('应该验证书名长度限制', () => {
      const form: BookForm = { title: 'a'.repeat(BOOK_NAME_MAX_LENGTH + 1) }
      const result = validateBookForm(form)
      
      expect(result.valid).toBe(false)
      expect(result.errors.title).toBe(`书名长度不能超过${BOOK_NAME_MAX_LENGTH}个字符`)
    })
    
    it('应该通过有效的书名', () => {
      const form: BookForm = { title: '人类简史' }
      const result = validateBookForm(form)
      
      expect(result.valid).toBe(true)
      expect(result.errors.title).toBeUndefined()
    })
  })
  
  describe('选填字段验证', () => {
    it('应该允许所有选填字段为空', () => {
      const form: BookForm = { title: '测试书籍' }
      const result = validateBookForm(form)
      
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })
    
    it('应该验证页数必须是正整数', () => {
      const testCases = [
        { pages: 0, valid: false },
        { pages: -1, valid: false },
        { pages: 1.5, valid: false },
        { pages: BOOK_PAGES_MAX + 1, valid: false },
        { pages: 100, valid: true },
        { pages: BOOK_PAGES_MAX, valid: true }
      ]
      
      testCases.forEach(({ pages, valid }) => {
        const form: BookForm = { title: '测试书籍', pages }
        const result = validateBookForm(form)
        
        if (!valid) {
          expect(result.valid).toBe(false)
          expect(result.errors.pages).toBe(`页数必须是${BOOK_PAGES_MIN}-${BOOK_PAGES_MAX}之间的正整数`)
        } else {
          expect(result.errors.pages).toBeUndefined()
        }
      })
    })
    
    it('应该验证出版年份的合理范围', () => {
      const currentYear = new Date().getFullYear()
      const testCases = [
        { publishYear: PUBLISH_YEAR_MIN - 1, valid: false },
        { publishYear: currentYear + 1, valid: false },
        { publishYear: 2020.5, valid: false },
        { publishYear: 2020, valid: true },
        { publishYear: PUBLISH_YEAR_MIN, valid: true },
        { publishYear: currentYear, valid: true }
      ]
      
      testCases.forEach(({ publishYear, valid }) => {
        const form: BookForm = { title: '测试书籍', publishYear }
        const result = validateBookForm(form)
        
        if (!valid) {
          expect(result.valid).toBe(false)
          expect(result.errors.publishYear).toBe(`出版年份必须在${PUBLISH_YEAR_MIN}年至${currentYear}年之间`)
        } else {
          expect(result.errors.publishYear).toBeUndefined()
        }
      })
    })
  })
  
  describe('完整表单验证', () => {
    it('应该验证包含所有字段的有效表单', () => {
      const form: BookForm = {
        title: '人类简史',
        author: '尤瓦尔·赫拉利',
        coverUrl: 'https://example.com/cover.jpg',
        pages: 500,
        publisher: '中信出版社',
        publishYear: 2017
      }
      
      const result = validateBookForm(form)
      
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })
    
    it('应该返回所有错误信息', () => {
      const form: BookForm = {
        title: '',
        pages: 0,
        publishYear: 1800
      }
      
      const result = validateBookForm(form)
      
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBe(3)
      expect(result.errors.title).toBeDefined()
      expect(result.errors.pages).toBeDefined()
      expect(result.errors.publishYear).toBeDefined()
    })
  })
})

// 导出验证函数供组件使用
export { validateBookForm }