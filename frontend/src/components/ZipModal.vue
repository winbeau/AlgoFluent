<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isProcessingZip: boolean
}>()

const emit = defineEmits<{
  close: []
  'handle-zip-file': [file: File]
  'handle-zip-drop': [event: DragEvent]
}>()

const zipInputRef = ref<HTMLInputElement | null>(null)

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('handle-zip-file', file)
  input.value = ''
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div class="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">比赛多题翻译</h2>
      <p class="text-slate-600 dark:text-slate-300 mb-6">
        上传包含多个题目 PDF 的 .zip 压缩包。系统将自动解析文件并生成导航栏。
      </p>
      <div v-if="isProcessingZip" class="h-48 flex flex-col items-center justify-center">
        <div class="loader mb-4"></div>
        <p class="text-slate-500 dark:text-slate-400">正在解压并分析 ZIP...</p>
      </div>
      <div
        v-else
        class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-all"
        @click="zipInputRef?.click()"
        @dragover.prevent
        @drop="(e) => emit('handle-zip-drop', e)"
      >
        <input
          ref="zipInputRef"
          type="file"
          class="hidden"
          accept=".zip"
          @change="handleFileChange"
        />
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <p class="mt-4 text-lg font-medium text-slate-700 dark:text-slate-200">点击上传 .zip 比赛包</p>
      </div>
      <div class="mt-6 flex justify-end">
        <button class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white" @click="emit('close')">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

