import type { QuestDifficulty, QuestType } from '@/types/system'

export interface QuestTemplate {
  id: string
  type: QuestType
  difficulty: QuestDifficulty
  title: string
  /** 描述模板，运行时替换 {qty} {floor} {hearts} {level} {threshold} */
  description: string
  target: {
    itemId?: string
    quantity?: number
    floor?: number
    npcId?: string
    hearts?: number
    skillType?: string
    skillLevel?: number
    fishId?: string
    metric?: string
    threshold?: number
  }
  /** 备用池，季轮换时补充 */
  reserve?: boolean
  /** 派发门槛（未满足则不进入任务池） */
  requires?: {
    minTavernLevel?: number
    minFarmhouseLevel?: number
    minMineFloor?: number
    minSkillLevel?: { skillType: string; level: number }
    warehouseUnlocked?: boolean
    minAnimalCount?: number
    fishPondBuilt?: boolean
    minBreedingStations?: number
  }
}

const DEADLINE_DAYS: Record<QuestDifficulty, number> = {
  1: 3,
  2: 7,
  3: 14,
  4: 28
}

const BASE_REWARD: Record<QuestDifficulty, number> = {
  1: 2,
  2: 5,
  3: 10,
  4: 20
}

export function getQuestDeadlineDays(difficulty: QuestDifficulty): number {
  return DEADLINE_DAYS[difficulty]
}

export function getQuestBaseReward(difficulty: QuestDifficulty): number {
  return BASE_REWARD[difficulty]
}

