import type { EquipmentEffectType } from '@/types'

/** 套装奖励档位 */
export interface SetBonusLevel {
  count: 2 | 3 | 4
  effects: { type: EquipmentEffectType; value: number }[]
  description: string
}

/** 装备套装定义 */
export interface EquipmentSetDef {
  id: string
  name: string
  description: string
  pieces: {
    weapon?: string
    ring: string
    hat: string
    shoe: string
  }
  bonuses: SetBonusLevel[]
}

export const EQUIPMENT_SETS: EquipmentSetDef[] = [
  {
    id: 'miner_set',
    name: '矿工套装',
    description: '专业矿工的标准装备',
    pieces: { ring: 'miners_ring', hat: 'miner_helmet', shoe: 'miner_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'ore_bonus', value: 1 }], description: '矿石加成+1' },
      { count: 3, effects: [{ type: 'mining_stamina', value: 0.1 }], description: '采矿体力消耗-10%' }
    ]
  },
  {
    id: 'fisher_set',
    name: '渔夫套装',
    description: '老练渔夫的行头',
    pieces: { ring: 'anglers_ring', hat: 'fisher_hat', shoe: 'fishing_waders' },
    bonuses: [
      { count: 2, effects: [{ type: 'fish_quality_bonus', value: 0.1 }], description: '鱼类品质+10%' },
      { count: 3, effects: [{ type: 'fishing_calm', value: 0.1 }], description: '钓鱼稳定+10%' }
    ]
  },
  {
    id: 'merchant_set',
    name: '商贾套装',
    description: '精明商人的生意行头',
    pieces: { ring: 'merchants_ring', hat: 'merchant_hat', shoe: 'merchant_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'sell_price_bonus', value: 0.05 }], description: '售价+5%' },
      { count: 3, effects: [{ type: 'shop_discount', value: 0.08 }], description: '商店折扣+8%' }
    ]
  },
  {
    id: 'harvest_set',
    name: '丰收套装',
    description: '丰收季节的农人装束',
    pieces: { ring: 'harvest_moon_ring', hat: 'jade_hairpin', shoe: 'silk_slippers' },
    bonuses: [
      { count: 2, effects: [{ type: 'crop_growth_bonus', value: 0.1 }], description: '作物生长+10%' },
      { count: 3, effects: [{ type: 'crop_quality_bonus', value: 0.1 }], description: '作物品质+10%' }
    ]
  },
  {
    id: 'dragon_warrior_set',
    name: '战龙套装',
    description: '以龙为名的战士铠甲',
    pieces: { ring: 'warlord_ring', hat: 'dragon_helm', shoe: 'dragon_scale_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'attack_bonus', value: 3 }], description: '攻击力+3' },
      { count: 3, effects: [{ type: 'crit_rate_bonus', value: 0.1 }], description: '暴击率+10%' }
    ]
  },
  {
    id: 'obsidian_set',
    name: '黑曜套装',
    description: '黑曜石锻造的重型护甲',
    pieces: { ring: 'stalwart_ring', hat: 'obsidian_helm', shoe: 'obsidian_greaves' },
    bonuses: [
      { count: 2, effects: [{ type: 'max_hp_bonus', value: 20 }], description: '最大HP+20' },
      { count: 3, effects: [{ type: 'defense_bonus', value: 0.1 }], description: '防御+10%' }
    ]
  },
  {
    id: 'phoenix_set',
    name: '凤凰套装',
    description: '凤凰涅槃，福运加身',
    pieces: { ring: 'fortune_ring', hat: 'phoenix_crown', shoe: 'phoenix_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'luck', value: 0.05 }], description: '幸运+5%' },
      { count: 3, effects: [{ type: 'exp_bonus', value: 0.15 }], description: '经验加成+15%' }
    ]
  },
  {
    id: 'shadow_set',
    name: '暗影套装',
    description: '暗影中潜行的刺客装备',
    pieces: { ring: 'shadow_ring', hat: 'shadow_mask', shoe: 'shadow_striders' },
    bonuses: [
      { count: 2, effects: [{ type: 'vampiric', value: 0.05 }], description: '吸血+5%' },
      { count: 3, effects: [{ type: 'monster_drop_bonus', value: 0.15 }], description: '掉落率+15%' }
    ]
  },
  {
    id: 'frost_queen_set',
    name: '冰后套装',
    description: '冰霜女王的遗物',
    pieces: {
      weapon: 'frost_queen_sting',
      ring: 'frost_queen_circlet',
      hat: 'frost_queen_tiara',
      shoe: 'frost_queen_slippers'
    },
    bonuses: [
      { count: 2, effects: [{ type: 'fishing_calm', value: 0.1 }], description: '钓鱼稳定+10%' },
      { count: 3, effects: [{ type: 'monster_drop_bonus', value: 0.1 }], description: '掉落率+10%' },
      { count: 4, effects: [{ type: 'fish_quality_bonus', value: 0.12 }], description: '鱼类品质+12%' }
    ]
  },
  {
    id: 'dragon_king_set',
    name: '龙王套装',
    description: '深渊龙王的至高遗产',
    pieces: {
      weapon: 'abyss_dragon_mace',
      ring: 'abyss_dragon_ring',
      hat: 'abyss_dragon_horns',
      shoe: 'abyss_dragon_treads'
    },
    bonuses: [
      { count: 2, effects: [{ type: 'attack_bonus', value: 5 }], description: '攻击力+5' },
      {
        count: 3,
        effects: [
          { type: 'vampiric', value: 0.08 },
          { type: 'defense_bonus', value: 0.08 }
        ],
        description: '吸血+8%，防御+8%'
      },
      { count: 4, effects: [{ type: 'attack_bonus', value: 6 }], description: '攻击力+6' }
    ]
  },
  {
    id: 'forest_hunter_set',
    name: '竹林猎手套装',
    description: '以竹林猛兽的皮骨打造的猎人装备',
    pieces: { ring: 'wolf_fang_pendant', hat: 'wolf_pelt_hood', shoe: 'bear_pelt_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'attack_bonus', value: 3 }], description: '攻击力+3' },
      {
        count: 3,
        effects: [
          { type: 'crit_rate_bonus', value: 0.08 },
          { type: 'monster_drop_bonus', value: 0.1 }
        ],
        description: '暴击率+8%，掉落率+10%'
      }
    ]
  },
  {
    id: 'beast_king_set',
    name: '兽王套装',
    description: '竹林之王的战利品，尽显猎手荣耀',
    pieces: { ring: 'tiger_fang_ring', hat: 'tiger_pelt_cape', shoe: 'bear_pelt_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'attack_bonus', value: 5 }], description: '攻击力+5' },
      {
        count: 3,
        effects: [
          { type: 'vampiric', value: 0.06 },
          { type: 'defense_bonus', value: 0.08 }
        ],
        description: '吸血+6%，防御+8%'
      }
    ]
  },
  {
    id: 'guild_champion_set',
    name: '公会勇士套装',
    description: '冒险家公会精英战士的专属装备',
    pieces: { weapon: 'guild_war_blade', ring: 'guild_war_ring', hat: 'guild_war_helm', shoe: 'guild_war_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'attack_bonus', value: 3 }], description: '攻击力+3' },
      {
        count: 3,
        effects: [
          { type: 'defense_bonus', value: 0.08 },
          { type: 'max_hp_bonus', value: 20 }
        ],
        description: '防御+8%，HP+20'
      },
      {
        count: 4,
        effects: [
          { type: 'vampiric', value: 0.08 },
          { type: 'crit_rate_bonus', value: 0.05 }
        ],
        description: '吸血+8%，暴击率+5%'
      }
    ]
  },
  {
    id: 'mud_king_set',
    name: '泥岩王套装',
    description: '泥岩巨兽陨落后凝成的重装',
    pieces: {
      weapon: 'mud_king_fang',
      ring: 'mud_golem_band',
      hat: 'mud_crown',
      shoe: 'mud_stride_boots'
    },
    bonuses: [
      { count: 2, effects: [{ type: 'stamina_reduction', value: 0.05 }], description: '体力消耗-5%' },
      { count: 3, effects: [{ type: 'mining_stamina', value: 0.12 }], description: '采矿体力-12%' },
      { count: 4, effects: [{ type: 'defense_bonus', value: 0.08 }], description: '防御+8%' }
    ]
  },
  {
    id: 'lava_lord_set',
    name: '熔岩君主套装',
    description: '熔岩深渊的君王遗产',
    pieces: {
      weapon: 'lava_lord_maul',
      ring: 'lava_lord_seal',
      hat: 'lava_lord_crown',
      shoe: 'lava_lord_greaves'
    },
    bonuses: [
      { count: 2, effects: [{ type: 'attack_bonus', value: 4 }], description: '攻击力+4' },
      { count: 3, effects: [{ type: 'vampiric', value: 0.06 }], description: '吸血+6%' },
      { count: 4, effects: [{ type: 'crit_rate_bonus', value: 0.08 }], description: '暴击率+8%' }
    ]
  },
  {
    id: 'crystal_king_set',
    name: '晶王套装',
    description: '水晶之王的悟道遗产',
    pieces: {
      weapon: 'crystal_king_blade',
      ring: 'crystal_king_seal',
      hat: 'crystal_king_crown',
      shoe: 'crystal_step_boots'
    },
    bonuses: [
      { count: 2, effects: [{ type: 'exp_bonus', value: 0.08 }], description: '经验+8%' },
      { count: 3, effects: [{ type: 'luck', value: 0.06 }], description: '幸运+6%' },
      { count: 4, effects: [{ type: 'exp_bonus', value: 0.12 }], description: '经验+12%' }
    ]
  },
  {
    id: 'shadow_sovereign_set',
    name: '暗影君主套装',
    description: '暗影君主专属，与小怪暗影套区分',
    pieces: {
      weapon: 'shadow_sovereign_fang',
      ring: 'shadow_sovereign_ring',
      hat: 'shadow_sovereign_veil',
      shoe: 'shadow_sovereign_treads'
    },
    bonuses: [
      { count: 2, effects: [{ type: 'crit_rate_bonus', value: 0.08 }], description: '暴击率+8%' },
      { count: 3, effects: [{ type: 'vampiric', value: 0.06 }], description: '吸血+6%' },
      { count: 4, effects: [{ type: 'monster_drop_bonus', value: 0.12 }], description: '掉落率+12%' }
    ]
  },
  {
    id: 'master_smith_set',
    name: '匠师套装',
    description: '孙铁匠挚友心传，炉火纯青',
    pieces: {
      weapon: 'smith_hammer',
      ring: 'smith_mastery_ring',
      hat: 'smith_apron',
      shoe: 'smith_sole'
    },
    bonuses: [
      { count: 2, effects: [{ type: 'forging_exp_bonus', value: 0.08 }], description: '锻造经验+8%' },
      { count: 3, effects: [{ type: 'forging_exp_bonus', value: 0.05 }], description: '锻造经验+5%（炉火纯青）' },
      { count: 4, effects: [{ type: 'forging_exp_bonus', value: 0.15 }], description: '锻造经验+15%' }
    ]
  },
  {
    id: 'forager_set',
    name: '樵采套装',
    description: '山林樵夫的轻便装束',
    pieces: { ring: 'forager_ring', hat: 'forager_hood', shoe: 'forager_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'foraging_stamina', value: 0.08 }], description: '采集体力-8%' },
      {
        count: 3,
        effects: [
          { type: 'foraging_stamina', value: 0.12 },
          { type: 'luck', value: 0.05 }
        ],
        description: '采集体力-12%，幸运+5%'
      }
    ]
  },
  {
    id: 'hearth_set',
    name: '灶火套装',
    description: '客栈灶台的烟火传承',
    pieces: { ring: 'hearth_ring', hat: 'hearth_cap', shoe: 'hearth_slippers' },
    bonuses: [
      { count: 2, effects: [{ type: 'exp_bonus', value: 0.08 }], description: '经验+8%' },
      { count: 3, effects: [{ type: 'exp_bonus', value: 0.1 }], description: '经验+10%（灶火延绵）' }
    ]
  },
  {
    id: 'tea_zen_set',
    name: '茶禅套装',
    description: '茶庄斗茶弟子的清心装',
    pieces: { ring: 'tea_ring', hat: 'tea_hat', shoe: 'tea_shoes' },
    bonuses: [
      { count: 2, effects: [{ type: 'gift_friendship', value: 0.08 }], description: '送礼好感+8%' },
      { count: 3, effects: [{ type: 'luck', value: 0.06 }], description: '幸运+6%' }
    ]
  },
  {
    id: 'escort_set',
    name: '行镖套装',
    description: '云飞镖局弟子的远行装',
    pieces: { ring: 'escort_ring', hat: 'escort_headband', shoe: 'escort_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'travel_speed', value: 0.1 }], description: '旅行加速+10%' },
      { count: 3, effects: [{ type: 'attack_bonus', value: 3 }], description: '攻击力+3' },
      { count: 3, effects: [{ type: 'stamina_reduction', value: 0.05 }], description: '体力消耗-5%' }
    ]
  },
  {
    id: 'furnace_set',
    name: '炉工套装',
    description: '熔炉工坊的劳保装束',
    pieces: { ring: 'furnace_ring', hat: 'furnace_mask', shoe: 'furnace_boots' },
    bonuses: [
      { count: 2, effects: [{ type: 'ore_bonus', value: 1 }], description: '矿石+1' },
      { count: 3, effects: [{ type: 'mining_stamina', value: 0.08 }], description: '采矿体力-8%' }
    ]
  },
  {
    id: 'shrine_harvest_set',
    name: '公祠丰收套装',
    description: '祠堂祈福所铸的丰收装',
    pieces: { ring: 'shrine_ring', hat: 'shrine_hat', shoe: 'shrine_shoes' },
    bonuses: [
      { count: 2, effects: [{ type: 'crop_growth_bonus', value: 0.08 }], description: '作物生长+8%' },
      {
        count: 3,
        effects: [
          { type: 'crop_quality_bonus', value: 0.08 },
          { type: 'sell_price_bonus', value: 0.05 }
        ],
        description: '作物品质+8%，售价+5%'
      }
    ]
  }
]

/** 根据装备ID查找所属套装 */
export const getSetByPieceId = (defId: string): EquipmentSetDef | undefined => {
  return EQUIPMENT_SETS.find(
    s =>
      s.pieces.weapon === defId ||
      s.pieces.ring === defId ||
      s.pieces.hat === defId ||
      s.pieces.shoe === defId
  )
}

export const getEquipmentSetById = (setId: string): EquipmentSetDef | undefined =>
  EQUIPMENT_SETS.find(s => s.id === setId)
