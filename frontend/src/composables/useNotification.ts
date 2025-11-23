import { ref } from 'vue'
import type { Notification, NotificationType } from '@/types'
import { NOTIFICATION_TIMEOUT } from '@/constants'

// 单例状态 - 确保所有地方使用同一个通知列表
const notifications = ref<Notification[]>([])

export function useNotification() {
  const notify = (type: NotificationType, message: string) => {
    const id = Date.now() + Math.random()
    notifications.value.push({ id, type, message })
    setTimeout(() => removeNotification(id), NOTIFICATION_TIMEOUT)
  }

  const removeNotification = (id: number) => {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  return {
    notifications,
    notify,
    removeNotification,
  }
}
