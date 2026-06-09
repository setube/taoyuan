import type { ProcessingMachineDef, ProcessingRecipeDef, SprinklerDef, FertilizerDef, BaitDef, TackleDef, BombDef } from '@/types'

/** 加工机器定义 */
export const PROCESSING_MACHINES: ProcessingMachineDef[] = [
  {
    id: 'wine_workshop',
    name: '酒坊',
    description: '将水果/作物酿成美酒，售价翻三倍。',
    craftCost: [
      { itemId: 'wood', quantity: 30 },
      { itemId: 'copper_ore', quantity: 5 },
      { itemId: 'iron_ore', quantity: 3 }
    ],
    craftMoney: 300
  },
  {
    id: 'sauce_jar',
    name: '酱缸',
    description: '将作物腌制成酱菜蜜饯，稳定增值。',
    craftCost: [
      { itemId: 'wood', quantity: 20 },
      { itemId: 'copper_ore', quantity: 8 },
      { itemId: 'quartz', quantity: 1 }
    ],
    craftMoney: 200
  },
  {
    id: 'bee_house',
    name: '蜂箱',
    description: '每4天自动产出蜂蜜。',
    craftCost: [
      { itemId: 'wood', quantity: 40 },
      { itemId: 'iron_ore', quantity: 2 },
      { itemId: 'bamboo', quantity: 10 }
    ],
    craftMoney: 250
  },
  {
    id: 'oil_press',
    name: '油坊',
    description: '将芝麻或种子榨成食用油。',
    craftCost: [
      { itemId: 'wood', quantity: 15 },
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'gold_ore', quantity: 1 }
    ],
    craftMoney: 350
  },
  {
    id: 'mayo_maker',
    name: '蛋黄酱机',
    description: '将鸡蛋或鸭蛋制成蛋黄酱。',
    craftCost: [
      { itemId: 'wood', quantity: 15 },
      { itemId: 'copper_ore', quantity: 5 },
      { itemId: 'quartz', quantity: 1 }
    ],
    craftMoney: 200
  },
  {
    id: 'seed_maker',
    name: '种子制造机',
    description: '将成熟作物转化为种子。',
    craftCost: [
      { itemId: 'wood', quantity: 20 },
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'gold_ore', quantity: 2 }
    ],
    craftMoney: 500
  },
  {
    id: 'crystal_duplicator',
    name: '结晶复制机',
    description: '投入宝石后缓慢复制，获得双倍产出。',
    craftCost: [
      { itemId: 'gold_ore', quantity: 5 },
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'quartz', quantity: 2 }
    ],
    craftMoney: 500
  },
  {
    id: 'smoker',
    name: '烟熏机',
    description: '将鱼烟熏处理，售价翻倍。',
    craftCost: [
      { itemId: 'wood', quantity: 20 },
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'firewood', quantity: 5 }
    ],
    craftMoney: 300
  },
  {
    id: 'dehydrator',
    name: '脱水机',
    description: '将蘑菇或水果脱水保存，增值出售。',
    craftCost: [
      { itemId: 'wood', quantity: 15 },
      { itemId: 'iron_ore', quantity: 2 },
      { itemId: 'firewood', quantity: 10 }
    ],
    craftMoney: 200
  },
  {
    id: 'recycler',
    name: '回收机',
    description: '将垃圾回收转化为有用材料。',
    craftCost: [
      { itemId: 'wood', quantity: 25 },
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'copper_ore', quantity: 5 }
    ],
    craftMoney: 150
  },
  {
    id: 'cheese_press',
    name: '乳酪机',
    description: '将牛奶制成美味的奶酪。',
    craftCost: [
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'wood', quantity: 15 },
      { itemId: 'copper_ore', quantity: 3 }
    ],
    craftMoney: 400
  },
  {
    id: 'loom',
    name: '织布机',
    description: '将毛线和丝织成布匹。',
    craftCost: [
      { itemId: 'wood', quantity: 20 },
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'bamboo', quantity: 10 }
    ],
    craftMoney: 300
  },
  {
    id: 'furnace',
    name: '熔炉',
    description: '投入同类矿石冶炼金属锭，每次最多5个。完成后自动收取。',
    craftCost: [
      { itemId: 'copper_ore', quantity: 10 },
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'quartz', quantity: 2 }
    ],
    craftMoney: 500,
    autoCollect: true
  },
  {
    id: 'charcoal_kiln',
    name: '炭窑',
    description: '将木材烧制成木炭。',
    craftCost: [
      { itemId: 'wood', quantity: 20 },
      { itemId: 'copper_ore', quantity: 3 },
      { itemId: 'firewood', quantity: 10 }
    ],
    craftMoney: 150
  },
  {
    id: 'mill',
    name: '石磨',
    description: '将谷物磨成面粉。',
    craftCost: [
      { itemId: 'wood', quantity: 25 },
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'quartz', quantity: 1 }
    ],
    craftMoney: 350
  },
  {
    id: 'worm_bin',
    name: '蚯蚓箱',
    description: '每2天自动产出鱼饵。',
    craftCost: [
      { itemId: 'wood', quantity: 15 },
      { itemId: 'herb', quantity: 5 },
      { itemId: 'firewood', quantity: 5 }
    ],
    craftMoney: 200
  },
  {
    id: 'tea_maker',
    name: '制茶机',
    description: '将茶叶和花卉泡制成饮品。',
    craftCost: [
      { itemId: 'wood', quantity: 15 },
      { itemId: 'iron_ore', quantity: 2 },
      { itemId: 'bamboo', quantity: 5 }
    ],
    craftMoney: 250
  },
  {
    id: 'tofu_press',
    name: '豆腐坊',
    description: '将豆类磨制成豆腐和酱料。',
    craftCost: [
      { itemId: 'wood', quantity: 20 },
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'quartz', quantity: 1 }
    ],
    craftMoney: 300
  },
  {
    id: 'herb_grinder',
    name: '药碾',
    description: '将草药研磨成药膏和精华。',
    craftCost: [
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'quartz', quantity: 2 },
      { itemId: 'gold_ore', quantity: 1 }
    ],
    craftMoney: 400
  },
  {
    id: 'incense_maker',
    name: '制香坊',
    description: '将树脂和花卉制成香料。',
    craftCost: [
      { itemId: 'wood', quantity: 15 },
      { itemId: 'bamboo', quantity: 10 },
      { itemId: 'firewood', quantity: 5 }
    ],
    craftMoney: 200
  }
]

