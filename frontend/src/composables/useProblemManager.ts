import { ref, computed } from 'vue'
import type { Problem } from '@/types'

// 单例状态 - 确保所有地方使用同一个状态实例
const problems = ref<Problem[]>([])
const currentProblemIndex = ref(0)
const contestName = ref('')

export function useProblemManager() {
  const currentProblem = computed(() => problems.value[currentProblemIndex.value] ?? null)

  const updateProblem = (index: number, patch: Partial<Problem>) => {
    const next = [...problems.value]
    const existing = next[index]
    if (!existing) return
    next[index] = { ...existing, ...patch }
    problems.value = next
  }

  const updateProblemById = (id: string, patch: Partial<Problem>) => {
    const idx = problems.value.findIndex((p) => p.id === id)
    if (idx !== -1) updateProblem(idx, patch)
    return idx
  }

  const clearProblems = () => {
    problems.value = []
    contestName.value = ''
    currentProblemIndex.value = 0
  }

  return {
    problems,
    currentProblemIndex,
    contestName,
    currentProblem,
    updateProblem,
    updateProblemById,
    clearProblems,
  }
}
