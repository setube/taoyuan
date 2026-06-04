import type { ItemCategory, ChestTier } from '@/types'

/** 仓库箱子可绑定的物品分类（不含装备类） */
export const CHEST_FILTER_CATEGORIES: ItemCategory[] = [
  'seed',
  'crop',
  'fruit',
  'fish',
  'food',
  'processed',
  'animal_product',
  'ore',
  'gem',
  'material',
  'misc',
  'machine',
  'sprinkler',
  'fertilizer',
  'bait',
  'tackle',
  'bomb',
  'sapling',
  'gift',
  'fossil',
  'artifact'
]

export const CHEST_CATEGORY_LABELS: Record<ItemCategory, string> = {
  seed: '种子',
  crop: '作物',
  fruit: '水果',
  fish: '鱼类',
  food: '食物',
  processed: '加工品',
  animal_product: '畜产品',
  ore: '矿石',
  gem: '宝石',
  material: '材料',
  misc: '杂货',
  machine: '机器',
  sprinkler: '洒水器',
  fertilizer: '肥料',
  bait: '鱼饵',
  tackle: '渔具',
  bomb: '炸弹',
  sapling: '树苗',
  gift: '礼物',
  fossil: '化石',
  artifact: '文物',
  weapon: '武器',
  ring: '戒指',
  hat: '帽子',
  shoe: '鞋子'
}

/** 可升级的普通箱子阶梯（不含虚空） */
export const UPGRADEABLE_CHEST_TIERS: ChestTier[] = ['wood', 'copper', 'iron', 'gold']

export const getNextChestUpgradeTier = (tier: ChestTier): ChestTier | null => {
  const idx = UPGRADEABLE_CHEST_TIERS.indexOf(tier)
  if (idx < 0 || idx >= UPGRADEABLE_CHEST_TIERS.length - 1) return null
  return UPGRADEABLE_CHEST_TIERS[idx + 1]!
}
