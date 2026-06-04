import type { ItemDef, ItemCategory } from '@/types/item'
import { CROPS } from './crops'
import { FISH } from './fish'
import { RECIPES } from './recipes'
import { PROCESSING_MACHINES, SPRINKLERS, FERTILIZERS, BAITS, TACKLES, BOMBS } from './processing'
import { FRUIT_TREE_DEFS } from './fruitTrees'
import { WEAPONS, getWeaponSellPrice } from './weapons'
import { RINGS } from './rings'
import { HATS } from './hats'
import { SHOES } from './shoes'

/** 从作物定义自动生成种子物品（排除已手动定义的种子） */
const SEED_ITEMS: ItemDef[] = CROPS.filter(
  crop => crop.seedId !== 'ancient_seed' && crop.seedId !== 'hanhai_cactus_seed' && crop.seedId !== 'hanhai_date_seed'
).map(crop => ({
  id: crop.seedId,
  name: `${crop.name}种子`,
  category: 'seed',
  description: `${crop.name}的种子，${crop.season
    .map(s => {
      const names: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }
      return names[s]
    })
    .join('/')}季可种植。`,
  sellPrice: Math.floor(crop.seedPrice / 2),
  edible: false
}))

/** 从作物定义自动生成收获物品 */
const CROP_ITEMS: ItemDef[] = CROPS.map(crop => ({
  id: crop.id,
  name: crop.name,
  category: 'crop',
  description: crop.description,
  sellPrice: Math.floor(crop.sellPrice * 1.5),
  edible: true,
  staminaRestore: Math.floor(crop.sellPrice / 5),
  healthRestore: Math.floor(crop.sellPrice / 10)
}))

/** 矿石物品 */
const ORE_ITEMS: ItemDef[] = [
  { id: 'copper_ore', name: '铜矿', category: 'ore', description: '常见的金属矿石。', sellPrice: 5, edible: false },
  { id: 'iron_ore', name: '铁矿', category: 'ore', description: '坚硬的铁矿石。', sellPrice: 10, edible: false },
  { id: 'gold_ore', name: '金矿', category: 'ore', description: '珍贵的金矿石。', sellPrice: 18, edible: false },
  { id: 'crystal_ore', name: '水晶矿', category: 'ore', description: '折射光芒的水晶矿石。', sellPrice: 30, edible: false },
  { id: 'shadow_ore', name: '暗影矿', category: 'ore', description: '沉重漆黑的神秘矿石。', sellPrice: 45, edible: false },
  { id: 'void_ore', name: '虚空矿', category: 'ore', description: '来自深渊尽头的矿石。', sellPrice: 60, edible: false },
  { id: 'iridium_ore', name: '铱矿', category: 'ore', description: '最坚硬稀有的金属矿石。', sellPrice: 80, edible: false },
  { id: 'quartz', name: '石英', category: 'gem', description: '晶莹剔透的石英。', sellPrice: 10, edible: false },
  { id: 'jade', name: '翡翠', category: 'gem', description: '温润的翡翠。', sellPrice: 30, edible: false },
  { id: 'ruby', name: '红宝石', category: 'gem', description: '光芒四射的红宝石。', sellPrice: 45, edible: false },
  { id: 'moonstone', name: '月光石', category: 'gem', description: '散发柔和光辉的宝石。', sellPrice: 65, edible: false },
  { id: 'obsidian', name: '黑曜石', category: 'gem', description: '暗如深渊的火山玻璃。', sellPrice: 90, edible: false },
  { id: 'dragon_jade', name: '龙玉', category: 'gem', description: '传说中龙脉凝聚的神玉。', sellPrice: 120, edible: false },
  { id: 'prismatic_shard', name: '五彩碎片', category: 'gem', description: '蕴含远古能量的碎片。', sellPrice: 180, edible: false },
  { id: 'battery', name: '电池组', category: 'material', description: '避雷针吸收雷电后产出的能量。', sellPrice: 100, edible: false }
]

/** 杂项 */
const MISC_ITEMS: ItemDef[] = [
  { id: 'wood', name: '木材', category: 'material', description: '建造和制作的基础材料。', sellPrice: 5, edible: false },
  { id: 'bamboo', name: '竹子', category: 'material', description: '竹林中采集的翠竹。', sellPrice: 10, edible: false },
  { id: 'herb', name: '草药', category: 'material', description: '山间野生的草药。', sellPrice: 15, edible: false },
  { id: 'firewood', name: '柴火', category: 'material', description: '烹饪用的燃料。', sellPrice: 5, edible: false },
  {
    id: 'winter_bamboo_shoot',
    name: '冬笋',
    category: 'misc',
    description: '冬季特有的鲜嫩竹笋。',
    sellPrice: 40,
    edible: true,
    staminaRestore: 8,
    healthRestore: 3
  },
  { id: 'wintersweet', name: '腊梅', category: 'gift', description: '寒冬中绽放的腊梅，送礼佳品。', sellPrice: 50, edible: false },
  {
    id: 'wild_mushroom',
    name: '野蘑菇',
    category: 'misc',
    description: '秋天的山林中采到的蘑菇。',
    sellPrice: 30,
    edible: true,
    staminaRestore: 5,
    healthRestore: 2
  },
  { id: 'ginseng', name: '人参', category: 'misc', description: '极其珍贵的野生人参。', sellPrice: 200, edible: false },
  {
    id: 'wild_berry',
    name: '野果',
    category: 'misc',
    description: '夏天山间的甜美野果。',
    sellPrice: 20,
    edible: true,
    staminaRestore: 5,
    healthRestore: 2
  },
  { id: 'pine_cone', name: '松果', category: 'material', description: '松树上掉落的果实。', sellPrice: 10, edible: false },
  { id: 'jade_ring', name: '翡翠戒指', category: 'gift', description: '精心打磨的翡翠戒指，可以用来求婚。', sellPrice: 500, edible: false },
  {
    id: 'silk_ribbon',
    name: '丝帕',
    category: 'gift',
    description: '精心绣制的丝帕，用来向心仪之人表达心意。',
    sellPrice: 200,
    edible: false
  },
  {
    id: 'zhiji_jade',
    name: '知己玉佩',
    category: 'gift',
    description: '一对精心雕琢的玉佩，赠予同性挚友可结为知己。',
    sellPrice: 300,
    edible: false
  },
  { id: 'scarecrow', name: '稻草人', category: 'machine', description: '放置在农场，驱赶偷吃作物的乌鸦。', sellPrice: 75, edible: false },
  { id: 'rain_totem', name: '雨图腾', category: 'misc', description: '使用后可以让明天下雨。', sellPrice: 30, edible: false },
  {
    id: 'fish_feed',
    name: '鱼饲料',
    category: 'material',
    description: '鱼塘专用饲料，维持鱼塘水质和鱼的健康。',
    sellPrice: 10,
    edible: false
  },
  {
    id: 'water_purifier',
    name: '水质改良剂',
    category: 'material',
    description: '改善鱼塘水质，降低鱼生病概率。',
    sellPrice: 50,
    edible: false
  }
]

/** 从鱼定义自动生成鱼物品 */
const FISH_ITEMS: ItemDef[] = FISH.map(fish => ({
  id: fish.id,
  name: fish.name,
  category: 'fish' as const,
  description: fish.description,
  sellPrice: Math.floor(fish.sellPrice * 1.5),
  edible: true,
  staminaRestore: Math.floor(fish.sellPrice / 5),
  healthRestore: Math.floor(fish.sellPrice / 8)
}))

/** 从食谱定义自动生成烹饪物品 */
const _preFoodItems: ItemDef[] = [...SEED_ITEMS, ...CROP_ITEMS, ...ORE_ITEMS, ...MISC_ITEMS, ...FISH_ITEMS]
const FOOD_ITEMS: ItemDef[] = RECIPES.map(recipe => {
  const baseSellPrice = Math.floor(recipe.effect.staminaRestore * 2)
  // 计算材料总售价，保底：食物售价不低于材料总售价的1.2倍
  const ingredientTotal = recipe.ingredients.reduce((sum, ing) => {
    const def = _preFoodItems.find(i => i.id === ing.itemId)
    return sum + (def?.sellPrice ?? 0) * ing.quantity
  }, 0)
  const sellPrice = Math.max(baseSellPrice, Math.floor(ingredientTotal * 1.2))
  return {
    id: `food_${recipe.id}`,
    name: recipe.name,
    category: 'food' as const,
    description: recipe.description,
    sellPrice,
    edible: true,
    staminaRestore: recipe.effect.staminaRestore,
    healthRestore: recipe.effect.healthRestore ?? Math.floor(recipe.effect.staminaRestore * 0.4)
  }
})

