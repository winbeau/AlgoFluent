import { CDN_URLS, COPY_ICON_SVG } from '@/constants'

export function useScriptLoader() {
  const scriptCache = new Map<string, Promise<void>>()
  let markedConfigured = false

  const loadScript = (src: string, id: string, asyncAttr = false) => {
    if (scriptCache.has(id)) return scriptCache.get(id)!
    if (typeof document !== 'undefined') {
      const existing = document.getElementById(id)
      if (existing) {
        const resolved = Promise.resolve()
        scriptCache.set(id, resolved)
        return resolved
      }
      const deferred = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.id = id
        script.src = src
        script.async = asyncAttr
        script.onload = () => resolve()
        script.onerror = () => reject(new Error(`Failed to load ${src}`))
        document.head.appendChild(script)
      })
      scriptCache.set(id, deferred)
      return deferred
    }
    const noop = Promise.resolve()
    scriptCache.set(id, noop)
    return noop
  }

  const configureMarkedRenderer = () => {
    if (!window.marked || markedConfigured) return
    const renderer = new window.marked.Renderer()
    renderer.code = (code: any, language: string) => {
      let codeContent = ''
      if (typeof code === 'string') codeContent = code
      else if (code && typeof code.text === 'string') codeContent = code.text
      const escaped = codeContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
      return `
      <div class="relative group my-4">
        <button onclick="window.handleCodeCopy(this)"
          class="absolute top-2 right-2 p-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-300 dark:hover:bg-slate-600 z-10 border border-slate-300 dark:border-slate-600"
          title="复制样例">
          ${COPY_ICON_SVG}
        </button>
        <pre><code class="${language || ''}">${escaped}</code></pre>
      </div>
    `
    }
    window.marked.use({
      breaks: true,
      gfm: true,
      renderer,
    })
    markedConfigured = true
  }

  const ensureMarkedReady = async () => {
    await loadScript(CDN_URLS.MARKED, 'marked-cdn')
    configureMarkedRenderer()
  }

  const ensurePdfReady = async () => {
    await loadScript(CDN_URLS.PDFJS, 'pdfjs-cdn')
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_URLS.PDF_WORKER
    } else {
      throw new Error('PDF.js 未成功加载')
    }
  }

  const ensureJsZipReady = async () => {
    await loadScript(CDN_URLS.JSZIP, 'jszip-cdn')
  }

  const ensureMathJaxReady = async () => {
    if (!window.MathJax) {
      window.MathJax = {
        tex: {
          inlineMath: [
            ['$', '$'],
            ['\\(', '\\)'],
          ],
          displayMath: [
            ['$$', '$$'],
            ['\\[', '\\]'],
          ],
          processEscapes: true,
        },
        svg: {
          fontCache: 'global',
        },
      }
    }
    await loadScript(CDN_URLS.MATHJAX, 'mathjax-cdn', true)
  }

  return {
    ensureMarkedReady,
    ensurePdfReady,
    ensureJsZipReady,
    ensureMathJaxReady,
  }
}
