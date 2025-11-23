/**
 * CDN 资源地址配置
 */
export const CDN_URLS = {
  MARKED: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  PDFJS: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  PDF_WORKER: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  JSZIP: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  MATHJAX: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
} as const

/**
 * SVG 图标字符串
 */
export const COPY_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'

export const CHECK_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>'

/**
 * 渲染配置
 */
export const RENDER_CONFIG = {
  // 超高清渲染：使用3-6倍缩放，确保最佳清晰度
  SCALE: Math.min(Math.max(window.devicePixelRatio * 1.5, 3), 6),
} as const

/**
 * 通知超时时间（毫秒）
 */
export const NOTIFICATION_TIMEOUT = 4000