/** 加工品物品 */
const PROCESSED_ITEMS: ItemDef[] = [
  {
    id: 'watermelon_wine',
    name: '西瓜酒',
    category: 'processed',
    description: '甘甜的西瓜酿成的佳酿。',
    sellPrice: 390,
    edible: true,
    staminaRestore: 25,
    healthRestore: 15
  },
  {
    id: 'osmanthus_wine',
    name: '桂花酿',
    category: 'processed',
    description: '馥郁芬芳的桂花酒。',
    sellPrice: 600,
    edible: true,
    staminaRestore: 30,
    healthRestore: 18
  },
  { id: 'rice_vinegar', name: '米醋', category: 'processed', description: '家酿老陈醋。', sellPrice: 290, edible: false },
  {
    id: 'pickled_cabbage',
    name: '腌白菜',
    category: 'processed',
    description: '开胃的腌白菜。',
    sellPrice: 155,
    edible: true,
    staminaRestore: 10,
    healthRestore: 5
  },
  {
    id: 'dried_radish',
    name: '萝卜干',
    category: 'processed',
    description: '香脆的萝卜干。',
    sellPrice: 245,
    edible: true,
    staminaRestore: 12,
    healthRestore: 5
  },
  {
    id: 'pumpkin_preserve',
    name: '南瓜酱',
    category: 'processed',
    description: '浓郁的南瓜酱。',
    sellPrice: 410,
    edible: true,
    staminaRestore: 15,
    healthRestore: 8
  },
  {
    id: 'honey',
    name: '蜂蜜',
    category: 'processed',
    description: '金黄甘甜的蜂蜜。',
    sellPrice: 100,
    edible: true,
    staminaRestore: 20,
    healthRestore: 10
  },
  { id: 'sesame_oil', name: '芝麻油', category: 'processed', description: '醇香的小磨麻油。', sellPrice: 260, edible: false },
  { id: 'tea_oil', name: '茶油', category: 'processed', description: '珍贵的山茶油。', sellPrice: 620, edible: false },
  {
    id: 'peach_wine',
    name: '桃花酒',
    category: 'processed',
    description: '清甜的桃花酒。',
    sellPrice: 420,
    edible: true,
    staminaRestore: 25,
    healthRestore: 15
  },
  {
    id: 'jujube_wine',
    name: '红枣酒',
    category: 'processed',
    description: '醇厚滋补的红枣酒。',
    sellPrice: 300,
    edible: true,
    staminaRestore: 20,
    healthRestore: 12
  },
  {
    id: 'corn_wine',
    name: '玉米酒',
    category: 'processed',
    description: '淡雅清香的玉米酒。',
    sellPrice: 330,
    edible: true,
    staminaRestore: 18,
    healthRestore: 10
  },
  {
    id: 'pickled_chili',
    name: '泡椒',
    category: 'processed',
    description: '酸辣开胃的泡椒。',
    sellPrice: 270,
    edible: true,
    staminaRestore: 10,
    healthRestore: 5
  },
  {
    id: 'pickled_ginger',
    name: '腌姜',
    category: 'processed',
    description: '酸甜脆嫩的腌姜。',
    sellPrice: 315,
    edible: true,
    staminaRestore: 12,
    healthRestore: 5
  },
  { id: 'mayonnaise', name: '蛋黄酱', category: 'processed', description: '用鸡蛋制成的浓郁蛋黄酱。', sellPrice: 115, edible: false },
  {
    id: 'duck_mayonnaise',
    name: '鸭蛋黄酱',
    category: 'processed',
    description: '用鸭蛋制成的高级蛋黄酱。',
    sellPrice: 215,
    edible: false
  },
  {
    id: 'goose_mayonnaise',
    name: '鹅蛋黄酱',
    category: 'processed',
    description: '用鹅蛋制成的浓稠蛋黄酱。',
    sellPrice: 250,
    edible: false
  },
  {
    id: 'silkie_mayonnaise',
    name: '乌鸡蛋黄酱',
    category: 'processed',
    description: '用乌鸡蛋制成的滋补蛋黄酱。',
    sellPrice: 295,
    edible: false
  },
  {
    id: 'ostrich_mayonnaise',
    name: '鸵鸟蛋黄酱',
    category: 'processed',
    description: '用鸵鸟蛋制成的大份蛋黄酱。',
    sellPrice: 450,
    edible: false
  },
  {
    id: 'quail_mayonnaise',
    name: '鹌鹑蛋黄酱',
    category: 'processed',
    description: '用鹌鹑蛋制成的精致蛋黄酱。',
    sellPrice: 170,
    edible: false
  }
]

/** 烟熏鱼物品 */
const SMOKED_ITEMS: ItemDef[] = [
  {
    id: 'smoked_crucian',
    name: '烟熏鲫鱼',
    category: 'processed',
    description: '经过烟熏处理的鲫鱼，风味独特。',
    sellPrice: 30,
    edible: true,
    staminaRestore: 7,
    healthRestore: 3
  },
  {
    id: 'smoked_carp',
    name: '烟熏鲤鱼',
    category: 'processed',
    description: '经过烟熏处理的鲤鱼，肉质紧实。',
    sellPrice: 50,
    edible: true,
    staminaRestore: 12,
    healthRestore: 6
  },
  {
    id: 'smoked_grass_carp',
    name: '烟熏草鱼',
    category: 'processed',
    description: '经过烟熏处理的草鱼，鲜香可口。',
    sellPrice: 80,
    edible: true,
    staminaRestore: 20,
    healthRestore: 10
  },
  {
    id: 'smoked_bass',
    name: '烟熏鲈鱼',
    category: 'processed',
    description: '经过烟熏处理的鲈鱼，口感细腻。',
    sellPrice: 120,
    edible: true,
    staminaRestore: 30,
    healthRestore: 15
  },
  {
    id: 'smoked_catfish',
    name: '烟熏鲶鱼',
    category: 'processed',
    description: '经过烟熏处理的鲶鱼，味道醇厚。',
    sellPrice: 90,
    edible: true,
    staminaRestore: 22,
    healthRestore: 11
  },
  {
    id: 'smoked_mandarin_fish',
    name: '烟熏桂花鱼',
    category: 'processed',
    description: '经过烟熏处理的桂花鱼，鲜嫩多汁。',
    sellPrice: 140,
    edible: true,
    staminaRestore: 35,
    healthRestore: 17
  },
  {
    id: 'smoked_eel',
    name: '烟熏鳗鱼',
    category: 'processed',
    description: '经过烟熏处理的鳗鱼，肥美香滑。',
    sellPrice: 170,
    edible: true,
    staminaRestore: 42,
    healthRestore: 21
  },
  {
    id: 'smoked_sturgeon',
    name: '烟熏鲟鱼',
    category: 'processed',
    description: '经过烟熏处理的鲟鱼，珍贵美味。',
    sellPrice: 260,
    edible: true,
    staminaRestore: 65,
    healthRestore: 32
  },
  {
    id: 'smoked_loach',
    name: '烟熏泥鳅',
    category: 'processed',
    description: '经过烟熏处理的泥鳅，酥脆鲜香。',
    sellPrice: 44,
    edible: true,
    staminaRestore: 11,
    healthRestore: 5
  },
  {
    id: 'smoked_yellow_eel',
    name: '烟熏黄鳝',
    category: 'processed',
    description: '经过烟熏处理的黄鳝，滋补美味。',
    sellPrice: 100,
    edible: true,
    staminaRestore: 25,
    healthRestore: 12
  }
]

/** 脱水食品物品 */
const DRIED_ITEMS: ItemDef[] = [
  {
    id: 'dried_mushroom',
    name: '干蘑菇',
    category: 'processed',
    description: '脱水保存的蘑菇，浓缩了鲜味。',
    sellPrice: 135,
    edible: true,
    staminaRestore: 18,
    healthRestore: 9
  },
  {
    id: 'dried_peach',
    name: '桃干',
    category: 'processed',
    description: '脱水制成的桃干，酸甜可口。',
    sellPrice: 120,
    edible: true,
    staminaRestore: 30,
    healthRestore: 15
  },
  {
    id: 'dried_lychee',
    name: '荔枝干',
    category: 'processed',
    description: '脱水制成的荔枝干，甘甜浓郁。',
    sellPrice: 160,
    edible: true,
    staminaRestore: 40,
    healthRestore: 20
  },
  {
    id: 'dried_persimmon_slice',
    name: '柿饼',
    category: 'processed',
    description: '柿子脱水制成的柿饼，软糯香甜。',
    sellPrice: 170,
    edible: true,
    staminaRestore: 42,
    healthRestore: 21
  },
  {
    id: 'dried_hawthorn',
    name: '山楂片',
    category: 'processed',
    description: '脱水制成的山楂片，酸甜开胃。',
    sellPrice: 130,
    edible: true,
    staminaRestore: 32,
    healthRestore: 16
  },
  {
    id: 'dried_apricot',
    name: '杏脯',
    category: 'processed',
    description: '脱水制成的杏脯，酸甜适中。',
    sellPrice: 110,
    edible: true,
    staminaRestore: 27,
    healthRestore: 13
  },
  {
    id: 'dried_berry',
    name: '果脯',
    category: 'processed',
    description: '野果脱水制成的果脯，方便保存。',
    sellPrice: 90,
    edible: true,
    staminaRestore: 12,
    healthRestore: 6
  }
]

