/**
 * 通知类型定义
 */
export type NotificationType = 'success' | 'error' | 'info'

export interface Notification {
  id: number
  type: NotificationType
  message: string
}

/**
 * 题目相关类型定义
 */
export interface Problem {
  id: string
  fileName: string
  fileObj: File
  pageStart: number
  pageEnd: number | null
  extractedText: string
  translation: string
  isExtracting: boolean
  isTranslating: boolean
  error: string
}

export interface SplitSegment {
  start: number
  end: number
}

/**
 * 全局Window扩展
 */
declare global {
  interface Window {
    pdfjsLib?: any
    JSZip?: any
    marked?: any
    MathJax?: {
      tex?: {
        inlineMath?: Array<[string, string]>
        displayMath?: Array<[string, string]>
        processEscapes?: boolean
      }
      svg?: {
        fontCache?: string
      }
      typesetPromise?: () => Promise<void>
    }
    handleCodeCopy?: (btn: HTMLElement) => void
    copyToClipboardFallback?: (text: string) => Promise<boolean>
  }
}

export {}
