import type { MonsterGoalDef, GuildShopItemDef, GuildDonationDef, GuildLevelDef } from '@/types'

/** 怪物讨伐目标 */
export const MONSTER_GOALS: MonsterGoalDef[] = [
  // ===== 浅层 =====
  {
    monsterId: 'mud_worm',
    monsterName: '泥虫',
    zone: 'shallow',
    killTarget: 25,
    reward: { money: 200 },
    description: '清除浅层的泥虫。'
  },
  {
    monsterId: 'stone_crab',
    monsterName: '石蟹',
    zone: 'shallow',
    killTarget: 25,
    reward: { money: 300 },
    description: '消灭浅层的石蟹。'
  },
  // ===== 冰霜 =====
  {
    monsterId: 'ice_bat',
    monsterName: '冰蝠',
    zone: 'frost',
    killTarget: 25,
    reward: { money: 500 },
    description: '击落冰霜层的冰蝠。'
  },
  {
    monsterId: 'ghost',
    monsterName: '幽灵',
    zone: 'frost',
    killTarget: 25,
    reward: { money: 500 },
    description: '驱散冰霜层的幽灵。'
  },
  // ===== 熔岩 =====
  {
    monsterId: 'fire_bat',
    monsterName: '火蝠',
    zone: 'lava',
    killTarget: 50,
    reward: { money: 800 },
    description: '击退熔岩层的火蝠。'
  },
  {
    monsterId: 'shadow_warrior',
    monsterName: '暗影武士',
    zone: 'lava',
    killTarget: 50,
    reward: { money: 1000 },
    description: '击败熔岩层的暗影武士。'
  },
  // ===== 水晶 =====
  {
    monsterId: 'crystal_golem',
    monsterName: '水晶魔像',
    zone: 'crystal',
    killTarget: 50,
    reward: { money: 1500 },
    description: '粉碎水晶层的魔像。'
  },
  {
    monsterId: 'prism_spider',
    monsterName: '棱镜蛛',
    zone: 'crystal',
    killTarget: 50,
    reward: { money: 1500 },
    description: '消灭水晶层的棱镜蛛。'
  },
  // ===== 暗影 =====
  {
    monsterId: 'shadow_lurker',
    monsterName: '暗影潜伏者',
    zone: 'shadow',
    killTarget: 75,
    reward: { money: 2000 },
    description: '猎杀暗影层的潜伏者。'
  },
  {
    monsterId: 'void_wraith',
    monsterName: '虚空幽魂',
    zone: 'shadow',
    killTarget: 75,
    reward: { money: 2500 },
    description: '净化暗影层的虚空幽魂。'
  },
  // ===== 深渊 =====
  {
    monsterId: 'abyss_serpent',
    monsterName: '深渊巨蟒',
    zone: 'abyss',
    killTarget: 100,
    reward: { money: 3000 },
    description: '讨伐深渊层的巨蟒。'
  },
  {
    monsterId: 'bone_dragon',
    monsterName: '骨龙',
    zone: 'abyss',
    killTarget: 100,
    reward: { money: 4000 },
    description: '击败深渊层的骨龙。'
  },
  // ===== BOSS =====
  {
    monsterId: 'mud_golem',
    monsterName: '泥岩巨兽',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 500, items: [{ itemId: 'copper_bar', quantity: 10 }] },
    description: '三次击败泥岩巨兽。'
  },
  {
    monsterId: 'frost_queen',
    monsterName: '冰霜女王',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 800, items: [{ itemId: 'iron_bar', quantity: 10 }] },
    description: '三次击败冰霜女王。'
  },
  {
    monsterId: 'lava_lord',
    monsterName: '熔岩君主',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 1500, items: [{ itemId: 'gold_bar', quantity: 10 }] },
    description: '三次击败熔岩君主。'
  },
  {
    monsterId: 'crystal_king',
    monsterName: '水晶之王',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 2500, items: [{ itemId: 'moonstone', quantity: 3 }] },
    description: '三次击败水晶之王。'
  },
  {
    monsterId: 'shadow_sovereign',
    monsterName: '暗影君主',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 4000, items: [{ itemId: 'obsidian', quantity: 3 }] },
    description: '三次击败暗影君主。'
  },
  {
    monsterId: 'abyss_dragon',
    monsterName: '深渊龙王',
    zone: 'boss',
    killTarget: 3,
    reward: { money: 6000, items: [{ itemId: 'dragon_jade', quantity: 2 }] },
    description: '三次击败深渊龙王。'
  },
  // ===== 骷髅矿穴 =====
  {
    monsterId: 'iridium_golem',
    monsterName: '铱金魔像',
    zone: 'skull',
    killTarget: 50,
    reward: { money: 3000 },
    description: '在骷髅矿穴中讨伐铱金魔像。'
  },
  {
    monsterId: 'skull_serpent',
    monsterName: '骷髅飞蛇',
    zone: 'skull',
    killTarget: 50,
    reward: { money: 3000 },
    description: '在骷髅矿穴中消灭骷髅飞蛇。'
  },
  {
    monsterId: 'ancient_mummy',
    monsterName: '远古木乃伊',
    zone: 'skull',
    killTarget: 50,
    reward: { money: 5000 },
    description: '在骷髅矿穴中击败远古木乃伊。'
  }
]