/** 加工配方 */
export const PROCESSING_RECIPES: ProcessingRecipeDef[] = [
  // 酒坊
  {
    id: 'wine_watermelon',
    machineType: 'wine_workshop',
    name: '西瓜酒',
    inputItemId: 'watermelon',
    inputQuantity: 1,
    maxInputQuantity: 3,
    outputItemId: 'watermelon_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '甘甜的西瓜酿成的佳酿。'
  },
  {
    id: 'wine_osmanthus',
    machineType: 'wine_workshop',
    name: '桂花酿',
    inputItemId: 'osmanthus',
    inputQuantity: 1,
    maxInputQuantity: 3,
    outputItemId: 'osmanthus_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '馥郁芬芳的桂花酒。'
  },
  {
    id: 'vinegar_rice',
    machineType: 'wine_workshop',
    name: '米醋',
    inputItemId: 'rice',
    inputQuantity: 2,
    maxInputQuantity: 3,
    outputItemId: 'rice_vinegar',
    outputQuantity: 1,
    processingDays: 3,
    description: '家酿老陈醋。'
  },
  // 酱缸
  {
    id: 'pickle_cabbage',
    machineType: 'sauce_jar',
    name: '腌白菜',
    inputItemId: 'cabbage',
    inputQuantity: 2,
    outputItemId: 'pickled_cabbage',
    outputQuantity: 1,
    processingDays: 2,
    description: '开胃的腌白菜。'
  },
  {
    id: 'pickle_radish',
    machineType: 'sauce_jar',
    name: '萝卜干',
    inputItemId: 'radish',
    inputQuantity: 2,
    outputItemId: 'dried_radish',
    outputQuantity: 1,
    processingDays: 2,
    description: '香脆的萝卜干。'
  },
  {
    id: 'preserve_pumpkin',
    machineType: 'sauce_jar',
    name: '南瓜酱',
    inputItemId: 'pumpkin',
    inputQuantity: 1,
    outputItemId: 'pumpkin_preserve',
    outputQuantity: 1,
    processingDays: 2,
    description: '浓郁的南瓜酱。'
  },
  // 蜂箱
  {
    id: 'honey',
    machineType: 'bee_house',
    name: '蜂蜜',
    inputItemId: null,
    inputQuantity: 0,
    outputItemId: 'honey',
    outputQuantity: 1,
    processingDays: 4,
    description: '金黄甘甜的蜂蜜。'
  },
  {
    id: 'honey_chrysanthemum',
    machineType: 'bee_house',
    name: '菊花蜜',
    inputItemId: 'chrysanthemum',
    inputQuantity: 1,
    outputItemId: 'chrysanthemum_honey',
    outputQuantity: 1,
    processingDays: 4,
    description: '带有菊花清香的蜂蜜。'
  },
  {
    id: 'honey_osmanthus',
    machineType: 'bee_house',
    name: '桂花蜜',
    inputItemId: 'osmanthus',
    inputQuantity: 1,
    outputItemId: 'osmanthus_honey',
    outputQuantity: 1,
    processingDays: 4,
    description: '馥郁芬芳的桂花蜂蜜。'
  },
  {
    id: 'honey_rapeseed',
    machineType: 'bee_house',
    name: '菜花蜜',
    inputItemId: 'rapeseed',
    inputQuantity: 1,
    outputItemId: 'rapeseed_honey',
    outputQuantity: 1,
    processingDays: 4,
    description: '清甜的油菜花蜂蜜。'
  },
  {
    id: 'honey_snow_lotus',
    machineType: 'bee_house',
    name: '雪莲蜜',
    inputItemId: 'snow_lotus',
    inputQuantity: 1,
    outputItemId: 'snow_lotus_honey',
    outputQuantity: 1,
    processingDays: 4,
    description: '珍贵的雪莲花蜂蜜。'
  },
  // 油坊
  {
    id: 'sesame_oil',
    machineType: 'oil_press',
    name: '芝麻油',
    inputItemId: 'sesame',
    inputQuantity: 3,
    outputItemId: 'sesame_oil',
    outputQuantity: 1,
    processingDays: 1,
    description: '醇香的小磨麻油。'
  },
  {
    id: 'tea_oil',
    machineType: 'oil_press',
    name: '茶油',
    inputItemId: 'tea',
    inputQuantity: 2,
    outputItemId: 'tea_oil',
    outputQuantity: 1,
    processingDays: 1,
    description: '珍贵的山茶油。'
  },
  {
    id: 'truffle_oil',
    machineType: 'oil_press',
    name: '松露油',
    inputItemId: 'truffle',
    inputQuantity: 1,
    outputItemId: 'truffle_oil',
    outputQuantity: 1,
    processingDays: 1,
    description: '珍贵的松露油。'
  },
  // 新增：酒坊配方
  {
    id: 'wine_peach',
    machineType: 'wine_workshop',
    name: '桃花酒',
    inputItemId: 'peach',
    inputQuantity: 1,
    maxInputQuantity: 3,
    outputItemId: 'peach_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '清甜的桃花酒。'
  },
  {
    id: 'wine_jujube',
    machineType: 'wine_workshop',
    name: '红枣酒',
    inputItemId: 'jujube',
    inputQuantity: 1,
    maxInputQuantity: 3,
    outputItemId: 'jujube_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '醇厚滋补的红枣酒。'
  },
  {
    id: 'wine_corn',
    machineType: 'wine_workshop',
    name: '玉米酒',
    inputItemId: 'corn',
    inputQuantity: 2,
    maxInputQuantity: 3,
    outputItemId: 'corn_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '淡雅清香的玉米酒。'
  },
  // 新增：酱缸配方
  {
    id: 'pickle_chili',
    machineType: 'sauce_jar',
    name: '泡椒',
    inputItemId: 'chili',
    inputQuantity: 2,
    outputItemId: 'pickled_chili',
    outputQuantity: 1,
    processingDays: 2,
    description: '酸辣开胃的泡椒。'
  },
  {
    id: 'pickle_ginger',
    machineType: 'sauce_jar',
    name: '腌姜',
    inputItemId: 'ginger',
    inputQuantity: 2,
    outputItemId: 'pickled_ginger',
    outputQuantity: 1,
    processingDays: 2,
    description: '酸甜脆嫩的腌姜。'
  },
  // 蛋黄酱机
  {
    id: 'mayo_egg',
    machineType: 'mayo_maker',
    name: '蛋黄酱',
    inputItemId: 'egg',
    inputQuantity: 1,
    outputItemId: 'mayonnaise',
    outputQuantity: 1,
    processingDays: 2,
    description: '用鸡蛋制成的浓郁蛋黄酱。'
  },
  {
    id: 'mayo_duck_egg',
    machineType: 'mayo_maker',
    name: '鸭蛋黄酱',
    inputItemId: 'duck_egg',
    inputQuantity: 1,
    outputItemId: 'duck_mayonnaise',
    outputQuantity: 1,
    processingDays: 2,
    description: '用鸭蛋制成的高级蛋黄酱。'
  },
  {
    id: 'mayo_goose_egg',
    machineType: 'mayo_maker',
    name: '鹅蛋黄酱',
    inputItemId: 'goose_egg',
    inputQuantity: 1,
    outputItemId: 'goose_mayonnaise',
    outputQuantity: 1,
    processingDays: 2,
    description: '用鹅蛋制成的浓稠蛋黄酱。'
  },
  {
    id: 'mayo_silkie_egg',
    machineType: 'mayo_maker',
    name: '乌鸡蛋黄酱',
    inputItemId: 'silkie_egg',
    inputQuantity: 1,
    outputItemId: 'silkie_mayonnaise',
    outputQuantity: 1,
    processingDays: 2,
    description: '用乌鸡蛋制成的滋补蛋黄酱。'
  },
  {
    id: 'mayo_ostrich_egg',
    machineType: 'mayo_maker',
    name: '鸵鸟蛋黄酱',
    inputItemId: 'ostrich_egg',
    inputQuantity: 1,
    outputItemId: 'ostrich_mayonnaise',
    outputQuantity: 1,
    processingDays: 2,
    description: '用鸵鸟蛋制成的大份蛋黄酱。'
  },
  {
    id: 'mayo_quail_egg',
    machineType: 'mayo_maker',
    name: '鹌鹑蛋黄酱',
    inputItemId: 'quail_egg',
    inputQuantity: 3,
    outputItemId: 'quail_mayonnaise',
    outputQuantity: 1,
    processingDays: 2,
    description: '用鹌鹑蛋制成的精致蛋黄酱。'
  },
  // 种子制造机
  {
    id: 'seed_from_cabbage',
    machineType: 'seed_maker',
    name: '青菜种子',
    inputItemId: 'cabbage',
    inputQuantity: 1,
    outputItemId: 'seed_cabbage',
    outputQuantity: 2,
    processingDays: 1,
    description: '从青菜中提取种子。'
  },
  {
    id: 'seed_from_radish',
    machineType: 'seed_maker',
    name: '萝卜种子',
    inputItemId: 'radish',
    inputQuantity: 1,
    outputItemId: 'seed_radish',
    outputQuantity: 2,
    processingDays: 1,
    description: '从萝卜中提取种子。'
  },
  {
    id: 'seed_from_potato',
    machineType: 'seed_maker',
    name: '土豆种子',
    inputItemId: 'potato',
    inputQuantity: 1,
    outputItemId: 'seed_potato',
    outputQuantity: 2,
    processingDays: 1,
    description: '从土豆中提取种子。'
  },
  {
    id: 'seed_from_tea',
    machineType: 'seed_maker',
    name: '茶苗种子',
    inputItemId: 'tea',
    inputQuantity: 1,
    outputItemId: 'seed_tea',
    outputQuantity: 2,
    processingDays: 1,
    description: '从茶苗中提取种子。'
  },
  {
    id: 'seed_from_watermelon',
    machineType: 'seed_maker',
    name: '西瓜种子',
    inputItemId: 'watermelon',
    inputQuantity: 1,
    outputItemId: 'seed_watermelon',
    outputQuantity: 2,
    processingDays: 1,
    description: '从西瓜中提取种子。'
  },
  {
    id: 'seed_from_rice',
    machineType: 'seed_maker',
    name: '稻种',
    inputItemId: 'rice',
    inputQuantity: 1,
    outputItemId: 'seed_rice',
    outputQuantity: 2,
    processingDays: 1,
    description: '从稻谷中提取种子。'
  },
  {
    id: 'seed_from_lotus_root',
    machineType: 'seed_maker',
    name: '莲藕种子',
    inputItemId: 'lotus_root',
    inputQuantity: 1,
    outputItemId: 'seed_lotus_root',
    outputQuantity: 2,
    processingDays: 1,
    description: '从莲藕中提取种子。'
  },
  {
    id: 'seed_from_sesame',
    machineType: 'seed_maker',
    name: '芝麻种子',
    inputItemId: 'sesame',
    inputQuantity: 1,
    outputItemId: 'seed_sesame',
    outputQuantity: 2,
    processingDays: 1,
    description: '从芝麻中提取种子。'
  },
  {
    id: 'seed_from_pumpkin',
    machineType: 'seed_maker',
    name: '南瓜种子',
    inputItemId: 'pumpkin',
    inputQuantity: 1,
    outputItemId: 'seed_pumpkin',
    outputQuantity: 2,
    processingDays: 1,
    description: '从南瓜中提取种子。'
  },
  {
    id: 'seed_from_sweet_potato',
    machineType: 'seed_maker',
    name: '红薯种子',
    inputItemId: 'sweet_potato',
    inputQuantity: 1,
    outputItemId: 'seed_sweet_potato',
    outputQuantity: 2,
    processingDays: 1,
    description: '从红薯中提取种子。'
  },
  {
    id: 'seed_from_chrysanthemum',
    machineType: 'seed_maker',
    name: '菊花种子',
    inputItemId: 'chrysanthemum',
    inputQuantity: 1,
    outputItemId: 'seed_chrysanthemum',
    outputQuantity: 2,
    processingDays: 1,
    description: '从菊花中提取种子。'
  },
  {
    id: 'seed_from_osmanthus',
    machineType: 'seed_maker',
    name: '桂花种子',
    inputItemId: 'osmanthus',
    inputQuantity: 1,
    outputItemId: 'seed_osmanthus',
    outputQuantity: 2,
    processingDays: 1,
    description: '从桂花中提取种子。'
  },
  {
    id: 'seed_from_bamboo_shoot',
    machineType: 'seed_maker',
    name: '春笋种子',
    inputItemId: 'bamboo_shoot',
    inputQuantity: 1,
    outputItemId: 'seed_bamboo_shoot',
    outputQuantity: 2,
    processingDays: 1,
    description: '从春笋中提取种子。'
  },
  {
    id: 'seed_from_persimmon',
    machineType: 'seed_maker',
    name: '柿子种子',
    inputItemId: 'persimmon',
    inputQuantity: 1,
    outputItemId: 'seed_persimmon',
    outputQuantity: 2,
    processingDays: 1,
    description: '从柿子中提取种子。'
  },
  {
    id: 'seed_from_winter_wheat',
    machineType: 'seed_maker',
    name: '冬麦种子',
    inputItemId: 'winter_wheat',
    inputQuantity: 1,
    outputItemId: 'seed_winter_wheat',
    outputQuantity: 2,
    processingDays: 1,
    description: '从冬小麦中提取种子。'
  },
  {
    id: 'seed_from_garlic',
    machineType: 'seed_maker',
    name: '大蒜种子',
    inputItemId: 'garlic',
    inputQuantity: 1,
    outputItemId: 'seed_garlic',
    outputQuantity: 2,
    processingDays: 1,
    description: '从大蒜中提取种子。'
  },
  {
    id: 'seed_from_snow_lotus',
    machineType: 'seed_maker',
    name: '雪莲种子',
    inputItemId: 'snow_lotus',
    inputQuantity: 1,
    outputItemId: 'seed_snow_lotus',
    outputQuantity: 2,
    processingDays: 1,
    description: '从雪莲中提取种子。'
  },
  {
    id: 'seed_from_rapeseed',
    machineType: 'seed_maker',
    name: '油菜种子',
    inputItemId: 'rapeseed',
    inputQuantity: 1,
    outputItemId: 'seed_rapeseed',
    outputQuantity: 2,
    processingDays: 1,
    description: '从油菜中提取种子。'
  },
  {
    id: 'seed_from_broad_bean',
    machineType: 'seed_maker',
    name: '蚕豆种子',
    inputItemId: 'broad_bean',
    inputQuantity: 1,
    outputItemId: 'seed_broad_bean',
    outputQuantity: 2,
    processingDays: 1,
    description: '从蚕豆中提取种子。'
  },
  {
    id: 'seed_from_peach',
    machineType: 'seed_maker',
    name: '水蜜桃种子',
    inputItemId: 'peach',
    inputQuantity: 1,
    outputItemId: 'seed_peach',
    outputQuantity: 2,
    processingDays: 1,
    description: '从水蜜桃中提取种子。'
  },
  {
    id: 'seed_from_green_bean',
    machineType: 'seed_maker',
    name: '豆角种子',
    inputItemId: 'green_bean',
    inputQuantity: 1,
    outputItemId: 'seed_green_bean',
    outputQuantity: 2,
    processingDays: 1,
    description: '从豆角中提取种子。'
  },
  {
    id: 'seed_from_loofah',
    machineType: 'seed_maker',
    name: '丝瓜种子',
    inputItemId: 'loofah',
    inputQuantity: 1,
    outputItemId: 'seed_loofah',
    outputQuantity: 2,
    processingDays: 1,
    description: '从丝瓜中提取种子。'
  },
  {
    id: 'seed_from_eggplant',
    machineType: 'seed_maker',
    name: '茄子种子',
    inputItemId: 'eggplant',
    inputQuantity: 1,
    outputItemId: 'seed_eggplant',
    outputQuantity: 2,
    processingDays: 1,
    description: '从茄子中提取种子。'
  },
  {
    id: 'seed_from_chili',
    machineType: 'seed_maker',
    name: '辣椒种子',
    inputItemId: 'chili',
    inputQuantity: 1,
    outputItemId: 'seed_chili',
    outputQuantity: 2,
    processingDays: 1,
    description: '从辣椒中提取种子。'
  },
  {
    id: 'seed_from_lotus_seed',
    machineType: 'seed_maker',
    name: '莲子种子',
    inputItemId: 'lotus_seed',
    inputQuantity: 1,
    outputItemId: 'seed_lotus_seed',
    outputQuantity: 2,
    processingDays: 1,
    description: '从莲子中提取种子。'
  },
  {
    id: 'seed_from_corn',
    machineType: 'seed_maker',
    name: '玉米种子',
    inputItemId: 'corn',
    inputQuantity: 1,
    outputItemId: 'seed_corn',
    outputQuantity: 2,
    processingDays: 1,
    description: '从玉米中提取种子。'
  },
  {
    id: 'seed_from_yam',
    machineType: 'seed_maker',
    name: '山药种子',
    inputItemId: 'yam',
    inputQuantity: 1,
    outputItemId: 'seed_yam',
    outputQuantity: 2,
    processingDays: 1,
    description: '从山药中提取种子。'
  },
  {
    id: 'seed_from_peanut',
    machineType: 'seed_maker',
    name: '花生种子',
    inputItemId: 'peanut',
    inputQuantity: 1,
    outputItemId: 'seed_peanut',
    outputQuantity: 2,
    processingDays: 1,
    description: '从花生中提取种子。'
  },
  {
    id: 'seed_from_jujube',
    machineType: 'seed_maker',
    name: '红枣种子',
    inputItemId: 'jujube',
    inputQuantity: 1,
    outputItemId: 'seed_jujube',
    outputQuantity: 2,
    processingDays: 1,
    description: '从红枣中提取种子。'
  },
  {
    id: 'seed_from_ginger',
    machineType: 'seed_maker',
    name: '生姜种子',
    inputItemId: 'ginger',
    inputQuantity: 1,
    outputItemId: 'seed_ginger',
    outputQuantity: 2,
    processingDays: 1,
    description: '从生姜中提取种子。'
  },
  {
    id: 'seed_from_napa_cabbage',
    machineType: 'seed_maker',
    name: '白菜种子',
    inputItemId: 'napa_cabbage',
    inputQuantity: 1,
    outputItemId: 'seed_napa_cabbage',
    outputQuantity: 2,
    processingDays: 1,
    description: '从白菜中提取种子。'
  },
  {
    id: 'seed_from_spinach',
    machineType: 'seed_maker',
    name: '菠菜种子',
    inputItemId: 'spinach',
    inputQuantity: 1,
    outputItemId: 'seed_spinach',
    outputQuantity: 2,
    processingDays: 1,
    description: '从菠菜中提取种子。'
  },
  {
    id: 'seed_from_mustard_green',
    machineType: 'seed_maker',
    name: '芥菜种子',
    inputItemId: 'mustard_green',
    inputQuantity: 1,
    outputItemId: 'seed_mustard_green',
    outputQuantity: 2,
    processingDays: 1,
    description: '从芥菜中提取种子。'
  },
  {
    id: 'seed_from_chives',
    machineType: 'seed_maker',
    name: '韭菜种子',
    inputItemId: 'chives',
    inputQuantity: 1,
    outputItemId: 'seed_chives',
    outputQuantity: 2,
    processingDays: 1,
    description: '从韭菜中提取种子。'
  },
  // 结晶复制机
  {
    id: 'dup_quartz',
    machineType: 'crystal_duplicator',
    name: '复制石英',
    inputItemId: 'quartz',
    inputQuantity: 1,
    outputItemId: 'quartz',
    outputQuantity: 2,
    processingDays: 3,
    description: '缓慢复制一颗石英。'
  },
  {
    id: 'dup_jade',
    machineType: 'crystal_duplicator',
    name: '复制翡翠',
    inputItemId: 'jade',
    inputQuantity: 1,
    outputItemId: 'jade',
    outputQuantity: 2,
    processingDays: 4,
    description: '缓慢复制一颗翡翠。'
  },
  {
    id: 'dup_ruby',
    machineType: 'crystal_duplicator',
    name: '复制红宝石',
    inputItemId: 'ruby',
    inputQuantity: 1,
    outputItemId: 'ruby',
    outputQuantity: 2,
    processingDays: 5,
    description: '缓慢复制一颗红宝石。'
  },
  {
    id: 'dup_moonstone',
    machineType: 'crystal_duplicator',
    name: '复制月光石',
    inputItemId: 'moonstone',
    inputQuantity: 1,
    outputItemId: 'moonstone',
    outputQuantity: 2,
    processingDays: 5,
    description: '缓慢复制一颗月光石。'
  },
  {
    id: 'dup_obsidian',
    machineType: 'crystal_duplicator',
    name: '复制黑曜石',
    inputItemId: 'obsidian',
    inputQuantity: 1,
    outputItemId: 'obsidian',
    outputQuantity: 2,
    processingDays: 4,
    description: '缓慢复制一颗黑曜石。'
  },
  {
    id: 'dup_dragon_jade',
    machineType: 'crystal_duplicator',
    name: '复制龙玉',
    inputItemId: 'dragon_jade',
    inputQuantity: 1,
    outputItemId: 'dragon_jade',
    outputQuantity: 2,
    processingDays: 7,
    description: '缓慢复制一颗龙玉。'
  },
  // 烟熏机
  {
    id: 'smoke_crucian',
    machineType: 'smoker',
    name: '烟熏鲫鱼',
    inputItemId: 'crucian',
    inputQuantity: 1,
    outputItemId: 'smoked_crucian',
    outputQuantity: 1,
    processingDays: 1,
    description: '将鲫鱼烟熏处理。'
  },
  {
    id: 'smoke_carp',
    machineType: 'smoker',
    name: '烟熏鲤鱼',
    inputItemId: 'carp',
    inputQuantity: 1,
    outputItemId: 'smoked_carp',
    outputQuantity: 1,
    processingDays: 1,
    description: '将鲤鱼烟熏处理。'
  },
  {
    id: 'smoke_grass_carp',
    machineType: 'smoker',
    name: '烟熏草鱼',
    inputItemId: 'grass_carp',
    inputQuantity: 1,
    outputItemId: 'smoked_grass_carp',
    outputQuantity: 1,
    processingDays: 1,
    description: '将草鱼烟熏处理。'
  },
  {
    id: 'smoke_bass',
    machineType: 'smoker',
    name: '烟熏鲈鱼',
    inputItemId: 'bass',
    inputQuantity: 1,
    outputItemId: 'smoked_bass',
    outputQuantity: 1,
    processingDays: 1,
    description: '将鲈鱼烟熏处理。'
  },
  {
    id: 'smoke_catfish',
    machineType: 'smoker',
    name: '烟熏鲶鱼',
    inputItemId: 'catfish',
    inputQuantity: 1,
    outputItemId: 'smoked_catfish',
    outputQuantity: 1,
    processingDays: 1,
    description: '将鲶鱼烟熏处理。'
  },
  {
    id: 'smoke_mandarin_fish',
    machineType: 'smoker',
    name: '烟熏桂花鱼',
    inputItemId: 'mandarin_fish',
    inputQuantity: 1,
    outputItemId: 'smoked_mandarin_fish',
    outputQuantity: 1,
    processingDays: 1,
    description: '将桂花鱼烟熏处理。'
  },
  {
    id: 'smoke_eel',
    machineType: 'smoker',
    name: '烟熏鳗鱼',
    inputItemId: 'eel',
    inputQuantity: 1,
    outputItemId: 'smoked_eel',
    outputQuantity: 1,
    processingDays: 1,
    description: '将鳗鱼烟熏处理。'
  },
  {
    id: 'smoke_sturgeon',
    machineType: 'smoker',
    name: '烟熏鲟鱼',
    inputItemId: 'sturgeon',
    inputQuantity: 1,
    outputItemId: 'smoked_sturgeon',
    outputQuantity: 1,
    processingDays: 1,
    description: '将鲟鱼烟熏处理。'
  },
  {
    id: 'smoke_loach',
    machineType: 'smoker',
    name: '烟熏泥鳅',
    inputItemId: 'loach',
    inputQuantity: 1,
    outputItemId: 'smoked_loach',
    outputQuantity: 1,
    processingDays: 1,
    description: '将泥鳅烟熏处理。'
  },
  {
    id: 'smoke_yellow_eel',
    machineType: 'smoker',
    name: '烟熏黄鳝',
    inputItemId: 'yellow_eel',
    inputQuantity: 1,
    outputItemId: 'smoked_yellow_eel',
    outputQuantity: 1,
    processingDays: 1,
    description: '将黄鳝烟熏处理。'
  },
  // 脱水机
  {
    id: 'dry_mushroom',
    machineType: 'dehydrator',
    name: '干蘑菇',
    inputItemId: 'wild_mushroom',
    inputQuantity: 3,
    outputItemId: 'dried_mushroom',
    outputQuantity: 1,
    processingDays: 1,
    description: '将野蘑菇脱水制成干蘑菇。'
  },
  {
    id: 'dry_peach',
    machineType: 'dehydrator',
    name: '桃干',
    inputItemId: 'tree_peach',
    inputQuantity: 1,
    outputItemId: 'dried_peach',
    outputQuantity: 1,
    processingDays: 1,
    description: '将鲜桃脱水制成桃干。'
  },
  {
    id: 'dry_lychee',
    machineType: 'dehydrator',
    name: '荔枝干',
    inputItemId: 'lychee',
    inputQuantity: 1,
    outputItemId: 'dried_lychee',
    outputQuantity: 1,
    processingDays: 1,
    description: '将荔枝脱水制成荔枝干。'
  },
  {
    id: 'dry_persimmon',
    machineType: 'dehydrator',
    name: '柿饼',
    inputItemId: 'persimmon',
    inputQuantity: 1,
    outputItemId: 'dried_persimmon_slice',
    outputQuantity: 1,
    processingDays: 1,
    description: '将柿子脱水制成柿饼。'
  },
  {
    id: 'dry_hawthorn',
    machineType: 'dehydrator',
    name: '山楂片',
    inputItemId: 'hawthorn',
    inputQuantity: 1,
    outputItemId: 'dried_hawthorn',
    outputQuantity: 1,
    processingDays: 1,
    description: '将山楂脱水制成山楂片。'
  },
  {
    id: 'dry_apricot',
    machineType: 'dehydrator',
    name: '杏脯',
    inputItemId: 'apricot',
    inputQuantity: 1,
    outputItemId: 'dried_apricot',
    outputQuantity: 1,
    processingDays: 1,
    description: '将杏子脱水制成杏脯。'
  },
  {
    id: 'dry_wild_berry',
    machineType: 'dehydrator',
    name: '果脯',
    inputItemId: 'wild_berry',
    inputQuantity: 3,
    outputItemId: 'dried_berry',
    outputQuantity: 1,
    processingDays: 1,
    description: '将野果脱水制成果脯。'
  },
  // 回收机
  {
    id: 'recycle_firewood',
    machineType: 'recycler',
    name: '回收柴火',
    inputItemId: 'trash',
    inputQuantity: 3,
    outputItemId: 'firewood',
    outputQuantity: 5,
    processingDays: 1,
    description: '将垃圾回收转化为柴火。'
  },
  {
    id: 'recycle_copper',
    machineType: 'recycler',
    name: '回收铜矿',
    inputItemId: 'trash',
    inputQuantity: 5,
    outputItemId: 'copper_ore',
    outputQuantity: 3,
    processingDays: 1,
    description: '将垃圾回收提炼出铜矿。'
  },
  {
    id: 'recycle_iron',
    machineType: 'recycler',
    name: '回收铁矿',
    inputItemId: 'trash',
    inputQuantity: 5,
    outputItemId: 'iron_ore',
    outputQuantity: 2,
    processingDays: 1,
    description: '将垃圾回收提炼出铁矿。'
  },
  {
    id: 'recycle_quartz',
    machineType: 'recycler',
    name: '回收石英',
    inputItemId: 'trash',
    inputQuantity: 8,
    outputItemId: 'quartz',
    outputQuantity: 1,
    processingDays: 2,
    description: '将垃圾回收提炼出石英。'
  },
  {
    id: 'recycle_driftwood',
    machineType: 'recycler',
    name: '浮木回收',
    inputItemId: 'driftwood',
    inputQuantity: 5,
    outputItemId: 'wood',
    outputQuantity: 10,
    processingDays: 1,
    description: '将浮木处理为可用木材。'
  },
  {
    id: 'recycle_cd',
    machineType: 'recycler',
    name: '碟片提炼',
    inputItemId: 'broken_cd',
    inputQuantity: 3,
    outputItemId: 'copper_ore',
    outputQuantity: 3,
    processingDays: 1,
    description: '从碎碟片中提炼金属。'
  },
  {
    id: 'recycle_newspaper',
    machineType: 'recycler',
    name: '报纸回收',
    inputItemId: 'soggy_newspaper',
    inputQuantity: 5,
    outputItemId: 'firewood',
    outputQuantity: 3,
    processingDays: 1,
    description: '将湿报纸晒干用作燃料。'
  },
  // 乳酪机
  {
    id: 'cheese_milk',
    machineType: 'cheese_press',
    name: '奶酪',
    inputItemId: 'milk',
    inputQuantity: 1,
    outputItemId: 'cheese',
    outputQuantity: 1,
    processingDays: 2,
    description: '用牛奶制成的醇厚奶酪。'
  },
  {
    id: 'cheese_goat',
    machineType: 'cheese_press',
    name: '山羊奶酪',
    inputItemId: 'goat_milk',
    inputQuantity: 1,
    outputItemId: 'goat_cheese',
    outputQuantity: 1,
    processingDays: 2,
    description: '用山羊奶制成的风味奶酪。'
  },
  {
    id: 'cheese_buffalo',
    machineType: 'cheese_press',
    name: '水牛奶酪',
    inputItemId: 'buffalo_milk',
    inputQuantity: 1,
    outputItemId: 'buffalo_cheese',
    outputQuantity: 1,
    processingDays: 2,
    description: '用水牛奶制成的浓郁奶酪。'
  },
  {
    id: 'cheese_yak',
    machineType: 'cheese_press',
    name: '牦牛奶酪',
    inputItemId: 'yak_milk',
    inputQuantity: 1,
    outputItemId: 'yak_cheese',
    outputQuantity: 1,
    processingDays: 2,
    description: '用牦牛奶制成的高原奶酪。'
  },
  // 织布机
  {
    id: 'weave_wool',
    machineType: 'loom',
    name: '布匹',
    inputItemId: 'wool',
    inputQuantity: 1,
    outputItemId: 'cloth',
    outputQuantity: 1,
    processingDays: 2,
    description: '将羊毛纺织成布匹。'
  },
  {
    id: 'weave_silk',
    machineType: 'loom',
    name: '丝绸',
    inputItemId: 'silk',
    inputQuantity: 1,
    outputItemId: 'silk_cloth',
    outputQuantity: 1,
    processingDays: 2,
    description: '将蚕丝织成华美丝绸。'
  },
  {
    id: 'weave_alpaca',
    machineType: 'loom',
    name: '羊驼绒',
    inputItemId: 'alpaca_wool',
    inputQuantity: 1,
    outputItemId: 'alpaca_cloth',
    outputQuantity: 1,
    processingDays: 2,
    description: '将羊驼毛织成柔软绒布。'
  },
  {
    id: 'weave_rabbit',
    machineType: 'loom',
    name: '毛毡',
    inputItemId: 'rabbit_fur',
    inputQuantity: 1,
    outputItemId: 'felt',
    outputQuantity: 1,
    processingDays: 2,
    description: '将兔毛压制成毛毡。'
  },
  // 熔炉
  {
    id: 'smelt_copper',
    machineType: 'furnace',
    name: '铜锭',
    inputItemId: 'copper_ore',
    inputQuantity: 1,
    maxInputQuantity: 5,
    outputItemId: 'copper_bar',
    outputQuantity: 1,
    processingDays: 1,
    description: '将铜矿冶炼成铜锭，每次最多投入5个。'
  },
  {
    id: 'smelt_iron',
    machineType: 'furnace',
    name: '铁锭',
    inputItemId: 'iron_ore',
    inputQuantity: 1,
    maxInputQuantity: 5,
    outputItemId: 'iron_bar',
    outputQuantity: 1,
    processingDays: 1,
    description: '将铁矿冶炼成铁锭，每次最多投入5个。'
  },
  {
    id: 'smelt_gold',
    machineType: 'furnace',
    name: '金锭',
    inputItemId: 'gold_ore',
    inputQuantity: 1,
    maxInputQuantity: 5,
    outputItemId: 'gold_bar',
    outputQuantity: 1,
    processingDays: 1,
    description: '将金矿冶炼成金锭，每次最多投入5个。'
  },
  {
    id: 'smelt_iridium',
    machineType: 'furnace',
    name: '铱锭',
    inputItemId: 'iridium_ore',
    inputQuantity: 1,
    maxInputQuantity: 5,
    outputItemId: 'iridium_bar',
    outputQuantity: 1,
    processingDays: 2,
    description: '将铱矿冶炼成铱锭，每次最多投入5个。'
  },
  // 炭窑
  {
    id: 'burn_wood',
    machineType: 'charcoal_kiln',
    name: '木炭（木材）',
    inputItemId: 'wood',
    inputQuantity: 10,
    outputItemId: 'charcoal',
    outputQuantity: 1,
    processingDays: 1,
    description: '将木材烧制成木炭。'
  },
  {
    id: 'burn_bamboo',
    machineType: 'charcoal_kiln',
    name: '木炭（竹子）',
    inputItemId: 'bamboo',
    inputQuantity: 5,
    outputItemId: 'charcoal',
    outputQuantity: 1,
    processingDays: 1,
    description: '将竹子烧制成木炭。'
  },
  // 石磨
  {
    id: 'mill_rice',
    machineType: 'mill',
    name: '米粉',
    inputItemId: 'rice',
    inputQuantity: 2,
    outputItemId: 'rice_flour',
    outputQuantity: 1,
    processingDays: 1,
    description: '将稻米磨成米粉。'
  },
  {
    id: 'mill_wheat',
    machineType: 'mill',
    name: '面粉',
    inputItemId: 'winter_wheat',
    inputQuantity: 2,
    outputItemId: 'wheat_flour',
    outputQuantity: 1,
    processingDays: 1,
    description: '将冬小麦磨成面粉。'
  },
  {
    id: 'mill_corn',
    machineType: 'mill',
    name: '玉米粉',
    inputItemId: 'corn',
    inputQuantity: 2,
    outputItemId: 'cornmeal',
    outputQuantity: 1,
    processingDays: 1,
    description: '将玉米磨成玉米粉。'
  },
  // 蚯蚓箱
  {
    id: 'worm_bait',
    machineType: 'worm_bin',
    name: '蚯蚓鱼饵',
    inputItemId: null,
    inputQuantity: 0,
    outputItemId: 'standard_bait',
    outputQuantity: 3,
    processingDays: 2,
    description: '蚯蚓箱自动产出鱼饵。'
  },
  // 制茶机
  {
    id: 'brew_green_tea',
    machineType: 'tea_maker',
    name: '绿茶',
    inputItemId: 'tea',
    inputQuantity: 2,
    outputItemId: 'green_tea_drink',
    outputQuantity: 1,
    processingDays: 1,
    description: '用茶叶泡制的清香绿茶。'
  },
  {
    id: 'brew_chrysanthemum',
    machineType: 'tea_maker',
    name: '菊花茶',
    inputItemId: 'chrysanthemum',
    inputQuantity: 2,
    outputItemId: 'chrysanthemum_tea',
    outputQuantity: 1,
    processingDays: 1,
    description: '清热明目的菊花茶。'
  },
  {
    id: 'brew_osmanthus',
    machineType: 'tea_maker',
    name: '桂花茶',
    inputItemId: 'osmanthus',
    inputQuantity: 2,
    outputItemId: 'osmanthus_tea',
    outputQuantity: 1,
    processingDays: 1,
    description: '馥郁芬芳的桂花茶。'
  },
  {
    id: 'brew_ginseng',
    machineType: 'tea_maker',
    name: '人参茶',
    inputItemId: 'ginseng',
    inputQuantity: 1,
    outputItemId: 'ginseng_tea',
    outputQuantity: 1,
    processingDays: 1,
    description: '滋补强身的人参茶。'
  },
  // 豆腐坊
  {
    id: 'press_tofu',
    machineType: 'tofu_press',
    name: '豆腐',
    inputItemId: 'broad_bean',
    inputQuantity: 3,
    outputItemId: 'tofu',
    outputQuantity: 1,
    processingDays: 1,
    description: '用蚕豆磨制的鲜嫩豆腐。'
  },
  {
    id: 'press_peanut_tofu',
    machineType: 'tofu_press',
    name: '花生豆腐',
    inputItemId: 'peanut',
    inputQuantity: 3,
    outputItemId: 'peanut_tofu',
    outputQuantity: 1,
    processingDays: 1,
    description: '用花生磨制的香浓豆腐。'
  },
  {
    id: 'press_sesame_paste',
    machineType: 'tofu_press',
    name: '芝麻酱',
    inputItemId: 'sesame',
    inputQuantity: 2,
    outputItemId: 'sesame_paste',
    outputQuantity: 1,
    processingDays: 1,
    description: '用芝麻磨制的浓香芝麻酱。'
  },
  // 药碾
  {
    id: 'grind_herb',
    machineType: 'herb_grinder',
    name: '草药膏',
    inputItemId: 'herb',
    inputQuantity: 3,
    outputItemId: 'herbal_paste',
    outputQuantity: 1,
    processingDays: 2,
    description: '将草药研磨成药膏。'
  },
  {
    id: 'grind_ginseng',
    machineType: 'herb_grinder',
    name: '人参精',
    inputItemId: 'ginseng',
    inputQuantity: 1,
    outputItemId: 'ginseng_extract',
    outputQuantity: 1,
    processingDays: 2,
    description: '将人参浓缩成精华。'
  },
  {
    id: 'grind_antler',
    machineType: 'herb_grinder',
    name: '鹿茸粉',
    inputItemId: 'antler_velvet',
    inputQuantity: 1,
    outputItemId: 'antler_powder',
    outputQuantity: 1,
    processingDays: 2,
    description: '将鹿茸研磨成粉。'
  },
  {
    id: 'grind_animal_medicine',
    machineType: 'herb_grinder',
    name: '兽药',
    inputItemId: 'herb',
    inputQuantity: 2,
    outputItemId: 'animal_medicine',
    outputQuantity: 1,
    processingDays: 1,
    description: '将草药研磨成治疗牲畜的药物。'
  },
  // 特殊饲料
  {
    id: 'mill_premium_feed',
    machineType: 'mill',
    name: '精饲料',
    inputItemId: 'corn',
    inputQuantity: 3,
    outputItemId: 'premium_feed',
    outputQuantity: 2,
    processingDays: 1,
    description: '将玉米配制成精饲料。'
  },
  {
    id: 'mill_nourishing_feed',
    machineType: 'mill',
    name: '滋补饲料',
    inputItemId: 'rice',
    inputQuantity: 3,
    outputItemId: 'nourishing_feed',
    outputQuantity: 2,
    processingDays: 1,
    description: '将稻米配制成滋补饲料。'
  },
  {
    id: 'grind_vitality_feed',
    machineType: 'herb_grinder',
    name: '活力饲料',
    inputItemId: 'herb',
    inputQuantity: 3,
    outputItemId: 'vitality_feed',
    outputQuantity: 1,
    processingDays: 2,
    description: '将草药研磨成活力饲料。'
  },
  // 竹林野兽材料加工
  {
    id: 'grind_bear_gall',
    machineType: 'herb_grinder',
    name: '熊胆丸',
    inputItemId: 'bear_gall',
    inputQuantity: 1,
    outputItemId: 'bear_gall_pill',
    outputQuantity: 2,
    processingDays: 2,
    description: '将熊胆研磨制成苦寒丸药。'
  },
  {
    id: 'grind_tiger_bone',
    machineType: 'herb_grinder',
    name: '虎骨酒',
    inputItemId: 'tiger_bone',
    inputQuantity: 1,
    outputItemId: 'tiger_bone_tonic',
    outputQuantity: 1,
    processingDays: 3,
    description: '将虎骨浸泡酿制成药酒。'
  },
  // 制香坊
  {
    id: 'incense_pine',
    machineType: 'incense_maker',
    name: '松香',
    inputItemId: 'pine_resin',
    inputQuantity: 2,
    outputItemId: 'pine_incense',
    outputQuantity: 1,
    processingDays: 2,
    description: '将松脂炼制成松香。'
  },
  {
    id: 'incense_camphor',
    machineType: 'incense_maker',
    name: '樟脑香',
    inputItemId: 'camphor_oil',
    inputQuantity: 2,
    outputItemId: 'camphor_incense',
    outputQuantity: 1,
    processingDays: 2,
    description: '将樟脑油炼制成樟脑香。'
  },
  {
    id: 'incense_osmanthus',
    machineType: 'incense_maker',
    name: '桂花香',
    inputItemId: 'osmanthus',
    inputQuantity: 2,
    outputItemId: 'osmanthus_incense',
    outputQuantity: 1,
    processingDays: 2,
    description: '将桂花制成桂花香。'
  },
  // 瀚海加工配方
  {
    id: 'press_spice_oil',
    machineType: 'oil_press',
    name: '香料油',
    inputItemId: 'hanhai_spice',
    inputQuantity: 2,
    outputItemId: 'spice_oil',
    outputQuantity: 1,
    processingDays: 2,
    description: '将西域香料榨成浓郁的异域风味油脂。'
  },
  {
    id: 'jar_cactus_jam',
    machineType: 'sauce_jar',
    name: '仙人掌果酱',
    inputItemId: 'hanhai_cactus',
    inputQuantity: 2,
    outputItemId: 'cactus_jam',
    outputQuantity: 1,
    processingDays: 2,
    description: '将仙人掌制成酸甜可口的沙漠果酱。'
  },
  {
    id: 'brew_cactus_wine',
    machineType: 'wine_workshop',
    name: '仙人掌酒',
    inputItemId: 'hanhai_cactus',
    inputQuantity: 3,
    maxInputQuantity: 3,
    outputItemId: 'cactus_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '将仙人掌酿成西域特色佳酿。'
  },
  {
    id: 'brew_date_wine',
    machineType: 'wine_workshop',
    name: '椰枣酒',
    inputItemId: 'hanhai_date',
    inputQuantity: 3,
    maxInputQuantity: 3,
    outputItemId: 'date_wine',
    outputQuantity: 1,
    processingDays: 3,
    description: '将椰枣酿成甘醇滋补的枣酿。'
  },
  {
    id: 'crystal_turquoise',
    machineType: 'crystal_duplicator',
    name: '绿松石饰品',
    inputItemId: 'hanhai_turquoise',
    inputQuantity: 2,
    outputItemId: 'turquoise_accessory',
    outputQuantity: 1,
    processingDays: 3,
    description: '将绿松石打磨成精致的首饰。'
  },
  {
    id: 'weave_brocade',
    machineType: 'loom',
    name: '锦缎',
    inputItemId: 'hanhai_silk',
    inputQuantity: 1,
    outputItemId: 'brocade',
    outputQuantity: 1,
    processingDays: 2,
    description: '将丝绸织成上等华丽的锦缎。'
  },
  {
    id: 'brew_spice_tea',
    machineType: 'tea_maker',
    name: '香料茶',
    inputItemId: 'hanhai_spice',
    inputQuantity: 2,
    outputItemId: 'spice_tea',
    outputQuantity: 1,
    processingDays: 2,
    description: '将西域香料冲泡成异域风味的香茶。'
  }
]

