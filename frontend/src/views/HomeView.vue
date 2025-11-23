<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { useScriptLoader } from '@/composables/useScriptLoader'
import { useClipboard } from '@/composables/useClipboard'
import { useProblemManager } from '@/composables/useProblemManager'
import { useTranslation } from '@/composables/useTranslation'
import { usePdfProcessor } from '@/composables/usePdfProcessor'
import NotificationToast from '@/components/NotificationToast.vue'
import ZipModal from '@/components/ZipModal.vue'
import KeyModal from '@/components/KeyModal.vue'

// 使用 Composables
const { notifications, notify, removeNotification } = useNotification()
const { ensureMarkedReady, ensurePdfReady, ensureJsZipReady, ensureMathJaxReady } = useScriptLoader()
const { isCopied, copyToClipboard, handleCodeCopy, handleAppCopy } = useClipboard()
const { problems, currentProblemIndex, contestName, currentProblem, clearProblems } = useProblemManager()
const { apiKey, showKeyModal, saveApiKey, translateCurrentProblem } = useTranslation()
const {
  pdfContainerRef,
  handleSingleFile,
  handleZipFile,
  extractTextForProblem,
  renderPdfPreview,
} = usePdfProcessor()

// UI 状态
const showZipModal = ref(false)
const isDarkMode = ref(true)
const isProcessingZip = ref(false)
const singleFileInputRef = ref<HTMLInputElement | null>(null)

// Computed
const translationHtml = computed(() => {
  const text = currentProblem.value?.translation ?? ''
  if (!text) return ''
  if (typeof window !== 'undefined' && window.marked) {
    return window.marked.parse(text)
  }
  return text.replace(/\n/g, '<br />')
})

// 事件处理
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) handleSingleFile(file)
  else if (file.name.toLowerCase().endsWith('.zip')) handleZipWithState(file, false)
  else notify('error', '请上传 PDF 或 ZIP 文件')
}

const handleZipDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (file.name.toLowerCase().endsWith('.zip')) handleZipWithState(file)
  else notify('error', '请上传 .zip 文件')
}

const handleZipWithState = async (file: File, closeModal = true) => {
  isProcessingZip.value = true
  try {
    await handleZipFile(file)
    if (closeModal) showZipModal.value = false
  } finally {
    isProcessingZip.value = false
  }
}

// Watchers
watch(
  () => [
    currentProblemIndex.value,
    problems.value.length,
    currentProblem.value?.pageStart,
    currentProblem.value?.pageEnd,
  ],
  () => {
    const problem = currentProblem.value
    if (!problem) {
      if (pdfContainerRef.value) pdfContainerRef.value.innerHTML = ''
      return
    }
    void renderPdfPreview(problem)
    if (!problem.extractedText && !problem.isExtracting) {
      void extractTextForProblem(currentProblemIndex.value, problem)
    }
  },
  { immediate: true }
)

watch(
  () => currentProblem.value?.translation,
  (value) => {
    if (!value) return
    Promise.all([ensureMarkedReady(), ensureMathJaxReady()]).then(() => {
      setTimeout(() => {
        window.MathJax?.typesetPromise?.()
      }, 120)
    })
  }
)

watch(
  isDarkMode,
  (value) => {
    document.documentElement.classList.toggle('dark', value)
  },
  { immediate: true }
)

watch(
  () => problems.value.length,
  (length) => {
    if (length === 0) currentProblemIndex.value = 0
    else if (currentProblemIndex.value >= length) currentProblemIndex.value = 0
  }
)

// Lifecycle
onMounted(() => {
  window.handleCodeCopy = (btn) => handleCodeCopy(btn as HTMLElement)
  window.copyToClipboardFallback = (text: string) => copyToClipboard(text)
  const storedKey = localStorage.getItem('deepseek_api_key')
  if (storedKey) apiKey.value = storedKey
  else {
    showKeyModal.value = true
    notify('info', '请先设置 API Key 以使用翻译功能')
  }
  ensureMarkedReady()
  ensurePdfReady()
  ensureJsZipReady()
  ensureMathJaxReady()
})
</script>

