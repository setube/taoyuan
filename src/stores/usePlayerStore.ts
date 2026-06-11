import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Gender } from '@/types'
import {
  LATE_NIGHT_RECOVERY_MAX,
  LATE_NIGHT_RECOVERY_MIN,
  PASSOUT_STAMINA_RECOVERY,
  PASSOUT_MONEY_PENALTY_RATE,
  PASSOUT_MONEY_PENALTY_CAP
} from '@/data/timeConstants'
import { useSkillStore } from './useSkillStore'
import { useHomeStore } from './useHomeStore'
import { useInventoryStore } from './useInventoryStore'
import { useAchievementStore } from './useAchievementStore'
import { useHiddenNpcStore } from './useHiddenNpcStore'
import { useMiningStore } from './useMiningStore'
import { useGuildStore } from './useGuildStore'
import { adjustMineDamageForMerit, adjustStaminaCostForMerit, type MeritStaminaActivity } from '@/composables/useMeritEffects'
import { useSystemStore } from './useSystemStore'

/** 最大体力阶梯 (5档, 270 起 508 顶) */
const STAMINA_CAPS = [120, 160, 200, 250, 300]

/** HP 常量 */
const BASE_MAX_HP = 100
const HP_PER_COMBAT_LEVEL = 5
const FIGHTER_HP_BONUS = 25
const WARRIOR_HP_BONUS = 40

