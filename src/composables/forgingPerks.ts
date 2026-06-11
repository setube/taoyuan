import { useSkillStore } from '@/stores/useSkillStore'
import { useForgeStore } from '@/stores/useForgeStore'

const isSmithStaminaBranch = (perk10: string | null, perk15: string | null) =>
  perk10 === 'smith_stamina' || perk10 === 'smith_tool' || perk15 === 'steady_arm' || perk15 === 'tireless'

const isSmithTimeBranch = (perk10: string | null, perk15: string | null) =>
  perk10 === 'smith_time' || perk10 === 'smith_armor' || perk15 === 'quick_quench'

/** 锻造专精加成汇总（§6 效率向 + Lv15/20） */
export const getForgingPerkBonuses = () => {
  const skill = useSkillStore().getSkill('forging')
  const forgeStore = useForgeStore()

  const has = (id: string) =>
    skill.perk5 === id ||
    skill.perk10 === id ||
    skill.perk15 === id ||
    skill.perk20 === id

  let rhythmZoneMult = 1
  if (skill.perk10 === 'smith_sword') rhythmZoneMult += 0.2
  if (skill.perk15 === 'keen_eye') rhythmZoneMult += 0.1
  rhythmZoneMult += forgeStore.rhythmZoneBonus

  let qualityBonus = forgeStore.qualityWeightBonus
  if (skill.perk15 === 'flame_keeper') qualityBonus += 0.05
  if (skill.perk20 === 'supreme_forge') qualityBonus += 0.05
  if (skill.perk20 === 'royal_armorer') qualityBonus += 0.05

  let expMult = 1
  if (skill.perk5 === 'apprentice') expMult = 1.15

  let practiceExpBonus = 0
  if (skill.perk15 === 'steady_arm' || skill.perk15 === 'tireless') practiceExpBonus += 0.25
  if (skill.perk20 === 'practice_sage') practiceExpBonus += 0.3

  let forgeStaminaReduction = 0
  if (isSmithStaminaBranch(skill.perk10, skill.perk15) || has('smith_stamina')) {
    forgeStaminaReduction += 0.25
  }
  if (skill.perk20 === 'forge_master') forgeStaminaReduction += 0.15
  forgeStaminaReduction = Math.min(0.85, forgeStaminaReduction)

  let forgeTimeReductionHours = 0
  if (isSmithTimeBranch(skill.perk10, skill.perk15) || has('smith_time')) {
    forgeTimeReductionHours += 0.5
  }
  if (skill.perk15 === 'quick_quench') forgeTimeReductionHours += 0.25
  if (skill.perk20 === 'forge_master') forgeTimeReductionHours += 0.25

  let moneyDiscount = 0
  if (skill.perk10 === 'smith_armor' || skill.perk10 === 'smith_time') moneyDiscount = 0.15

  let toolMaterialDiscount = 0
  if (skill.perk10 === 'smith_tool' || skill.perk10 === 'smith_stamina') toolMaterialDiscount = 0.2
  if (skill.perk15 === 'efficient_smith') toolMaterialDiscount = Math.max(toolMaterialDiscount, 0.1)

  let accessoryMaterialDiscount = 0
  if (skill.perk15 === 'frugal_fit') accessoryMaterialDiscount = 0.1

  let rerollMoneyDiscount = 0
  if (skill.perk10 === 'enchanter') rerollMoneyDiscount = 0.2
  if (skill.perk15 === 'rune_touch') rerollMoneyDiscount = Math.max(rerollMoneyDiscount, 0.25)

  let weaponAttackMult = 1
  if (skill.perk20 === 'master_blade') weaponAttackMult = 1.05

  let setAffixMult = 1
  if (skill.perk15 === 'set_mason') setAffixMult = 1.1

  let craftedSellMult = 1
  if (skill.perk5 === 'merchant') craftedSellMult = 1.1
  if (skill.perk20 === 'golden_anvil') craftedSellMult = 1.2

  let t4WeightBonus = 0
  if (skill.perk20 === 'arch_enchanter') t4WeightBonus = 12

  const twinRuneChance = skill.perk20 === 'twin_runes' ? 0.1 : 0
  const luckyRerollTierChance = skill.perk15 === 'lucky_reroll' ? 0.15 : 0

  let toolMoneyDiscount = 0
  if (skill.perk20 === 'grand_temper') toolMoneyDiscount = 0.2

  const toolLevelReduction = skill.perk20 === 'tool_legend' ? 1 : 0

  return {
    rhythmZoneMult,
    qualityBonus,
    expMult,
    practiceExpBonus,
    forgeStaminaReduction,
    forgeTimeReductionHours,
    moneyDiscount,
    toolMaterialDiscount,
    accessoryMaterialDiscount,
    rerollMoneyDiscount,
    weaponAttackMult,
    setAffixMult,
    craftedSellMult,
    t4WeightBonus,
    twinRuneChance,
    luckyRerollTierChance,
    toolMoneyDiscount,
    toolLevelReduction,
    has
  }
}

export const useForgingPerkBonuses = getForgingPerkBonuses
