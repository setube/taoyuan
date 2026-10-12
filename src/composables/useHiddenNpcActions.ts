import { useHiddenNpcStore } from '@/stores/useHiddenNpcStore'
import { useGameStore } from '@/stores/useGameStore'
import { addLog, showFloat } from './useGameLog'
import { getHiddenNpcById } from '@/data/hiddenNpcs'
import type { Quality } from '@/types'

/** 执行供奉 */
export const doOffering = (npcId: string, itemId: string, quality: Quality): boolean => {
  const hiddenNpcStore = useHiddenNpcStore()
  const result = hiddenNpcStore.performOffering(npcId, itemId, quality)
  if (result.success) {
    const gameStore = useGameStore()
    gameStore.advanceTime(0.5)
    if (result.affinityChange > 0) {
      showFloat(`+${result.affinityChange}缘分`, 'accent')
    } else if (result.affinityChange < 0) {
      showFloat(`${result.affinityChange}缘分`, 'danger')
    }
    addLog(result.message)
  } else {
    addLog(result.message)
  }
  return result.success
}

/** 执行独特互动 */
export const doSpecialInteraction = (npcId: string): boolean => {
  const def = getHiddenNpcById(npcId)
  if (!def) return false
  const hiddenNpcStore = useHiddenNpcStore()
  const result = hiddenNpcStore.performSpecialInteraction(npcId)
  if (result.success) {
    const gameStore = useGameStore()
    gameStore.advanceTime(1)
    showFloat(`+${result.affinityChange}缘分`, 'accent')
    addLog(result.message)
  } else {
    addLog(result.message)
  }
  return result.success
}

/** 发起求缘 */
export const doCourting = (npcId: string): boolean => {
  const hiddenNpcStore = useHiddenNpcStore()
  const result = hiddenNpcStore.startCourting(npcId)
  if (result.success) {
    showFloat('求缘成功', 'accent')
  }
  addLog(result.message)
  return result.success
}

/** 发起结缘 */
export const doBond = (npcId: string): boolean => {
  const hiddenNpcStore = useHiddenNpcStore()
  const result = hiddenNpcStore.formBond(npcId)
  if (result.success) {
    showFloat('结缘成功！', 'accent')
  }
  addLog(result.message)
  return result.success
}

/** 解除缘分 */
export const doDissolve = (npcId: string): boolean => {
  const hiddenNpcStore = useHiddenNpcStore()
  const result = hiddenNpcStore.dissolveBond(npcId)
  addLog(result.message)
  return result.success
}

/** 获取供奉偏好标签 */
export const getOfferingPreference = (npcId: string, itemId: string): 'resonant' | 'pleased' | 'repelled' | 'neutral' => {
  const def = getHiddenNpcById(npcId)
  if (!def) return 'neutral'
  if (def.resonantOfferings.includes(itemId)) return 'resonant'
  if (def.pleasedOfferings.includes(itemId)) return 'pleased'
  if (def.repelledOfferings.includes(itemId)) return 'repelled'
  return 'neutral'
}

export const OFFERING_PREF_LABELS: Record<string, string> = {
  resonant: '灵犀',
  pleased: '合意',
  repelled: '排斥',
  neutral: ''
}

export const OFFERING_PREF_CLASS: Record<string, string> = {
  resonant: 'text-accent',
  pleased: 'text-success',
  repelled: 'text-danger',
  neutral: ''
}

export const OFFERING_PREF_ORDER: Record<string, number> = {
  resonant: 0,
  pleased: 1,
  neutral: 2,
  repelled: 3
}