/** 公会商店物品 (与镖局互补，不重复) */
export const GUILD_SHOP_ITEMS: GuildShopItemDef[] = [
  // --- 消耗品（铜钱购买，不限购）---
  {
    itemId: 'combat_tonic',
    name: '战斗补剂',
    price: 200,
    description: '恢复30点HP。'
  },
  {
    itemId: 'adventurer_ration',
    name: '冒险口粮',
    price: 350,
    description: '恢复25体力和25HP。',
    unlockGuildLevel: 2
  },
  {
    itemId: 'fortify_brew',
    name: '强化药水',
    price: 500,
    description: '恢复60点HP。'
  },
  {
    itemId: 'ironhide_potion',
    name: '铁壁药剂',
    price: 800,
    description: '恢复全部HP。'
  },
  {
    itemId: 'warriors_feast',
    name: '勇者盛宴',
    price: 1000,
    description: '恢复50体力和50HP。',
    unlockGuildLevel: 5
  },
  {
    itemId: 'slayer_charm',
    name: '猎魔符',
    price: 1500,
    description: '怪物掉落率+20%（当次探索）。',
    unlockGuildLevel: 3
  },
  {
    itemId: 'stamina_elixir',
    name: '精力药剂',
    price: 600,
    description: '恢复120点体力。',
    unlockGuildLevel: 4
  },
  {
    itemId: 'monster_lure',
    name: '怪物诱饵',
    price: 2000,
    description: '本层怪物数量翻倍。',
    unlockGuildLevel: 7
  },
  // --- 装备（贡献点+材料，限购1件）---
  {
    itemId: 'guild_cloud_horse',
    name: '踏云驹',
    price: 0,
    contributionCost: 600,
    description: '公会驯养的神骏。获得踏云驹品种：赶路极快，放牧时帮你照看畜群。',
    unlockGuildLevel: 8,
    totalLimit: 1,
    horseUpgrade: 'cloud',
    materials: [
      { itemId: 'iridium_bar', quantity: 3 },
      { itemId: 'hay', quantity: 50 }
    ]
  },
  {
    itemId: 'guild_war_ring',
    name: '公会战戒',
    price: 0,
    contributionCost: 200,
    description: '攻击+4，防御+6%。',
    unlockGuildLevel: 5,
    totalLimit: 1,
    equipType: 'ring',
    materials: [
      { itemId: 'gold_bar', quantity: 5 },
      { itemId: 'ruby', quantity: 2 }
    ]
  },
  {
    itemId: 'guild_war_helm',
    name: '公会战盔',
    price: 0,
    contributionCost: 250,
    description: '攻击+3，HP+15。',
    unlockGuildLevel: 6,
    totalLimit: 1,
    equipType: 'hat',
    materials: [
      { itemId: 'gold_bar', quantity: 5 },
      { itemId: 'moonstone', quantity: 1 }
    ]
  },
  {
    itemId: 'guild_war_boots',
    name: '公会战靴',
    price: 0,
    contributionCost: 250,
    description: '攻击+2，防御+5%，移速+10%。',
    unlockGuildLevel: 7,
    totalLimit: 1,
    equipType: 'shoe',
    materials: [
      { itemId: 'gold_bar', quantity: 5 },
      { itemId: 'obsidian', quantity: 1 }
    ]
  },
  {
    itemId: 'guild_war_blade',
    name: '公会战刃',
    price: 0,
    contributionCost: 350,
    description: '攻击力36，暴击率10%。',
    unlockGuildLevel: 9,
    totalLimit: 1,
    equipType: 'weapon',
    materials: [
      { itemId: 'gold_bar', quantity: 10 },
      { itemId: 'dragon_jade', quantity: 1 }
    ]
  },
  // --- 永久品（贡献点购买，每日限购）---
  {
    itemId: 'guild_badge',
    name: '公会徽章',
    price: 0,
    contributionCost: 150,
    description: '攻击力永久+3。',
    unlockGuildLevel: 6,
    weeklyLimit: 10
  },
  {
    itemId: 'life_talisman',
    name: '生命护符',
    price: 0,
    contributionCost: 200,
    description: '最大生命值永久+15。',
    unlockGuildLevel: 8,
    dailyLimit: 1,
    totalLimit: 100
  },
  {
    itemId: 'defense_charm',
    name: '守护符',
    price: 0,
    contributionCost: 180,
    description: '防御永久+3%。',
    unlockGuildLevel: 7,
    weeklyLimit: 3,
    totalLimit: 10
  },
  {
    itemId: 'lucky_coin',
    name: '幸运铜钱',
    price: 0,
    contributionCost: 300,
    description: '怪物掉落率永久+5%。',
    unlockGuildLevel: 10,
    weeklyLimit: 3,
    totalLimit: 10
  }
]