/** 机器物品 */
const MACHINE_ITEMS: ItemDef[] = PROCESSING_MACHINES.map(m => ({
  id: `machine_${m.id}`,
  name: m.name,
  category: 'machine' as const,
  description: m.description,
  sellPrice: Math.floor(m.craftMoney * 0.5),
  edible: false
}))

/** 洒水器物品 */
const SPRINKLER_ITEMS: ItemDef[] = SPRINKLERS.map(s => ({
  id: s.id,
  name: s.name,
  category: 'sprinkler' as const,
  description: s.description,
  sellPrice: Math.floor(s.craftMoney * 0.5),
  edible: false
}))

/** 肥料物品 */
const FERTILIZER_ITEMS: ItemDef[] = FERTILIZERS.map(f => ({
  id: f.id,
  name: f.name,
  category: 'fertilizer' as const,
  description: f.description,
  sellPrice: 5,
  edible: false
}))

/** 鱼饵物品 */
const BAIT_ITEMS: ItemDef[] = BAITS.map(b => ({
  id: b.id,
  name: b.name,
  category: 'bait' as const,
  description: b.description,
  sellPrice: b.shopPrice ? Math.floor(b.shopPrice * 0.4) : 5,
  edible: false
}))

/** 浮漂物品 */
const TACKLE_ITEMS: ItemDef[] = TACKLES.map(t => ({
  id: t.id,
  name: t.name,
  category: 'tackle' as const,
  description: t.description,
  sellPrice: t.shopPrice ? Math.floor(t.shopPrice * 0.5) : 50,
  edible: false
}))

/** 动物产品 */
const ANIMAL_PRODUCT_ITEMS: ItemDef[] = [
  {
    id: 'egg',
    name: '鸡蛋',
    category: 'animal_product',
    description: '新鲜的鸡蛋。',
    sellPrice: 75,
    edible: true,
    staminaRestore: 5,
    healthRestore: 3
  },
  {
    id: 'duck_egg',
    name: '鸭蛋',
    category: 'animal_product',
    description: '个大味美的鸭蛋。',
    sellPrice: 142,
    edible: true,
    staminaRestore: 8,
    healthRestore: 4
  },
  {
    id: 'milk',
    name: '牛奶',
    category: 'animal_product',
    description: '新鲜的牛奶。',
    sellPrice: 187,
    edible: true,
    staminaRestore: 10,
    healthRestore: 5
  },
  { id: 'wool', name: '羊毛', category: 'animal_product', description: '柔软的羊毛。', sellPrice: 510, edible: false },
  { id: 'hay', name: '干草', category: 'material', description: '喂养牲畜的干草。', sellPrice: 0, edible: false },
  // 新增动物产品
  { id: 'rabbit_fur', name: '兔毛', category: 'animal_product', description: '柔软的兔毛。', sellPrice: 225, edible: false },
  {
    id: 'rabbit_foot',
    name: '幸运兔脚',
    category: 'animal_product',
    description: '传说能带来好运的兔脚，十分稀有。',
    sellPrice: 300,
    edible: false
  },
  {
    id: 'goose_egg',
    name: '鹅蛋',
    category: 'animal_product',
    description: '个头很大的鹅蛋。',
    sellPrice: 165,
    edible: true,
    staminaRestore: 10,
    healthRestore: 5
  },
  {
    id: 'quail_egg',
    name: '鹌鹑蛋',
    category: 'animal_product',
    description: '小巧的鹌鹑蛋。',
    sellPrice: 37,
    edible: true,
    staminaRestore: 3,
    healthRestore: 2
  },
  {
    id: 'pigeon_egg',
    name: '鸽子蛋',
    category: 'animal_product',
    description: '营养丰富的鸽子蛋。',
    sellPrice: 67,
    edible: true,
    staminaRestore: 5,
    healthRestore: 3
  },
  {
    id: 'silkie_egg',
    name: '乌鸡蛋',
    category: 'animal_product',
    description: '滋补的乌鸡蛋。',
    sellPrice: 195,
    edible: true,
    staminaRestore: 15,
    healthRestore: 8
  },
  { id: 'peacock_feather', name: '孔雀羽', category: 'animal_product', description: '华丽的孔雀尾羽。', sellPrice: 525, edible: false },
  {
    id: 'goat_milk',
    name: '羊奶',
    category: 'animal_product',
    description: '新鲜的羊奶。',
    sellPrice: 165,
    edible: true,
    staminaRestore: 10,
    healthRestore: 5
  },
  {
    id: 'truffle',
    name: '松露',
    category: 'animal_product',
    description: '珍贵的地下菌类。',
    sellPrice: 450,
    edible: true,
    staminaRestore: 5,
    healthRestore: 3
  },
  {
    id: 'buffalo_milk',
    name: '水牛奶',
    category: 'animal_product',
    description: '醇厚的水牛奶。',
    sellPrice: 150,
    edible: true,
    staminaRestore: 8,
    healthRestore: 4
  },
  {
    id: 'yak_milk',
    name: '牦牛奶',
    category: 'animal_product',
    description: '高原牦牛的浓郁奶。',
    sellPrice: 210,
    edible: true,
    staminaRestore: 12,
    healthRestore: 6
  },
  { id: 'alpaca_wool', name: '羊驼毛', category: 'animal_product', description: '极其柔软的羊驼毛。', sellPrice: 375, edible: false },
  {
    id: 'antler_velvet',
    name: '鹿茸',
    category: 'animal_product',
    description: '珍贵的鹿茸，可直接食用补体力。',
    sellPrice: 675,
    edible: true,
    staminaRestore: 30,
    healthRestore: 15
  },
  {
    id: 'donkey_milk',
    name: '驴奶',
    category: 'animal_product',
    description: '驴奶，味道温和。',
    sellPrice: 120,
    edible: true,
    staminaRestore: 6,
    healthRestore: 3
  },
  {
    id: 'camel_milk',
    name: '驼奶',
    category: 'animal_product',
    description: '营养丰富的驼奶。',
    sellPrice: 240,
    edible: true,
    staminaRestore: 12,
    healthRestore: 6
  },
  {
    id: 'ostrich_egg',
    name: '鸵鸟蛋',
    category: 'animal_product',
    description: '巨大的鸵鸟蛋。',
    sellPrice: 300,
    edible: true,
    staminaRestore: 15,
    healthRestore: 8
  }
]

/** 果树水果 */
const FRUIT_TREE_ITEMS: ItemDef[] = FRUIT_TREE_DEFS.map(t => ({
  id: t.fruitId,
  name: t.fruitName,
  category: 'fruit' as const,
  description: `${t.name}结出的${t.fruitName}。`,
  sellPrice: Math.floor(t.fruitSellPrice * 1.5),
  edible: true,
  staminaRestore: Math.floor(t.fruitSellPrice / 5),
  healthRestore: Math.floor(t.fruitSellPrice / 10)
}))

/** 树苗 */
const SAPLING_ITEMS: ItemDef[] = FRUIT_TREE_DEFS.map(t => ({
  id: t.saplingId,
  name: `${t.name}苗`,
  category: 'sapling' as const,
  description: `种下后${t.growthDays}天可成熟，${t.fruitSeason === 'spring' ? '春' : t.fruitSeason === 'summer' ? '夏' : t.fruitSeason === 'autumn' ? '秋' : '冬'}季产出${t.fruitName}。`,
  sellPrice: Math.floor(t.saplingPrice / 2),
  edible: false
}))