<template>
  <div :class="['min-h-screen flex flex-col transition-colors duration-300', isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800']">
    <NotificationToast :notifications="notifications" @remove="removeNotification" />

    <header class="border-b shrink-0 transition-colors duration-300 bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col">
      <div class="h-16 flex items-center justify-between px-6">
        <div class="flex items-center gap-3">
          <div class="bg-blue-600 p-2 rounded-lg text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="m5 8 6 6m-7 0 6-6 2-3M2 5h12M7 2h1m14 20-5-10-5 10m1-4h6" />
            </svg>
          </div>
          <h1 class="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
            AlgoFluent
            <span class="text-blue-600 dark:text-blue-400 text-sm font-normal ml-2">Powered by DeepSeek</span>
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="btn-primary"
            @click="showZipModal = true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            比赛多题翻译
          </button>
          <div class="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
          <button
            class="btn-icon"
            @click="isDarkMode = !isDarkMode"
          >
            <svg v-if="isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </button>
          <button
            class="btn-text"
            @click="showKeyModal = true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="7.5" cy="15.5" r="5.5" />
              <path d="m21 2-9.6 9.6m-5.9 13L22 7l-3-3" />
            </svg>
            API Key
          </button>
        </div>
      </div>
      <div
        v-if="problems.length > 1 || contestName"
        class="px-6 pb-0 flex items-center border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-x-auto"
      >
        <div
          v-if="contestName"
          class="flex items-center gap-2 mr-6 py-3 text-slate-800 dark:text-slate-100 font-bold whitespace-nowrap"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <polyline points="17 11 19 13 23 9" />
          </svg>
          {{ contestName }}
        </div>
        <div class="flex gap-1 py-2">
          <button
            v-for="(prob, idx) in problems"
            :key="prob.id"
            class="px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap"
            :class="[
              currentProblemIndex === idx
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50',
            ]"
            @click="currentProblemIndex = idx"
          >
            {{ prob.fileName }}
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 flex overflow-hidden">
      <section class="flex-1 border-r flex flex-col min-w-0 transition-colors duration-300 bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <div class="h-14 px-3 border-b font-mono text-sm flex justify-between items-center transition-colors duration-300 bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400">
          <span>{{ currentProblem ? `预览: ${currentProblem.fileName}` : '请上传文件' }}</span>
          <button
            v-if="currentProblem"
            class="text-xs text-red-500 hover:text-red-600 dark:text-red-400"
            @click="clearProblems"
          >
            清空
          </button>
        </div>
        <div class="flex-1 overflow-y-auto relative">
          <div
            v-if="!currentProblem"
            class="h-full m-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800/30"
            @click="singleFileInputRef?.click()"
            @dragover.prevent
            @drop="handleDrop"
          >
            <input
              ref="singleFileInputRef"
              type="file"
              class="hidden"
              accept=".pdf,.zip"
              @change="(event: Event) => {
                const input = event.target as HTMLInputElement
                const file = input.files?.[0]
                if (!file) return
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) handleSingleFile(file)
                else if (file.name.toLowerCase().endsWith('.zip')) handleZipWithState(file, false)
                else notify('error', '不支持的文件格式')
                input.value = ''
              }"
            />
            <svg class="w-12 h-12 mb-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9m4-4-4-4-4 4" />
            </svg>
            <p class="text-lg font-medium">点击上传 PDF 或 ZIP</p>
          </div>
          <div v-else ref="pdfContainerRef" class="w-full flex flex-col min-h-full"></div>
        </div>
      </section>

      <section class="flex-1 flex flex-col min-w-0 transition-colors duration-300 bg-white dark:bg-slate-900">
        <div class="h-14 px-3 border-b font-mono text-sm flex justify-between items-center transition-colors duration-300 bg-slate-50 border-slate-200 text-blue-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-blue-400">
          <span>中文翻译</span>
          <div class="flex gap-2">
            <button
              v-if="currentProblem?.translation && !currentProblem.isTranslating"
              class="btn-secondary"
              title="重新生成翻译"
              @click="translateCurrentProblem"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5" />
              </svg>
              重译
            </button>
            <button
              v-if="currentProblem?.translation"
              class="btn-secondary"
              @click="currentProblem?.translation && handleAppCopy(currentProblem.translation)"
            >
              <svg v-if="isCopied" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              {{ isCopied ? '已复制' : '复制' }}
            </button>
            <button
              v-if="currentProblem && !currentProblem.isTranslating && !currentProblem.translation"
              class="btn-primary"
              @click="translateCurrentProblem"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="m5 8 6 6m-7 0 6-6 2-3M2 5h12M7 2h1m14 20-5-10-5 10m1-4h6" />
              </svg>
              开始翻译
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#0f172a] relative">
          <div
            v-if="currentProblem?.error"
            class="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200 p-4 rounded-lg mb-4"
          >
            {{ currentProblem.error }}
          </div>
          <div v-if="currentProblem?.isTranslating" class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center opacity-70" style="top: 300px;">
            <div class="loader mb-6"></div>
            <p class="text-blue-600 dark:text-blue-300 text-lg animate-pulse">AI 正在翻译...</p>
          </div>
          <div v-else-if="currentProblem?.translation" class="markdown-body" v-html="translationHtml"></div>
          <div v-else class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center text-slate-400 dark:text-slate-500" style="top: 300px;">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
            <p class="mt-4">准备就绪，点击上方翻译按钮</p>
          </div>
        </div>
      </section>
    </main>

    <ZipModal
      v-if="showZipModal"
      :is-processing-zip="isProcessingZip"
      @close="showZipModal = false"
      @handle-zip-file="handleZipWithState"
      @handle-zip-drop="handleZipDrop"
    />

    <KeyModal
      v-if="showKeyModal"
      v-model="apiKey"
      @save="saveApiKey"
    />
  </div>
</template>