/** 捐献物品表 */
export const GUILD_DONATIONS: GuildDonationDef[] = [
  // 矿石
  { itemId: 'copper_ore', points: 2 },
  { itemId: 'iron_ore', points: 4 },
  { itemId: 'gold_ore', points: 8 },
  { itemId: 'crystal_ore', points: 12 },
  { itemId: 'shadow_ore', points: 18 },
  { itemId: 'void_ore', points: 25 },
  { itemId: 'iridium_ore', points: 35 },
  // 宝石
  { itemId: 'quartz', points: 4 },
  { itemId: 'jade', points: 12 },
  { itemId: 'ruby', points: 18 },
  { itemId: 'moonstone', points: 25 },
  { itemId: 'obsidian', points: 35 },
  { itemId: 'dragon_jade', points: 50 },
  { itemId: 'prismatic_shard', points: 80 }
]

/** 公会等级表（10级） */
export const GUILD_LEVELS: GuildLevelDef[] = [
  { level: 1, expRequired: 100 },
  { level: 2, expRequired: 300 },
  { level: 3, expRequired: 600 },
  { level: 4, expRequired: 1000 },
  { level: 5, expRequired: 1500 },
  { level: 6, expRequired: 2200 },
  { level: 7, expRequired: 3000 },
  { level: 8, expRequired: 4000 },
  { level: 9, expRequired: 5500 },
  { level: 10, expRequired: 7500 }
]

/** 每公会等级的被动增益 */
export const GUILD_BONUS_PER_LEVEL = {
  attack: 1, // 每级+1攻击力
  maxHp: 5 // 每级+5最大生命值
}

/** 根据怪物ID查找讨伐目标 */
export const getMonsterGoal = (monsterId: string): MonsterGoalDef | undefined => MONSTER_GOALS.find(g => g.monsterId === monsterId)