/** 野树产物和材料 */
const WILD_TREE_ITEMS: ItemDef[] = [
  {
    id: 'camphor_seed',
    name: '樟树种子',
    category: 'material',
    description: '樟树的种子，种下后可长成樟树。',
    sellPrice: 15,
    edible: false
  },
  {
    id: 'mulberry',
    name: '桑葚',
    category: 'misc',
    description: '紫黑色的桑葚，酸甜可口。',
    sellPrice: 25,
    edible: true,
    staminaRestore: 5,
    healthRestore: 2
  },
  { id: 'pine_resin', name: '松脂', category: 'material', description: '松树分泌的树脂，可用于制作。', sellPrice: 30, edible: false },
  { id: 'camphor_oil', name: '樟脑油', category: 'material', description: '樟树提取的精油，气味清香。', sellPrice: 50, edible: false },
  { id: 'silk', name: '蚕丝', category: 'material', description: '桑树上采集的蚕丝，光滑细腻。', sellPrice: 40, edible: false },
  { id: 'tapper', name: '采脂器', category: 'machine', description: '安装到成熟野树上，定期产出树脂。', sellPrice: 100, edible: false }
]

/** 炸弹物品 */
const BOMB_ITEMS: ItemDef[] = BOMBS.map(b => ({
  id: b.id,
  name: b.name,
  category: 'bomb' as const,
  description: b.description,
  sellPrice: 25,
  edible: false
}))

/** 蟹笼和水产物品 */
const CRAB_POT_ITEMS: ItemDef[] = [
  {
    id: 'crab_pot',
    name: '蟹笼',
    category: 'machine',
    description: '放置在钓鱼地点，每日自动捕获水产（需鱼饵）。',
    sellPrice: 750,
    edible: false
  },
  {
    id: 'snail',
    name: '蜗牛',
    category: 'fish',
    description: '小巧的淡水蜗牛。',
    sellPrice: 15,
    edible: true,
    staminaRestore: 3,
    healthRestore: 2
  },
  {
    id: 'freshwater_shrimp',
    name: '淡水虾',
    category: 'fish',
    description: '清澈水域中的小虾。',
    sellPrice: 20,
    edible: true,
    staminaRestore: 4,
    healthRestore: 2
  },
  {
    id: 'crab',
    name: '螃蟹',
    category: 'fish',
    description: '鲜美的河蟹。',
    sellPrice: 30,
    edible: true,
    staminaRestore: 6,
    healthRestore: 3
  },
  {
    id: 'lobster',
    name: '龙虾',
    category: 'fish',
    description: '珍贵的淡水龙虾。',
    sellPrice: 50,
    edible: true,
    staminaRestore: 10,
    healthRestore: 5
  },
  {
    id: 'cave_shrimp',
    name: '洞穴虾',
    category: 'fish',
    description: '矿洞暗河中的透明小虾。',
    sellPrice: 40,
    edible: true,
    staminaRestore: 8,
    healthRestore: 4
  },
  {
    id: 'swamp_crab',
    name: '沼泽蟹',
    category: 'fish',
    description: '沼泽中的深色螃蟹。',
    sellPrice: 45,
    edible: true,
    staminaRestore: 9,
    healthRestore: 4
  },
  { id: 'trash', name: '垃圾', category: 'misc', description: '没什么用的杂物。', sellPrice: 1, edible: false },
  { id: 'driftwood', name: '浮木', category: 'misc', description: '水中捞起的朽木。', sellPrice: 2, edible: false },
  { id: 'broken_cd', name: '碎碟片', category: 'misc', description: '不知谁丢的破碟子。', sellPrice: 1, edible: false },
  { id: 'soggy_newspaper', name: '湿报纸', category: 'misc', description: '泡烂的旧报纸。', sellPrice: 1, edible: false }
]

/** 花蜜物品 */
const FLOWER_HONEY_ITEMS: ItemDef[] = [
  {
    id: 'chrysanthemum_honey',
    name: '菊花蜜',
    category: 'processed',
    description: '带有菊花清香的蜂蜜。',
    sellPrice: 200,
    edible: true,
    staminaRestore: 25,
    healthRestore: 12
  },
  {
    id: 'osmanthus_honey',
    name: '桂花蜜',
    category: 'processed',
    description: '馥郁芬芳的桂花蜂蜜。',
    sellPrice: 450,
    edible: true,
    staminaRestore: 30,
    healthRestore: 15
  },
  {
    id: 'rapeseed_honey',
    name: '菜花蜜',
    category: 'processed',
    description: '清甜的油菜花蜂蜜。',
    sellPrice: 150,
    edible: true,
    staminaRestore: 20,
    healthRestore: 10
  },
  {
    id: 'snow_lotus_honey',
    name: '雪莲蜜',
    category: 'processed',
    description: '珍贵的雪莲花蜂蜜。',
    sellPrice: 730,
    edible: true,
    staminaRestore: 40,
    healthRestore: 20
  }
]

/** 松露油 */
const TRUFFLE_OIL_ITEM: ItemDef[] = [
  { id: 'truffle_oil', name: '松露油', category: 'processed', description: '珍贵的松露油，烹饪佳品。', sellPrice: 680, edible: false }
]

/** 奶酪物品 */
const CHEESE_ITEMS: ItemDef[] = [
  {
    id: 'cheese',
    name: '奶酪',
    category: 'processed',
    description: '用牛奶制成的醇厚奶酪。',
    sellPrice: 250,
    edible: true,
    staminaRestore: 50,
    healthRestore: 25
  },
  {
    id: 'goat_cheese',
    name: '山羊奶酪',
    category: 'processed',
    description: '用山羊奶制成的风味奶酪。',
    sellPrice: 220,
    edible: true,
    staminaRestore: 44,
    healthRestore: 22
  },
  {
    id: 'buffalo_cheese',
    name: '水牛奶酪',
    category: 'processed',
    description: '用水牛奶制成的浓郁奶酪。',
    sellPrice: 200,
    edible: true,
    staminaRestore: 40,
    healthRestore: 20
  },
  {
    id: 'yak_cheese',
    name: '牦牛奶酪',
    category: 'processed',
    description: '用牦牛奶制成的高原奶酪。',
    sellPrice: 280,
    edible: true,
    staminaRestore: 56,
    healthRestore: 28
  }
]

/** 布料物品 */
const CLOTH_ITEMS: ItemDef[] = [
  { id: 'cloth', name: '布匹', category: 'material', description: '用羊毛纺织的布匹。', sellPrice: 660, edible: false },
  { id: 'silk_cloth', name: '丝绸', category: 'material', description: '华美的丝绸。', sellPrice: 200, edible: false },
  { id: 'alpaca_cloth', name: '羊驼绒', category: 'material', description: '极其柔软的羊驼绒布。', sellPrice: 530, edible: false },
  { id: 'felt', name: '毛毡', category: 'material', description: '用兔毛压制的毛毡。', sellPrice: 340, edible: false }
]

/** 金属锭物品 */
const BAR_ITEMS: ItemDef[] = [
  { id: 'copper_bar', name: '铜锭', category: 'material', description: '冶炼出的铜锭。', sellPrice: 40, edible: false },
  { id: 'iron_bar', name: '铁锭', category: 'material', description: '冶炼出的铁锭。', sellPrice: 80, edible: false },
  { id: 'gold_bar', name: '金锭', category: 'material', description: '冶炼出的金锭。', sellPrice: 160, edible: false },
  { id: 'iridium_bar', name: '铱锭', category: 'material', description: '冶炼出的铱锭，极其珍贵。', sellPrice: 700, edible: false }
]

/** 木炭物品 */
const CHARCOAL_ITEMS: ItemDef[] = [
  { id: 'charcoal', name: '木炭', category: 'material', description: '烧制的木炭，可用作燃料和制作。', sellPrice: 55, edible: false }
]

/** 面粉物品 */
const FLOUR_ITEMS: ItemDef[] = [
  { id: 'rice_flour', name: '米粉', category: 'material', description: '用稻米磨成的细腻米粉。', sellPrice: 160, edible: false },
  { id: 'wheat_flour', name: '面粉', category: 'material', description: '用冬小麦磨成的面粉。', sellPrice: 130, edible: false },
  { id: 'cornmeal', name: '玉米粉', category: 'material', description: '用玉米磨成的粗粉。', sellPrice: 180, edible: false }
]

/** 茶饮物品 */
const TEA_DRINK_ITEMS: ItemDef[] = [
  {
    id: 'green_tea_drink',
    name: '绿茶',
    category: 'processed',
    description: '清香的绿茶饮品。',
    sellPrice: 620,
    edible: true,
    staminaRestore: 25,
    healthRestore: 12
  },
  {
    id: 'chrysanthemum_tea',
    name: '菊花茶',
    category: 'processed',
    description: '清热明目的菊花茶。',
    sellPrice: 470,
    edible: true,
    staminaRestore: 20,
    healthRestore: 10
  },
  {
    id: 'osmanthus_tea',
    name: '桂花茶',
    category: 'processed',
    description: '馥郁芬芳的桂花茶。',
    sellPrice: 780,
    edible: true,
    staminaRestore: 30,
    healthRestore: 15
  },
  {
    id: 'ginseng_tea',
    name: '人参茶',
    category: 'processed',
    description: '滋补强身的人参茶。',
    sellPrice: 300,
    edible: true,
    staminaRestore: 40,
    healthRestore: 20
  }
]

