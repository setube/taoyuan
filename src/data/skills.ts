import type { SkillPerk15, SkillPerk20, SkillType } from '@/types'

/** 专精元数据（锻造 Lv15/20；其余技能后续迁入） */
export interface PerkMeta {
  name: string
  description: string
}

export const FORGING_PERK15_BRANCHES: Record<string, { id: SkillPerk15; name: string; description: string }[]> = {
  smith_sword: [
    { id: 'keen_eye', name: '锐眼', description: '小游戏目标区再+10%' },
    { id: 'flame_keeper', name: '守炉', description: '起炉 perfect 时品质权重+5%' }
  ],
  smith_stamina: [
    { id: 'steady_arm', name: '稳臂', description: '练习经验+25%' },
    { id: 'efficient_smith', name: '省料锻', description: '工具升级材料再-10%' }
  ],
  smith_tool: [
    { id: 'steady_arm', name: '稳臂', description: '练习经验+25%' },
    { id: 'efficient_smith', name: '省料锻', description: '工具升级材料再-10%' }
  ],
  enchanter: [
    { id: 'rune_touch', name: '符文手', description: '词条重刷铜钱-25%' },
    { id: 'lucky_reroll', name: '吉锻', description: '重刷15%概率升一档词条 tier' }
  ],
  smith_time: [
    { id: 'quick_quench', name: '速淬', description: '锻造/练习时间再-0.25h' },
    { id: 'rune_touch', name: '符文手', description: '词条重刷铜钱-25%' }
  ],
  smith_armor: [
    { id: 'quick_quench', name: '速淬', description: '锻造/练习时间再-0.25h' },
    { id: 'frugal_fit', name: '俭锻', description: '帽/鞋/戒打造材料-10%' }
  ]
}

export const FORGING_PERK20_BRANCHES: Record<SkillPerk15, { id: SkillPerk20; name: string; description: string }[]> = {
  keen_eye: [
    { id: 'master_blade', name: '名匠', description: '武器攻击结算+5%' },
    { id: 'supreme_forge', name: '天工', description: '武器打造极品权重+5%' }
  ],
  flame_keeper: [
    { id: 'master_blade', name: '名匠', description: '武器攻击结算+5%' },
    { id: 'supreme_forge', name: '天工', description: '武器打造极品权重+5%' }
  ],
  steady_arm: [
    { id: 'practice_sage', name: '练圣', description: '练习得分→经验+30%' },
    { id: 'forge_master', name: '炉尊', description: '锻造体力再-15%，时间再-0.25h' }
  ],
  tireless: [
    { id: 'practice_sage', name: '练圣', description: '练习得分→经验+30%' },
    { id: 'forge_master', name: '炉尊', description: '锻造体力再-15%，时间再-0.25h' }
  ],
  efficient_smith: [
    { id: 'tool_legend', name: '工圣', description: '工具升级所需锻造等级-1' },
    { id: 'grand_temper', name: '神淬', description: '工具升级铜钱-20%' }
  ],
  quick_quench: [
    { id: 'forge_master', name: '炉尊', description: '锻造体力再-15%，时间再-0.25h' },
    { id: 'golden_anvil', name: '金砧', description: '打造装备出售+20%' }
  ],
  rune_touch: [
    { id: 'arch_enchanter', name: '大宗师', description: '极品第二槽 T4 权重+12%' },
    { id: 'twin_runes', name: '双纹', description: '重刷10%额外 roll 取优' }
  ],
  lucky_reroll: [
    { id: 'arch_enchanter', name: '大宗师', description: '极品第二槽 T4 权重+12%' },
    { id: 'twin_runes', name: '双纹', description: '重刷10%额外 roll 取优' }
  ],
  set_mason: [
    { id: 'royal_armorer', name: '御用', description: '防具打造品质权重+5%' },
    { id: 'golden_anvil', name: '金砧', description: '打造装备出售+20%' }
  ],
  frugal_fit: [
    { id: 'royal_armorer', name: '御用', description: '防具打造品质权重+5%' },
    { id: 'golden_anvil', name: '金砧', description: '打造装备出售+20%' }
  ]
}

/** 获取 Lv15 专精选项（当前仅 forging） */
export const getPerk15Options = (
  skillType: SkillType,
  perk10: string | null
): { id: SkillPerk15; name: string; description: string }[] => {
  if (skillType !== 'forging' || !perk10) return []
  return FORGING_PERK15_BRANCHES[perk10] ?? []
}

/** 获取 Lv20 专精选项（当前仅 forging） */
export const getPerk20Options = (
  skillType: SkillType,
  perk15: SkillPerk15 | null
): { id: SkillPerk20; name: string; description: string }[] => {
  if (skillType !== 'forging' || !perk15) return []
  return FORGING_PERK20_BRANCHES[perk15] ?? []
}

/** 旧档锻造专精 ID 迁移（§6） */
export const migrateForgingPerkIds = (skill: {
  perk10: string | null
  perk15: string | null
}): void => {
  if (skill.perk10 === 'smith_tool') skill.perk10 = 'smith_stamina'
  if (skill.perk10 === 'smith_armor') skill.perk10 = 'smith_time'
  if (skill.perk15 === 'tireless') skill.perk15 = 'steady_arm'
}
