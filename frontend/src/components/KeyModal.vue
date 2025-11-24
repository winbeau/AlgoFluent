<script setup lang="ts">
const apiKey = defineModel<string>({ required: true })

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  save: [key: string]
}>()
</script>

<template>
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div class="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">设置 DeepSeek API Key</h2>
      <input
        v-model="apiKey"
        type="password"
        placeholder="sk-..."
        class="w-full bg-slate-50 border border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-white rounded p-3 focus:outline-none focus:border-blue-500 mb-2"
      />
      <div class="mb-4 text-sm text-slate-600 dark:text-slate-400">
        获取 API Key:
        <a
          href="https://platform.deepseek.com"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
        >
          https://platform.deepseek.com
        </a>
      </div>
      <div class="flex justify-end gap-3">
        <button
          class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium disabled:opacity-60"
          :disabled="!apiKey || disabled"
          @click="emit('save', apiKey)"
        >
          保存并继续
        </button>
      </div>
    </div>
  </div>
</template>
