import { ref } from 'vue'
import type { HeartEventDef, SkillType, SkillPerk5, SkillPerk10, SkillPerk15, SkillPerk20 } from '@/types'
import type { DiscoveryStep } from '@/types/hiddenNpc'
import type { SeasonEventDef } from '@/data/events'
import type { MorningChoiceEvent } from '@/data/farmEvents'
import { WEDDING_EVENT } from '@/data/heartEvents'
import { HIDDEN_NPCS } from '@/data/hiddenNpcs'
import { useGameStore } from '@/stores/useGameStore'
import { useNpcStore } from '@/stores/useNpcStore'
import { useHiddenNpcStore } from '@/stores/useHiddenNpcStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useSkillStore } from '@/stores/useSkillStore'
import { addLog, showFloat, _registerPerkChecker } from './useGameLog'
import { useAudio } from './useAudio'

// 模块级单例状态
const currentEvent = ref<SeasonEventDef | null>(null)
const pendingHeartEvent = ref<HeartEventDef | null>(null)
type FestivalType =
  | 'fishing_contest'
  | 'harvest_fair'
  | 'dragon_boat'
  | 'lantern_riddle'
  | 'pot_throwing'
  | 'dumpling_making'
  | 'firework_show'
  | 'tea_contest'
  | 'kite_flying'
const currentFestival = ref<FestivalType | null>(null)
const pendingPerk = ref<{ skillType: SkillType; level: 5 | 10 | 15 | 20 } | null>(null)

/** 宠物领养弹窗 */
const pendingPetAdoption = ref(false)

/** 检查是否有技能达到天赋阈值但尚未选择天赋 */
export const checkAllPerks = () => {
  const skillStore = useSkillStore()
  for (const skill of skillStore.skills) {
    if (skill.level >= 5 && !skill.perk5) {
      pendingPerk.value = { skillType: skill.type, level: 5 }
      return
    }
    if (skill.level >= 10 && !skill.perk10) {
      pendingPerk.value = { skillType: skill.type, level: 10 }
      return
    }
    if (skill.level >= 15 && skill.perk10 && !skill.perk15) {
      pendingPerk.value = { skillType: skill.type, level: 15 }
      return
    }
    if (skill.level >= 20 && skill.perk15 && !skill.perk20) {
      pendingPerk.value = { skillType: skill.type, level: 20 }
      return
    }
  }
}

// 向 useGameLog 注册 checkAllPerks，使 addLog 可触发天赋检查
_registerPerkChecker(checkAllPerks)

/** 处理天赋选择对话框 */
export const handlePerkSelect = (perk: SkillPerk5 | SkillPerk10 | SkillPerk15 | SkillPerk20) => {
  if (!pendingPerk.value) return
  const skillStore = useSkillStore()
  const { skillType, level } = pendingPerk.value
  if (level === 5) {
    skillStore.setPerk5(skillType, perk as SkillPerk5)
  } else if (level === 10) {
    skillStore.setPerk10(skillType, perk as SkillPerk10)
  } else if (level === 15) {
    skillStore.setPerk15(skillType, perk as SkillPerk15)
  } else {
    skillStore.setPerk20(skillType, perk as SkillPerk20)
  }
  addLog('习得了新专精！')
  pendingPerk.value = null
  checkAllPerks()
}

/** 判断是否为隐藏NPC */
const isHiddenNpcId = (npcId: string): boolean => HIDDEN_NPCS.some(n => n.id === npcId)

/** 触发心事件（由 NpcView / HiddenNpcModal 调用） */
export const triggerHeartEvent = (event: HeartEventDef) => {
  if (isHiddenNpcId(event.npcId)) {
    const hiddenNpcStore = useHiddenNpcStore()
    hiddenNpcStore.markHeartEventTriggered(event.npcId, event.id)
  } else {
    const npcStore = useNpcStore()
    npcStore.markHeartEventTriggered(event.npcId, event.id)
  }
  pendingHeartEvent.value = event
}

/** 关闭心事件对话框并应用友好度变化 */
export const closeHeartEvent = (changes: { npcId: string; amount: number }[]) => {
  for (const change of changes) {
    if (isHiddenNpcId(change.npcId)) {
      const hiddenNpcStore = useHiddenNpcStore()
      hiddenNpcStore.addAffinity(change.npcId, change.amount)
    } else {
      const npcStore = useNpcStore()
      npcStore.adjustFriendship(change.npcId, change.amount)
    }
    if (change.amount > 0) {
      addLog(`好感度+${change.amount}`)
    } else if (change.amount < 0) {
      addLog(`好感度${change.amount}`)
    }
  }
  pendingHeartEvent.value = null
}

