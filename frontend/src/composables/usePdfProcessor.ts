import { ref } from 'vue'
import type { Problem, SplitSegment } from '@/types'
import { RENDER_CONFIG } from '@/constants'
import { useNotification } from './useNotification'
import { useProblemManager } from './useProblemManager'
import { useScriptLoader } from './useScriptLoader'

export function usePdfProcessor() {
  const { notify } = useNotification()
  const { problems, contestName, updateProblem } = useProblemManager()
  const { ensurePdfReady, ensureJsZipReady } = useScriptLoader()

  const previewCache = new Map<string, { key: string; el: HTMLElement }>()
  const pdfContainerRef = ref<HTMLDivElement | null>(null)
  let lastRenderToken = 0

  const handleSingleFile = async (file: File) => {
    try {
      await ensurePdfReady()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
      if (pdf.numPages > 4) {
        const confirmMsg = `检测到此 PDF 有 ${pdf.numPages} 页，可能包含多个题目。\n\n是否尝试自动拆分为"比赛模式"处理？`
        const segments = await analyzeAndSplitPdf(file)
        if (segments && segments.length > 1 && window.confirm(confirmMsg)) {
          await confirmSplit(file, segments)
          return
        }
      }
      previewCache.clear()
      problems.value = [
        {
          id: `single-${Date.now()}`,
          fileName: file.name,
          fileObj: file,
          pageStart: 1,
          pageEnd: pdf.numPages,
          extractedText: '',
          translation: '',
          isExtracting: false,
          isTranslating: false,
          error: '',
        },
      ]
      notify('success', '文件上传成功')
    } catch (err) {
      console.error(err)
      notify('error', '无法读取 PDF 文件')
    }
  }

  const analyzeAndSplitPdf = async (file: File) => {
    try {
      await ensurePdfReady()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const totalPages = pdf.numPages
      const segments: SplitSegment[] = []
      let currentStart = 1
      const problemHeaderRegex = /(?:Problem|Task)\s+[A-Z]|\b[A-Z]\.\s+/i
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const snippet = textContent.items
          .map((item: any) => (item.str ? String(item.str) : ''))
          .filter((s: string) => s.trim().length > 0)
          .slice(0, 5)
          .join(' ')
        if (pageNum > 1 && problemHeaderRegex.test(snippet)) {
          segments.push({ start: currentStart, end: pageNum - 1 })
          currentStart = pageNum
        }
      }
      segments.push({ start: currentStart, end: totalPages })
      return segments
    } catch (err) {
      console.error('PDF 分析失败', err)
      return null
    }
  }

  const confirmSplit = async (file: File, segments: SplitSegment[]) => {
    const generated = segments.map((segment, idx) => {
      const letter = String.fromCharCode(65 + idx)
      return {
        id: `split-${idx}-${Date.now()}`,
        fileName: `Problem ${letter} (P${segment.start}-${segment.end})`,
        fileObj: file,
        pageStart: segment.start,
        pageEnd: segment.end,
        extractedText: '',
        translation: '',
        isExtracting: false,
        isTranslating: false,
        error: '',
      }
    })
    problems.value = generated
    contestName.value = file.name.replace('.pdf', '')
    notify('success', `成功拆分为 ${generated.length} 个题目`)
  }

  const handleZipFile = async (zipFile: File) => {
    if (!zipFile.name.toLowerCase().endsWith('.zip')) {
      notify('error', '请上传 .zip 格式的文件')
      return
    }
    try {
      await ensureJsZipReady()
      const zip = await window.JSZip.loadAsync(zipFile)
      const entries: any[] = []
      zip.forEach((relativePath: string, zipEntry: any) => {
        if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.pdf') && !relativePath.includes('__MACOSX')) {
          entries.push(zipEntry)
        }
      })
      if (!entries.length) {
        notify('error', '压缩包内没有找到有效的 PDF 文件')
        return
      }
      entries.sort((a, b) => a.name.localeCompare(b.name))
      const newProblems = await Promise.all(
        entries.map(async (entry, idx) => {
          const blob = await entry.async('blob')
          const simpleName = entry.name.split('/').pop()?.replace('.pdf', '') ?? `Problem ${idx + 1}`
          const file = new File([blob], entry.name.split('/').pop() ?? `Problem_${idx + 1}.pdf`, {
            type: 'application/pdf',
          })
          return {
            id: `zip-${idx}-${Date.now()}`,
            fileName: simpleName,
            fileObj: file,
            pageStart: 1,
            pageEnd: null,
            extractedText: '',
            translation: '',
            isExtracting: false,
            isTranslating: false,
            error: '',
          }
        })
      )
      previewCache.clear()
      problems.value = newProblems
      contestName.value = zipFile.name.replace('.zip', '').replace(/_/g, ' ')
      notify('success', `成功解析 ${newProblems.length} 个题目`)
    } catch (err) {
      console.error('Zip Error', err)
      notify('error', '无法解析 ZIP 文件，请确保文件未损坏')
    }
  }

  const extractTextForProblem = async (index: number, problem: Problem) => {
    updateProblem(index, { isExtracting: true, error: '' })
    try {
      await ensurePdfReady()
      const arrayBuffer = await problem.fileObj.arrayBuffer()
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      const finalEnd = problem.pageEnd ?? pdf.numPages
      for (let pageNum = problem.pageStart; pageNum <= finalEnd; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const lines: Record<number, any[]> = {}
        const tolerance = 5
        textContent.items.forEach((item: any) => {
          const y = item.transform[5]
          const existingKey = Object.keys(lines).find((key) => Math.abs(Number(key) - y) < tolerance)
          if (existingKey) {
            const lineItems = lines[Number(existingKey)]
            if (lineItems) lineItems.push(item)
          } else {
            lines[y] = [item]
          }
        })
        const sortedKeys = Object.keys(lines).sort((a, b) => Number(b) - Number(a))
        let pageText = ''
        sortedKeys.forEach((key) => {
          const lineItems = lines[Number(key)] ?? []
          lineItems.sort((a: any, b: any) => a.transform[4] - b.transform[4])
          pageText += lineItems.map((item: any) => item.str).join(' ') + '\n'
        })
        fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`
      }
      updateProblem(index, { extractedText: fullText, isExtracting: false })
    } catch (err) {
      console.error('Extract text failed', err)
      updateProblem(index, { isExtracting: false, error: '文本提取失败' })
      notify('error', '提取文本失败，可能是加密的 PDF')
    }
  }

  const renderPdfPreview = async (problem: Problem) => {
    const container = pdfContainerRef.value
    if (!container) return
    const cacheKey = `${problem.id}-${problem.pageStart}-${problem.pageEnd ?? 'end'}-${RENDER_CONFIG.SCALE}`
    const cached = previewCache.get(problem.id)
    if (cached && cached.key === cacheKey) {
      container.innerHTML = ''
      container.appendChild(cached.el)
      return
    }
    const token = ++lastRenderToken
    container.innerHTML = ''
    const loadingDiv = document.createElement('div')
    loadingDiv.className =
      'flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400'
    loadingDiv.innerHTML = `<div class="loader mb-4"></div><p>正在渲染预览 (第 ${problem.pageStart} - ${
      problem.pageEnd ?? '?'
    } 页)...</p>`
    container.appendChild(loadingDiv)
    try {
      await ensurePdfReady()
      const arrayBuffer = await problem.fileObj.arrayBuffer()
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      if (token !== lastRenderToken) return
      const rendered = document.createElement('div')
      const finalEnd = problem.pageEnd ?? pdf.numPages
      for (let pageNum = problem.pageStart; pageNum <= finalEnd; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1 })
        const renderViewport = page.getViewport({ scale: RENDER_CONFIG.SCALE })

        const canvasWrapper = document.createElement('div')
        canvasWrapper.className = 'overflow-hidden relative group'
        canvasWrapper.style.width = '100%'

        const pageBadge = document.createElement('div')
        pageBadge.className =
          'absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'
        pageBadge.innerText = `Page ${pageNum}`
        canvasWrapper.appendChild(pageBadge)

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d', {
          alpha: false,
          desynchronized: true,
          willReadFrequently: false
        })

        canvas.height = renderViewport.height
        canvas.width = renderViewport.width

        if (context) {
          context.imageSmoothingEnabled = true
          context.imageSmoothingQuality = 'high'
        }

        canvas.style.width = '100%'
        canvas.style.height = 'auto'
        canvas.className = 'block'

        canvasWrapper.appendChild(canvas)
        rendered.appendChild(canvasWrapper)

        await page.render({
          canvasContext: context,
          viewport: renderViewport,
          intent: 'display',
          enableWebGL: false,
          renderInteractiveForms: false,
          background: 'white'
        }).promise

        if (token !== lastRenderToken) return
      }
      container.innerHTML = ''
      container.appendChild(rendered)
      previewCache.set(problem.id, { key: cacheKey, el: rendered })
    } catch (err) {
      console.error('PDF render failed', err)
      container.innerHTML = '<div class="text-red-500 p-4">无法渲染预览</div>'
      notify('error', `无法渲染 PDF: ${problem.fileName}`)
    }
  }

  return {
    pdfContainerRef,
    previewCache,
    handleSingleFile,
    analyzeAndSplitPdf,
    confirmSplit,
    handleZipFile,
    extractTextForProblem,
    renderPdfPreview,
  }
}