/** 豆腐物品 */
const TOFU_ITEMS: ItemDef[] = [
  {
    id: 'tofu',
    name: '豆腐',
    category: 'processed',
    description: '鲜嫩的豆腐。',
    sellPrice: 500,
    edible: true,
    staminaRestore: 20,
    healthRestore: 10
  },
  {
    id: 'peanut_tofu',
    name: '花生豆腐',
    category: 'processed',
    description: '香浓的花生豆腐。',
    sellPrice: 380,
    edible: true,
    staminaRestore: 18,
    healthRestore: 9
  },
  {
    id: 'sesame_paste',
    name: '芝麻酱',
    category: 'processed',
    description: '浓香的芝麻酱。',
    sellPrice: 175,
    edible: true,
    staminaRestore: 15,
    healthRestore: 8
  }
]

/** 药品物品 */
const HERB_PRODUCT_ITEMS: ItemDef[] = [
  {
    id: 'herbal_paste',
    name: '草药膏',
    category: 'processed',
    description: '研磨制成的草药膏。',
    sellPrice: 80,
    edible: true,
    staminaRestore: 15,
    healthRestore: 10
  },
  {
    id: 'ginseng_extract',
    name: '人参精',
    category: 'processed',
    description: '浓缩的人参精华。',
    sellPrice: 400,
    edible: true,
    staminaRestore: 50,
    healthRestore: 25
  },
  {
    id: 'antler_powder',
    name: '鹿茸粉',
    category: 'processed',
    description: '研磨的鹿茸粉。',
    sellPrice: 950,
    edible: true,
    staminaRestore: 60,
    healthRestore: 30
  },
  {
    id: 'animal_medicine',
    name: '兽药',
    category: 'misc',
    description: '治疗生病的牲畜，立即痊愈。',
    sellPrice: 50,
    edible: false
  },
  {
    id: 'stamina_fruit',
    name: '仙桃',
    category: 'misc',
    description: '蕴含远古灵气的果实，食用后永久提升体力上限。极其稀有。',
    sellPrice: 5000,
    edible: false
  }
]

/** 特殊饲料物品 */
const FEED_ITEMS: ItemDef[] = [
  {
    id: 'premium_feed',
    name: '精饲料',
    category: 'material',
    description: '精心配制的优质饲料，显著提升动物心情和好感度。',
    sellPrice: 40,
    edible: false
  },
  {
    id: 'nourishing_feed',
    name: '滋补饲料',
    category: 'material',
    description: '添加滋补成分的饲料，加速动物产出周期。',
    sellPrice: 50,
    edible: false
  },
  {
    id: 'vitality_feed',
    name: '活力饲料',
    category: 'material',
    description: '含有草药精华的饲料，喂食后必定治愈疾病。',
    sellPrice: 60,
    edible: false
  }
]

/** 香料物品 */
const INCENSE_ITEMS: ItemDef[] = [
  { id: 'pine_incense', name: '松香', category: 'gift', description: '清新的松香，送礼佳品。', sellPrice: 100, edible: false },
  { id: 'camphor_incense', name: '樟脑香', category: 'gift', description: '提神醒脑的樟脑香。', sellPrice: 150, edible: false },
  { id: 'osmanthus_incense', name: '桂花香', category: 'gift', description: '馥郁的桂花香。', sellPrice: 780, edible: false }
]

/** 武器图鉴物品 */
const WEAPON_ITEMS: ItemDef[] = Object.values(WEAPONS).map(w => ({
  id: w.id,
  name: w.name,
  category: 'weapon' as const,
  description: w.description,
  sellPrice: getWeaponSellPrice(w.id, null),
  edible: false
}))

/** 戒指图鉴物品 */
const RING_ITEMS: ItemDef[] = RINGS.map(r => ({
  id: r.id,
  name: r.name,
  category: 'ring' as const,
  description: r.description,
  sellPrice: r.sellPrice,
  edible: false
}))

/** 帽子图鉴物品 */
const HAT_ITEMS: ItemDef[] = HATS.map(h => ({
  id: h.id,
  name: h.name,
  category: 'hat' as const,
  description: h.description,
  sellPrice: h.sellPrice,
  edible: false
}))

/** 鞋子图鉴物品 */
const SHOE_ITEMS: ItemDef[] = SHOES.map(s => ({
  id: s.id,
  name: s.name,
  category: 'shoe' as const,
  description: s.description,
  sellPrice: s.sellPrice,
  edible: false
}))

