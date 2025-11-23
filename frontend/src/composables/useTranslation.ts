import { ref } from 'vue'
import { useNotification } from './useNotification'
import { useProblemManager } from './useProblemManager'

// 单例状态 - 确保 API Key 和模态框状态在所有地方共享
const apiKey = ref('')
const showKeyModal = ref(false)

export function useTranslation() {
  const { notify } = useNotification()
  const { problems, currentProblemIndex, updateProblem, updateProblemById } = useProblemManager()

  const saveApiKey = (key: string) => {
    apiKey.value = key
    localStorage.setItem('deepseek_api_key', key)
    showKeyModal.value = false
    notify('success', 'API Key 已保存')
  }

  const translateCurrentProblem = async () => {
    const targetIndex = currentProblemIndex.value
    const targetProblem = problems.value[targetIndex]
    if (!targetProblem) return
    if (!targetProblem.extractedText) {
      notify('info', '请先等待文本提取完成')
      return
    }
    if (!apiKey.value) {
      showKeyModal.value = true
      notify('error', '请先设置 API Key')
      return
    }
    updateProblem(targetIndex, { isTranslating: true, error: '' })
    const systemPrompt = `You are an expert Competitive Programming Translator.
Translate the following Algorithm Problem Statement from English to Chinese.
RULES:
1. Keep all mathematical formulas in LaTeX format.
2. Use standard Chinese algorithmic terminology.
3. Structure the output clearly using Markdown headers.
4. Reconstruct Sample Input/Output using Markdown Code Blocks.`
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.value}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `PDF Content (Problem Part):\n\n${targetProblem.extractedText}` },
          ],
          stream: false,
        }),
      })
      if (!response.ok) throw new Error(`API Error: ${response.status}`)
      const data = await response.json()
      const aiText = data.choices?.[0]?.message?.content
      if (!aiText) throw new Error('未获取到翻译结果')
      const finalIndex = problems.value.findIndex((p) => p.id === targetProblem.id)
      if (finalIndex !== -1) {
        updateProblem(finalIndex, { translation: aiText, isTranslating: false })
      }
      notify('success', '翻译完成！')
    } catch (err: any) {
      console.error('Translate failed', err)
      updateProblemById(targetProblem.id, {
        isTranslating: false,
        error: `翻译失败: ${err?.message ?? '未知错误'}`,
      })
      notify('error', `翻译失败: ${err?.message ?? '未知错误'}`)
    }
  }

  return {
    apiKey,
    showKeyModal,
    saveApiKey,
    translateCurrentProblem,
  }
}
