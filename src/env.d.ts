/// <reference types="vite/client" />
/// <reference types="@dcloudio/types" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 确保模块路径别名正常工作
// 说明：imageUpload 工具模块采用预签名直传方案，类型由源码提供，无需额外声明。

declare module '@/api/modules/book' {
  export interface Book {
    id: number
    title: string
    author?: string
    isbn?: string
    publisher?: string
    publishDate?: string
    coverUrl?: string
    coverColor?: string
    pages?: number
    totalNotes?: number
    noteCount?: number
    chapters?: number
    description?: string
    progress?: number
    status?: 'reading' | 'finished' | 'wishlist'
    source?: 'isbn_api' | 'manual'
    createdAt?: string
    updatedAt?: string
  }

  export interface CreateBookData {
    title: string
    author?: string
    isbn?: string
    publisher?: string
    publishDate?: string
    coverKey?: string
    coverUrl?: string
    pages?: number
    source?: 'isbn_api' | 'manual'
    description?: string
    status?: 'reading' | 'finished' | 'wishlist'
  }

  export function createBook(data: CreateBookData): Promise<Book>
  export function getBookList(params?: any): Promise<any>
  export function getBookDetail(id: number): Promise<Book>
  export function updateBook(id: number, data: any): Promise<Book>
  export function deleteBook(id: number): Promise<void>
  export function searchBookByISBN(isbn: string): Promise<Book>
  export function searchBooks(keyword: string): Promise<any>
}

declare module '@/stores/modules/book' {
  import type { Store } from 'pinia'

  export interface Book {
    id: number
    title: string
    author?: string
    isbn?: string
    publisher?: string
    publishDate?: string
    coverUrl?: string
    description?: string
    noteCount?: number
    status?: 'reading' | 'finished' | 'wishlist'
    progress?: number
    tags?: string[]
    pages?: number
    publishYear?: number
    createdAt?: string
    updatedAt?: string
  }

  export interface CreateBookParams {
    title: string
    author?: string
    isbn?: string
    publisher?: string
    publishDate?: string
    coverUrl?: string
    description?: string
    status?: 'reading' | 'finished' | 'wishlist'
    pages?: number
    publishYear?: number
  }

  export function useBookStore(): Store<'book', any>
}
