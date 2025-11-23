import { ref } from 'vue'
import { CHECK_ICON_SVG, COPY_ICON_SVG } from '@/constants'
import { useNotification } from './useNotification'

// 单例状态 - 确保复制状态在所有地方共享
const isCopied = ref(false)

export function useClipboard() {
  const { notify } = useNotification()

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (err) {
        console.warn('Clipboard API failed, fallback engaged', err)
      }
    }
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.top = '0'
      textarea.style.left = '0'
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const result = document.execCommand('copy')
      document.body.removeChild(textarea)
      return result
    } catch (err) {
      console.error('Fallback copy failed', err)
      return false
    }
  }

  const handleCodeCopy = async (buttonEl: HTMLElement) => {
    const wrapper = buttonEl.closest('.relative')
    const codeBlock = wrapper?.querySelector('code')
    if (!codeBlock) return
    const text = codeBlock.textContent ?? ''
    const success = await copyToClipboard(text)
    if (success) {
      buttonEl.innerHTML = CHECK_ICON_SVG
      setTimeout(() => {
        buttonEl.innerHTML = COPY_ICON_SVG
      }, 2000)
    } else {
      notify('error', '复制失败，请手动选择复制')
    }
  }

  const handleAppCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      isCopied.value = true
      notify('success', '已复制翻译内容')
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    } else {
      notify('error', '复制失败，请手动复制')
    }
  }

  return {
    isCopied,
    copyToClipboard,
    handleCodeCopy,
    handleAppCopy,
  }
}
