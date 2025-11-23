<script setup lang="ts">
import type { Notification } from '@/types'

defineProps<{
  notifications: Notification[]
}>()

const emit = defineEmits<{
  remove: [id: number]
}>()
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
    <div
      v-for="notif in notifications"
      :key="notif.id"
      class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-in"
      :class="[
        notif.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100'
          : notif.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-800 dark:text-green-100'
            : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-slate-800/90 dark:border-slate-600 dark:text-blue-100',
      ]"
    >
      <svg v-if="notif.type === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <svg v-else-if="notif.type === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span class="text-sm font-medium">{{ notif.message }}</span>
      <button class="ml-2 hover:opacity-70 inline-flex items-center justify-center" @click="emit('remove', notif.id)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</template>