/** 洒水器定义 */
export const SPRINKLERS: SprinklerDef[] = [
  {
    id: 'bamboo_sprinkler',
    name: '竹筒洒水器',
    description: '自动灌溉上下左右4块地。',
    range: 4,
    craftCost: [
      { itemId: 'bamboo', quantity: 10 },
      { itemId: 'copper_ore', quantity: 3 }
    ],
    craftMoney: 100
  },
  {
    id: 'copper_sprinkler',
    name: '铜管洒水器',
    description: '自动灌溉周围8块地。',
    range: 8,
    craftCost: [
      { itemId: 'copper_bar', quantity: 3 },
      { itemId: 'iron_bar', quantity: 1 }
    ],
    craftMoney: 500
  },
  {
    id: 'gold_sprinkler',
    name: '金管洒水器',
    description: '自动灌溉周围5×5共24块地。',
    range: 24,
    craftCost: [
      { itemId: 'gold_bar', quantity: 2 },
      { itemId: 'iron_bar', quantity: 2 },
      { itemId: 'quartz', quantity: 1 }
    ],
    craftMoney: 1500
  }
]

/** 肥料定义 */
export const FERTILIZERS: FertilizerDef[] = [
  {
    id: 'basic_fertilizer',
    name: '基础肥料',
    description: '提升作物品质概率+20%。',
    qualityBonus: 0.2,
    craftCost: [
      { itemId: 'wood', quantity: 5 },
      { itemId: 'herb', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: 25
  },
  {
    id: 'quality_fertilizer',
    name: '优质肥料',
    description: '提升作物品质概率+40%。',
    qualityBonus: 0.4,
    craftCost: [
      { itemId: 'herb', quantity: 3 },
      { itemId: 'quartz', quantity: 1 }
    ],
    craftMoney: 0,
    shopPrice: 75
  },
  {
    id: 'speed_gro',
    name: '生长激素',
    description: '加速作物生长25%。',
    growthSpeedup: 0.25,
    craftCost: [
      { itemId: 'pine_cone', quantity: 3 },
      { itemId: 'herb', quantity: 1 }
    ],
    craftMoney: 0,
    shopPrice: 50
  },
  {
    id: 'deluxe_speed_gro',
    name: '高级激素',
    description: '加速作物生长33%。',
    growthSpeedup: 0.33,
    craftCost: [
      { itemId: 'quartz', quantity: 1 },
      { itemId: 'firewood', quantity: 3 }
    ],
    craftMoney: 0,
    shopPrice: 100
  },
  {
    id: 'retaining_soil',
    name: '保湿土',
    description: '50%概率隔夜保持浇水状态。',
    retainChance: 0.5,
    craftCost: [
      { itemId: 'wood', quantity: 3 },
      { itemId: 'firewood', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: 30
  },
  {
    id: 'quality_retaining_soil',
    name: '优质保湿土',
    description: '100%隔夜保持浇水状态。',
    retainChance: 1.0,
    craftCost: [
      { itemId: 'quartz', quantity: 1 },
      { itemId: 'wood', quantity: 5 }
    ],
    craftMoney: 0,
    shopPrice: 80
  }
]

/** 鱼饵定义 */
export const BAITS: BaitDef[] = [
  {
    id: 'standard_bait',
    name: '普通鱼饵',
    description: '使鱼更安静，降低猛冲概率。',
    behaviorModifier: { calm: 0.1, struggle: 0, dash: -0.1 },
    craftCost: [{ itemId: 'herb', quantity: 2 }],
    craftMoney: 0,
    shopPrice: 5
  },
  {
    id: 'wild_bait',
    name: '野生鱼饵',
    description: '25%概率获得双倍鱼获。',
    doubleCatchChance: 0.25,
    craftCost: [
      { itemId: 'herb', quantity: 3 },
      { itemId: 'wild_berry', quantity: 1 },
      { itemId: 'firewood', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: null
  },
  {
    id: 'magic_bait',
    name: '魔法鱼饵',
    description: '无视季节限制，可钓到所有鱼。',
    ignoresSeason: true,
    craftCost: [
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'gold_ore', quantity: 1 }
    ],
    craftMoney: 0,
    shopPrice: null
  },
  {
    id: 'deluxe_bait',
    name: '精致鱼饵',
    description: '鱼更安静，挣扎成功率+5%。',
    behaviorModifier: { calm: 0.15, struggle: 0, dash: -0.1 },
    struggleBonus: 0.05,
    craftCost: [
      { itemId: 'herb', quantity: 3 },
      { itemId: 'ginseng', quantity: 1 }
    ],
    craftMoney: 0,
    shopPrice: null
  },
  {
    id: 'targeted_bait',
    name: '定向鱼饵',
    description: '困难鱼权重×2，传说鱼权重×1.5。',
    hardWeightMult: 2,
    legendaryWeightMult: 1.5,
    craftCost: [
      { itemId: 'magic_bait', quantity: 1 },
      { itemId: 'gold_ore', quantity: 1 }
    ],
    craftMoney: 0,
    shopPrice: null
  }
]

/** 浮漂定义 */
export const TACKLES: TackleDef[] = [
  {
    id: 'spinner',
    name: '旋转浮漂',
    description: '减少50%钓鱼体力消耗。',
    maxDurability: 20,
    requiredRodTier: 'iron',
    staminaReduction: 0.5,
    craftCost: [
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'bamboo', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: 250
  },
  {
    id: 'trap_bobber',
    name: '陷阱浮漂',
    description: '断线时获得1次额外机会。',
    maxDurability: 20,
    requiredRodTier: 'iron',
    extraBreakChance: 1,
    craftCost: [
      { itemId: 'copper_ore', quantity: 5 },
      { itemId: 'wood', quantity: 5 }
    ],
    craftMoney: 0,
    shopPrice: 200
  },
  {
    id: 'cork_bobber',
    name: '软木浮漂',
    description: '挣扎时成功率+25%。',
    maxDurability: 20,
    requiredRodTier: 'iron',
    struggleBonus: 0.25,
    craftCost: [
      { itemId: 'wood', quantity: 10 },
      { itemId: 'iron_ore', quantity: 2 }
    ],
    craftMoney: 0,
    shopPrice: 250
  },
  {
    id: 'quality_bobber',
    name: '品质浮漂',
    description: '钓到的鱼品质+1档。',
    maxDurability: 20,
    requiredRodTier: 'iron',
    qualityBoost: 1,
    craftCost: [
      { itemId: 'gold_ore', quantity: 2 },
      { itemId: 'copper_ore', quantity: 3 }
    ],
    craftMoney: 0,
    shopPrice: 500
  },
  {
    id: 'lead_bobber',
    name: '铅坠浮漂',
    description: '减少鱼猛冲和翻腾概率各10%。',
    maxDurability: 20,
    requiredRodTier: 'iron',
    dangerReduction: 0.1,
    craftCost: [
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'wood', quantity: 3 }
    ],
    craftMoney: 0,
    shopPrice: 200
  }
]

export const getMachineById = (id: string): ProcessingMachineDef | undefined => {
  return PROCESSING_MACHINES.find(m => m.id === id)
}

export const getProcessingRecipeById = (id: string): ProcessingRecipeDef | undefined => {
  return PROCESSING_RECIPES.find(r => r.id === id)
}

/** 配方单次最多投入数 */
export const getRecipeMaxInput = (recipe: ProcessingRecipeDef): number => recipe.maxInputQuantity ?? recipe.inputQuantity

/** 配方单次最少投入数（批量配方为最少批次数 1） */
export const getRecipeMinInput = (recipe: ProcessingRecipeDef): number =>
  recipe.maxInputQuantity ? 1 : recipe.inputQuantity

/** 批量配方实际消耗原料数 */
export const getMaterialInputQuantity = (recipe: ProcessingRecipeDef, batchCount: number): number =>
  recipe.maxInputQuantity && recipe.machineType !== 'furnace'
    ? batchCount * recipe.inputQuantity
    : batchCount

/** 根据实际投入数计算产出数量 */
export const getOutputQuantityForInput = (recipe: ProcessingRecipeDef, inputAmount: number): number => {
  if (recipe.maxInputQuantity) return inputAmount * recipe.outputQuantity
  return recipe.outputQuantity
}

/** 槽位实际投入数（旧存档熔炉加工中缺省为5） */
export const getSlotInputAmount = (recipe: ProcessingRecipeDef, slot: { inputAmount?: number }): number => {
  if (slot.inputAmount !== undefined) return slot.inputAmount
  if (recipe.maxInputQuantity && recipe.machineType === 'furnace') return 5
  if (recipe.maxInputQuantity && recipe.machineType === 'wine_workshop') return 1
  return recipe.inputQuantity
}

export const getRecipesForMachine = (machineType: string): ProcessingRecipeDef[] => {
  return PROCESSING_RECIPES.filter(r => r.machineType === machineType)
}

export const getSprinklerById = (id: string): SprinklerDef | undefined => {
  return SPRINKLERS.find(s => s.id === id)
}

export const getFertilizerById = (id: string): FertilizerDef | undefined => {
  return FERTILIZERS.find(f => f.id === id)
}

export const getBaitById = (id: string): BaitDef | undefined => {
  return BAITS.find(b => b.id === id)
}

export const getTackleById = (id: string): TackleDef | undefined => {
  return TACKLES.find(t => t.id === id)
}

/** 采脂器制造定义 */
export const TAPPER = {
  id: 'tapper',
  name: '采脂器',
  description: '安装到成熟野树上，定期产出树脂。',
  craftCost: [
    { itemId: 'copper_ore', quantity: 5 },
    { itemId: 'wood', quantity: 10 }
  ],
  craftMoney: 200
}

/** 蟹笼制造定义 */
export const CRAB_POT_CRAFT = {
  id: 'crab_pot',
  name: '蟹笼',
  description: '放置在钓鱼地点，每日自动捕获水产（需鱼饵）。',
  craftCost: [
    { itemId: 'wood', quantity: 15 },
    { itemId: 'iron_bar', quantity: 2 }
  ],
  craftMoney: 500
}

/** 避雷针制造定义 */
export const LIGHTNING_ROD = {
  id: 'lightning_rod',
  name: '避雷针',
  description: '放置在农场，雷暴时吸收闪电保护作物，产出电池组。',
  craftCost: [
    { itemId: 'iron_ore', quantity: 5 },
    { itemId: 'copper_ore', quantity: 3 },
    { itemId: 'quartz', quantity: 1 }
  ],
  craftMoney: 300
}

/** 稻草人制造定义 */
export const SCARECROW = {
  id: 'scarecrow',
  name: '稻草人',
  description: '放置在农场，驱赶偷吃作物的乌鸦。',
  craftCost: [
    { itemId: 'wood', quantity: 20 },
    { itemId: 'bamboo', quantity: 5 },
    { itemId: 'firewood', quantity: 5 }
  ],
  craftMoney: 150
}

export const AUTO_PETTER = {
  id: 'auto_petter',
  name: '自动抚摸机',
  description: '安装到畜舍后，每天自动抚摸所有动物。需要大型畜舍（2级）。',
  craftCost: [
    { itemId: 'gold_bar', quantity: 10 },
    { itemId: 'iron_bar', quantity: 20 },
    { itemId: 'copper_bar', quantity: 20 }
  ],
  craftMoney: 5000
}

/** 炸弹定义 */
export const BOMBS: BombDef[] = [
  {
    id: 'cherry_bomb',
    name: '爆竹',
    description: '小范围爆破，一次获取3份矿石。',
    oreMultiplier: 3,
    clearsMonster: false,
    craftCost: [
      { itemId: 'copper_ore', quantity: 12 },
      { itemId: 'firewood', quantity: 15 }
    ],
    craftMoney: 100,
    shopPrice: null
  },
  {
    id: 'bomb',
    name: '火药包',
    description: '大范围爆破，获取5份矿石并清除怪物。',
    oreMultiplier: 5,
    clearsMonster: true,
    craftCost: [
      { itemId: 'iron_ore', quantity: 12 },
      { itemId: 'firewood', quantity: 18 },
      { itemId: 'quartz', quantity: 5 }
    ],
    craftMoney: 250,
    shopPrice: null
  },
  {
    id: 'mega_bomb',
    name: '雷火弹',
    description: '超大范围爆破，获取8份矿石并清除怪物。',
    oreMultiplier: 8,
    clearsMonster: true,
    craftCost: [
      { itemId: 'gold_ore', quantity: 18 },
      { itemId: 'iron_ore', quantity: 15 },
      { itemId: 'firewood', quantity: 25 },
      { itemId: 'ruby', quantity: 3 }
    ],
    craftMoney: 500,
    shopPrice: null
  }
]

export const getBombById = (id: string): BombDef | undefined => {
  return BOMBS.find(b => b.id === id)
}