/** 所有物品定义 */
export const ITEMS: ItemDef[] = [
  ...SEED_ITEMS,
  ...CROP_ITEMS,
  ...ORE_ITEMS,
  ...MISC_ITEMS,
  ...FISH_ITEMS,
  ...FOOD_ITEMS,
  ...PROCESSED_ITEMS,
  ...SMOKED_ITEMS,
  ...DRIED_ITEMS,
  ...MACHINE_ITEMS,
  ...SPRINKLER_ITEMS,
  ...FERTILIZER_ITEMS,
  ...BAIT_ITEMS,
  ...TACKLE_ITEMS,
  ...ANIMAL_PRODUCT_ITEMS,
  ...FRUIT_TREE_ITEMS,
  ...SAPLING_ITEMS,
  ...WILD_TREE_ITEMS,
  ...BOMB_ITEMS,
  ...CRAB_POT_ITEMS,
  ...TRUFFLE_OIL_ITEM,
  ...FLOWER_HONEY_ITEMS,
  ...CHEESE_ITEMS,
  ...CLOTH_ITEMS,
  ...BAR_ITEMS,
  ...CHARCOAL_ITEMS,
  ...FLOUR_ITEMS,
  ...TEA_DRINK_ITEMS,
  ...TOFU_ITEMS,
  ...HERB_PRODUCT_ITEMS,
  ...FEED_ITEMS,
  ...INCENSE_ITEMS,

  // 装备图鉴
  ...WEAPON_ITEMS,
  ...RING_ITEMS,
  ...HAT_ITEMS,
  ...SHOE_ITEMS,

  // 淘金产出
  { id: 'gold_nugget', name: '金砂', category: 'misc', description: '河中淘得的金砂，闪闪发光。', sellPrice: 80, edible: false },

  // ===== 化石 (8) =====
  { id: 'trilobite_fossil', name: '三叶虫化石', category: 'fossil', description: '远古海洋生物的化石。', sellPrice: 120, edible: false },
  { id: 'amber', name: '琥珀', category: 'fossil', description: '凝固了万年的树脂化石。', sellPrice: 150, edible: false },
  { id: 'ammonite_fossil', name: '菊石化石', category: 'fossil', description: '螺旋状的远古海洋化石。', sellPrice: 180, edible: false },
  { id: 'fern_fossil', name: '蕨叶化石', category: 'fossil', description: '保存完好的远古蕨类化石。', sellPrice: 100, edible: false },
  { id: 'shell_fossil', name: '螺壳化石', category: 'fossil', description: '古代软体动物的壳化石。', sellPrice: 90, edible: false },
  { id: 'bone_fragment', name: '骨骸碎片', category: 'fossil', description: '不知名远古生物的骨骸碎片。', sellPrice: 200, edible: false },
  { id: 'petrified_wood', name: '石化木', category: 'fossil', description: '被矿物质替代的远古木材。', sellPrice: 130, edible: false },
  { id: 'dragon_tooth', name: '龙牙化石', category: 'fossil', description: '传说中龙族遗留的牙齿化石。', sellPrice: 350, edible: false },

  // ===== 古物 (10) =====
  { id: 'ancient_pottery', name: '古陶片', category: 'artifact', description: '远古文明留下的陶器碎片。', sellPrice: 100, edible: false },
  { id: 'jade_disc', name: '玉璧残片', category: 'artifact', description: '精美的远古玉璧碎片。', sellPrice: 250, edible: false },
  { id: 'bronze_mirror', name: '铜镜', category: 'artifact', description: '磨制精良的远古铜镜。', sellPrice: 200, edible: false },
  { id: 'ancient_coin', name: '远古铜钱', category: 'artifact', description: '不知名朝代的古铜钱。', sellPrice: 150, edible: false },
  { id: 'oracle_bone', name: '甲骨片', category: 'artifact', description: '刻有卜辞的远古甲骨。', sellPrice: 300, edible: false },
  { id: 'jade_pendant', name: '玉佩', category: 'artifact', description: '温润如玉的远古佩饰。', sellPrice: 220, edible: false },
  {
    id: 'ancient_seed',
    name: '远古种子',
    category: 'artifact',
    description: '蕴含远古生命力的神秘种子，据说能种出远古水果。',
    sellPrice: 400,
    edible: false
  },
  { id: 'bamboo_scroll', name: '竹简', category: 'artifact', description: '刻有古文的竹简残片。', sellPrice: 180, edible: false },
  { id: 'stone_axe_head', name: '石斧头', category: 'artifact', description: '远古先民使用的石斧头。', sellPrice: 120, edible: false },
  { id: 'painted_pottery', name: '彩陶碎片', category: 'artifact', description: '绘有精美纹饰的彩陶碎片。', sellPrice: 200, edible: false },

  // ===== 公会商店物品 =====
  {
    id: 'combat_tonic',
    name: '战斗补剂',
    category: 'food',
    description: '恢复30点HP。',
    sellPrice: 100,
    edible: true,
    staminaRestore: 0,
    healthRestore: 30
  },
  {
    id: 'fortify_brew',
    name: '强化药水',
    category: 'food',
    description: '恢复60点HP。',
    sellPrice: 250,
    edible: true,
    staminaRestore: 0,
    healthRestore: 60
  },
  {
    id: 'ironhide_potion',
    name: '铁壁药剂',
    category: 'food',
    description: '恢复全部HP。',
    sellPrice: 400,
    edible: true,
    staminaRestore: 0,
    healthRestore: 999
  },
  { id: 'slayer_charm', name: '猎魔符', category: 'misc', description: '怪物掉落率+20%（当次探索）。', sellPrice: 750, edible: false },
  {
    id: 'warriors_feast',
    name: '勇者盛宴',
    category: 'food',
    description: '恢复50体力和50HP。',
    sellPrice: 500,
    edible: true,
    staminaRestore: 50,
    healthRestore: 50
  },
  { id: 'monster_lure', name: '怪物诱饵', category: 'misc', description: '本层怪物数量翻倍。', sellPrice: 1000, edible: false },
  { id: 'guild_badge', name: '公会徽章', category: 'misc', description: '攻击力永久+3。', sellPrice: 0, edible: false },
  { id: 'life_talisman', name: '生命护符', category: 'misc', description: '最大生命值永久+15。', sellPrice: 0, edible: false },
  { id: 'defense_charm', name: '守护符', category: 'misc', description: '防御永久+3%。', sellPrice: 0, edible: false },
  {
    id: 'adventurer_ration',
    name: '冒险口粮',
    category: 'food',
    description: '恢复25体力和25HP。',
    sellPrice: 175,
    edible: true,
    staminaRestore: 25,
    healthRestore: 25
  },
  {
    id: 'stamina_elixir',
    name: '精力药剂',
    category: 'food',
    description: '恢复120点体力。',
    sellPrice: 300,
    edible: true,
    staminaRestore: 120,
    healthRestore: 0
  },
  { id: 'lucky_coin', name: '幸运铜钱', category: 'misc', description: '怪物掉落率永久+5%。', sellPrice: 0, edible: false },

  // ===== 瀚海物品 =====
  {
    id: 'hanhai_cactus_seed',
    name: '仙人掌种子',
    category: 'seed',
    description: '来自西域的奇特植物种子，夏季可种植。',
    sellPrice: 250,
    edible: false
  },
  {
    id: 'hanhai_date_seed',
    name: '椰枣种子',
    category: 'seed',
    description: '丝绸之路带来的西域果实种子，夏/秋季可种植。',
    sellPrice: 200,
    edible: false
  },
  { id: 'hanhai_spice', name: '西域香料', category: 'material', description: '异域风情的香料，烹饪佳品。', sellPrice: 150, edible: false },
  { id: 'hanhai_silk', name: '丝绸', category: 'material', description: '细腻光滑的上等丝绸。', sellPrice: 400, edible: false },
  { id: 'hanhai_turquoise', name: '绿松石', category: 'gem', description: '西域特产的珍贵宝石。', sellPrice: 300, edible: false },
  { id: 'hanhai_map', name: '藏宝图', category: 'misc', description: '标记着荒原某处宝藏的地图。', sellPrice: 500, edible: false },
  {
    id: 'mega_bomb_recipe',
    name: '巨型炸弹配方',
    category: 'misc',
    description: '据说能炸开整层矿洞的秘方。',
    sellPrice: 2500,
    edible: false
  },
  // --- 新增西域商品 ---
  { id: 'hanhai_incense', name: '瀚海沉香', category: 'gift', description: '西域珍贵香料，送礼佳品。', sellPrice: 250, edible: false },
  {
    id: 'hanhai_carpet',
    name: '飞毯碎片',
    category: 'misc',
    description: '传说中飞毯的残片，珍贵的收藏品。',
    sellPrice: 600,
    edible: false
  },
  { id: 'hanhai_amber', name: '戈壁琥珀', category: 'gem', description: '戈壁滩的天然琥珀。', sellPrice: 220, edible: false },
  {
    id: 'hanhai_dried_fruit',
    name: '西域干果',
    category: 'food',
    description: '甜蜜的异域干果，恢复体力。',
    sellPrice: 100,
    edible: true,
    staminaRestore: 20
  },
  { id: 'hanhai_pottery', name: '彩陶', category: 'gift', description: '精致的西域彩陶，送礼佳品。', sellPrice: 175, edible: false },
  {
    id: 'hanhai_saddle_leather',
    name: '鞍具皮革',
    category: 'material',
    description: '上等的西域马具皮革。',
    sellPrice: 350,
    edible: false
  },
  { id: 'hanhai_lapis', name: '青金石', category: 'gem', description: '深蓝色的珍贵宝石。', sellPrice: 275, edible: false },
  // --- 加工产出 ---
  { id: 'spice_oil', name: '香料油', category: 'processed', description: '浓郁的异域风味油脂。', sellPrice: 350, edible: false },
  {
    id: 'cactus_jam',
    name: '仙人掌果酱',
    category: 'processed',
    description: '酸甜可口的沙漠果酱。',
    sellPrice: 400,
    edible: true,
    staminaRestore: 35,
    healthRestore: 15
  },
  {
    id: 'cactus_wine',
    name: '仙人掌酒',
    category: 'processed',
    description: '西域特色佳酿。',
    sellPrice: 800,
    edible: true,
    staminaRestore: 30,
    healthRestore: 20
  },
  {
    id: 'date_wine',
    name: '椰枣酒',
    category: 'processed',
    description: '甘醇滋补的枣酿。',
    sellPrice: 650,
    edible: true,
    staminaRestore: 25,
    healthRestore: 15
  },
  {
    id: 'turquoise_accessory',
    name: '绿松石饰品',
    category: 'gift',
    description: '精致的绿松石首饰，送礼极佳。',
    sellPrice: 650,
    edible: false
  },
  { id: 'brocade', name: '锦缎', category: 'material', description: '上等华丽的锦缎。', sellPrice: 900, edible: false },
  {
    id: 'spice_tea',
    name: '香料茶',
    category: 'processed',
    description: '异域风味的香茶。',
    sellPrice: 350,
    edible: true,
    staminaRestore: 20,
    healthRestore: 10
  },
  // --- 积分兑换物品 ---
  {
    id: 'trade_star_fragment',
    name: '星辰碎片',
    category: 'material',
    description: '稀有材料，用于高级制作。',
    sellPrice: 500,
    edible: false
  },
  // { id: 'trade_golden_coconut', name: '金椰子', category: 'misc', description: '打开可获得随机稀有物品。', sellPrice: 800, edible: false },
  // {
  //   id: 'trade_desert_totem',
  //   name: '沙漠图腾',
  //   category: 'misc',
  //   description: '立即传送至瀚海（不消耗时间）。',
  //   sellPrice: 300,
  //   edible: false
  // },
  { id: 'trade_spice_bundle', name: '香料礼包', category: 'misc', description: '内含西域香料×5。', sellPrice: 750, edible: false },
  {
    id: 'trade_turquoise_pendant',
    name: '绿松石吊坠',
    category: 'gem',
    description: '西域绿松石打磨而成的精致吊坠。',
    sellPrice: 600,
    edible: false
  },
  { id: 'trade_silk_robe', name: '丝绸长袍', category: 'misc', description: '西域丝绸织就的华美长袍。', sellPrice: 750, edible: false },
  {
    id: 'trade_desert_blade',
    name: '沙漠弯刀',
    category: 'misc',
    description: '西域锻造的弯刀，锋利无比。',
    sellPrice: 2000,
    edible: false
  },
  // --- 瀚海拓展料理 ---
  {
    id: 'cactus_salad',
    name: '仙人掌沙拉',
    category: 'food',
    description: '清爽可口的仙人掌沙拉。',
    sellPrice: 250,
    edible: true,
    staminaRestore: 40,
    healthRestore: 20
  },
  {
    id: 'spice_fried_rice',
    name: '香料炒饭',
    category: 'food',
    description: '西域香料翻炒的米饭。',
    sellPrice: 300,
    edible: true,
    staminaRestore: 55,
    healthRestore: 25
  },
  {
    id: 'turquoise_tea',
    name: '绿松石养生茶',
    category: 'food',
    description: '以绿松石粉入茶的养生饮品。',
    sellPrice: 400,
    edible: true,
    staminaRestore: 60,
    healthRestore: 30
  },
  {
    id: 'silk_tofu',
    name: '丝绸豆腐',
    category: 'food',
    description: '用丝绸包裹蒸制的嫩滑豆腐。',
    sellPrice: 280,
    edible: true,
    staminaRestore: 45,
    healthRestore: 20
  },
  {
    id: 'date_porridge',
    name: '枣泥粥',
    category: 'food',
    description: '温热滋补的枣泥粥。',
    sellPrice: 260,
    edible: true,
    staminaRestore: 50,
    healthRestore: 25
  },
  {
    id: 'desert_feast',
    name: '西域盛宴',
    category: 'food',
    description: '集西域精华于一桌的豪华宴席。',
    sellPrice: 800,
    edible: true,
    staminaRestore: 80,
    healthRestore: 50
  },
  {
    id: 'brocade_dumpling',
    name: '锦缎御饺',
    category: 'food',
    description: '以锦缎为皮的极品饺子。',
    sellPrice: 700,
    edible: true,
    staminaRestore: 75,
    healthRestore: 40
  },

  // ==================== 仙灵物品 ====================
  // 发现线索
  {
    id: 'fox_bead',
    name: '狐珠',
    category: 'misc',
    description: '矿洞深处捡到的赤红色珠子，温热如有生命。',
    sellPrice: 500,
    edible: false
  },

  // 求缘物品
  {
    id: 'dragon_scale_charm',
    name: '龙鳞佩',
    category: 'misc',
    description: '以龙玉雕琢的鳞片形佩饰，蕴含潜渊之力。',
    sellPrice: 0,
    edible: false
  },
  { id: 'blossom_crown', name: '花灵冠', category: 'misc', description: '用永不凋零的桃花编织的花冠。', sellPrice: 0, edible: false },
  { id: 'jade_mortar', name: '玉药杵', category: 'misc', description: '月光石雕成的药杵，与月兔的玉杵成对。', sellPrice: 0, edible: false },
  { id: 'fox_flame_lantern', name: '狐火灯笼', category: 'misc', description: '内含狐火的灯笼，永不熄灭。', sellPrice: 0, edible: false },
  {
    id: 'cultivation_jade',
    name: '修炼玉佩',
    category: 'misc',
    description: '蕴含灵气的玉佩，修行者的信物。',
    sellPrice: 0,
    edible: false
  },
  {
    id: 'silver_thread_ring',
    name: '银丝戒',
    category: 'misc',
    description: '用月光银丝编织的戒指，寄托归乡之思。',
    sellPrice: 0,
    edible: false
  },

  // 结缘物品
  {
    id: 'dragon_pearl',
    name: '龙珠',
    category: 'misc',
    description: '以龙玉、月光石与棱彩碎片炼成的灵珠，是龙族至高的缘定信物。',
    sellPrice: 0,
    edible: false
  },
  {
    id: 'eternal_blossom',
    name: '不凋花',
    category: 'misc',
    description: '用至尊桃子、蜂蜜和桂花凝聚而成，永不枯萎的灵花。',
    sellPrice: 0,
    edible: false
  },
  {
    id: 'moon_elixir',
    name: '月华丹',
    category: 'misc',
    description: '人参、雪莲与月光石炼制的仙丹，散发柔和的银白色光芒。',
    sellPrice: 0,
    edible: false
  },
  {
    id: 'fox_spirit_bead',
    name: '灵狐珠',
    category: 'misc',
    description: '红宝石、月光石与黄金炼成的珠子，封印着狐仙的一缕灵力。',
    sellPrice: 0,
    edible: false
  },
  {
    id: 'immortal_gourd',
    name: '仙人葫',
    category: 'misc',
    description: '人参、鹿茸与铱矿炼制的丹葫芦，内蕴五百年修行之力。',
    sellPrice: 0,
    edible: false
  },
  {
    id: 'starlight_loom',
    name: '星光织机',
    category: 'misc',
    description: '蚕丝、月光石与棱彩碎片织成的微型织机，能织出星光般的丝线。',
    sellPrice: 0,
    edible: false
  },

  // 能力产出物品
  {
    id: 'spirit_peach',
    name: '灵桃',
    category: 'misc',
    description: '桃夭赐福的仙桃，散发着灵气。',
    sellPrice: 800,
    edible: true,
    staminaRestore: 50,
    healthRestore: 30
  },
  { id: 'moon_herb', name: '月草', category: 'material', description: '沐浴月华而生的灵草，药效极佳。', sellPrice: 300, edible: false },
  { id: 'dream_silk', name: '梦丝', category: 'material', description: '归女织出的银白丝线，闪烁着星光。', sellPrice: 500, edible: false },
  // --- 竹林野兽掉落 ---
  { id: 'wolf_pelt', name: '狼皮', category: 'material', description: '竹林灰狼的毛皮，柔韧耐磨。', sellPrice: 200, edible: false },
  { id: 'wolf_fang', name: '狼牙', category: 'material', description: '锋利的狼牙，可作装饰。', sellPrice: 150, edible: false },
  { id: 'bear_pelt', name: '熊皮', category: 'material', description: '厚实的黑熊皮毛，御寒极佳。', sellPrice: 400, edible: false },
  { id: 'bear_gall', name: '熊胆', category: 'material', description: '珍贵的药材，苦寒入肝。', sellPrice: 600, edible: false },
  { id: 'tiger_pelt', name: '虎皮', category: 'material', description: '稀有的虎皮，价值连城。', sellPrice: 800, edible: false },
  { id: 'tiger_bone', name: '虎骨', category: 'material', description: '传统名贵药材。', sellPrice: 500, edible: false },
  { id: 'tiger_fang', name: '虎牙', category: 'material', description: '猛虎獠牙，可作护身符。', sellPrice: 350, edible: false },
  // --- 竹林野兽掉落加工品 ---
  {
    id: 'bear_gall_pill',
    name: '熊胆丸',
    category: 'food',
    description: '熊胆研磨制成的苦寒丸药，服后神清气爽。',
    sellPrice: 450,
    edible: true,
    staminaRestore: 55,
    healthRestore: 30
  },
  {
    id: 'tiger_bone_tonic',
    name: '虎骨酒',
    category: 'food',
    description: '虎骨浸泡的药酒，饮后气血翻涌。',
    sellPrice: 700,
    edible: true,
    staminaRestore: 70,
    healthRestore: 40
  }
]

