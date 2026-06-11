export type ForgeQuestType =
  | 'forge_craft'
  | 'forge_deliver'
  | 'forge_reroll'
  | 'forge_material'
  | 'forge_perfect'

export interface ForgeQuestTemplate {
  id: string
  issuerNpcId: 'sun_tiejiang' | 'a_tie'
  description: string
  type: ForgeQuestType
  /** forge_craft: 次数；forge_reroll: 次数 */
  count?: number
  /** forge_deliver: 最低品质 */
  minQuality?: 'fine' | 'excellent' | 'supreme'
  /** forge_deliver: 品类 */
  category?: 'weapon' | 'ring' | 'hat' | 'shoe'
  /** forge_deliver: 指定装备 defId（可选） */
  targetDefId?: string
  /** forge_material */
  materialId?: string
  materialQty?: number
  expReward: number
  moneyReward: number
  friendshipReward?: number
}

/** §10.3 铁匠任务模板 */
export const FORGE_QUEST_TEMPLATES: ForgeQuestTemplate[] = [
  {
    id: 'fq_copper_swords',
    issuerNpcId: 'sun_tiejiang',
    description: '打造 2 把铜剑',
    type: 'forge_craft',
    count: 2,
    category: 'weapon',
    expReward: 40,
    moneyReward: 150
  },
  {
    id: 'fq_iron_ring',
    issuerNpcId: 'a_tie',
    description: '交付 1 枚优良以上铁戒指',
    type: 'forge_deliver',
    category: 'ring',
    minQuality: 'fine',
    expReward: 55,
    moneyReward: 200,
    friendshipReward: 5
  },
  {
    id: 'fq_copper_bars',
    issuerNpcId: 'sun_tiejiang',
    description: '收集 5 块铜锭交给孙铁匠',
    type: 'forge_material',
    materialId: 'copper_bar',
    materialQty: 5,
    expReward: 30,
    moneyReward: 100
  },
  {
    id: 'fq_forge_any',
    issuerNpcId: 'sun_tiejiang',
    description: '亲手打造 3 件装备',
    type: 'forge_craft',
    count: 3,
    expReward: 45,
    moneyReward: 180
  },
  {
    id: 'fq_practice_rings',
    issuerNpcId: 'a_tie',
    description: '打造 2 枚戒指',
    type: 'forge_craft',
    count: 2,
    category: 'ring',
    expReward: 35,
    moneyReward: 120,
    friendshipReward: 3
  }
]

export interface ActiveForgeQuest {
  instanceId: string
  templateId: string
  acceptedDay: number
  deadlineDay: number
  progress: number
}

export interface ForgeBoardQuest {
  templateId: string
  postedDay: number
}

/** 已提交完成的铁匠任务记录 */
export interface CompletedForgeQuest {
  instanceId: string
  templateId: string
  completedDay: number
}

/** 任务奖励文案（浮动提示 / 任务卡展示） */
export const formatForgeQuestRewardText = (tpl: ForgeQuestTemplate): string => {
  const parts = [`+${tpl.expReward} 锻造经验`, `+${tpl.moneyReward} 文`]
  if (tpl.friendshipReward) parts.push(`+${tpl.friendshipReward} 好感`)
  return parts.join(' · ')
}