/** 主池 + 备用池共 55 条 */
export const QUEST_TEMPLATES: QuestTemplate[] = [
  // === 采集 collect ===
  { id: 'collect_copper_1', type: 'collect', difficulty: 1, title: '浅层铜矿', description: '收集 {qty} 个铜矿', target: { itemId: 'copper_ore', quantity: 5 } },
  { id: 'collect_iron_1', type: 'collect', difficulty: 1, title: '铁矿储备', description: '收集 {qty} 个铁矿', target: { itemId: 'iron_ore', quantity: 4 } },
  { id: 'collect_charcoal_2', type: 'collect', difficulty: 2, title: '木炭补给', description: '收集 {qty} 个木炭', target: { itemId: 'charcoal', quantity: 8 } },
  { id: 'collect_jade_2', type: 'collect', difficulty: 2, title: '温润翡翠', description: '收集 {qty} 个翡翠', target: { itemId: 'jade', quantity: 3 } },
  { id: 'collect_gold_3', type: 'collect', difficulty: 3, title: '金矿采集', description: '收集 {qty} 个金矿', target: { itemId: 'gold_ore', quantity: 5 } },
  { id: 'collect_prismatic_4', type: 'collect', difficulty: 4, title: '五彩碎片', description: '收集 {qty} 个五彩碎片', target: { itemId: 'prismatic_shard', quantity: 1 }, requires: { minMineFloor: 40 } },
  { id: 'collect_wood_1', type: 'collect', difficulty: 1, title: '木材囤积', description: '收集 {qty} 个木材', target: { itemId: 'wood', quantity: 20 } },
  { id: 'collect_honey_2', type: 'collect', difficulty: 2, title: '蜂蜜储备', description: '收集 {qty} 个蜂蜜', target: { itemId: 'honey', quantity: 5 } },

  // === 矿洞 mine ===
  { id: 'mine_floor_10', type: 'mine', difficulty: 1, title: '初探矿洞', description: '到达矿洞第 {floor} 层', target: { floor: 10 } },
  { id: 'mine_floor_20', type: 'mine', difficulty: 2, title: '深入矿脉', description: '到达矿洞第 {floor} 层', target: { floor: 20 } },
  { id: 'mine_floor_40', type: 'mine', difficulty: 2, title: '冰霜前哨', description: '到达矿洞第 {floor} 层', target: { floor: 40 } },
  { id: 'mine_floor_60', type: 'mine', difficulty: 3, title: '暗影层域', description: '到达矿洞第 {floor} 层', target: { floor: 60 } },
  { id: 'mine_floor_80', type: 'mine', difficulty: 3, title: '熔岩深渊', description: '到达矿洞第 {floor} 层', target: { floor: 80 } },
  { id: 'mine_floor_100', type: 'mine', difficulty: 4, title: '百层试炼', description: '到达矿洞第 {floor} 层', target: { floor: 100 } },
  { id: 'mine_floor_120', type: 'mine', difficulty: 4, title: '深渊龙王', description: '到达矿洞第 {floor} 层', target: { floor: 120 } },

  // === 社交 social ===
  { id: 'social_liu_2', type: 'social', difficulty: 1, title: '柳娘的心意', description: '与柳娘好感达到 {hearts} 心', target: { npcId: 'liu_niang', hearts: 2 } },
  { id: 'social_any_3', type: 'social', difficulty: 1, title: '邻里之交', description: '与任意 NPC 好感达到 {hearts} 心', target: { hearts: 3 } },
  { id: 'social_a_shi_4', type: 'social', difficulty: 2, title: '阿石的信任', description: '与阿石好感达到 {hearts} 心', target: { npcId: 'a_shi', hearts: 4 } },
  { id: 'social_any_5', type: 'social', difficulty: 2, title: '桃源知己', description: '与任意 NPC 好感达到 {hearts} 心', target: { hearts: 5 } },
  { id: 'social_hong_6', type: 'social', difficulty: 3, title: '红豆的羁绊', description: '与红豆好感达到 {hearts} 心', target: { npcId: 'hong_dou', hearts: 6 } },
  { id: 'social_any_8', type: 'social', difficulty: 4, title: '八心之谊', description: '与任意 NPC 好感达到 {hearts} 心', target: { hearts: 8 } },

  // === 技能 skill ===
  { id: 'skill_farming_3', type: 'skill', difficulty: 1, title: '农耕入门', description: '农耕技能达到 {level} 级', target: { skillType: 'farming', skillLevel: 3 } },
  { id: 'skill_fishing_3', type: 'skill', difficulty: 1, title: '垂钓初学', description: '钓鱼技能达到 {level} 级', target: { skillType: 'fishing', skillLevel: 3 } },
  { id: 'skill_cooking_5', type: 'skill', difficulty: 2, title: '厨艺精进', description: '烹饪技能达到 {level} 级', target: { skillType: 'cooking', skillLevel: 5 } },
  { id: 'skill_mining_5', type: 'skill', difficulty: 2, title: '采矿老手', description: '采矿技能达到 {level} 级', target: { skillType: 'mining', skillLevel: 5 } },
  { id: 'skill_combat_7', type: 'skill', difficulty: 3, title: '战斗修行', description: '战斗技能达到 {level} 级', target: { skillType: 'combat', skillLevel: 7 } },
  { id: 'skill_any_10', type: 'skill', difficulty: 4, title: '宗师之路', description: '任意技能达到 {level} 级', target: { skillType: 'any', skillLevel: 10 } },

  // === 制作 craft ===
  { id: 'craft_cabbage_1', type: 'craft', difficulty: 1, title: '家常炒青菜', description: '拥有 {qty} 份炒青菜', target: { itemId: 'food_stir_fried_cabbage', quantity: 3 } },
  { id: 'craft_miner_2', type: 'craft', difficulty: 2, title: '矿工便当', description: '拥有 {qty} 份矿工便当', target: { itemId: 'food_miner_lunch', quantity: 2 } },
  { id: 'craft_wine_2', type: 'craft', difficulty: 2, title: '桂花酿', description: '拥有 {qty} 瓶桂花酿', target: { itemId: 'osmanthus_wine', quantity: 2 } },
  { id: 'craft_hotpot_3', type: 'craft', difficulty: 3, title: '麻辣火锅', description: '拥有 {qty} 份麻辣火锅', target: { itemId: 'food_spicy_hotpot', quantity: 1 } },
  { id: 'craft_braised_2', type: 'craft', difficulty: 2, title: '红烧鲤鱼', description: '拥有 {qty} 份红烧鲤鱼', target: { itemId: 'food_braised_carp', quantity: 2 } },

  // === 钓鱼 fish ===
  { id: 'fish_crucian_1', type: 'fish', difficulty: 1, title: '溪边鲫鱼', description: '拥有 {qty} 条鲫鱼', target: { fishId: 'crucian', quantity: 3 } },
  { id: 'fish_carp_1', type: 'fish', difficulty: 1, title: '鲤鱼丰收', description: '拥有 {qty} 条鲤鱼', target: { fishId: 'carp', quantity: 3 } },
  { id: 'fish_golden_2', type: 'fish', difficulty: 2, title: '金鲈挑战', description: '拥有 {qty} 条金鲈', target: { fishId: 'golden_perch', quantity: 1 } },
  { id: 'fish_bass_2', type: 'fish', difficulty: 2, title: '鲈鱼达人', description: '拥有 {qty} 条鲈鱼', target: { fishId: 'bass', quantity: 2 } },
  { id: 'fish_dragon_4', type: 'fish', difficulty: 4, title: '传说龙鱼', description: '拥有 {qty} 条龙鱼', target: { fishId: 'dragonfish', quantity: 1 }, requires: { minSkillLevel: { skillType: 'fishing', level: 5 } } },

  // === 酒肆 tavern ===
  { id: 'tavern_revenue_1', type: 'tavern', difficulty: 1, title: '开张营收', description: '酒肆单日收入达到 {threshold} 文', target: { metric: 'revenue', threshold: 500 }, requires: { minTavernLevel: 1 } },
  { id: 'tavern_rep_2', type: 'tavern', difficulty: 2, title: '口碑经营', description: '酒肆口碑达到 {threshold}', target: { metric: 'reputation', threshold: 70 }, requires: { minTavernLevel: 1 } },
  { id: 'tavern_feast_3', type: 'tavern', difficulty: 3, title: '宴席订单', description: '完成 {qty} 个 NPC 宴席订单', target: { metric: 'feast', threshold: 1 }, requires: { minTavernLevel: 1 } },
  { id: 'tavern_revenue_2', type: 'tavern', difficulty: 2, title: '旺铺营收', description: '酒肆单日收入达到 {threshold} 文', target: { metric: 'revenue', threshold: 1200 }, requires: { minTavernLevel: 1 } },

  // === 备用池 reserve ===
  { id: 'collect_firewood_1', type: 'collect', difficulty: 1, title: '柴火储备', description: '收集 {qty} 个柴火', target: { itemId: 'firewood', quantity: 15 }, reserve: true },
  { id: 'collect_quartz_2', type: 'collect', difficulty: 2, title: '石英采集', description: '收集 {qty} 个石英', target: { itemId: 'quartz', quantity: 6 }, reserve: true },
  { id: 'mine_floor_30', type: 'mine', difficulty: 2, title: '三十层突破', description: '到达矿洞第 {floor} 层', target: { floor: 30 }, reserve: true },
  { id: 'social_qiu_3', type: 'social', difficulty: 1, title: '秋月相识', description: '与秋月好感达到 {hearts} 心', target: { npcId: 'qiu_yue', hearts: 3 }, reserve: true },
  { id: 'skill_foraging_4', type: 'skill', difficulty: 2, title: '采集精进', description: '采集技能达到 {level} 级', target: { skillType: 'foraging', skillLevel: 4 }, reserve: true },
  { id: 'craft_porridge_1', type: 'craft', difficulty: 1, title: '药膳粥', description: '拥有 {qty} 份药膳粥', target: { itemId: 'food_herbal_porridge', quantity: 2 }, reserve: true },
  { id: 'fish_silver_1', type: 'fish', difficulty: 1, title: '银鲢垂钓', description: '拥有 {qty} 条银鲢', target: { fishId: 'silver_carp', quantity: 3 }, reserve: true },
  { id: 'tavern_rep_3', type: 'tavern', difficulty: 3, title: '名店口碑', description: '酒肆口碑达到 {threshold}', target: { metric: 'reputation', threshold: 85 }, reserve: true, requires: { minTavernLevel: 1 } },
  { id: 'collect_ruby_3', type: 'collect', difficulty: 3, title: '红宝石', description: '收集 {qty} 个红宝石', target: { itemId: 'ruby', quantity: 2 }, reserve: true },
  { id: 'mine_floor_50', type: 'mine', difficulty: 3, title: '五十层征途', description: '到达矿洞第 {floor} 层', target: { floor: 50 }, reserve: true },
  { id: 'social_chun_4', type: 'social', difficulty: 2, title: '春兰相知', description: '与春兰好感达到 {hearts} 心', target: { npcId: 'chun_lan', hearts: 4 }, reserve: true },
  { id: 'skill_farming_7', type: 'skill', difficulty: 3, title: '农耕大师', description: '农耕技能达到 {level} 级', target: { skillType: 'farming', skillLevel: 7 }, reserve: true },
  { id: 'craft_cake_2', type: 'craft', difficulty: 2, title: '桂花糕', description: '拥有 {qty} 份桂花糕', target: { itemId: 'food_osmanthus_cake', quantity: 3 }, reserve: true },
  { id: 'fish_turtle_2', type: 'fish', difficulty: 2, title: '灵龟垂钓', description: '拥有 {qty} 只乌龟', target: { fishId: 'pond_turtle', quantity: 1 }, reserve: true },
  { id: 'tavern_feast_2', type: 'tavern', difficulty: 2, title: '双席宴席', description: '完成 {qty} 个 NPC 宴席订单', target: { metric: 'feast', threshold: 2 }, reserve: true, requires: { minTavernLevel: 1 } },
  { id: 'collect_moonstone_3', type: 'collect', difficulty: 3, title: '月光石', description: '收集 {qty} 个月光石', target: { itemId: 'moonstone', quantity: 2 }, reserve: true },
  { id: 'mine_floor_15', type: 'mine', difficulty: 1, title: '十五层探索', description: '到达矿洞第 {floor} 层', target: { floor: 15 }, reserve: true },
  { id: 'social_lin_3', type: 'social', difficulty: 1, title: '林老相识', description: '与林老好感达到 {hearts} 心', target: { npcId: 'lin_lao', hearts: 3 }, reserve: true },
  { id: 'skill_fishing_6', type: 'skill', difficulty: 3, title: '钓鱼高手', description: '钓鱼技能达到 {level} 级', target: { skillType: 'fishing', skillLevel: 6 }, reserve: true },
  { id: 'craft_steamed_2', type: 'craft', difficulty: 2, title: '清蒸鲈鱼', description: '拥有 {qty} 份清蒸鲈鱼', target: { itemId: 'food_steamed_bass', quantity: 2 }, reserve: true },
  { id: 'fish_koi_3', type: 'fish', difficulty: 3, title: '锦鲤祈福', description: '拥有 {qty} 条锦鲤', target: { fishId: 'koi', quantity: 1 }, reserve: true }
]

export function getTemplateById(id: string): QuestTemplate | undefined {
  return QUEST_TEMPLATES.find(t => t.id === id)
}
