import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { migrateForgingPerkIds } from '@/data/skills'
import type { SkillType, SkillState, SkillPerk5, SkillPerk10, SkillPerk15, SkillPerk20 } from '@/types'
import { useInventoryStore } from './useInventoryStore'
import { getMeritBonus } from '@/composables/useMeritEffects'
import { useSystemStore } from './useSystemStore'

/** 各等级所需累计经验（Lv0～20，§技能树 spec 5.1） */
const EXP_TABLE = [
  0, 100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000, 22000, 32000, 46000, 65000, 90000, 125000,
  175000, 240000, 330000, 450000
]
const MAX_SKILL_LEVEL = 20

/** 创建初始技能状态 */
const createSkill = (type: SkillType): SkillState => {
  return { type, exp: 0, level: 0, perk5: null, perk10: null, perk15: null, perk20: null }
}

export const useSkillStore = defineStore('skill', () => {
  const skills = ref<SkillState[]>([
    createSkill('farming'),
    createSkill('foraging'),
    createSkill('fishing'),
    createSkill('mining'),
    createSkill('combat'),
    createSkill('cooking'),
    createSkill('forging')
  ])

  const getSkill = (type: SkillType): SkillState => {
    return skills.value.find(s => s.type === type)!
  }

  const farmingLevel = computed(() => getSkill('farming').level)
  const fishingLevel = computed(() => getSkill('fishing').level)
  const miningLevel = computed(() => getSkill('mining').level)
  const foragingLevel = computed(() => getSkill('foraging').level)
  const combatLevel = computed(() => getSkill('combat').level)
  const cookingLevel = computed(() => getSkill('cooking').level)
  const forgingLevel = computed(() => getSkill('forging').level)

  /** 增加经验并自动升级（含戒指经验加成） */
  const addExp = (type: SkillType, amount: number): { leveledUp: boolean; newLevel: number } => {
    const ringExpBonus = useInventoryStore().getRingEffectValue('exp_bonus')
    const meritExpBonus = getMeritBonus('skill_exp')
    const adjustedAmount = Math.floor(amount * (1 + ringExpBonus + meritExpBonus))

    const skill = getSkill(type)
    skill.exp += adjustedAmount
    let leveledUp = false

    while (skill.level < MAX_SKILL_LEVEL) {
      const nextLevelExp = EXP_TABLE[skill.level + 1]!
      if (skill.exp >= nextLevelExp) {
        skill.level++
        leveledUp = true
      } else {
        break
      }
    }

    if (leveledUp) {
      try {
        useSystemStore().onSkillLevelUp(type, skill.level)
      } catch {
        /* pinia 未就绪 */
      }
    }

    return { leveledUp, newLevel: skill.level }
  }

  /** 获取升级到下一级所需经验 */
  const getExpToNextLevel = (type: SkillType): { current: number; required: number } | null => {
    const skill = getSkill(type)
    if (skill.level >= MAX_SKILL_LEVEL) return null
    return { current: skill.exp, required: EXP_TABLE[skill.level + 1]! }
  }

  const hasPerk = (perkId: string): boolean => {
    for (const skill of skills.value) {
      if (
        skill.perk5 === perkId ||
        skill.perk10 === perkId ||
        skill.perk15 === perkId ||
        skill.perk20 === perkId
      ) {
        return true
      }
    }
    return false
  }

  /** 设置等级15专精（当前 forging 实装） */
  const setPerk15 = (type: SkillType, perk: SkillPerk15): boolean => {
    const skill = getSkill(type)
    if (skill.level < 15 || !skill.perk10 || skill.perk15 !== null) return false
    skill.perk15 = perk
    return true
  }

  /** 设置等级20专精 */
  const setPerk20 = (type: SkillType, perk: SkillPerk20): boolean => {
    const skill = getSkill(type)
    if (skill.level < 20 || !skill.perk15 || skill.perk20 !== null) return false
    skill.perk20 = perk
    return true
  }

  /** 计算技能对体力消耗的减免 (每级减少1%，10级共减少10%) */
  const getStaminaReduction = (type: SkillType): number => {
    return getSkill(type).level * 0.01
  }

  /** 设置等级5专精 */
  const setPerk5 = (type: SkillType, perk: SkillPerk5): boolean => {
    const skill = getSkill(type)
    if (skill.level < 5 || skill.perk5 !== null) return false
    skill.perk5 = perk
    return true
  }

  /** 设置等级10专精 */
  const setPerk10 = (type: SkillType, perk: SkillPerk10): boolean => {
    const skill = getSkill(type)
    if (skill.level < 10 || skill.perk10 !== null) return false
    skill.perk10 = perk
    return true
  }

  /** 判断作物品质（基于农耕等级） */
  const rollCropQuality = (): 'normal' | 'fine' | 'excellent' | 'supreme' => {
    return rollCropQualityWithBonus(0)
  }

  /** 判断作物品质（带肥料加成 + 可选技能等级加成） */
  const rollCropQualityWithBonus = (qualityBonus: number, levelBonus: number = 0): 'normal' | 'fine' | 'excellent' | 'supreme' => {
    const level = farmingLevel.value + levelBonus
    const roll = Math.random()

    if (level >= 9 && roll < 0.05 + qualityBonus * 0.5) return 'supreme'
    if (level >= 6 && roll < 0.15 + qualityBonus) return 'excellent'
    if (level >= 3 && roll < 0.3 + qualityBonus) return 'fine'
    return 'normal'
  }

  /** 判断采集物品质（基于采集等级和专精 + 可选技能等级加成） */
  const rollForageQuality = (levelBonus: number = 0): 'normal' | 'fine' | 'excellent' | 'supreme' => {
    const skill = getSkill('foraging')
    if (skill.perk10 === 'botanist') return 'excellent'
    const level = skill.level + levelBonus
    const roll = Math.random()

    if (level >= 9 && roll < 0.05) return 'supreme'
    if (level >= 6 && roll < 0.12) return 'excellent'
    if (level >= 3 && roll < 0.25) return 'fine'
    return 'normal'
  }

  /** 旧档一次性迁移：累计烹饪次数 → cooking 经验 */
  const migrateCookingExpFromRecipes = (totalRecipesCooked: number, alreadyMigrated: boolean): boolean => {
    if (alreadyMigrated || totalRecipesCooked <= 0) return false
    addExp('cooking', totalRecipesCooked * 5)
    return true
  }

  const serialize = () => {
    return { skills: skills.value }
  }

  const deserialize = (data: ReturnType<typeof serialize>) => {
    const arr: SkillState[] = data.skills ?? []
    // 确保 5 个技能都存在（旧存档可能没有 combat）
    const allTypes: SkillType[] = ['farming', 'foraging', 'fishing', 'mining', 'combat', 'cooking', 'forging']
    for (const type of allTypes) {
      const existing = arr.find(s => s.type === type)
      if (!existing) {
        const newSkill = createSkill(type)
        // 旧存档迁移：mining 的 fighter/warrior/brute → combat
        if (type === 'combat') {
          const mining = arr.find(s => s.type === 'mining')
          if (mining && mining.perk5 === 'fighter') {
            newSkill.exp = mining.exp
            newSkill.level = mining.level
            newSkill.perk5 = 'fighter'
            newSkill.perk10 = mining.perk10
            mining.perk5 = null
            mining.perk10 = null
          }
        }
        arr.push(newSkill)
      } else {
        existing.perk15 ??= null
        existing.perk20 ??= null
        if (existing.type === 'forging') migrateForgingPerkIds(existing)
      }
    }
    skills.value = arr
  }

  return {
    skills,
    farmingLevel,
    fishingLevel,
    miningLevel,
    foragingLevel,
    combatLevel,
    cookingLevel,
    forgingLevel,
    getSkill,
    migrateCookingExpFromRecipes,
    addExp,
    getExpToNextLevel,
    getStaminaReduction,
    setPerk5,
    setPerk10,
    setPerk15,
    setPerk20,
    hasPerk,
    rollCropQuality,
    rollCropQualityWithBonus,
    rollForageQuality,
    serialize,
    deserialize
  }
})