export const usePlayerStore = defineStore('player', () => {
  const playerName = ref('未命名')
  const gender = ref<Gender>('male')
  /** 旧存档加载后需要设置身份（不持久化） */
  const needsIdentitySetup = ref(false)
  const money = ref(500)
  const stamina = ref(120)
  const maxStamina = ref(120)
  const staminaCapLevel = ref(0) // 0=120, 1=160, 2=200, 3=250, 4=300
  /** 额外体力上限加成（仙翁金丹等），不受仙桃阶梯覆盖 */
  const bonusMaxStamina = ref(0)

  // HP 系统
  const hp = ref(BASE_MAX_HP)
  const baseMaxHp = ref(BASE_MAX_HP)

  const isExhausted = computed(() => stamina.value <= 5)
  const staminaPercent = computed(() => Math.round((stamina.value / maxStamina.value) * 100))
  /** NPC 用来称呼玩家的称谓 */
  const honorific = computed(() => (gender.value === 'male' ? '小哥' : '姑娘'))

  /** 计算当前最大 HP（基础 + 战斗等级 + 专精加成 + 仙缘加成 + 公会加成） */
  const getMaxHp = (): number => {
    const skillStore = useSkillStore()
    let bonus = skillStore.combatLevel * HP_PER_COMBAT_LEVEL
    const perk5 = skillStore.getSkill('combat').perk5
    const perk10 = skillStore.getSkill('combat').perk10
    if (perk5 === 'fighter') bonus += FIGHTER_HP_BONUS
    if (perk10 === 'warrior') bonus += WARRIOR_HP_BONUS
    const ringHpBonus = useInventoryStore().getRingEffectValue('max_hp_bonus')
    // 仙缘结缘：灵护（spirit_shield）HP 加成
    const spiritShield = useHiddenNpcStore().getBondBonusByType('spirit_shield')
    const spiritHpBonus = spiritShield?.type === 'spirit_shield' ? spiritShield.hpBonus : 0
    // 公会加成：生命护符永久 + 等级被动
    const guildHpBonus = useMiningStore().guildBonusMaxHp
    const guildLevelHpBonus = useGuildStore().getGuildHpBonus()
    return baseMaxHp.value + bonus + ringHpBonus + spiritHpBonus + guildHpBonus + guildLevelHpBonus
  }

  const getHpPercent = (): number => {
    return Math.round((hp.value / getMaxHp()) * 100)
  }

  const getIsLowHp = (): boolean => {
    return hp.value <= getMaxHp() * 0.25
  }

  /** 消耗体力（含仙缘灵护、功勋巧手减免），返回是否成功 */
  const consumeStamina = (amount: number, activity: MeritStaminaActivity = 'general'): boolean => {
    const spiritShield2 = useHiddenNpcStore().getBondBonusByType('spirit_shield')
    const spiritSave = spiritShield2?.type === 'spirit_shield' ? spiritShield2.staminaSave / 100 : 0
    let effectiveAmount = Math.max(1, Math.floor(amount * (1 - spiritSave)))
    effectiveAmount = adjustStaminaCostForMerit(effectiveAmount, activity)
    if (stamina.value < effectiveAmount) return false
    stamina.value -= effectiveAmount
    try {
      useSystemStore().onStaminaThreshold()
    } catch {
      /* pinia 未就绪 */
    }
    return true
  }

  /** 恢复体力 */
  const restoreStamina = (amount: number) => {
    stamina.value = Math.min(stamina.value + amount, maxStamina.value)
    try {
      useSystemStore().onStaminaThreshold()
    } catch {
      /* pinia 未就绪 */
    }
  }

  /** 受到伤害（扣 HP），source=mine 时应用功勋铁骨减免 */
  const takeDamage = (amount: number, source: 'mine' | 'combat' | 'general' = 'general'): number => {
    let dmg = amount
    if (source === 'mine') dmg = adjustMineDamageForMerit(dmg)
    const actual = Math.min(dmg, hp.value)
    hp.value -= actual
    return actual
  }

  /** 恢复生命值 */
  const restoreHealth = (amount: number) => {
    hp.value = Math.min(hp.value + amount, getMaxHp())
  }

  /**
   * 每日重置
   * - 正常：满体力 + 满HP
   * - 晚睡：渐进恢复 (24时90%→25时60%) + 满HP
   * - 昏倒：50% 体力 + 满HP + 扣10%铜钱
   */
  const dailyReset = (mode: 'normal' | 'late' | 'passout', bedHour?: number): { moneyLost: number; recoveryPct: number } => {
    let moneyLost = 0
    let recoveryPct = 1
    switch (mode) {
      case 'normal':
        stamina.value = maxStamina.value
        break
      case 'late': {
        // 渐进式恢复：24时→90%, 25时→60%, 线性插值
        const homeStore = useHomeStore()
        const staminaBonus = homeStore.getStaminaRecoveryBonus()
        const t = Math.min(Math.max((bedHour ?? 24) - 24, 0), 1)
        recoveryPct = LATE_NIGHT_RECOVERY_MAX - t * (LATE_NIGHT_RECOVERY_MAX - LATE_NIGHT_RECOVERY_MIN) + staminaBonus
        stamina.value = Math.floor(maxStamina.value * Math.min(recoveryPct, 1))
        break
      }
      case 'passout': {
        const homeStore2 = useHomeStore()
        const staminaBonus2 = homeStore2.getStaminaRecoveryBonus()
        recoveryPct = PASSOUT_STAMINA_RECOVERY + staminaBonus2
        stamina.value = Math.floor(maxStamina.value * Math.min(recoveryPct, 1))
        moneyLost = Math.min(Math.floor(money.value * PASSOUT_MONEY_PENALTY_RATE), PASSOUT_MONEY_PENALTY_CAP)
        money.value -= moneyLost
        break
      }
    }
    // HP 每天都回满
    hp.value = getMaxHp()
    try {
      useSystemStore().onStaminaThreshold()
    } catch {
      /* pinia 未就绪 */
    }
    return { moneyLost, recoveryPct }
  }

  /** 提升体力上限 */
  const upgradeMaxStamina = (): boolean => {
    if (staminaCapLevel.value >= STAMINA_CAPS.length - 1) return false
    staminaCapLevel.value++
    maxStamina.value = STAMINA_CAPS[staminaCapLevel.value]! + bonusMaxStamina.value
    return true
  }

  /** 增加额外体力上限加成（仙翁金丹等） */
  const addBonusMaxStamina = (amount: number) => {
    bonusMaxStamina.value += amount
    maxStamina.value = STAMINA_CAPS[staminaCapLevel.value]! + bonusMaxStamina.value
  }

  /** 永久增加生命上限（功勋商店等） */
  const addBonusMaxHp = (amount: number) => {
    baseMaxHp.value += amount
    hp.value = Math.min(hp.value + amount, getMaxHp())
  }

  /** 花费铜钱，返回是否成功 */
  const spendMoney = (amount: number): boolean => {
    if (money.value < amount) return false
    money.value -= amount
    return true
  }

  /** 获得铜钱 */
  const earnMoney = (amount: number) => {
    money.value += amount
    useAchievementStore().recordMoneyEarned(amount)
  }

  /** 设置玩家身份（新游戏或旧存档迁移时调用） */
  const setIdentity = (name: string, g: Gender) => {
    playerName.value = name
    gender.value = g
    needsIdentitySetup.value = false
  }

  const serialize = () => {
    return {
      playerName: playerName.value,
      gender: gender.value,
      money: money.value,
      stamina: stamina.value,
      maxStamina: maxStamina.value,
      staminaCapLevel: staminaCapLevel.value,
      bonusMaxStamina: bonusMaxStamina.value,
      hp: hp.value,
      baseMaxHp: baseMaxHp.value
    }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    const hasIdentity = (data as any).playerName != null
    playerName.value = (data as any).playerName ?? '未命名'
    gender.value = (data as any).gender ?? 'male'
    needsIdentitySetup.value = !hasIdentity
    money.value = data.money
    stamina.value = data.stamina
    maxStamina.value = data.maxStamina
    staminaCapLevel.value = data.staminaCapLevel
    bonusMaxStamina.value = (data as any).bonusMaxStamina ?? 0
    // 旧存档兼容：如果没有 bonusMaxStamina 字段，从 maxStamina 和 staminaCapLevel 推算
    if ((data as any).bonusMaxStamina == null) {
      const expectedBase = STAMINA_CAPS[staminaCapLevel.value] ?? 120
      const diff = maxStamina.value - expectedBase
      if (diff > 0) bonusMaxStamina.value = diff
    }
    // 确保 maxStamina 与 staminaCapLevel + bonusMaxStamina 一致（修复旧存档）
    const expectedMax = (STAMINA_CAPS[staminaCapLevel.value] ?? 120) + bonusMaxStamina.value
    if (maxStamina.value !== expectedMax) {
      maxStamina.value = expectedMax
    }
    hp.value = (data as any).hp ?? BASE_MAX_HP
    baseMaxHp.value = (data as any).baseMaxHp ?? BASE_MAX_HP
  }

  return {
    playerName,
    gender,
    needsIdentitySetup,
    honorific,
    money,
    stamina,
    maxStamina,
    staminaCapLevel,
    bonusMaxStamina,
    hp,
    baseMaxHp,
    isExhausted,
    staminaPercent,
    getMaxHp,
    getHpPercent,
    getIsLowHp,
    consumeStamina,
    restoreStamina,
    takeDamage,
    restoreHealth,
    dailyReset,
    upgradeMaxStamina,
    addBonusMaxStamina,
    addBonusMaxHp,
    spendMoney,
    earnMoney,
    setIdentity,
    serialize,
    deserialize
  }
})