/** 根据ID查找物品 */
export const getItemById = (id: string): ItemDef | undefined => {
  return ITEMS.find(i => i.id === id)
}

/** 物品分类默认来源 */
const CATEGORY_SOURCE: Record<ItemCategory, string> = {
  seed: '商店购买',
  crop: '种植收获',
  fish: '钓鱼获得',
  ore: '矿洞采集',
  gem: '矿洞采集',
  material: '采集/合成',
  food: '烹饪制作',
  processed: '加工制作',
  machine: '合成制作',
  sprinkler: '合成制作',
  fertilizer: '合成制作',
  bait: '商店购买',
  tackle: '商店购买',
  animal_product: '畜牧产出',
  fruit: '果树收获',
  sapling: '商店购买',
  bomb: '合成制作',
  gift: '采集/商店',
  fossil: '矿洞挖掘',
  artifact: '矿洞挖掘',
  weapon: '商店/掉落',
  ring: '商店/合成',
  hat: '商店/合成',
  shoe: '铁匠铺合成',
  misc: '多种途径'
}

/** 特定物品来源覆写 */
const ITEM_SOURCE_OVERRIDES: Record<string, string> = {
  // 材料类
  wood: '砍树获得',
  bamboo: '砍竹获得',
  herb: '山间采集',
  firewood: '砍树获得',
  pine_cone: '砍树掉落',
  battery: '避雷针（雷雨天气）',
  copper_bar: '熔炉冶炼',
  iron_bar: '熔炉冶炼',
  gold_bar: '熔炉冶炼',
  iridium_bar: '熔炉冶炼',
  charcoal: '窑炉烧制',
  rice_flour: '石磨加工',
  wheat_flour: '石磨加工',
  cornmeal: '石磨加工',
  cloth: '织布机加工',
  silk_cloth: '织布机加工',
  alpaca_cloth: '织布机加工',
  felt: '织布机加工',
  fish_feed: '商店购买',
  water_purifier: '商店购买',
  // 采集类
  wild_mushroom: '矿洞蘑菇层/秋季觅食',
  winter_bamboo_shoot: '冬季觅食',
  ginseng: '秋季觅食',
  wild_berry: '夏季觅食',
  camphor_seed: '野树掉落',
  mulberry: '桑树收获',
  pine_resin: '树液采集器',
  // 野树相关
  tapper: '合成制作',
  lightning_rod: '合成制作',
  // 机器
  scarecrow: '合成制作',
  crab_pot: '合成制作',
  // 蟹笼捕获
  snail: '蟹笼捕获',
  freshwater_shrimp: '蟹笼捕获',
  crab: '蟹笼捕获',
  lobster: '蟹笼捕获',
  cave_shrimp: '蟹笼捕获',
  swamp_crab: '蟹笼捕获',
  trash: '蟹笼捕获',
  driftwood: '蟹笼捕获',
  broken_cd: '蟹笼捕获',
  soggy_newspaper: '蟹笼捕获',
  // 蜂蜜
  chrysanthemum_honey: '蜂箱产出',
  osmanthus_honey: '蜂箱产出',
  rapeseed_honey: '蜂箱产出',
  snow_lotus_honey: '蜂箱产出',
  // 奶酪
  cheese: '奶酪机加工',
  goat_cheese: '奶酪机加工',
  buffalo_cheese: '奶酪机加工',
  yak_cheese: '奶酪机加工',
  // 松露油
  truffle_oil: '榨油机加工',
  // 豆腐
  tofu: '石磨加工',
  peanut_tofu: '石磨加工',
  sesame_paste: '石磨加工',
  // 茶饮
  green_tea_drink: '加工制作',
  chrysanthemum_tea: '加工制作',
  ginseng_tea: '加工制作',
  // 礼物
  jade_ring: '商店购买',
  silk_ribbon: '商店购买',
  zhiji_jade: '商店购买',
  wintersweet: '冬季觅食',
  pine_incense: '合成制作',
  camphor_incense: '合成制作',
  osmanthus_incense: '合成制作',
  // 杂货
  rain_totem: '合成制作',
  gold_nugget: '河边淘金',
  // 公会商店
  combat_tonic: '冒险家公会',
  fortify_brew: '冒险家公会',
  ironhide_potion: '冒险家公会',
  warriors_feast: '冒险家公会',
  slayer_charm: '冒险家公会',
  monster_lure: '冒险家公会',
  guild_badge: '冒险家公会',
  life_talisman: '冒险家公会',
  defense_charm: '冒险家公会',
  lucky_coin: '冒险家公会',
  adventurer_ration: '冒险家公会',
  stamina_elixir: '冒险家公会',
  // 瀚海物品
  hanhai_cactus_seed: '瀚海沙漠商人',
  hanhai_date_seed: '瀚海沙漠商人',
  hanhai_spice: '瀚海沙漠商人',
  hanhai_silk: '瀚海沙漠商人',
  hanhai_turquoise: '瀚海沙漠商人',
  hanhai_map: '瀚海沙漠',
  hanhai_fossil: '瀚海沙漠',
  mega_bomb_recipe: '瀚海沙漠',
  hanhai_incense: '瀚海沙漠商人',
  hanhai_carpet: '瀚海沙漠商人',
  hanhai_amber: '瀚海沙漠商人',
  hanhai_dried_fruit: '瀚海沙漠商人',
  hanhai_pottery: '瀚海沙漠商人',
  hanhai_saddle_leather: '瀚海沙漠商人',
  hanhai_lapis: '瀚海沙漠商人',
  spice_oil: '加工制作',
  cactus_jam: '加工制作',
  cactus_wine: '加工制作',
  date_wine: '加工制作',
  turquoise_accessory: '加工制作',
  brocade: '加工制作',
  spice_tea: '加工制作',
  trade_star_fragment: '通商积分兑换',
  // trade_golden_coconut: '通商积分兑换',
  // trade_desert_totem: '通商积分兑换',
  trade_spice_bundle: '通商积分兑换',
  trade_turquoise_pendant: '通商积分兑换',
  trade_silk_robe: '通商积分兑换',
  trade_desert_blade: '通商积分兑换',
  cactus_salad: '烹饪',
  spice_fried_rice: '烹饪',
  turquoise_tea: '烹饪',
  silk_tofu: '烹饪',
  date_porridge: '烹饪',
  desert_feast: '烹饪',
  brocade_dumpling: '烹饪',
  // 远古种子
  ancient_seed: '矿洞挖掘（可种植）',
  // 草药加工品
  herbal_paste: '加工制作',
  ginseng_extract: '加工制作',
  antler_powder: '加工制作',
  stamina_fruit: '深渊宝箱(极稀有) / 制作',
  // 仙灵相关物品
  fox_bead: '矿洞深处（狐仙发现线索）',
  spirit_peach: '仙缘能力·灵桃（桃夭）',
  moon_herb: '仙缘能力·月华（月兔）',
  dream_silk: '仙缘能力·梦织（归女）',
  dragon_scale_charm: '制作（龙灵求缘信物）',
  blossom_crown: '制作（桃夭求缘信物）',
  jade_mortar: '制作（月兔求缘信物）',
  fox_flame_lantern: '制作（狐仙求缘信物）',
  cultivation_jade: '制作（山翁求缘信物）',
  silver_thread_ring: '制作（归女求缘信物）',
  dragon_pearl: '制作（龙灵结缘信物）',
  eternal_blossom: '制作（桃夭结缘信物）',
  moon_elixir: '制作（月兔结缘信物）',
  fox_spirit_bead: '制作（狐仙结缘信物）',
  immortal_gourd: '制作（山翁结缘信物）',
  starlight_loom: '制作（归女结缘信物）',
  // 竹林野兽掉落
  wolf_pelt: '竹林野兽掉落',
  wolf_fang: '竹林野兽掉落',
  bear_pelt: '竹林野兽掉落',
  bear_gall: '竹林野兽掉落',
  tiger_pelt: '竹林野兽掉落',
  tiger_bone: '竹林野兽掉落',
  tiger_fang: '竹林野兽掉落',
  bear_gall_pill: '加工制作',
  tiger_bone_tonic: '加工制作'
}