/** 触发婚礼事件（由 useEndDay 调用） */
export const triggerWeddingEvent = (npcId: string) => {
  const event: HeartEventDef = { ...WEDDING_EVENT, npcId }
  pendingHeartEvent.value = event
}

/** 显示季节事件对话框 */
export const showEvent = (event: SeasonEventDef) => {
  currentEvent.value = event
}

/** 关闭季节事件对话框 */
export const closeEvent = () => {
  currentEvent.value = null
  const { endFestivalBgm } = useAudio()
  endFestivalBgm()
}

/** 显示节日庆典界面并播放小游戏专属 BGM */
export const showFestival = (type: FestivalType) => {
  currentFestival.value = type
  const { startMinigameBgm } = useAudio()
  startMinigameBgm(type)
}

/** 关闭节日庆典并发放奖品 */
export const closeFestival = (prize: number) => {
  if (prize > 0) {
    const playerStore = usePlayerStore()
    playerStore.earnMoney(prize)
    showFloat(`+${prize}文`, 'accent')
    addLog(`节日奖金：${prize}文！`)
  }
  currentFestival.value = null
  // 如果还有事件叙述在显示，切换到季节节日 BGM；否则直接恢复季节 BGM
  if (currentEvent.value) {
    const { startFestivalBgm } = useAudio()
    const gameStore = useGameStore()
    startFestivalBgm(gameStore.season)
  } else {
    const { endFestivalBgm } = useAudio()
    endFestivalBgm()
  }
}

/** 触发宠物领养弹窗 */
export const triggerPetAdoption = () => {
  pendingPetAdoption.value = true
}

/** 关闭宠物领养弹窗 */
export const closePetAdoption = () => {
  pendingPetAdoption.value = false
}

/** 子女提议弹窗 */
const childProposalVisible = ref(false)

/** 显示子女提议弹窗 */
export const showChildProposal = () => {
  childProposalVisible.value = true
}

/** 关闭子女提议弹窗 */
export const closeChildProposal = () => {
  childProposalVisible.value = false
}

/** 晨间选项事件弹窗 */
const pendingFarmEvent = ref<MorningChoiceEvent | null>(null)

/** 显示晨间选项事件 */
export const showFarmEvent = (event: MorningChoiceEvent) => {
  pendingFarmEvent.value = event
}

/** 关闭晨间选项事件 */
export const closeFarmEvent = () => {
  pendingFarmEvent.value = null
}

/** 仙灵发现场景弹窗队列 */
const pendingDiscoveryScenes = ref<{ npcId: string; step: DiscoveryStep }[]>([])

/** 当前显示的发现场景（队列头部） */
const pendingDiscoveryScene = ref<{ npcId: string; step: DiscoveryStep } | null>(null)

/** 添加仙灵发现场景到队列 */
export const showDiscoveryScene = (npcId: string, step: DiscoveryStep) => {
  pendingDiscoveryScenes.value.push({ npcId, step })
  if (!pendingDiscoveryScene.value) {
    pendingDiscoveryScene.value = pendingDiscoveryScenes.value.shift() ?? null
  }
}

/** 关闭当前仙灵发现场景，显示队列中的下一个 */
export const closeDiscoveryScene = () => {
  pendingDiscoveryScene.value = pendingDiscoveryScenes.value.shift() ?? null
}

export const useDialogs = () => {
  return {
    currentEvent,
    pendingHeartEvent,
    currentFestival,
    pendingPerk,
    pendingPetAdoption,
    childProposalVisible,
    checkAllPerks,
    handlePerkSelect,
    triggerHeartEvent,
    triggerWeddingEvent,
    closeHeartEvent,
    showEvent,
    closeEvent,
    showFestival,
    closeFestival,
    triggerPetAdoption,
    closePetAdoption,
    showChildProposal,
    closeChildProposal,
    pendingFarmEvent,
    showFarmEvent,
    closeFarmEvent,
    pendingDiscoveryScene,
    showDiscoveryScene,
    closeDiscoveryScene
  }
}