/** 获取物品来源描述 */
export const getItemSource = (itemId: string): string => {
  const override = ITEM_SOURCE_OVERRIDES[itemId]
  if (override) return override
  const def = getItemById(itemId)
  if (!def) return '未知'
  return CATEGORY_SOURCE[def.category]
}

/** 箱子阶梯定义 */
import type { ChestTier } from '@/types'

export const CHEST_DEFS: Record<
  ChestTier,
  {
    name: string
    capacity: number
    craftCost: { itemId: string; quantity: number }[]
    craftMoney: number
    description: string
  }
> = {
  wood: {
    name: '木箱',
    capacity: 18,
    craftCost: [{ itemId: 'wood', quantity: 50 }],
    craftMoney: 500,
    description: '基础储物箱，可存放18格物品。'
  },
  copper: {
    name: '铜箱',
    capacity: 36,
    craftCost: [{ itemId: 'copper_bar', quantity: 15 }],
    craftMoney: 2000,
    description: '坚固的铜制储物箱，可存放36格物品。'
  },
  iron: {
    name: '铁箱',
    capacity: 64,
    craftCost: [
      { itemId: 'iron_bar', quantity: 10 },
      { itemId: 'wood', quantity: 20 }
    ],
    craftMoney: 5000,
    description: '耐用的铁制储物箱，可存放64格物品。'
  },
  gold: {
    name: '金箱',
    capacity: 128,
    craftCost: [
      { itemId: 'gold_bar', quantity: 8 },
      { itemId: 'iron_bar', quantity: 5 }
    ],
    craftMoney: 10000,
    description: '华贵的金制储物箱，可存放128格物品。'
  },
  void: {
    name: '虚空箱',
    capacity: 64,
    craftCost: [
      { itemId: 'iridium_bar', quantity: 5 },
      { itemId: 'void_ore', quantity: 20 }
    ],
    craftMoney: 25000,
    description: '可远程存取，并可设为作坊原料箱/成品箱。容量64格。'
  }
}

/** 箱子阶梯顺序 */
export const CHEST_TIER_ORDER: ChestTier[] = ['wood', 'copper', 'iron', 'gold', 'void']
