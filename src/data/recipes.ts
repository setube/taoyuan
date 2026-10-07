import type { RecipeDef } from '@/types'

/** 所有食谱定义 */
export const RECIPES: RecipeDef[] = [
  {
    id: 'stir_fried_cabbage',
    name: '炒青菜',
    ingredients: [{ itemId: 'cabbage', quantity: 2 }],
    effect: { staminaRestore: 15, healthRestore: 5 },
    unlockSource: '初始自带',
    description: '简单朴素的家常菜。'
  },
  {
    id: 'radish_soup',
    name: '萝卜汤',
    ingredients: [
      { itemId: 'radish', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 10 },
    unlockSource: '陈伯好感「相识」',
    description: '热腾腾的萝卜汤，暖身又暖心。'
  },
  {
    id: 'braised_carp',
    name: '红烧鲤鱼',
    ingredients: [
      { itemId: 'carp', quantity: 1 },
      { itemId: 'sesame', quantity: 2 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 15,
      buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' }
    },
    unlockSource: '秋月好感「相识」',
    description: '鲜香可口的红烧鲤鱼。'
  },
  {
    id: 'herbal_porridge',
    name: '药膳粥',
    ingredients: [
      { itemId: 'herb', quantity: 2 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 40, healthRestore: 20 },
    unlockSource: '林老好感「相识」',
    description: '调理身体的药膳粥。'
  },
  {
    id: 'osmanthus_cake',
    name: '桂花糕',
    ingredients: [
      { itemId: 'osmanthus', quantity: 3 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 20,
      healthRestore: 5,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '柳娘好感「相识」',
    description: '精致的桂花糕，送礼极佳。'
  },
  {
    id: 'miner_lunch',
    name: '矿工便当',
    ingredients: [
      { itemId: 'potato', quantity: 2 },
      { itemId: 'sweet_potato', quantity: 1 }
    ],
    effect: {
      staminaRestore: 25,
      healthRestore: 25,
      buff: {
        type: 'mining',
        value: 20,
        description: '挖矿体力消耗-20%（当天）'
      }
    },
    unlockSource: '阿石好感「相识」',
    description: '实打实的矿工饭。'
  },
  {
    id: 'spicy_hotpot',
    name: '麻辣火锅',
    ingredients: [
      { itemId: 'chili', quantity: 2 },
      { itemId: 'cabbage', quantity: 1 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 40,
      buff: { type: 'defense', value: 20, description: '受到伤害-20%（当天）' }
    },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '火辣辣的麻辣火锅，驱寒暖身。'
  },
  {
    id: 'steamed_bass',
    name: '清蒸鲈鱼',
    ingredients: [
      { itemId: 'bass', quantity: 1 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'fishing', value: 2, description: '钓鱼技能+2（当天）' }
    },
    unlockSource: '钓鱼等级3',
    requiredSkill: { type: 'fishing', level: 3 },
    description: '鲜嫩的清蒸鲈鱼。'
  },
  {
    id: 'honey_tea',
    name: '蜂蜜茶',
    ingredients: [
      { itemId: 'honey', quantity: 1 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '甜蜜温润的蜂蜜茶。'
  },
  {
    id: 'ginger_soup',
    name: '姜汤',
    ingredients: [
      { itemId: 'ginger', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 20,
      healthRestore: 10,
      buff: { type: 'speed', value: 15, description: '行动速度+15%（当天）' }
    },
    unlockSource: '初始自带',
    description: '驱寒暖胃的姜汤。'
  },
  {
    id: 'jujube_cake',
    name: '红枣糕',
    ingredients: [
      { itemId: 'jujube', quantity: 3 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 15 },
    unlockSource: '烹饪等级2',
    requiredSkill: { type: 'farming', level: 2 },
    description: '香甜软糯的红枣糕。'
  },
  {
    id: 'peach_blossom_cake',
    name: '桃花饼',
    ingredients: [
      { itemId: 'peach', quantity: 2 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 25,
      healthRestore: 10,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '春日限定的桃花饼。'
  },
  {
    id: 'fish_noodle',
    name: '鱼汤面',
    ingredients: [
      { itemId: 'crucian', quantity: 1 },
      { itemId: 'winter_wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 30, healthRestore: 15 },
    unlockSource: '钓鱼等级2',
    requiredSkill: { type: 'fishing', level: 2 },
    description: '鲜美的鱼汤面。'
  },
  {
    id: 'miner_iron_pot',
    name: '矿工铁锅饭',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'copper_ore', quantity: 1 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 30,
      buff: {
        type: 'mining',
        value: 25,
        description: '挖矿体力消耗-25%（当天）'
      }
    },
    unlockSource: '挖矿等级4',
    requiredSkill: { type: 'mining', level: 4 },
    description: '矿工们的铁锅大杂烩。'
  },
  {
    id: 'bamboo_shoot_stir_fry',
    name: '冬笋炒肉',
    ingredients: [
      { itemId: 'winter_bamboo_shoot', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '鲜香的冬笋炒肉片。'
  },
  {
    id: 'dried_persimmon',
    name: '柿饼',
    ingredients: [{ itemId: 'persimmon', quantity: 3 }],
    effect: { staminaRestore: 20, healthRestore: 5 },
    unlockSource: '初始自带',
    description: '晒干的柿饼，甘甜绵密。'
  },
  {
    id: 'lotus_seed_soup',
    name: '莲子羹',
    ingredients: [
      { itemId: 'lotus_seed', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '清心安神的莲子羹。'
  },
  {
    id: 'sesame_paste',
    name: '芝麻糊',
    ingredients: [
      { itemId: 'sesame', quantity: 3 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '浓郁香滑的芝麻糊。'
  },
  {
    id: 'ginseng_soup',
    name: '人参汤',
    ingredients: [
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'herb', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 30,
      buff: {
        type: 'farming',
        value: 20,
        description: '农耕体力消耗-20%（当天）'
      }
    },
    unlockSource: '采集等级5',
    requiredSkill: { type: 'foraging', level: 5 },
    description: '滋补元气的人参汤。'
  },
  {
    id: 'corn_pancake',
    name: '玉米烙',
    ingredients: [
      { itemId: 'corn', quantity: 2 },
      { itemId: 'sesame_oil', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '金黄酥脆的玉米烙。'
  },
  {
    id: 'osmanthus_lotus_root',
    name: '桂花藕粉',
    ingredients: [
      { itemId: 'osmanthus', quantity: 1 },
      { itemId: 'lotus_root', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'luck', value: 10, description: '幸运+10%（当天）' }
    },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '清香四溢的桂花藕粉。'
  },

  // ==================== 新增初始食谱 (8) ====================
  {
    id: 'scrambled_egg_rice',
    name: '蛋炒饭',
    ingredients: [
      { itemId: 'egg', quantity: 1 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 20, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '简单可口的蛋炒饭。'
  },
  {
    id: 'stir_fried_potato',
    name: '炒土豆丝',
    ingredients: [{ itemId: 'potato', quantity: 2 }],
    effect: { staminaRestore: 18, healthRestore: 5 },
    unlockSource: '初始自带',
    description: '酸辣爽脆的炒土豆丝。'
  },
  {
    id: 'boiled_egg',
    name: '水煮蛋',
    ingredients: [{ itemId: 'egg', quantity: 2 }],
    effect: { staminaRestore: 15, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '最朴实的营养来源。'
  },
  {
    id: 'congee',
    name: '白粥',
    ingredients: [{ itemId: 'rice', quantity: 2 }],
    effect: { staminaRestore: 15, healthRestore: 5 },
    unlockSource: '初始自带',
    description: '清淡养胃的白粥。'
  },
  {
    id: 'rice_ball',
    name: '饭团',
    ingredients: [{ itemId: 'rice', quantity: 1 }],
    effect: { staminaRestore: 12, healthRestore: 3 },
    unlockSource: '初始自带',
    description: '简单捏制的米饭团子，方便携带。'
  },
  {
    id: 'steamed_bun',
    name: '馒头',
    ingredients: [{ itemId: 'wheat_flour', quantity: 1 }],
    effect: { staminaRestore: 12, healthRestore: 3 },
    unlockSource: '初始自带',
    description: '松软的白面馒头，最朴素的主食。'
  },
  {
    id: 'roasted_sweet_potato',
    name: '烤红薯',
    ingredients: [{ itemId: 'sweet_potato', quantity: 2 }],
    effect: { staminaRestore: 20, healthRestore: 5 },
    unlockSource: '初始自带',
    description: '香甜绵软的烤红薯。'
  },
  {
    id: 'vegetable_soup',
    name: '田园蔬菜汤',
    ingredients: [
      { itemId: 'cabbage', quantity: 1 },
      { itemId: 'radish', quantity: 1 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '新鲜蔬菜熬制的清汤。'
  },
  {
    id: 'chive_egg_stir_fry',
    name: '韭菜炒蛋',
    ingredients: [
      { itemId: 'chives', quantity: 2 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: { staminaRestore: 22, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '韭菜与鸡蛋的经典搭配。'
  },
  {
    id: 'peanut_candy',
    name: '花生糖',
    ingredients: [
      { itemId: 'peanut', quantity: 3 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 18, healthRestore: 5 },
    unlockSource: '初始自带',
    description: '酥脆香甜的花生糖。'
  },

  // ==================== NPC 好感食谱 — 相识 (1 新) ====================
  {
    id: 'sweet_osmanthus_tea',
    name: '桂花甜茶',
    ingredients: [
      { itemId: 'osmanthus', quantity: 1 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 20,
      healthRestore: 5,
      buff: { type: 'luck', value: 10, description: '幸运+10%（当天）' }
    },
    unlockSource: '小满好感「相识」',
    description: '芬芳甜蜜的桂花甜茶。'
  },

  // ==================== NPC 好感食谱 — 相知 (6) ====================
  {
    id: 'aged_radish_stew',
    name: '老萝卜炖肉',
    ingredients: [
      { itemId: 'radish', quantity: 3 },
      { itemId: 'firewood', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 25 },
    unlockSource: '陈伯好感「相知」',
    description: '陈伯秘传的萝卜炖肉，入味三分。'
  },
  {
    id: 'maple_grilled_fish',
    name: '枫叶烤鱼',
    ingredients: [
      { itemId: 'mandarin_fish', quantity: 1 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 20,
      buff: { type: 'fishing', value: 2, description: '钓鱼技能+2（当天）' }
    },
    unlockSource: '秋月好感「相知」',
    description: '秋月独创的枫叶烤鱼法。'
  },
  {
    id: 'herbal_pill',
    name: '百草丹',
    ingredients: [
      { itemId: 'herb', quantity: 3 },
      { itemId: 'ginseng', quantity: 1 }
    ],
    effect: { staminaRestore: 60, healthRestore: 30 },
    unlockSource: '林老好感「相知」',
    description: '林老配方的百草良药。'
  },
  {
    id: 'embroidered_cake',
    name: '绣囊糕',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'osmanthus', quantity: 2 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 15,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '柳娘好感「相知」',
    description: '柳娘精心制作的绣囊糕。'
  },
  {
    id: 'deep_mine_stew',
    name: '深矿炖菜',
    ingredients: [
      { itemId: 'potato', quantity: 2 },
      { itemId: 'copper_ore', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 35,
      buff: {
        type: 'mining',
        value: 30,
        description: '挖矿体力消耗-30%（当天）'
      }
    },
    unlockSource: '阿石好感「相知」',
    description: '阿石在矿洞深处发明的炖菜。'
  },
  {
    id: 'wild_berry_jam',
    name: '野果酱',
    ingredients: [
      { itemId: 'wild_berry', quantity: 3 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 25,
      healthRestore: 10,
      buff: { type: 'speed', value: 20, description: '行动速度+20%（当天）' }
    },
    unlockSource: '小满好感「相知」',
    description: '小满用林中野果做的果酱。'
  },

  // ==================== NPC 好感食谱 — 挚友 (6) ====================
  {
    id: 'farmers_feast',
    name: '农家盛宴',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'cabbage', quantity: 2 },
      { itemId: 'egg', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 40,
      buff: {
        type: 'farming',
        value: 25,
        description: '农耕体力消耗-25%（当天）'
      }
    },
    unlockSource: '陈伯好感「挚友」',
    description: '陈伯压箱底的农家大菜。'
  },
  {
    id: 'autumn_moon_feast',
    name: '秋月宴',
    ingredients: [
      { itemId: 'mandarin_fish', quantity: 1 },
      { itemId: 'river_crab', quantity: 1 },
      { itemId: 'osmanthus', quantity: 2 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 30,
      buff: { type: 'luck', value: 20, description: '幸运+20%（当天）' }
    },
    unlockSource: '秋月好感「挚友」',
    description: '秋月为挚友备的秋夜佳宴。'
  },
  {
    id: 'longevity_soup',
    name: '长生汤',
    ingredients: [
      { itemId: 'ginseng', quantity: 2 },
      { itemId: 'herb', quantity: 3 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 80, healthRestore: 40 },
    unlockSource: '林老好感「挚友」',
    description: '林老毕生心血的养生秘方。'
  },
  {
    id: 'lovers_pastry',
    name: '鸳鸯酥',
    ingredients: [
      { itemId: 'peach', quantity: 2 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 20,
      buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' }
    },
    unlockSource: '柳娘好感「挚友」',
    description: '柳娘专为有情人做的鸳鸯酥。'
  },
  {
    id: 'forgemasters_meal',
    name: '锻造师套餐',
    ingredients: [
      { itemId: 'iron_ore', quantity: 2 },
      { itemId: 'potato', quantity: 3 },
      { itemId: 'firewood', quantity: 2 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 50,
      buff: { type: 'defense', value: 25, description: '受到伤害-25%（当天）' }
    },
    unlockSource: '阿石好感「挚友」',
    description: '阿石独创的锻造师能量餐。'
  },
  {
    id: 'spirit_fruit_wine',
    name: '灵果酒',
    ingredients: [
      { itemId: 'wild_berry', quantity: 3 },
      { itemId: 'honey', quantity: 2 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 25,
      buff: { type: 'luck', value: 25, description: '幸运+25%（当天）' }
    },
    unlockSource: '小满好感「挚友」',
    description: '小满用灵果酿的幸运酒。'
  },

  // ==================== NPC 结婚食谱 (12) ====================
  {
    id: 'phoenix_cake',
    name: '凤凰糕',
    ingredients: [
      { itemId: 'rice', quantity: 3 },
      { itemId: 'osmanthus', quantity: 2 },
      { itemId: 'jujube', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 25,
      buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' }
    },
    unlockSource: '与柳娘结婚后',
    description: '柳娘婚后传授的凤凰糕秘方。'
  },
  {
    id: 'molten_hotpot',
    name: '熔岩铁锅',
    ingredients: [
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'chili', quantity: 2 },
      { itemId: 'potato', quantity: 2 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 50,
      buff: {
        type: 'mining',
        value: 35,
        description: '挖矿体力消耗-35%（当天）'
      }
    },
    unlockSource: '与阿石结婚后',
    description: '阿石婚后教你的熔岩铁锅料理。'
  },
  {
    id: 'moonlight_sashimi',
    name: '月下刺身',
    ingredients: [
      { itemId: 'sturgeon', quantity: 1 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 20,
      buff: { type: 'fishing', value: 3, description: '钓鱼技能+3（当天）' }
    },
    unlockSource: '与秋月结婚后',
    description: '秋月婚后分享的月下刺身。'
  },
  {
    id: 'tea_banquet',
    name: '茶宴八珍',
    ingredients: [
      { itemId: 'tea', quantity: 3 },
      { itemId: 'lotus_seed', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 30,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '与春兰结婚后',
    description: '春兰婚后传授的茶宴配方，以茶入馔。'
  },
  {
    id: 'snow_plum_soup',
    name: '雪梅羹',
    ingredients: [
      { itemId: 'snow_lotus', quantity: 1 },
      { itemId: 'honey', quantity: 2 }
    ],
    effect: {
      staminaRestore: 65,
      healthRestore: 35,
      buff: { type: 'luck', value: 3, description: '幸运+3（当天）' }
    },
    unlockSource: '与雪芹结婚后',
    description: '雪芹婚后分享的画室私房羹汤。'
  },
  {
    id: 'silk_dumpling',
    name: '锦囊玉饺',
    ingredients: [
      { itemId: 'silk', quantity: 1 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'cabbage', quantity: 2 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '与素素结婚后',
    description: '素素婚后教你包的精致饺子，形如锦囊。'
  },
  {
    id: 'drunken_chicken',
    name: '醉仙鸡',
    ingredients: [
      { itemId: 'egg', quantity: 3 },
      { itemId: 'peach_wine', quantity: 1 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 40,
      buff: {
        type: 'farming',
        value: 30,
        description: '农作体力消耗-30%（当天）'
      }
    },
    unlockSource: '与红豆结婚后',
    description: '红豆婚后传授的酒香名菜。'
  },
  {
    id: 'scholars_porridge',
    name: '文曲星粥',
    ingredients: [
      { itemId: 'rice', quantity: 3 },
      { itemId: 'tea', quantity: 1 },
      { itemId: 'ginseng', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 30,
      buff: { type: 'speed', value: 2, description: '移动速度+2（当天）' }
    },
    unlockSource: '与丹青结婚后',
    description: '丹青婚后按古方熬煮的养心粥。'
  },
  {
    id: 'ironforge_stew',
    name: '铁匠炖',
    ingredients: [
      { itemId: 'potato', quantity: 3 },
      { itemId: 'corn', quantity: 2 },
      { itemId: 'iron_ore', quantity: 1 }
    ],
    effect: {
      staminaRestore: 80,
      healthRestore: 50,
      buff: {
        type: 'mining',
        value: 40,
        description: '挖矿体力消耗-40%（当天）'
      }
    },
    unlockSource: '与阿铁结婚后',
    description: '阿铁婚后做的粗犷炖菜，量大管饱。'
  },
  {
    id: 'hunters_roast',
    name: '猎人烤',
    ingredients: [
      { itemId: 'wild_mushroom', quantity: 3 },
      { itemId: 'herb', quantity: 2 },
      { itemId: 'pine_cone', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 45,
      buff: { type: 'defense', value: 3, description: '防御+3（当天）' }
    },
    unlockSource: '与云飞结婚后',
    description: '云飞婚后教你的山野烤法。'
  },
  {
    id: 'ranch_milk_soup',
    name: '牧场鲜奶汤',
    ingredients: [
      { itemId: 'milk', quantity: 2 },
      { itemId: 'corn', quantity: 2 },
      { itemId: 'sweet_potato', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 35,
      buff: {
        type: 'farming',
        value: 25,
        description: '农作体力消耗-25%（当天）'
      }
    },
    unlockSource: '与大牛结婚后',
    description: '大牛婚后常做的香浓奶汤。'
  },
  {
    id: 'moonlit_tea_rice',
    name: '月下茶泡饭',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'tea', quantity: 2 },
      { itemId: 'bamboo_shoot', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 20,
      buff: { type: 'luck', value: 2, description: '幸运+2（当天）' }
    },
    unlockSource: '与墨白结婚后',
    description: '墨白婚后常在月下泡的清淡茶饭。'
  },

  // ==================== 农耕技能食谱 (3 新) ====================
  {
    id: 'pumpkin_pie',
    name: '南瓜饼',
    ingredients: [
      { itemId: 'pumpkin', quantity: 2 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: {
        type: 'farming',
        value: 15,
        description: '农耕体力消耗-15%（当天）'
      }
    },
    unlockSource: '农耕等级6',
    requiredSkill: { type: 'farming', level: 6 },
    description: '金黄松软的南瓜饼。'
  },
  {
    id: 'golden_fried_rice',
    name: '黄金炒饭',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'egg', quantity: 2 },
      { itemId: 'corn', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: {
        type: 'farming',
        value: 20,
        description: '农耕体力消耗-20%（当天）'
      }
    },
    unlockSource: '农耕等级7',
    requiredSkill: { type: 'farming', level: 7 },
    description: '粒粒金黄的炒饭。'
  },
  {
    id: 'supreme_farm_feast',
    name: '田园盛筵',
    ingredients: [
      { itemId: 'pumpkin', quantity: 1 },
      { itemId: 'watermelon', quantity: 1 },
      { itemId: 'corn', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 35,
      buff: {
        type: 'farming',
        value: 30,
        description: '农耕体力消耗-30%（当天）'
      }
    },
    unlockSource: '农耕等级9',
    requiredSkill: { type: 'farming', level: 9 },
    description: '集四季精华的田园盛筵。'
  },

  // ==================== 钓鱼技能食谱 (5 新) ====================
  {
    id: 'braised_catfish',
    name: '红烧鲶鱼',
    ingredients: [
      { itemId: 'catfish', quantity: 1 },
      { itemId: 'chili', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' }
    },
    unlockSource: '钓鱼等级4',
    requiredSkill: { type: 'fishing', level: 4 },
    description: '辣味十足的红烧鲶鱼。'
  },
  {
    id: 'grilled_eel',
    name: '烤鳗鱼',
    ingredients: [
      { itemId: 'eel', quantity: 1 },
      { itemId: 'sesame', quantity: 1 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'fishing', value: 2, description: '钓鱼技能+2（当天）' }
    },
    unlockSource: '钓鱼等级5',
    requiredSkill: { type: 'fishing', level: 5 },
    description: '外焦里嫩的烤鳗鱼。'
  },
  {
    id: 'crab_soup',
    name: '蟹黄汤',
    ingredients: [
      { itemId: 'river_crab', quantity: 2 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 25,
      buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' }
    },
    unlockSource: '钓鱼等级6',
    requiredSkill: { type: 'fishing', level: 6 },
    description: '鲜美浓郁的蟹黄汤。'
  },
  {
    id: 'sturgeon_stew',
    name: '鲟鱼羹',
    ingredients: [
      { itemId: 'sturgeon', quantity: 1 },
      { itemId: 'herb', quantity: 1 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 30,
      buff: { type: 'fishing', value: 3, description: '钓鱼技能+3（当天）' }
    },
    unlockSource: '钓鱼等级7',
    requiredSkill: { type: 'fishing', level: 7 },
    description: '珍贵的鲟鱼炖羹。'
  },
  {
    id: 'dragon_sashimi',
    name: '龙鱼刺身',
    ingredients: [
      { itemId: 'dragonfish', quantity: 1 },
      { itemId: 'ginger', quantity: 2 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 35,
      buff: { type: 'fishing', value: 4, description: '钓鱼技能+4（当天）' }
    },
    unlockSource: '钓鱼等级8',
    requiredSkill: { type: 'fishing', level: 8 },
    description: '传说龙鱼制成的极品刺身。'
  },

  // ==================== 采矿技能食谱 (5 新) ====================
  {
    id: 'stone_soup',
    name: '矿石汤',
    ingredients: [
      { itemId: 'copper_ore', quantity: 2 },
      { itemId: 'radish', quantity: 1 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 20 },
    unlockSource: '采矿等级3',
    requiredSkill: { type: 'mining', level: 3 },
    description: '矿洞中就地取材的汤。'
  },
  {
    id: 'crystal_jelly',
    name: '水晶冻',
    ingredients: [
      { itemId: 'crystal_ore', quantity: 1 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 25,
      buff: {
        type: 'mining',
        value: 25,
        description: '挖矿体力消耗-25%（当天）'
      }
    },
    unlockSource: '采矿等级5',
    requiredSkill: { type: 'mining', level: 5 },
    description: '晶莹剔透的水晶冻。'
  },
  {
    id: 'iron_tonic',
    name: '铁骨汤',
    ingredients: [
      { itemId: 'iron_ore', quantity: 2 },
      { itemId: 'herb', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 35,
      buff: { type: 'defense', value: 20, description: '受到伤害-20%（当天）' }
    },
    unlockSource: '采矿等级6',
    requiredSkill: { type: 'mining', level: 6 },
    description: '强筋健骨的铁骨汤。'
  },
  {
    id: 'gold_dumpling',
    name: '金矿饺',
    ingredients: [
      { itemId: 'gold_ore', quantity: 1 },
      { itemId: 'winter_wheat', quantity: 2 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 30,
      buff: {
        type: 'mining',
        value: 30,
        description: '挖矿体力消耗-30%（当天）'
      }
    },
    unlockSource: '采矿等级7',
    requiredSkill: { type: 'mining', level: 7 },
    description: '金粉入馅的矿工饺子。'
  },
  {
    id: 'void_essence_soup',
    name: '虚空精华汤',
    ingredients: [
      { itemId: 'void_ore', quantity: 1 },
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 40,
      buff: {
        type: 'mining',
        value: 35,
        description: '挖矿体力消耗-35%（当天）'
      }
    },
    unlockSource: '采矿等级8',
    requiredSkill: { type: 'mining', level: 8 },
    description: '虚空矿石炼制的神秘汤剂。'
  },

  // ==================== 采集技能食谱 (4 新) ====================
  {
    id: 'wild_salad',
    name: '野菜沙拉',
    ingredients: [
      { itemId: 'herb', quantity: 2 },
      { itemId: 'wild_berry', quantity: 1 }
    ],
    effect: { staminaRestore: 20, healthRestore: 10 },
    unlockSource: '采集等级3',
    requiredSkill: { type: 'foraging', level: 3 },
    description: '山间新鲜野菜拌成的沙拉。'
  },
  {
    id: 'mushroom_stew',
    name: '蘑菇炖',
    ingredients: [
      { itemId: 'wild_mushroom', quantity: 3 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 20,
      buff: { type: 'speed', value: 15, description: '行动速度+15%（当天）' }
    },
    unlockSource: '采集等级4',
    requiredSkill: { type: 'foraging', level: 4 },
    description: '野生蘑菇慢炖的浓汤。'
  },
  {
    id: 'forest_tonic',
    name: '林间补药',
    ingredients: [
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'wild_mushroom', quantity: 2 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 30,
      buff: {
        type: 'farming',
        value: 20,
        description: '农耕体力消耗-20%（当天）'
      }
    },
    unlockSource: '采集等级7',
    requiredSkill: { type: 'foraging', level: 7 },
    description: '林中珍材熬制的补药。'
  },
  {
    id: 'spirit_herb_elixir',
    name: '灵草秘药',
    ingredients: [
      { itemId: 'ginseng', quantity: 2 },
      { itemId: 'herb', quantity: 3 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 80,
      healthRestore: 40,
      buff: { type: 'luck', value: 25, description: '幸运+25%（当天）' }
    },
    unlockSource: '采集等级9',
    requiredSkill: { type: 'foraging', level: 9 },
    description: '采集大师秘传的灵草药剂。'
  },

  // ==================== 战斗技能食谱 (5 新) ====================
  {
    id: 'warrior_ration',
    name: '战士口粮',
    ingredients: [
      { itemId: 'potato', quantity: 2 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 25 },
    unlockSource: '战斗等级3',
    requiredSkill: { type: 'combat', level: 3 },
    description: '简单实用的战士口粮。'
  },
  {
    id: 'battle_stew',
    name: '战斗炖菜',
    ingredients: [
      { itemId: 'chili', quantity: 1 },
      { itemId: 'potato', quantity: 1 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 30,
      buff: { type: 'defense', value: 15, description: '受到伤害-15%（当天）' }
    },
    unlockSource: '战斗等级4',
    requiredSkill: { type: 'combat', level: 4 },
    description: '提升战斗力的辛辣炖菜。'
  },
  {
    id: 'iron_fist_soup',
    name: '铁拳汤',
    ingredients: [
      { itemId: 'iron_ore', quantity: 1 },
      { itemId: 'chili', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 35,
      buff: { type: 'defense', value: 20, description: '受到伤害-20%（当天）' }
    },
    unlockSource: '战斗等级5',
    requiredSkill: { type: 'combat', level: 5 },
    description: '拳师专用的铁拳汤。'
  },
  {
    id: 'shadow_brew',
    name: '暗影酿',
    ingredients: [
      { itemId: 'shadow_ore', quantity: 1 },
      { itemId: 'herb', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 40,
      buff: { type: 'defense', value: 25, description: '受到伤害-25%（当天）' }
    },
    unlockSource: '战斗等级7',
    requiredSkill: { type: 'combat', level: 7 },
    description: '暗影矿石酿制的神秘饮品。'
  },
  {
    id: 'void_elixir',
    name: '虚空药剂',
    ingredients: [
      { itemId: 'void_ore', quantity: 1 },
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'shadow_ore', quantity: 1 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 50,
      buff: { type: 'defense', value: 30, description: '受到伤害-30%（当天）' }
    },
    unlockSource: '战斗等级9',
    requiredSkill: { type: 'combat', level: 9 },
    description: '战斗大师炼制的终极药剂。'
  },

  // ==================== 季节节日食谱 (4) ====================
  {
    id: 'spring_roll',
    name: '春卷',
    ingredients: [
      { itemId: 'cabbage', quantity: 2 },
      { itemId: 'bamboo_shoot', quantity: 1 },
      { itemId: 'sesame_oil', quantity: 1 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 15,
      buff: { type: 'speed', value: 15, description: '行动速度+15%（当天）' }
    },
    unlockSource: '春耕祭奖励',
    description: '春耕祭传统的春卷。'
  },
  {
    id: 'lotus_lantern_cake',
    name: '荷灯糕',
    ingredients: [
      { itemId: 'lotus_seed', quantity: 2 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 20,
      buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' }
    },
    unlockSource: '荷灯节奖励',
    description: '荷灯节限定的荷灯糕。'
  },
  {
    id: 'harvest_feast',
    name: '丰收盛宴',
    ingredients: [
      { itemId: 'pumpkin', quantity: 1 },
      { itemId: 'sweet_potato', quantity: 1 },
      { itemId: 'corn', quantity: 1 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 25,
      buff: {
        type: 'farming',
        value: 20,
        description: '农耕体力消耗-20%（当天）'
      }
    },
    unlockSource: '丰收宴奖励',
    description: '丰收宴上的传统大菜。'
  },
  {
    id: 'new_year_dumpling',
    name: '年夜饺',
    ingredients: [
      { itemId: 'winter_wheat', quantity: 3 },
      { itemId: 'napa_cabbage', quantity: 2 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 30,
      buff: { type: 'luck', value: 20, description: '幸运+20%（当天）' }
    },
    unlockSource: '除夕守岁奖励',
    description: '除夕夜包的幸运饺子。'
  },

  // ==================== 新增节日食谱 (10) ====================
  {
    id: 'nian_gao',
    name: '年糕',
    ingredients: [
      { itemId: 'rice', quantity: 3 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 15,
      buff: {
        type: 'farming',
        value: 10,
        description: '农耕体力消耗-10%（当天）'
      }
    },
    unlockSource: '元日奖励',
    description: '「年年高」的吉祥年糕。'
  },
  {
    id: 'hua_gao',
    name: '花糕',
    ingredients: [
      { itemId: 'peach', quantity: 2 },
      { itemId: 'rice', quantity: 1 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 10,
      buff: { type: 'luck', value: 10, description: '幸运+10%（当天）' }
    },
    unlockSource: '花朝节奖励',
    description: '以鲜花入馅的精致糕点。'
  },
  {
    id: 'qing_tuan',
    name: '青团',
    ingredients: [
      { itemId: 'herb', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 10,
      buff: {
        type: 'farming',
        value: 15,
        description: '农耕体力消耗-15%（当天）'
      }
    },
    unlockSource: '上巳踏青奖励',
    description: '草药清香的踏青小食。'
  },
  {
    id: 'yue_bing',
    name: '月饼',
    ingredients: [
      { itemId: 'lotus_seed', quantity: 2 },
      { itemId: 'sesame_oil', quantity: 1 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' }
    },
    unlockSource: '中秋赏月奖励',
    description: '月圆之夜的莲蓉月饼。'
  },
  {
    id: 'la_ba_zhou',
    name: '腊八粥',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'peanut', quantity: 1 },
      { itemId: 'wild_berry', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 25
    },
    unlockSource: '腊八粥会奖励',
    description: '暖胃驱寒的腊八粥。'
  },
  {
    id: 'dragon_boat_zongzi',
    name: '粽子',
    ingredients: [
      { itemId: 'rice', quantity: 3 },
      { itemId: 'bamboo_shoot', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'speed', value: 10, description: '行动速度+10%（当天）' }
    },
    unlockSource: '端午赛龙舟奖励',
    description: '竹叶清香的端午粽子。'
  },
  {
    id: 'qiao_guo',
    name: '巧果',
    ingredients: [
      { itemId: 'winter_wheat', quantity: 2 },
      { itemId: 'honey', quantity: 1 },
      { itemId: 'sesame_oil', quantity: 1 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 10,
      buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' }
    },
    unlockSource: '七夕猜灯谜奖励',
    description: '七夕乞巧的传统小点。'
  },
  {
    id: 'chrysanthemum_wine',
    name: '菊花酒',
    ingredients: [
      { itemId: 'chrysanthemum', quantity: 3 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 20,
      buff: { type: 'luck', value: 12, description: '幸运+12%（当天）' }
    },
    unlockSource: '重阳投壶奖励',
    description: '重阳佳节的菊花酿。'
  },
  {
    id: 'jiaozi',
    name: '冬至饺',
    ingredients: [
      { itemId: 'winter_wheat', quantity: 2 },
      { itemId: 'napa_cabbage', quantity: 2 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'mining', value: 1, description: '矿工技能+1（当天）' }
    },
    unlockSource: '冬至包饺子奖励',
    description: '冬至时节包的暖心饺子。'
  },
  {
    id: 'tangyuan',
    name: '汤圆',
    ingredients: [
      { itemId: 'rice', quantity: 3 },
      { itemId: 'honey', quantity: 1 },
      { itemId: 'peanut', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 25,
      buff: { type: 'all_skills', value: 1, description: '全技能+1（当天）' }
    },
    unlockSource: '年末烟花会奖励',
    description: '团团圆圆的花生汤圆。'
  },
  {
    id: 'dou_cha_yin',
    name: '斗茶饮',
    ingredients: [
      { itemId: 'tea', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'all_skills', value: 1, description: '全技能+1（当天）' }
    },
    unlockSource: '斗茶大会奖励',
    description: '斗茶会上的经典茶饮，清香沁脾。'
  },
  {
    id: 'zhi_yuan_gao',
    name: '纸鸢糕',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'peach', quantity: 1 },
      { itemId: 'sesame_oil', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'speed', value: 12, description: '行动速度+12%（当天）' }
    },
    unlockSource: '秋风筝会奖励',
    description: '风筝节上的应景糕点，形如纸鸢。'
  },

  // ==================== 成就里程碑食谱 (9) ====================
  {
    id: 'first_catch_soup',
    name: '初钓鱼汤',
    ingredients: [
      { itemId: 'crucian', quantity: 2 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: { staminaRestore: 20, healthRestore: 10 },
    unlockSource: '成就：初次钓鱼',
    description: '第一次钓鱼的纪念汤。'
  },
  {
    id: 'bountiful_porridge',
    name: '百收粥',
    ingredients: [
      { itemId: 'rice', quantity: 3 },
      { itemId: 'jujube', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 20 },
    unlockSource: '成就：收获100次作物',
    description: '庆祝百次丰收的粥。'
  },
  {
    id: 'miners_glory',
    name: '矿工荣光',
    ingredients: [
      { itemId: 'gold_ore', quantity: 1 },
      { itemId: 'egg', quantity: 2 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 30,
      buff: {
        type: 'mining',
        value: 25,
        description: '挖矿体力消耗-25%（当天）'
      }
    },
    unlockSource: '成就：到达矿洞30层',
    description: '矿工荣耀的象征。'
  },
  {
    id: 'chef_special',
    name: '大厨特供',
    ingredients: [
      { itemId: 'egg', quantity: 2 },
      { itemId: 'honey', quantity: 1 },
      { itemId: 'sesame', quantity: 2 }
    ],
    effect: { staminaRestore: 45, healthRestore: 20 },
    unlockSource: '成就：烹饪20道菜',
    description: '大厨才能做出的特供菜。'
  },
  {
    id: 'social_tea',
    name: '交际花茶',
    ingredients: [
      { itemId: 'osmanthus', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 15,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '成就：3位NPC达到相知',
    description: '社交达人的特调花茶。'
  },
  {
    id: 'anglers_platter',
    name: '渔夫拼盘',
    ingredients: [
      { itemId: 'bass', quantity: 1 },
      { itemId: 'creek_shrimp', quantity: 1 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 25,
      buff: { type: 'fishing', value: 2, description: '钓鱼技能+2（当天）' }
    },
    unlockSource: '成就：钓到20条鱼',
    description: '渔夫才能拼出的海鲜拼盘。'
  },
  {
    id: 'legendary_feast',
    name: '传说盛宴',
    ingredients: [
      { itemId: 'jade_dragon', quantity: 1 },
      { itemId: 'ginger', quantity: 2 }
    ],
    effect: {
      staminaRestore: 80,
      healthRestore: 40,
      buff: { type: 'fishing', value: 4, description: '钓鱼技能+4（当天）' }
    },
    unlockSource: '成就：钓到传说鱼',
    description: '用传说之鱼做的极品盛宴。'
  },
  {
    id: 'abyss_stew',
    name: '深渊炖菜',
    ingredients: [
      { itemId: 'shadow_ore', quantity: 1 },
      { itemId: 'crystal_shrimp', quantity: 1 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 35,
      buff: { type: 'defense', value: 20, description: '受到伤害-20%（当天）' }
    },
    unlockSource: '成就：到达矿洞50层',
    description: '深渊探索者的秘制炖菜。'
  },
  {
    id: 'collectors_banquet',
    name: '收藏家宴',
    ingredients: [
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'sturgeon', quantity: 1 },
      { itemId: 'pumpkin', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 80,
      healthRestore: 40,
      buff: { type: 'luck', value: 25, description: '幸运+25%（当天）' }
    },
    unlockSource: '成就：发现50种物品',
    description: '用珍稀食材做的收藏家宴。'
  },
  // ===== 新增：动物产品食谱 =====
  {
    id: 'silkie_egg_soup',
    name: '乌鸡蛋羹',
    ingredients: [
      { itemId: 'silkie_egg', quantity: 2 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: { staminaRestore: 50, healthRestore: 30 },
    unlockSource: '初始自带',
    description: '滋补养生的乌鸡蛋羹。'
  },
  {
    id: 'goat_milk_soup',
    name: '羊奶汤',
    ingredients: [
      { itemId: 'goat_milk', quantity: 2 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 45, healthRestore: 25 },
    unlockSource: '大牛好感「挚友」',
    description: '温热醇厚的羊奶汤。'
  },
  {
    id: 'truffle_fried_rice',
    name: '松露炒饭',
    ingredients: [
      { itemId: 'truffle', quantity: 1 },
      { itemId: 'rice', quantity: 1 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 30,
      buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' }
    },
    unlockSource: '大牛好感「知己」',
    description: '奢侈的松露炒饭，香气四溢。'
  },
  {
    id: 'antler_soup',
    name: '鹿茸汤',
    ingredients: [
      { itemId: 'antler_velvet', quantity: 1 },
      { itemId: 'herb', quantity: 2 },
      { itemId: 'ginseng', quantity: 1 }
    ],
    effect: {
      staminaRestore: 80,
      healthRestore: 40,
      buff: { type: 'stamina', value: 100, description: '体力全恢复' }
    },
    unlockSource: '林老好感「知己」',
    description: '大补之物，一碗下去神清气爽。'
  },
  {
    id: 'camel_milk_tea',
    name: '驼奶茶',
    ingredients: [
      { itemId: 'camel_milk', quantity: 1 },
      { itemId: 'tea', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'speed', value: 15, description: '行动速度+15%（当天）' }
    },
    unlockSource: '陈伯好感「挚友」',
    description: '丝滑醇香的驼奶茶。'
  },
  {
    id: 'peacock_feast',
    name: '孔雀宴',
    ingredients: [
      { itemId: 'peacock_feather', quantity: 1 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'osmanthus', quantity: 1 }
    ],
    effect: {
      staminaRestore: 90,
      healthRestore: 50,
      buff: { type: 'all_skills', value: 1, description: '全技能+1（当天）' }
    },
    unlockSource: '结婚后解锁',
    description: '传说中的孔雀宴，尊贵无比。'
  },
  // === 瀚海食谱 ===
  {
    id: 'spiced_lamb',
    name: '香料烤羊',
    ingredients: [
      { itemId: 'hanhai_spice', quantity: 1 },
      { itemId: 'goat_milk', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 30,
      buff: { type: 'mining', value: 2, description: '采矿技能+2（当天）' }
    },
    unlockSource: '瀚海驿站购买香料后解锁',
    description: '西域风味的烤羊肉，香气扑鼻，力量倍增。'
  },
  {
    id: 'silk_dumpling_deluxe',
    name: '丝路饺子',
    ingredients: [
      { itemId: 'hanhai_silk', quantity: 1 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'hanhai_spice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 35,
      buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' }
    },
    unlockSource: '瀚海驿站购买丝绸后解锁',
    description: '用丝绸包裹的精致饺子，配以西域香料，送礼佳品。'
  },
  {
    id: 'desert_cactus_soup',
    name: '仙人掌汤',
    ingredients: [
      { itemId: 'hanhai_cactus', quantity: 2 },
      { itemId: 'hanhai_spice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 40,
      buff: { type: 'stamina', value: 30, description: '体力上限+30（当天）' }
    },
    unlockSource: '收获仙人掌后解锁',
    description: '清凉解暑的仙人掌汤，沙漠旅人的续命良方。'
  },
  {
    id: 'date_cake',
    name: '枣糕',
    ingredients: [
      { itemId: 'hanhai_date', quantity: 3 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'farming', value: 2, description: '种植技能+2（当天）' }
    },
    unlockSource: '收获椰枣后解锁',
    description: '甜蜜软糯的枣糕，补气养血。'
  },
  // === 瀚海拓展食谱 ===
  {
    id: 'cactus_salad',
    name: '仙人掌沙拉',
    ingredients: [
      { itemId: 'hanhai_cactus', quantity: 1 },
      { itemId: 'hanhai_spice', quantity: 1 }
    ],
    effect: { staminaRestore: 40, healthRestore: 20 },
    unlockSource: '解锁瀚海后自动获得',
    description: '清爽可口的仙人掌沙拉，搭配西域香料别有风味。'
  },
  {
    id: 'spice_fried_rice',
    name: '香料炒饭',
    ingredients: [
      { itemId: 'hanhai_spice', quantity: 1 },
      { itemId: 'rice', quantity: 3 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 25,
      buff: { type: 'farming', value: 1, description: '种植技能+1（当天）' }
    },
    unlockSource: '解锁瀚海后自动获得',
    description: '西域香料翻炒的米饭，粒粒喷香，干活有劲。'
  },
  {
    id: 'turquoise_tea',
    name: '绿松石养生茶',
    ingredients: [
      { itemId: 'hanhai_turquoise', quantity: 1 },
      { itemId: 'tea', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 30,
      buff: { type: 'mining', value: 2, description: '采矿技能+2（当天）' }
    },
    unlockSource: '解锁瀚海后自动获得',
    description: '以绿松石粉入茶，据说能增强矿石感应力。'
  },
  {
    id: 'silk_tofu',
    name: '丝绸豆腐',
    ingredients: [
      { itemId: 'hanhai_silk', quantity: 1 },
      { itemId: 'tofu', quantity: 2 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' }
    },
    unlockSource: '解锁瀚海后自动获得',
    description: '用丝绸包裹蒸制的嫩滑豆腐，口感如丝绸般细腻。'
  },
  {
    id: 'date_porridge',
    name: '枣泥粥',
    ingredients: [
      { itemId: 'hanhai_date', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 50, healthRestore: 25 },
    unlockSource: '解锁瀚海后自动获得',
    description: '温热滋补的枣泥粥，暖胃养身。'
  },
  {
    id: 'desert_feast',
    name: '西域盛宴',
    ingredients: [
      { itemId: 'hanhai_cactus', quantity: 2 },
      { itemId: 'hanhai_spice', quantity: 2 },
      { itemId: 'hanhai_date', quantity: 2 }
    ],
    effect: {
      staminaRestore: 80,
      healthRestore: 50,
      buff: { type: 'all_skills', value: 1, description: '全技能+1（当天）' }
    },
    unlockSource: '通商等级3解锁',
    description: '集西域精华于一桌的豪华宴席，食之精力充沛。'
  },
  {
    id: 'brocade_dumpling',
    name: '锦缎御饺',
    ingredients: [
      { itemId: 'brocade', quantity: 1 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'hanhai_spice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 75,
      healthRestore: 40,
      buff: { type: 'giftBonus', value: 5, description: '送礼好感×5（当天）' }
    },
    unlockSource: '通商等级5解锁',
    description: '以锦缎为皮的极品饺子，御赐级别的送礼佳品。'
  },

  // === 加工品菜谱 ===

  {
    id: 'vinegar_cabbage',
    name: '醋溜白菜',
    ingredients: [
      { itemId: 'rice_vinegar', quantity: 1 },
      { itemId: 'cabbage', quantity: 2 }
    ],
    effect: { staminaRestore: 30, healthRestore: 10 },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '酸爽开胃的家常菜，米醋的妙用。'
  },
  {
    id: 'cheese_baked_rice',
    name: '奶酪焗饭',
    ingredients: [
      { itemId: 'cheese', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '浓郁奶酪与米饭的完美融合。'
  },
  {
    id: 'goat_cheese_salad',
    name: '山羊奶酪沙拉',
    ingredients: [
      { itemId: 'goat_cheese', quantity: 1 },
      { itemId: 'wild_berry', quantity: 2 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'luck', value: 1, description: '幸运+1（当天）' }
    },
    unlockSource: '烹饪等级6',
    requiredSkill: { type: 'farming', level: 6 },
    description: '清爽酸甜，搭配山羊奶酪恰到好处。'
  },
  {
    id: 'mayo_noodles',
    name: '蛋黄酱拌面',
    ingredients: [
      { itemId: 'mayonnaise', quantity: 1 },
      { itemId: 'wheat_flour', quantity: 2 }
    ],
    effect: { staminaRestore: 25, healthRestore: 10 },
    unlockSource: '烹饪等级2',
    requiredSkill: { type: 'farming', level: 2 },
    description: '简单却美味的拌面，蛋黄酱的浓郁令人回味。'
  },
  {
    id: 'smoked_fish_platter',
    name: '烟熏鱼拼盘',
    ingredients: [
      { itemId: 'smoked_carp', quantity: 1 },
      { itemId: 'smoked_bass', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 25,
      buff: { type: 'fishing', value: 2, description: '钓鱼技能+2（当天）' }
    },
    unlockSource: '秋月好感「知己」',
    description: '精心摆盘的双色烟熏鱼，鲜香四溢。'
  },
  {
    id: 'dried_fruit_mix',
    name: '果脯什锦',
    ingredients: [
      { itemId: 'dried_peach', quantity: 1 },
      { itemId: 'dried_hawthorn', quantity: 1 },
      { itemId: 'dried_apricot', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 15,
      buff: { type: 'luck', value: 2, description: '幸运+2（当天）' }
    },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '三种果脯的酸甜组合，行路必备干粮。'
  },
  {
    id: 'pickled_veggie_fried_rice',
    name: '腌菜炒饭',
    ingredients: [
      { itemId: 'pickled_cabbage', quantity: 1 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 15 },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '腌白菜的咸香与蛋炒饭完美结合。'
  },
  {
    id: 'pickled_chili_fish',
    name: '泡椒鱼',
    ingredients: [
      { itemId: 'pickled_chili', quantity: 2 },
      { itemId: 'crucian', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 30,
      buff: { type: 'defense', value: 15, description: '受到伤害-15%（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '麻辣鲜香的泡椒鱼，吃了浑身充满力量。'
  },
  {
    id: 'honey_cake',
    name: '花蜜糕',
    ingredients: [
      { itemId: 'osmanthus_honey', quantity: 1 },
      { itemId: 'wheat_flour', quantity: 2 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 10,
      buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' }
    },
    unlockSource: '柳娘好感「知己」',
    description: '桂花蜜制成的精致糕点，送礼上佳。'
  },
  {
    id: 'antler_tonic',
    name: '鹿茸补汤',
    ingredients: [
      { itemId: 'antler_powder', quantity: 1 },
      { itemId: 'jujube', quantity: 2 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 40,
      buff: { type: 'mining', value: 2, description: '采矿技能+2（当天）' }
    },
    unlockSource: '林老好感「知己」',
    description: '珍贵的滋补汤品，喝后精力充沛。'
  },
  {
    id: 'tea_oil_fried_egg',
    name: '茶油煎蛋',
    ingredients: [
      { itemId: 'tea_oil', quantity: 1 },
      { itemId: 'egg', quantity: 2 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'speed', value: 1, description: '旅行加速+1（当天）' }
    },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '山茶油煎出的金黄蛋饼，清香扑鼻。'
  },
  {
    id: 'truffle_oil_risotto',
    name: '松露油炒饭',
    ingredients: [
      { itemId: 'truffle_oil', quantity: 1 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'wild_mushroom', quantity: 1 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 30,
      buff: { type: 'all_skills', value: 1, description: '全技能+1（当天）' }
    },
    unlockSource: '烹饪等级8',
    requiredSkill: { type: 'farming', level: 8 },
    description: '奢侈的松露油炒饭，每一口都是享受。'
  },
  {
    id: 'sesame_paste_noodles',
    name: '麻酱凉面',
    ingredients: [
      { itemId: 'sesame_paste', quantity: 1 },
      { itemId: 'wheat_flour', quantity: 2 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 10,
      buff: { type: 'stamina', value: 15, description: '体力消耗-15%（当天）' }
    },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '浓香麻酱配上劲道凉面，夏日消暑佳品。'
  },
  {
    id: 'peanut_tofu_soup',
    name: '花生豆腐羹',
    ingredients: [
      { itemId: 'peanut_tofu', quantity: 1 },
      { itemId: 'peanut', quantity: 2 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 20,
      buff: { type: 'defense', value: 15, description: '受到伤害-15%（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '绵密顺滑的花生豆腐羹，暖胃养身。'
  },
  {
    id: 'pumpkin_preserve_cake',
    name: '南瓜酱饼',
    ingredients: [
      { itemId: 'pumpkin_preserve', quantity: 1 },
      { itemId: 'wheat_flour', quantity: 2 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' }
    },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '香甜的南瓜酱夹心饼，田间劳作的好伙伴。'
  },
  {
    id: 'dried_mushroom_stew',
    name: '干蘑菇炖鸡',
    ingredients: [
      { itemId: 'dried_mushroom', quantity: 2 },
      { itemId: 'egg', quantity: 2 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 30,
      buff: { type: 'mining', value: 1, description: '采矿技能+1（当天）' }
    },
    unlockSource: '烹饪等级6',
    requiredSkill: { type: 'farming', level: 6 },
    description: '干蘑菇的鲜味在慢炖中完全释放。'
  },
  {
    id: 'ginger_green_tea',
    name: '姜茶',
    ingredients: [
      { itemId: 'pickled_ginger', quantity: 1 },
      { itemId: 'green_tea_drink', quantity: 1 }
    ],
    effect: {
      staminaRestore: 25,
      healthRestore: 10,
      buff: { type: 'speed', value: 1, description: '旅行加速+1（当天）' }
    },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '腌姜与绿茶的搭配，暖身又提神。'
  },
  {
    id: 'snow_lotus_honey_paste',
    name: '雪莲蜜膏',
    ingredients: [
      { itemId: 'snow_lotus_honey', quantity: 1 },
      { itemId: 'ginseng_extract', quantity: 1 }
    ],
    effect: {
      staminaRestore: 80,
      healthRestore: 50
    },
    unlockSource: '林老好感「挚友」',
    description: '极品滋补圣品，雪莲蜜与人参精的至高结合。'
  },
  {
    id: 'buffalo_cheese_pizza',
    name: '水牛奶酪烤饼',
    ingredients: [
      { itemId: 'buffalo_cheese', quantity: 1 },
      { itemId: 'wheat_flour', quantity: 2 },
      { itemId: 'chili', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 35,
      buff: { type: 'defense', value: 20, description: '受到伤害-20%（当天）' }
    },
    unlockSource: '烹饪等级7',
    requiredSkill: { type: 'farming', level: 7 },
    description: '厚实的水牛奶酪配上辣椒，战斗前的最佳选择。'
  },
  {
    id: 'yak_cheese_hotpot',
    name: '牦牛奶酪锅',
    ingredients: [
      { itemId: 'yak_cheese', quantity: 1 },
      { itemId: 'potato', quantity: 2 },
      { itemId: 'dried_radish', quantity: 1 }
    ],
    effect: {
      staminaRestore: 65,
      healthRestore: 35,
      buff: { type: 'defense', value: 25, description: '受到伤害-25%（当天）' }
    },
    unlockSource: '烹饪等级8',
    requiredSkill: { type: 'farming', level: 8 },
    description: '浓厚的牦牛奶酪与萝卜干炖煮，冬日暖食。'
  },
  {
    id: 'herbal_healing_soup',
    name: '草药疗伤汤',
    ingredients: [
      { itemId: 'herbal_paste', quantity: 1 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 45
    },
    unlockSource: '林老好感「相熟」',
    description: '草药膏熬成的汤剂，恢复力极强。'
  },
  {
    id: 'chrysanthemum_jelly',
    name: '菊花冻',
    ingredients: [
      { itemId: 'chrysanthemum_honey', quantity: 1 },
      { itemId: 'chrysanthemum_tea', quantity: 1 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 10,
      buff: { type: 'luck', value: 2, description: '幸运+2（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '清凉透亮的菊花冻，吃后心旷神怡。'
  },
  {
    id: 'watermelon_wine_sorbet',
    name: '西瓜酒冰沙',
    ingredients: [
      { itemId: 'watermelon_wine', quantity: 1 },
      { itemId: 'watermelon', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'speed', value: 2, description: '旅行加速+2（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '冰爽的西瓜酒冰沙，夏日消暑极品。'
  },
  {
    id: 'jujube_wine_stew',
    name: '红枣酒炖梨',
    ingredients: [
      { itemId: 'jujube_wine', quantity: 1 },
      { itemId: 'jujube', quantity: 2 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 25,
      buff: { type: 'stamina', value: 20, description: '体力消耗-20%（当天）' }
    },
    unlockSource: '红豆好感「知己」',
    description: '红枣酒炖煮的甜品，补气养血。'
  },
  {
    id: 'osmanthus_wine_chicken',
    name: '桂花酒蒸鸡',
    ingredients: [
      { itemId: 'osmanthus_wine', quantity: 1 },
      { itemId: 'egg', quantity: 2 },
      { itemId: 'ginger', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 30,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '柳娘好感「相熟」',
    description: '桂花酒的幽香渗入鸡肉，雅致非凡。'
  },
  {
    id: 'smoked_eel_rice',
    name: '烟熏鳗鱼饭',
    ingredients: [
      { itemId: 'smoked_eel', quantity: 1 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'sesame_oil', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 25,
      buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' }
    },
    unlockSource: '烹饪等级6',
    requiredSkill: { type: 'farming', level: 6 },
    description: '烟熏鳗鱼铺在热饭上，淋上麻油，鲜美无比。'
  },
  {
    id: 'rapeseed_honey_bread',
    name: '菜花蜜面包',
    ingredients: [
      { itemId: 'rapeseed_honey', quantity: 1 },
      { itemId: 'wheat_flour', quantity: 2 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 10,
      buff: { type: 'luck', value: 1, description: '幸运+1（当天）' }
    },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '菜花蜜香甜的面包，出门采集前来一块。'
  },
  {
    id: 'corn_wine_braised_pork',
    name: '玉米酒烧肉',
    ingredients: [
      { itemId: 'corn_wine', quantity: 1 },
      { itemId: 'corn', quantity: 2 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 30,
      buff: { type: 'defense', value: 15, description: '受到伤害-15%（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '玉米酒焖出的浓香肉菜，力气十足。'
  },
  {
    id: 'ginseng_tea_rice',
    name: '参茶泡饭',
    ingredients: [
      { itemId: 'ginseng_tea', quantity: 1 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 20,
      buff: { type: 'mining', value: 1, description: '采矿技能+1（当天）' }
    },
    unlockSource: '烹饪等级6',
    requiredSkill: { type: 'farming', level: 6 },
    description: '用人参茶泡饭，简单却元气满满。'
  },
  // ── 新增第一批：农产品料理 ──
  {
    id: 'pumpkin_rice_porridge',
    name: '南瓜米粥',
    ingredients: [
      { itemId: 'pumpkin', quantity: 2 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 20 },
    unlockSource: '初始自带',
    description: '金黄南瓜煮成的甜粥，暖胃又好消化。'
  },
  {
    id: 'watermelon_cold_soup',
    name: '西瓜冷汤',
    ingredients: [
      { itemId: 'watermelon', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 20,
      healthRestore: 30,
      buff: { type: 'speed', value: 10, description: '移动耗时-10%（当天）' }
    },
    unlockSource: '夏季限定',
    description: '西瓜加蜂蜜打成冷汤，炎夏里喝一碗透心凉。'
  },
  {
    id: 'sweet_potato_balls',
    name: '番薯糯米球',
    ingredients: [
      { itemId: 'sweet_potato', quantity: 2 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 20 },
    unlockSource: '初始自带',
    description: '番薯与糯米揉成的圆球，外脆内软，饱足感十足。'
  },
  {
    id: 'osmanthus_rice_cake',
    name: '桂花年糕',
    ingredients: [
      { itemId: 'osmanthus', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 15,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '烹饪等级2',
    requiredSkill: { type: 'farming', level: 2 },
    description: '桂花香气渗入年糕，软糯甜蜜，送礼上选。'
  },
  {
    id: 'chili_braised_tofu',
    name: '麻婆豆腐',
    ingredients: [
      { itemId: 'chili', quantity: 2 },
      { itemId: 'silk_tofu', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 20,
      buff: { type: 'defense', value: 10, description: '受到伤害-10%（当天）' }
    },
    unlockSource: '初始自带',
    description: '麻辣滚烫的豆腐，下饭神器，吃完浑身发热。'
  },
  {
    id: 'peach_honey_cake',
    name: '蜜桃糕',
    ingredients: [
      { itemId: 'peach', quantity: 2 },
      { itemId: 'honey', quantity: 1 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 35,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '春季限定',
    description: '鲜桃与蜂蜜做成的糕点，粉嫩诱人，春日馈礼之选。'
  },
  {
    id: 'jujube_porridge',
    name: '红枣粥',
    ingredients: [
      { itemId: 'jujube', quantity: 3 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 45,
      buff: { type: 'stamina', value: 20, description: '体力上限+20（当天）' }
    },
    unlockSource: '初始自带',
    description: '红枣熬的粥，补气养血，每天一碗精神好。'
  },
  {
    id: 'corn_steamed_cake',
    name: '玉米发糕',
    ingredients: [
      { itemId: 'corn', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 15 },
    unlockSource: '初始自带',
    description: '玉米粉发酵蒸成的糕，松软带甜，农家早餐的常客。'
  },
  {
    id: 'radish_stew',
    name: '萝卜炖汤',
    ingredients: [
      { itemId: 'radish', quantity: 3 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 30 },
    unlockSource: '初始自带',
    description: '大白萝卜慢炖出的清汤，素净滋润，去油解腻。'
  },
  {
    id: 'sesame_oil_noodle',
    name: '芝麻油拌面',
    ingredients: [
      { itemId: 'wheat', quantity: 2 },
      { itemId: 'sesame_oil', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 10,
      buff: { type: 'speed', value: 12, description: '移动耗时-12%（当天）' }
    },
    unlockSource: '初始自带',
    description: '芝麻油拌出来的面条，油光锃亮，简单却香得停不下筷子。'
  },
  {
    id: 'chili_sesame_paste',
    name: '辣芝麻酱饭',
    ingredients: [
      { itemId: 'sesame_paste', quantity: 1 },
      { itemId: 'chili', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 15,
      buff: { type: 'speed', value: 10, description: '移动耗时-10%（当天）' }
    },
    unlockSource: '烹饪等级2',
    requiredSkill: { type: 'farming', level: 2 },
    description: '辣椒与芝麻酱拌饭，浓香带劲，吃完脚底生风。'
  },
  // ── 新增第二批：鱼类料理 ──
  {
    id: 'crucian_ginger_soup',
    name: '鲫鱼姜汤',
    ingredients: [
      { itemId: 'crucian', quantity: 1 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 30,
      buff: { type: 'stamina', value: 15, description: '体力上限+15（当天）' }
    },
    unlockSource: '秋月好感「相识」',
    description: '奶白色的鲫鱼汤，去腥滋补，暖胃养身。'
  },
  {
    id: 'bass_steamed',
    name: '清蒸鲈鱼',
    ingredients: [
      { itemId: 'bass', quantity: 1 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 30,
      buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' }
    },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '清蒸出来的鲈鱼，鱼肉细嫩，汤汁鲜美，是钓鱼人的骄傲。'
  },
  {
    id: 'catfish_hotpot',
    name: '鲶鱼火锅',
    ingredients: [
      { itemId: 'catfish', quantity: 1 },
      { itemId: 'chili', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 40,
      buff: { type: 'defense', value: 20, description: '受到伤害-20%（当天）' }
    },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '鲶鱼配辣椒炖成的火锅，汤底鲜辣，寒夜里最暖。'
  },
  {
    id: 'eel_rice_bowl',
    name: '鳗鱼盖饭',
    ingredients: [
      { itemId: 'eel', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 40,
      buff: { type: 'stamina', value: 25, description: '体力上限+25（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '烤鳗鱼盖在白饭上，油脂丰腴，补充体力一流。'
  },
  {
    id: 'mandarin_fish_soup',
    name: '清炖鳜鱼',
    ingredients: [
      { itemId: 'mandarin_fish', quantity: 1 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 50,
      buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' }
    },
    unlockSource: '烹饪等级6',
    requiredSkill: { type: 'farming', level: 6 },
    description: '鳜鱼清炖，鱼肉细嫩无刺，号称"水中贵族"，全面滋养。'
  },
  {
    id: 'sturgeon_sashimi',
    name: '鲟鱼片',
    ingredients: [
      { itemId: 'sturgeon', quantity: 1 },
      { itemId: 'sesame_paste', quantity: 1 }
    ],
    effect: {
      staminaRestore: 65,
      healthRestore: 45,
      buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' }
    },
    unlockSource: '烹饪等级7',
    requiredSkill: { type: 'farming', level: 7 },
    description: '鲟鱼切片蘸芝麻酱，肉质鲜弹，是深水鱼里的极品。'
  },
  {
    id: 'river_crab_feast',
    name: '清蒸河蟹',
    ingredients: [
      { itemId: 'river_crab', quantity: 2 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 40,
      buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' }
    },
    unlockSource: '秋月好感「亲近」',
    description: '秋日里清蒸的河蟹，膏满黄肥，吃完连运气都好了几分。'
  },
  {
    id: 'crab_porridge',
    name: '蟹粥',
    ingredients: [
      { itemId: 'crab', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 50,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '蟹肉蟹黄煨入白粥，鲜味浓郁，宴客当之无愧。'
  },
  {
    id: 'cave_shrimp_stir_fry',
    name: '清炒洞虾',
    ingredients: [
      { itemId: 'cave_shrimp', quantity: 3 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 25,
      buff: { type: 'mining', value: 1, description: '采矿技能+1（当天）' }
    },
    unlockSource: '矿洞探索',
    description: '矿洞深处才有的洞虾，炒出来晶莹透亮，带着矿水的鲜味。'
  },
  {
    id: 'lobster_congee',
    name: '龙虾粥',
    ingredients: [
      { itemId: 'lobster', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 55,
      buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' }
    },
    unlockSource: '烹饪等级7',
    requiredSkill: { type: 'farming', level: 7 },
    description: '龙虾拆肉煨入白粥，金贵的鲜甜在舌尖散开。'
  },
  // ── 新增第三批：矿物/特殊材料 ──
  {
    id: 'quartz_herb_tea',
    name: '石英草药茶',
    ingredients: [
      { itemId: 'quartz', quantity: 2 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 40,
      buff: { type: 'defense', value: 15, description: '受到伤害-15%（当天）' }
    },
    unlockSource: '矿洞探索',
    description: '石英矿泉与草药同煮，清澈见底，护体如玉。'
  },
  {
    id: 'jade_ginseng_elixir',
    name: '翠玉参露',
    ingredients: [
      { itemId: 'jade', quantity: 1 },
      { itemId: 'ginseng', quantity: 2 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 55,
      buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' }
    },
    unlockSource: '矿洞探索',
    description: '翡翠碎粉溶入参露，绿意盎然，滋养全身。'
  },
  {
    id: 'ruby_peach_wine',
    name: '红宝桃酒',
    ingredients: [
      { itemId: 'ruby', quantity: 1 },
      { itemId: 'peach_wine', quantity: 1 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 30,
      buff: { type: 'luck', value: 20, description: '幸运+20%（当天）' }
    },
    unlockSource: '矿洞探索',
    description: '红宝石粉末融入桃花酒，红艳如血，喝下去运气暗涨。'
  },
  {
    id: 'moonstone_sweet_soup',
    name: '月华甜羹',
    ingredients: [
      { itemId: 'moonstone', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 40,
      healthRestore: 50,
      buff: { type: 'luck', value: 25, description: '幸运+25%（当天）' }
    },
    unlockSource: '矿洞探索',
    description: '月光石研碎入甜羹，莹白如月，带着神秘的运气。'
  },
  {
    id: 'obsidian_mushroom_stew',
    name: '黑曜菌汤',
    ingredients: [
      { itemId: 'obsidian', quantity: 1 },
      { itemId: 'wild_mushroom', quantity: 3 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 60,
      buff: { type: 'defense', value: 30, description: '受到伤害-30%（当天）' }
    },
    unlockSource: '矿洞探索',
    description: '黑曜石泡水炖蘑菇，乌黑浓稠，喝下去身体如磐石。'
  },
  {
    id: 'shadow_ore_brew',
    name: '暗矿酿',
    ingredients: [
      { itemId: 'shadow_ore', quantity: 1 },
      { itemId: 'osmanthus_wine', quantity: 1 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 40,
      buff: { type: 'defense', value: 22, description: '受到伤害-22%（当天）' }
    },
    unlockSource: '矿洞探索',
    description: '暗矿的沉重化入桂花酒中，暗香护体，出入矿洞的好伴侣。'
  },
  {
    id: 'crystal_ore_jelly',
    name: '水晶矿冻',
    ingredients: [
      { itemId: 'crystal_ore', quantity: 1 },
      { itemId: 'watermelon', quantity: 2 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 40,
      buff: { type: 'luck', value: 18, description: '幸运+18%（当天）' }
    },
    unlockSource: '矿洞探索',
    description: '水晶矿粉与西瓜汁凝成冻，颜色梦幻，运气也跟着好看。'
  },
  {
    id: 'void_ore_stamina_soup',
    name: '虚空强体汤',
    ingredients: [
      { itemId: 'void_ore', quantity: 1 },
      { itemId: 'ginseng', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 65,
      buff: { type: 'stamina', value: 40, description: '体力上限+40（当天）' }
    },
    unlockSource: '烹饪等级8',
    requiredSkill: { type: 'farming', level: 8 },
    description: '虚空矿与人参同炖，力量在体内轰然展开，体力上限大增。'
  },
  {
    id: 'dragon_jade_wine_soup',
    name: '龙翠御汤',
    ingredients: [
      { itemId: 'dragon_jade', quantity: 1 },
      { itemId: 'jujube_wine', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 55,
      buff: { type: 'all_skills', value: 2, description: '所有技能+2（当天）' }
    },
    unlockSource: '烹饪等级9',
    requiredSkill: { type: 'farming', level: 9 },
    description: '龙翠玉碎入枣酒，翠意漫溢，传说诸艺皆精进。'
  },
  // ── 新增第四批：动物产品料理 ──
  {
    id: 'goat_milk_rice',
    name: '羊乳饭',
    ingredients: [
      { itemId: 'goat_milk', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 30,
      buff: { type: 'stamina', value: 15, description: '体力上限+15（当天）' }
    },
    unlockSource: '拥有山羊',
    description: '羊奶煮出来的饭，奶香渗入米粒，软糯滑腻。'
  },
  {
    id: 'duck_egg_congee',
    name: '皮蛋粥',
    ingredients: [
      { itemId: 'duck_egg', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 25,
      buff: { type: 'luck', value: 12, description: '幸运+12%（当天）' }
    },
    unlockSource: '拥有鸭',
    description: '鸭蛋腌制后煮成粥，独特的风味令人难忘。'
  },
  {
    id: 'goose_egg_cake',
    name: '鹅蛋糕',
    ingredients: [
      { itemId: 'goose_egg', quantity: 1 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 35,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '拥有鹅',
    description: '鹅蛋比鸡蛋大出许多，打出来的糕点分量足，是家里来客的礼物。'
  },
  {
    id: 'rabbit_herb_stew',
    name: '兔肉药炖',
    ingredients: [
      { itemId: 'rabbit_foot', quantity: 1 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 40,
      buff: { type: 'luck', value: 25, description: '幸运+25%（当天）' }
    },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '兔足与草药同炖，传说吃了运气能好上三天。'
  },
  {
    id: 'wool_herb_protection_tea',
    name: '护身茶',
    ingredients: [
      { itemId: 'wool', quantity: 1 },
      { itemId: 'herb', quantity: 3 }
    ],
    effect: {
      staminaRestore: 25,
      healthRestore: 20,
      buff: { type: 'defense', value: 18, description: '受到伤害-18%（当天）' }
    },
    unlockSource: '拥有羊',
    description: '羊毛滤水泡制的草药茶，驱寒护体，出门必备。'
  },
  {
    id: 'camel_milk_corn_bread',
    name: '驼乳玉米饼',
    ingredients: [
      { itemId: 'camel_milk', quantity: 2 },
      { itemId: 'corn', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 35,
      buff: { type: 'speed', value: 15, description: '移动耗时-15%（当天）' }
    },
    unlockSource: '拥有骆驼',
    description: '驼乳揉进玉米面里烙成的饼，耐饥又提神，长途奔走的好伴侣。'
  },
  {
    id: 'truffle_goat_risotto',
    name: '松露羊奶烩',
    ingredients: [
      { itemId: 'truffle', quantity: 1 },
      { itemId: 'goat_milk', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 65,
      healthRestore: 50,
      buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' }
    },
    unlockSource: '烹饪等级7',
    requiredSkill: { type: 'farming', level: 7 },
    description: '松露与羊奶炖成的烩饭，奢华的香气让人神魂颠倒。'
  },
  // ── 新增第五批：NPC 好感 & 节日 ──
  {
    id: 'spring_festival_dumplings',
    name: '春节饺子',
    ingredients: [
      { itemId: 'wheat', quantity: 2 },
      { itemId: 'cabbage', quantity: 2 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: {
      staminaRestore: 55,
      healthRestore: 45,
      buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' }
    },
    unlockSource: '春节限定',
    description: '春节里包的饺子，全家人一起动手，味道里满是人情温暖。'
  },
  {
    id: 'autumn_chrysanthemum_cake',
    name: '秋菊糕',
    ingredients: [
      { itemId: 'chrysanthemum', quantity: 3 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: {
      staminaRestore: 30,
      healthRestore: 40,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '秋季采集',
    description: '菊花清香揉入米糕，秋日限定，清雅不腻。'
  },
  {
    id: 'napa_cabbage_meatball_soup',
    name: '白菜丸子汤',
    ingredients: [
      { itemId: 'napa_cabbage', quantity: 2 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: { staminaRestore: 40, healthRestore: 30 },
    unlockSource: '初始自带',
    description: '白菜与蛋液捏成的丸子汤，清鲜不腻，家常味道。'
  },
  {
    id: 'village_feast',
    name: '乡宴',
    ingredients: [
      { itemId: 'cabbage', quantity: 2 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'egg', quantity: 1 },
      { itemId: 'carp', quantity: 1 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 60,
      buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' }
    },
    unlockSource: '柳村长好感「亲近」',
    description: '乡里人聚在一起的大桌宴，热腾腾的菜肴里都是人情味。'
  },
  {
    id: 'winter_solstice_soup',
    name: '冬至羊肉汤',
    ingredients: [
      { itemId: 'wool', quantity: 1 },
      { itemId: 'radish', quantity: 2 },
      { itemId: 'firewood', quantity: 1 }
    ],
    effect: {
      staminaRestore: 65,
      healthRestore: 50,
      buff: { type: 'defense', value: 20, description: '受到伤害-20%（当天）' }
    },
    unlockSource: '冬季节日',
    description: '冬至必喝的羊肉汤，驱寒暖体，一碗下去整个冬天都不怕冷。'
  },
  {
    id: 'mid_autumn_moon_cake_special',
    name: '秘制月饼',
    ingredients: [
      { itemId: 'osmanthus', quantity: 2 },
      { itemId: 'honey', quantity: 2 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: {
      staminaRestore: 45,
      healthRestore: 35,
      buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' }
    },
    unlockSource: '中秋节限定',
    description: '桂花蜜酿的月饼，皮薄馅厚，中秋送礼最合适。'
  },
  // ── 新增第六批：高端 & 功能性料理 ──
  {
    id: 'stamina_root_elixir',
    name: '元气根露',
    ingredients: [
      { itemId: 'ginseng', quantity: 2 },
      { itemId: 'honey', quantity: 2 }
    ],
    effect: {
      staminaRestore: 80,
      healthRestore: 20,
      buff: { type: 'stamina', value: 50, description: '体力上限+50（当天）' }
    },
    unlockSource: '烹饪等级8',
    requiredSkill: { type: 'farming', level: 8 },
    description: '双份人参与蜂蜜提炼的精华，喝下去元气大涨。'
  },
  {
    id: 'lucky_wild_berry_jam',
    name: '野果幸运酱',
    ingredients: [
      { itemId: 'wild_berry', quantity: 4 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: {
      staminaRestore: 20,
      healthRestore: 25,
      buff: { type: 'luck', value: 22, description: '幸运+22%（当天）' }
    },
    unlockSource: '采集',
    description: '多种野果熬成的杂果酱，越吃运气越好，是采集人的秘密武器。'
  },
  {
    id: 'speed_herb_broth',
    name: '疾行草汤',
    ingredients: [
      { itemId: 'herb', quantity: 3 },
      { itemId: 'ginseng', quantity: 1 }
    ],
    effect: {
      staminaRestore: 35,
      healthRestore: 20,
      buff: { type: 'speed', value: 22, description: '移动耗时-22%（当天）' }
    },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '特定草药配方熬出的汤，喝完整个人都轻盈了。'
  },
  {
    id: 'defense_iron_soup',
    name: '铁甲汤',
    ingredients: [
      { itemId: 'iron_ore', quantity: 2 },
      { itemId: 'wild_mushroom', quantity: 3 }
    ],
    effect: {
      staminaRestore: 50,
      healthRestore: 70,
      buff: { type: 'defense', value: 28, description: '受到伤害-28%（当天）' }
    },
    unlockSource: '矿洞探索',
    description: '铁矿精华熬成的菌汤，坚固如铁盔，挨打不怕。'
  },
  {
    id: 'gold_skill_elixir',
    name: '黄金技巧露',
    ingredients: [
      { itemId: 'gold_ore', quantity: 1 },
      { itemId: 'peach_wine', quantity: 1 }
    ],
    effect: {
      staminaRestore: 60,
      healthRestore: 55,
      buff: { type: 'all_skills', value: 2, description: '所有技能+2（当天）' }
    },
    unlockSource: '烹饪等级9',
    requiredSkill: { type: 'farming', level: 9 },
    description: '黄金矿粉溶入桃酒，传说可以让一切技艺都更精进。'
  },
  {
    id: 'full_harvest_bento',
    name: '丰收便当',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'egg', quantity: 1 },
      { itemId: 'carp', quantity: 1 },
      { itemId: 'cabbage', quantity: 1 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 50,
      buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' }
    },
    unlockSource: '烹饪等级7',
    requiredSkill: { type: 'farming', level: 7 },
    description: '四样食材搭配的豪华便当，荤素均衡，样样都有提升。'
  },
  {
    id: 'immortal_stamina_cake',
    name: '仙桃发糕',
    ingredients: [
      { itemId: 'stamina_fruit', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 100,
      healthRestore: 80,
      buff: { type: 'stamina', value: 60, description: '体力上限+60（当天）' }
    },
    unlockSource: '烹饪等级10',
    requiredSkill: { type: 'farming', level: 10 },
    description: '仙果入糕，蒸出来香气绕梁，一口下去精力充沛一整天。'
  },
  {
    id: 'abyss_bone_roast',
    name: '深渊炙骨',
    ingredients: [
      { itemId: 'bone_fragment', quantity: 2 },
      { itemId: 'firewood', quantity: 2 }
    ],
    effect: {
      staminaRestore: 70,
      healthRestore: 75,
      buff: { type: 'defense', value: 35, description: '受到伤害-35%（当天）' }
    },
    unlockSource: '矿洞深处',
    description: '以深渊古骨慢烤，坚硬之气化入体内，护体如铠甲。'
  },
  {
    id: 'all_skill_supreme_feast',
    name: '至尊盛宴',
    ingredients: [
      { itemId: 'lobster', quantity: 1 },
      { itemId: 'truffle', quantity: 1 },
      { itemId: 'dragon_jade', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: {
      staminaRestore: 120,
      healthRestore: 100,
      buff: { type: 'all_skills', value: 3, description: '所有技能+3（当天）' }
    },
    unlockSource: '烹饪等级10',
    requiredSkill: { type: 'farming', level: 10 },
    description: '汇聚山珍、海味、矿物精华于一桌，传说是仙人方能备齐的材料。'
  },
  // ── 新增第七批：简单家常 ──
  {
    id: 'grilled_corn_butter',
    name: '黄油烤玉米',
    ingredients: [
      { itemId: 'corn', quantity: 2 },
      { itemId: 'goat_milk', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 15, buff: { type: 'speed', value: 8, description: '移动耗时-8%（当天）' } },
    unlockSource: '拥有山羊',
    description: '羊油刷遍烤玉米，焦香甜糯，边走边吃的好零食。'
  },
  {
    id: 'cabbage_egg_stir_fry',
    name: '青菜炒蛋',
    ingredients: [
      { itemId: 'cabbage', quantity: 2 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 20 },
    unlockSource: '初始自带',
    description: '嫩绿菜叶与金黄蛋花炒在一起，最朴素的家常味。'
  },
  {
    id: 'pumpkin_egg_soup',
    name: '南瓜蛋花汤',
    ingredients: [
      { itemId: 'pumpkin', quantity: 2 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 25 },
    unlockSource: '初始自带',
    description: '南瓜甜味与蛋花融合，清淡暖胃，每天早晨的好选择。'
  },
  {
    id: 'sweet_potato_soup',
    name: '番薯姜汤',
    ingredients: [
      { itemId: 'sweet_potato', quantity: 2 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 20, buff: { type: 'defense', value: 8, description: '受到伤害-8%（当天）' } },
    unlockSource: '初始自带',
    description: '番薯与草药同煮，甜中带辛，驱寒效果出乎意料地好。'
  },
  {
    id: 'chili_corn_congee',
    name: '辣味玉米粥',
    ingredients: [
      { itemId: 'corn', quantity: 2 },
      { itemId: 'chili', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 10, buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' } },
    unlockSource: '初始自带',
    description: '玉米粥里加了辣椒，暖身开胃，干农活前喝一碗。'
  },
  {
    id: 'wheat_sesame_roll',
    name: '麻酱花卷',
    ingredients: [
      { itemId: 'wheat', quantity: 2 },
      { itemId: 'sesame_paste', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 10 },
    unlockSource: '初始自带',
    description: '麻酱卷进面团里蒸出来，层层叠叠，芝麻香气浓郁。'
  },
  {
    id: 'radish_egg_pancake',
    name: '萝卜丝饼',
    ingredients: [
      { itemId: 'radish', quantity: 2 },
      { itemId: 'egg', quantity: 1 },
      { itemId: 'wheat', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 20 },
    unlockSource: '初始自带',
    description: '萝卜丝加蛋液烙成的薄饼，外脆内软，简单好吃。'
  },
  {
    id: 'potato_cabbage_stew',
    name: '土豆白菜炖',
    ingredients: [
      { itemId: 'potato', quantity: 2 },
      { itemId: 'cabbage', quantity: 2 }
    ],
    effect: { staminaRestore: 35, healthRestore: 25 },
    unlockSource: '初始自带',
    description: '土豆与白菜慢炖，软烂入味，冬天里最踏实的一锅菜。'
  },
  {
    id: 'peach_osmanthus_tea',
    name: '桃花桂花茶',
    ingredients: [
      { itemId: 'peach', quantity: 1 },
      { itemId: 'osmanthus', quantity: 2 }
    ],
    effect: { staminaRestore: 15, healthRestore: 25, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '春季限定',
    description: '桃花与桂花同泡，花香缭绕，喝一杯心情舒畅，送礼也合适。'
  },
  {
    id: 'honey_osmanthus_wine',
    name: '蜜桂花酒',
    ingredients: [
      { itemId: 'honey', quantity: 2 },
      { itemId: 'osmanthus_wine', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 20, buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' } },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '蜂蜜调入桂花酒，甜蜜芬芳，据说喝了好运不断。'
  },
  // ── 新增第八批：鱼类进阶料理 ──
  {
    id: 'carp_radish_soup',
    name: '鲤鱼萝卜汤',
    ingredients: [
      { itemId: 'carp', quantity: 1 },
      { itemId: 'radish', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 35, buff: { type: 'stamina', value: 15, description: '体力上限+15（当天）' } },
    unlockSource: '秋月好感「相识」',
    description: '鲤鱼与白萝卜同炖，汤色奶白，鲜甜滋补。'
  },
  {
    id: 'eel_rice_noodle',
    name: '鳗鱼米粉',
    ingredients: [
      { itemId: 'eel', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 55, healthRestore: 30, buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' } },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '鳗鱼片铺在细滑米粉上，油脂四溢，钓鱼人的犒劳。'
  },
  {
    id: 'crucian_congee',
    name: '鲫鱼粥',
    ingredients: [
      { itemId: 'crucian', quantity: 1 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 45, healthRestore: 40, buff: { type: 'stamina', value: 20, description: '体力上限+20（当天）' } },
    unlockSource: '秋月好感「亲近」',
    description: '鲫鱼慢熬成粥，奶白浓郁，是产后或病后恢复体力的良方。'
  },
  {
    id: 'bass_corn_chowder',
    name: '鲈鱼玉米浓汤',
    ingredients: [
      { itemId: 'bass', quantity: 1 },
      { itemId: 'corn', quantity: 2 },
      { itemId: 'goat_milk', quantity: 1 }
    ],
    effect: { staminaRestore: 60, healthRestore: 45, buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' } },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '鲈鱼与玉米的搭配意外完美，羊奶提鲜，浓郁顺滑。'
  },
  {
    id: 'river_crab_ginger_soup',
    name: '河蟹姜汤',
    ingredients: [
      { itemId: 'river_crab', quantity: 1 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: { staminaRestore: 45, healthRestore: 50, buff: { type: 'defense', value: 12, description: '受到伤害-12%（当天）' } },
    unlockSource: '秋季限定',
    description: '螃蟹性寒，配草药温补，解馋又护身。'
  },
  {
    id: 'cave_shrimp_porridge',
    name: '洞虾鲜粥',
    ingredients: [
      { itemId: 'cave_shrimp', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 50, healthRestore: 35, buff: { type: 'mining', value: 1, description: '采矿技能+1（当天）' } },
    unlockSource: '矿洞探索',
    description: '矿洞特有的洞虾鲜味足，煮出来的粥带着独特的矿泉香气。'
  },
  {
    id: 'catfish_pumpkin_stew',
    name: '鲶鱼南瓜炖',
    ingredients: [
      { itemId: 'catfish', quantity: 1 },
      { itemId: 'pumpkin', quantity: 2 }
    ],
    effect: { staminaRestore: 55, healthRestore: 40, buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' } },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '鲶鱼肉嫩，南瓜甜糯，两者同炖相辅相成。'
  },
  // ── 新增第九批：加工品料理 ──
  {
    id: 'vinegar_fish_cabbage',
    name: '醋溜鱼白菜',
    ingredients: [
      { itemId: 'carp', quantity: 1 },
      { itemId: 'rice_vinegar', quantity: 1 },
      { itemId: 'cabbage', quantity: 1 }
    ],
    effect: { staminaRestore: 45, healthRestore: 30, buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' } },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '醋香提鲜，鱼肉更嫩，白菜吸饱汤汁，酸中有鲜。'
  },
  {
    id: 'wine_braised_carp',
    name: '酒焖鲤鱼',
    ingredients: [
      { itemId: 'carp', quantity: 1 },
      { itemId: 'peach_wine', quantity: 1 }
    ],
    effect: { staminaRestore: 55, healthRestore: 40, buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' } },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '桃花酒焖出来的鲤鱼，酒香与鱼鲜交融，是待客的好菜。'
  },
  {
    id: 'corn_wine_pork',
    name: '玉米酒炖',
    ingredients: [
      { itemId: 'corn_wine', quantity: 1 },
      { itemId: 'potato', quantity: 2 }
    ],
    effect: { staminaRestore: 60, healthRestore: 45, buff: { type: 'defense', value: 15, description: '受到伤害-15%（当天）' } },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '玉米酒焖出的根茎菜，酒气全化，满口浓香，力气充沛。'
  },
  {
    id: 'truffle_oil_noodle',
    name: '松露油拌面',
    ingredients: [
      { itemId: 'truffle_oil', quantity: 1 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 50, healthRestore: 30, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '烹饪等级6',
    requiredSkill: { type: 'farming', level: 6 },
    description: '几滴松露油便让面条变得奢华，香气钻进每一根面条里。'
  },
  {
    id: 'sesame_oil_cold_dish',
    name: '麻油凉菜',
    ingredients: [
      { itemId: 'sesame_oil', quantity: 1 },
      { itemId: 'cabbage', quantity: 3 }
    ],
    effect: { staminaRestore: 20, healthRestore: 15, buff: { type: 'speed', value: 10, description: '移动耗时-10%（当天）' } },
    unlockSource: '初始自带',
    description: '麻油拌的爽口凉菜，清鲜提神，夏日首选。'
  },
  {
    id: 'goat_cheese_flatbread',
    name: '羊酪煎饼',
    ingredients: [
      { itemId: 'goat_cheese', quantity: 1 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 50, healthRestore: 35, buff: { type: 'stamina', value: 20, description: '体力上限+20（当天）' } },
    unlockSource: '拥有山羊',
    description: '羊酪融化在煎饼里，外酥内软带奶香，扛饿顶时。'
  },
  {
    id: 'date_wine_soup',
    name: '枣酒暖汤',
    ingredients: [
      { itemId: 'date_wine', quantity: 1 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: { staminaRestore: 35, healthRestore: 50, buff: { type: 'stamina', value: 25, description: '体力上限+25（当天）' } },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '枣酒与草药同煮，甜香暖身，体力恢复极快。'
  },
  {
    id: 'osmanthus_wine_congee',
    name: '桂花酒粥',
    ingredients: [
      { itemId: 'osmanthus_wine', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 30, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '桂花酒熬入粥中，清甜芬芳，喝完余香绕口，人见人爱。'
  },
  {
    id: 'mulberry_honey_cake',
    name: '桑蜜糕',
    ingredients: [
      { itemId: 'mulberry', quantity: 3 },
      { itemId: 'honey', quantity: 1 },
      { itemId: 'rice', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 35, buff: { type: 'luck', value: 12, description: '幸运+12%（当天）' } },
    unlockSource: '夏季采集',
    description: '桑葚与蜂蜜糅入米糕，紫红晶亮，甜蜜带着野生的气息。'
  },
  {
    id: 'wild_berry_ginseng_tonic',
    name: '野果参补汤',
    ingredients: [
      { itemId: 'wild_berry', quantity: 3 },
      { itemId: 'ginseng', quantity: 1 }
    ],
    effect: { staminaRestore: 45, healthRestore: 50, buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' } },
    unlockSource: '采集',
    description: '野果的酸甜中和了人参的苦涩，熬出的汤既滋补又好入口。'
  },
  // ── 新增第十批：动物副产品进阶 ──
  {
    id: 'duck_egg_yolk_rice',
    name: '蛋黄炒饭',
    ingredients: [
      { itemId: 'duck_egg', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 45, healthRestore: 25, buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' } },
    unlockSource: '拥有鸭',
    description: '鸭蛋黄炒饭，色泽金黄，颗颗分明，比鸡蛋炒饭更香浓。'
  },
  {
    id: 'buffalo_milk_porridge',
    name: '水牛奶粥',
    ingredients: [
      { itemId: 'buffalo_milk', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 50, healthRestore: 35, buff: { type: 'stamina', value: 20, description: '体力上限+20（当天）' } },
    unlockSource: '拥有水牛',
    description: '水牛奶脂肪含量高，熬出来的粥格外浓郁扎实，补力一流。'
  },
  {
    id: 'yak_milk_hot_drink',
    name: '牦牛奶热饮',
    ingredients: [
      { itemId: 'yak_milk', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 30, buff: { type: 'defense', value: 12, description: '受到伤害-12%（当天）' } },
    unlockSource: '拥有牦牛',
    description: '高原上的牦牛奶，热喝一碗驱寒御风，浓香扑鼻。'
  },
  {
    id: 'donkey_milk_cake',
    name: '驴奶酥饼',
    ingredients: [
      { itemId: 'donkey_milk', quantity: 1 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 45, healthRestore: 30, buff: { type: 'speed', value: 10, description: '移动耗时-10%（当天）' } },
    unlockSource: '拥有驴',
    description: '驴奶调成的酥饼，细腻甜润，据说古代贵族才喝得上驴奶。'
  },
  {
    id: 'goose_egg_steamed',
    name: '蒸鹅蛋',
    ingredients: [
      { itemId: 'goose_egg', quantity: 1 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 45, healthRestore: 35, buff: { type: 'stamina', value: 15, description: '体力上限+15（当天）' } },
    unlockSource: '拥有鹅',
    description: '鹅蛋个头大，蒸出来一整碗，嫩滑饱腹，体力大补。'
  },
  {
    id: 'quail_egg_soup',
    name: '鹌鹑蛋汤',
    ingredients: [
      { itemId: 'quail_egg', quantity: 3 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 45, buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' } },
    unlockSource: '拥有鹌鹑',
    description: '小小的鹌鹑蛋煮成一锅汤，口感细腻，据说多吃能带来好运。'
  },
  {
    id: 'pigeon_egg_rice',
    name: '鸽蛋饭',
    ingredients: [
      { itemId: 'pigeon_egg', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 50, healthRestore: 40, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '拥有鸽子',
    description: '珍贵的鸽蛋盖在白饭上，清鲜不腥，是待客的高档食材。'
  },
  {
    id: 'silkie_egg_congee',
    name: '乌鸡蛋粥',
    ingredients: [
      { itemId: 'silkie_egg', quantity: 1 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'ginseng', quantity: 1 }
    ],
    effect: { staminaRestore: 55, healthRestore: 60, buff: { type: 'stamina', value: 30, description: '体力上限+30（当天）' } },
    unlockSource: '拥有乌骨鸡',
    description: '乌鸡蛋与人参同熬，黑色的粥看起来玄妙，滋补效果却是一绝。'
  },
  {
    id: 'ostrich_egg_omelette',
    name: '鸵鸟蛋摊',
    ingredients: [
      { itemId: 'ostrich_egg', quantity: 1 },
      { itemId: 'chili', quantity: 1 }
    ],
    effect: { staminaRestore: 80, healthRestore: 50, buff: { type: 'defense', value: 20, description: '受到伤害-20%（当天）' } },
    unlockSource: '拥有鸵鸟',
    description: '一个鸵鸟蛋够摊一大锅，加上辣椒，够全村人吃一顿。'
  },
  // ── 新增第十一批：技能解锁进阶料理 ──
  {
    id: 'cactus_wine_marinade',
    name: '仙人掌酒卤',
    ingredients: [
      { itemId: 'cactus_wine', quantity: 1 },
      { itemId: 'egg', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 30, buff: { type: 'mining', value: 1, description: '采矿技能+1（当天）' } },
    unlockSource: '沙漠探索',
    description: '仙人掌酒卤出的蛋，异域风味，带着沙漠的辛辣气息。'
  },
  {
    id: 'winter_bamboo_shoot_rice',
    name: '冬笋饭',
    ingredients: [
      { itemId: 'winter_bamboo_shoot', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 30, buff: { type: 'speed', value: 10, description: '移动耗时-10%（当天）' } },
    unlockSource: '冬季采集',
    description: '冬笋脆爽，与白米同炊，笋香渗透每粒米，清新不腻。'
  },
  {
    id: 'dried_mushroom_soup',
    name: '干菌汤',
    ingredients: [
      { itemId: 'dried_mushroom', quantity: 2 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 45, buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' } },
    unlockSource: '采集',
    description: '晒干的菌子泡发后慢炖，鲜味浓缩得比新鲜菌还要强。'
  },
  {
    id: 'dried_berry_oat',
    name: '野果干麦粥',
    ingredients: [
      { itemId: 'dried_berry', quantity: 2 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 30, healthRestore: 25, buff: { type: 'luck', value: 10, description: '幸运+10%（当天）' } },
    unlockSource: '初始自带',
    description: '晒干的野果与麦片同煮，酸甜夹在麦香里，运气也随之而来。'
  },
  {
    id: 'rice_vinegar_cold_noodle',
    name: '醋汁凉面',
    ingredients: [
      { itemId: 'rice_vinegar', quantity: 1 },
      { itemId: 'wheat', quantity: 2 },
      { itemId: 'sesame_paste', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 15, buff: { type: 'speed', value: 18, description: '移动耗时-18%（当天）' } },
    unlockSource: '夏季限定',
    description: '醋汁与芝麻酱拌凉面，酸香开胃，吃完整个人都轻盈起来。'
  },
  {
    id: 'peanut_tofu_salad',
    name: '花生豆腐拌',
    ingredients: [
      { itemId: 'peanut_tofu', quantity: 1 },
      { itemId: 'sesame_oil', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 30, buff: { type: 'defense', value: 10, description: '受到伤害-10%（当天）' } },
    unlockSource: '初始自带',
    description: '花生豆腐拌上麻油，清淡而有韧劲，是素食里的蛋白质担当。'
  },
  {
    id: 'silk_tofu_seaweed',
    name: '嫩豆腐汤',
    ingredients: [
      { itemId: 'silk_tofu', quantity: 1 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: { staminaRestore: 25, healthRestore: 40, buff: { type: 'stamina', value: 12, description: '体力上限+12（当天）' } },
    unlockSource: '初始自带',
    description: '丝绢豆腐入汤，细嫩如布，草药提鲜，清清淡淡却养人。'
  },
  {
    id: 'sesame_paste_dip',
    name: '芝麻酱蘸蔬',
    ingredients: [
      { itemId: 'sesame_paste', quantity: 1 },
      { itemId: 'radish', quantity: 2 }
    ],
    effect: { staminaRestore: 20, healthRestore: 20, buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' } },
    unlockSource: '初始自带',
    description: '芝麻酱浓稠香醇，用来蘸生萝卜，脆与糯的反差妙不可言。'
  },
  // ── 新增第十二批：家常蔬食 ──
  {
    id: 'chives_egg_pancake',
    name: '韭菜蛋饼',
    ingredients: [
      { itemId: 'chives', quantity: 2 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 20, buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' } },
    unlockSource: '初始自带',
    description: '韭菜与蛋烙成饼，绿中带金，是春天最应季的早餐。'
  },
  {
    id: 'chrysanthemum_porridge',
    name: '菊花粥',
    ingredients: [
      { itemId: 'chrysanthemum', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 25, healthRestore: 30, buff: { type: 'luck', value: 12, description: '幸运+12%（当天）' } },
    unlockSource: '秋季采集',
    description: '菊花浮在粥面，清香淡雅，据说有明目安神之效。'
  },
  {
    id: 'napa_cabbage_tofu',
    name: '大白菜炖豆腐',
    ingredients: [
      { itemId: 'napa_cabbage', quantity: 2 },
      { itemId: 'silk_tofu', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 30 },
    unlockSource: '初始自带',
    description: '大白菜与嫩豆腐同炖，清淡鲜美，冬日里的暖心菜。'
  },
  {
    id: 'watermelon_honey_drink',
    name: '西瓜蜜饮',
    ingredients: [
      { itemId: 'watermelon', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 20, healthRestore: 25, buff: { type: 'speed', value: 12, description: '移动耗时-12%（当天）' } },
    unlockSource: '夏季限定',
    description: '西瓜汁加蜂蜜调成的消暑饮，甜凉清爽，身轻如燕。'
  },
  {
    id: 'pumpkin_chive_dumplings',
    name: '南瓜韭菜饺',
    ingredients: [
      { itemId: 'pumpkin', quantity: 1 },
      { itemId: 'chives', quantity: 2 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 50, healthRestore: 35, buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' } },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '南瓜甜、韭菜香，包进薄皮里，一口一个满足。'
  },
  {
    id: 'jujube_chrysanthemum_tea',
    name: '枣菊茶',
    ingredients: [
      { itemId: 'jujube', quantity: 2 },
      { itemId: 'chrysanthemum', quantity: 2 }
    ],
    effect: { staminaRestore: 20, healthRestore: 35, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '秋季限定',
    description: '红枣与菊花合泡，暗红金黄相映，养生又讨喜。'
  },
  {
    id: 'corn_potato_soup',
    name: '玉米土豆汤',
    ingredients: [
      { itemId: 'corn', quantity: 2 },
      { itemId: 'potato', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 30 },
    unlockSource: '初始自带',
    description: '玉米清甜，土豆绵软，一锅炖出来朴实耐喝。'
  },
  {
    id: 'chili_corn_mochi',
    name: '辣玉米糍粑',
    ingredients: [
      { itemId: 'corn', quantity: 2 },
      { itemId: 'chili', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 15, buff: { type: 'defense', value: 10, description: '受到伤害-10%（当天）' } },
    unlockSource: '初始自带',
    description: '玉米捣成糍粑加辣椒，外焦里糯，越嚼越辣越上瘾。'
  },
  {
    id: 'sweet_potato_ginger_cake',
    name: '番薯姜饼',
    ingredients: [
      { itemId: 'sweet_potato', quantity: 2 },
      { itemId: 'herb', quantity: 1 },
      { itemId: 'wheat', quantity: 1 }
    ],
    effect: { staminaRestore: 40, healthRestore: 30, buff: { type: 'defense', value: 12, description: '受到伤害-12%（当天）' } },
    unlockSource: '初始自带',
    description: '番薯与姜揉进面团里烙出来，软糯带辣，驱寒暖胃。'
  },
  {
    id: 'radish_sesame_bun',
    name: '萝卜芝麻包',
    ingredients: [
      { itemId: 'radish', quantity: 2 },
      { itemId: 'sesame', quantity: 1 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 20 },
    unlockSource: '初始自带',
    description: '萝卜丝馅加芝麻撒面，蒸出来松软饱腹，馅料清爽不腻。'
  },
  // ── 新增第十三批：特殊材料烹调 ──
  {
    id: 'truffle_egg_congee',
    name: '松露蛋粥',
    ingredients: [
      { itemId: 'truffle', quantity: 1 },
      { itemId: 'egg', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 60, healthRestore: 40, buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' } },
    unlockSource: '采集等级6',
    requiredSkill: { type: 'foraging', level: 6 },
    description: '松露刨入粥中，香气无可比拟，是顶级待客珍品。'
  },
  {
    id: 'ginseng_rice_soup',
    name: '人参米汤',
    ingredients: [
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'rice', quantity: 3 }
    ],
    effect: { staminaRestore: 40, healthRestore: 60, buff: { type: 'stamina', value: 35, description: '体力上限+35（当天）' } },
    unlockSource: '采集等级4',
    requiredSkill: { type: 'foraging', level: 4 },
    description: '人参慢炖入米汤，温补而不燥，体虚者的良方。'
  },
  {
    id: 'honey_sesame_candy',
    name: '蜜芝麻糖',
    ingredients: [
      { itemId: 'honey', quantity: 2 },
      { itemId: 'sesame', quantity: 2 }
    ],
    effect: { staminaRestore: 25, healthRestore: 20, buff: { type: 'luck', value: 18, description: '幸运+18%（当天）' } },
    unlockSource: '初始自带',
    description: '蜂蜜裹满芝麻熬成糖块，甜香脆口，吃完口齿留香。'
  },
  {
    id: 'bamboo_rice_stuffed',
    name: '竹节糯米饭',
    ingredients: [
      { itemId: 'bamboo_shoot', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 45, healthRestore: 30, buff: { type: 'speed', value: 15, description: '移动耗时-15%（当天）' } },
    unlockSource: '采集',
    description: '糯米装入竹节里蒸，吸满竹香，清新雅致。'
  },
  {
    id: 'wild_berry_pancake',
    name: '野果煎饼',
    ingredients: [
      { itemId: 'wild_berry', quantity: 3 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 35, healthRestore: 25, buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' } },
    unlockSource: '初始自带',
    description: '野果碾碎揉进面团烙出来，带着野地里的酸甜气。'
  },
  {
    id: 'mulberry_rice_cake',
    name: '桑椹年糕',
    ingredients: [
      { itemId: 'mulberry', quantity: 3 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 30, healthRestore: 30, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '夏季采集',
    description: '桑椹汁染紫的年糕，软糯带酸甜，是夏日特有的颜色。'
  },
  // ── 新增第十四批：鱼类多样化 ──
  {
    id: 'pike_sour_soup',
    name: '酸汤鱼片',
    ingredients: [
      { itemId: 'pike', quantity: 1 },
      { itemId: 'rice_vinegar', quantity: 1 },
      { itemId: 'chili', quantity: 1 }
    ],
    effect: { staminaRestore: 55, healthRestore: 35, buff: { type: 'fishing', value: 1, description: '钓鱼技能+1（当天）' } },
    unlockSource: '烹饪等级5',
    requiredSkill: { type: 'farming', level: 5 },
    description: '酸辣汤底与鱼片完美搭配，酸爽开胃，是钓鱼人的庆功宴。'
  },
  {
    id: 'sturgeon_steamed',
    name: '清蒸鲟鱼',
    ingredients: [
      { itemId: 'sturgeon', quantity: 1 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 65, healthRestore: 50, buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' } },
    unlockSource: '钓鱼等级7',
    requiredSkill: { type: 'fishing', level: 7 },
    description: '鲟鱼以清蒸最能保留原味，肉质细腻，是难得的珍馐。'
  },
  {
    id: 'mandarin_fish_wine',
    name: '醉鳜鱼',
    ingredients: [
      { itemId: 'mandarin_fish', quantity: 1 },
      { itemId: 'peach_wine', quantity: 1 }
    ],
    effect: { staminaRestore: 60, healthRestore: 45, buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' } },
    unlockSource: '钓鱼等级6',
    requiredSkill: { type: 'fishing', level: 6 },
    description: '桃花酒腌制的鳜鱼，酒香入骨，是待客的上品。'
  },
  {
    id: 'crab_corn_bisque',
    name: '蟹肉玉米浓汤',
    ingredients: [
      { itemId: 'crab', quantity: 1 },
      { itemId: 'corn', quantity: 2 },
      { itemId: 'goat_milk', quantity: 1 }
    ],
    effect: { staminaRestore: 65, healthRestore: 50, buff: { type: 'stamina', value: 25, description: '体力上限+25（当天）' } },
    unlockSource: '烹饪等级6',
    requiredSkill: { type: 'farming', level: 6 },
    description: '蟹肉融入玉米浓汤，鲜甜奢华，是秋日里最难忘的滋味。'
  },
  {
    id: 'lobster_herb_butter',
    name: '草药龙虾',
    ingredients: [
      { itemId: 'lobster', quantity: 1 },
      { itemId: 'herb', quantity: 2 }
    ],
    effect: { staminaRestore: 80, healthRestore: 60, buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' } },
    unlockSource: '钓鱼等级8',
    requiredSkill: { type: 'fishing', level: 8 },
    description: '龙虾配草药，简单的烹法最能衬托食材本身的高贵。'
  },
  {
    id: 'crystal_shrimp_soup',
    name: '水晶虾汤',
    ingredients: [
      { itemId: 'crystal_shrimp', quantity: 2 },
      { itemId: 'radish', quantity: 1 }
    ],
    effect: { staminaRestore: 45, healthRestore: 40, buff: { type: 'luck', value: 20, description: '幸运+20%（当天）' } },
    unlockSource: '钓鱼等级5',
    requiredSkill: { type: 'fishing', level: 5 },
    description: '水晶虾透明如玻璃，煮成汤后鲜美无比，好运连连。'
  },
  // ── 新增第十五批：饮品系列 ──
  {
    id: 'chive_flower_vinegar',
    name: '韭花醋饮',
    ingredients: [
      { itemId: 'chives', quantity: 2 },
      { itemId: 'rice_vinegar', quantity: 1 }
    ],
    effect: { staminaRestore: 20, healthRestore: 20, buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' } },
    unlockSource: '初始自带',
    description: '韭花浸入米醋，清辛爽口，据说能使劲道大增。'
  },
  {
    id: 'osmanthus_jujube_milk',
    name: '桂枣奶饮',
    ingredients: [
      { itemId: 'osmanthus', quantity: 1 },
      { itemId: 'jujube', quantity: 2 },
      { itemId: 'goat_milk', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 40, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '秋季限定',
    description: '桂花与红枣融入羊奶，甜香绵密，是秋天最温柔的饮品。'
  },
  {
    id: 'honey_ginger_tea',
    name: '蜜姜茶',
    ingredients: [
      { itemId: 'honey', quantity: 2 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 20, healthRestore: 30, buff: { type: 'defense', value: 15, description: '受到伤害-15%（当天）' } },
    unlockSource: '初始自带',
    description: '蜂蜜与姜草合泡，一口下去从喉咙暖到胃，感冒初期的良药。'
  },
  {
    id: 'bamboo_shoot_soup',
    name: '鲜笋清汤',
    ingredients: [
      { itemId: 'bamboo_shoot', quantity: 2 },
      { itemId: 'herb', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 25, buff: { type: 'speed', value: 10, description: '移动耗时-10%（当天）' } },
    unlockSource: '春季采集',
    description: '鲜竹笋煮成的清汤，脆嫩鲜美，春意盎然。'
  },
  {
    id: 'peach_honey_sorbet',
    name: '桃蜜冰饮',
    ingredients: [
      { itemId: 'peach', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 20, healthRestore: 25, buff: { type: 'luck', value: 15, description: '幸运+15%（当天）' } },
    unlockSource: '夏季限定',
    description: '桃子捣成泥加蜂蜜冰镇，粉嫩清甜，是盛夏的幸运饮。'
  },
  // ── 新增第十六批：精英料理 ──
  {
    id: 'truffle_egg_rolls',
    name: '松露蛋卷',
    ingredients: [
      { itemId: 'truffle', quantity: 1 },
      { itemId: 'egg', quantity: 3 }
    ],
    effect: { staminaRestore: 65, healthRestore: 45, buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' } },
    unlockSource: '采集等级7',
    requiredSkill: { type: 'foraging', level: 7 },
    description: '蛋液煎薄、松露卷入，入口即化，技艺与食材皆一流。'
  },
  {
    id: 'ginseng_jujube_congee',
    name: '参枣粥',
    ingredients: [
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'jujube', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 55, healthRestore: 65, buff: { type: 'stamina', value: 40, description: '体力上限+40（当天）' } },
    unlockSource: '采集等级5',
    requiredSkill: { type: 'foraging', level: 5 },
    description: '人参与红枣同熬，是古法滋补之方，体力大增。'
  },
  {
    id: 'truffle_rice_platter',
    name: '松露米盘',
    ingredients: [
      { itemId: 'truffle', quantity: 1 },
      { itemId: 'rice', quantity: 3 },
      { itemId: 'egg', quantity: 1 }
    ],
    effect: { staminaRestore: 70, healthRestore: 50, buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' } },
    unlockSource: '采集等级8',
    requiredSkill: { type: 'foraging', level: 8 },
    description: '松露刨片铺满米盘，奢华而克制，适合最重要的场合。'
  },
  {
    id: 'nine_layer_cake',
    name: '九层千层糕',
    ingredients: [
      { itemId: 'rice', quantity: 3 },
      { itemId: 'jujube', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 60, healthRestore: 50, buff: { type: 'luck', value: 20, description: '幸运+20%（当天）' } },
    unlockSource: '节日食谱',
    description: '九层糕象征步步高升，红枣与蜜糖逐层相间，甜蜜而有仪式感。'
  },
  {
    id: 'fortune_dumpling_soup',
    name: '元宝汤圆',
    ingredients: [
      { itemId: 'rice', quantity: 2 },
      { itemId: 'sesame_paste', quantity: 1 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 45, healthRestore: 40, buff: { type: 'giftBonus', value: 3, description: '送礼好感×3（当天）' } },
    unlockSource: '节日食谱',
    description: '元宝形状的汤圆，芝麻蜜馅滑溜，财运与甜蜜一起滚来。'
  },
  {
    id: 'moonlight_osmanthus_cake',
    name: '月光桂花糕',
    ingredients: [
      { itemId: 'osmanthus', quantity: 3 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 40, healthRestore: 45, buff: { type: 'luck', value: 25, description: '幸运+25%（当天）' } },
    unlockSource: '中秋节日',
    description: '月明夜里做的桂花糕，香气随风飘散，据说月神也爱吃。'
  },
  {
    id: 'dragon_fruit_pudding',
    name: '火龙果冻',
    ingredients: [
      { itemId: 'watermelon', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 35, buff: { type: 'speed', value: 15, description: '移动耗时-15%（当天）' } },
    unlockSource: '夏季限定',
    description: '以西瓜模拟制成的红色果冻，夏日里最清爽的甜点。'
  },
  {
    id: 'winter_tonic_soup',
    name: '冬至进补汤',
    ingredients: [
      { itemId: 'winter_bamboo_shoot', quantity: 1 },
      { itemId: 'ginseng', quantity: 1 },
      { itemId: 'jujube', quantity: 2 }
    ],
    effect: { staminaRestore: 65, healthRestore: 70, buff: { type: 'stamina', value: 45, description: '体力上限+45（当天）' } },
    unlockSource: '冬季节日',
    description: '冬至进补，冬笋、人参、红枣三味合一，一碗下去一冬安康。'
  },
  // ── 新增第十七批：矿工菜肴 ──
  {
    id: 'iron_powder_noodle',
    name: '铁粉荞面',
    ingredients: [
      { itemId: 'iron_ore', quantity: 1 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 45, healthRestore: 30, buff: { type: 'mining', value: 1, description: '采矿技能+1（当天）' } },
    unlockSource: '采矿等级3',
    requiredSkill: { type: 'mining', level: 3 },
    description: '铁矿粉微量调入面团，面条带着淡淡的矿物质气息，矿工专属。'
  },
  {
    id: 'gold_flake_rice',
    name: '金箔饭',
    ingredients: [
      { itemId: 'gold_ore', quantity: 1 },
      { itemId: 'rice', quantity: 3 }
    ],
    effect: { staminaRestore: 55, healthRestore: 40, buff: { type: 'luck', value: 30, description: '幸运+30%（当天）' } },
    unlockSource: '采矿等级6',
    requiredSkill: { type: 'mining', level: 6 },
    description: '金粉点缀白饭，奢华至极，据说吃了财运滚滚来。'
  },
  {
    id: 'cave_mushroom_stew',
    name: '洞菌炖肉',
    ingredients: [
      { itemId: 'dried_mushroom', quantity: 2 },
      { itemId: 'cave_shrimp', quantity: 1 }
    ],
    effect: { staminaRestore: 55, healthRestore: 45, buff: { type: 'mining', value: 1, description: '采矿技能+1（当天）' } },
    unlockSource: '矿洞探索',
    description: '矿洞干菌与洞虾同炖，带着地下世界独特的鲜味。'
  },
  {
    id: 'shadow_ore_tonic',
    name: '暗影矿补汤',
    ingredients: [
      { itemId: 'shadow_ore', quantity: 1 },
      { itemId: 'herb', quantity: 2 },
      { itemId: 'ginseng', quantity: 1 }
    ],
    effect: { staminaRestore: 60, healthRestore: 50, buff: { type: 'defense', value: 22, description: '受到伤害-22%（当天）' } },
    unlockSource: '采矿等级7',
    requiredSkill: { type: 'mining', level: 7 },
    description: '暗影矿的神秘力量与草药融合，喝下去仿佛披了一层黑甲。'
  },
  // ── 新增第十八批：组合料理 ──
  {
    id: 'five_grain_congee',
    name: '五谷杂粮粥',
    ingredients: [
      { itemId: 'rice', quantity: 1 },
      { itemId: 'corn', quantity: 1 },
      { itemId: 'wheat', quantity: 1 },
      { itemId: 'sesame', quantity: 1 }
    ],
    effect: { staminaRestore: 50, healthRestore: 40, buff: { type: 'all_skills', value: 1, description: '所有技能+1（当天）' } },
    unlockSource: '烹饪等级4',
    requiredSkill: { type: 'farming', level: 4 },
    description: '五种谷物各有其香，合而成粥，是每天最踏实的开始。'
  },
  {
    id: 'triple_egg_bowl',
    name: '三蛋盖饭',
    ingredients: [
      { itemId: 'egg', quantity: 1 },
      { itemId: 'duck_egg', quantity: 1 },
      { itemId: 'quail_egg', quantity: 2 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 65, healthRestore: 50, buff: { type: 'farming', value: 1, description: '农耕技能+1（当天）' } },
    unlockSource: '拥有鸡鸭鹌鹑',
    description: '三种蛋齐聚一碗，色泽各异，口感丰富，是养禽人的炫耀之作。'
  },
  {
    id: 'flower_rice_ball',
    name: '花香饭团',
    ingredients: [
      { itemId: 'osmanthus', quantity: 1 },
      { itemId: 'chrysanthemum', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 35, healthRestore: 30, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '秋季限定',
    description: '桂花与菊花揉入饭团，清香随手心温度散发，是最应景的礼物。'
  },
  {
    id: 'farmers_feast',
    name: '农家大丰收',
    ingredients: [
      { itemId: 'cabbage', quantity: 2 },
      { itemId: 'potato', quantity: 2 },
      { itemId: 'radish', quantity: 2 },
      { itemId: 'egg', quantity: 2 }
    ],
    effect: { staminaRestore: 80, healthRestore: 60, buff: { type: 'farming', value: 2, description: '农耕技能+2（当天）' } },
    unlockSource: '烹饪等级6',
    requiredSkill: { type: 'farming', level: 6 },
    description: '把地里收的一切都摆上桌，满满当当，这就是丰收的味道。'
  },
  {
    id: 'fishermans_platter',
    name: '渔人满载',
    ingredients: [
      { itemId: 'carp', quantity: 1 },
      { itemId: 'river_crab', quantity: 1 },
      { itemId: 'rice', quantity: 2 }
    ],
    effect: { staminaRestore: 80, healthRestore: 60, buff: { type: 'fishing', value: 2, description: '钓鱼技能+2（当天）' } },
    unlockSource: '钓鱼等级6',
    requiredSkill: { type: 'fishing', level: 6 },
    description: '鱼与蟹同盘，配上白饭，是每次大丰收后的庆功宴。'
  },
  {
    id: 'explorers_ration',
    name: '探险家口粮',
    ingredients: [
      { itemId: 'dried_berry', quantity: 2 },
      { itemId: 'dried_mushroom', quantity: 1 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 50, healthRestore: 35, buff: { type: 'speed', value: 20, description: '移动耗时-20%（当天）' } },
    unlockSource: '采集',
    description: '轻便耐储的干粮，塞进包里就出发，步伐比平时更轻盈。'
  },
  {
    id: 'foragers_trail_mix',
    name: '采集者杂粮棒',
    ingredients: [
      { itemId: 'wild_berry', quantity: 2 },
      { itemId: 'sesame', quantity: 2 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 40, healthRestore: 30, buff: { type: 'luck', value: 22, description: '幸运+22%（当天）' } },
    unlockSource: '采集',
    description: '野果、芝麻、蜂蜜压成棒，随采随食，大自然的馈赠集合体。'
  },
  {
    id: 'banquet_cold_platter',
    name: '宴席冷盘',
    ingredients: [
      { itemId: 'silk_tofu', quantity: 1 },
      { itemId: 'sesame_oil', quantity: 1 },
      { itemId: 'chives', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 25, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '烹饪等级3',
    requiredSkill: { type: 'farming', level: 3 },
    description: '凉拌豆腐配麻油韭花，清清爽爽端上宴席，开胃第一品。'
  },
  // ── 新增第十九批：收尾八品 ──
  {
    id: 'sesame_corn_cake',
    name: '芝麻玉米饼',
    ingredients: [
      { itemId: 'corn', quantity: 2 },
      { itemId: 'sesame', quantity: 2 }
    ],
    effect: { staminaRestore: 35, healthRestore: 20 },
    unlockSource: '初始自带',
    description: '玉米面加芝麻烙出来的圆饼，香脆实在，干活前垫底最好。'
  },
  {
    id: 'chili_tofu_pot',
    name: '辣椒豆腐煲',
    ingredients: [
      { itemId: 'chili', quantity: 2 },
      { itemId: 'silk_tofu', quantity: 1 }
    ],
    effect: { staminaRestore: 35, healthRestore: 20, buff: { type: 'defense', value: 8, description: '受到伤害-8%（当天）' } },
    unlockSource: '初始自带',
    description: '辣椒与嫩豆腐同煮，红白相间，辣味渗进豆腐里，过瘾。'
  },
  {
    id: 'jujube_wheat_steamed',
    name: '枣糕',
    ingredients: [
      { itemId: 'jujube', quantity: 3 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 35, buff: { type: 'giftBonus', value: 2, description: '送礼好感×2（当天）' } },
    unlockSource: '秋季限定',
    description: '红枣嵌在麦糕里，甜而不腻，是送长辈最讨喜的礼物。'
  },
  {
    id: 'honey_peanut_tofu',
    name: '蜜汁花生豆腐',
    ingredients: [
      { itemId: 'peanut_tofu', quantity: 1 },
      { itemId: 'honey', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 30, buff: { type: 'luck', value: 10, description: '幸运+10%（当天）' } },
    unlockSource: '初始自带',
    description: '花生豆腐淋上蜂蜜，甜中带香，是午后最温柔的小食。'
  },
  {
    id: 'mushroom_wheat_bun',
    name: '蘑菇包',
    ingredients: [
      { itemId: 'dried_mushroom', quantity: 2 },
      { itemId: 'wheat', quantity: 2 }
    ],
    effect: { staminaRestore: 40, healthRestore: 25 },
    unlockSource: '采集',
    description: '干菌泡发剁碎包入面团蒸，鲜香的菌味被包裹得严严实实。'
  },
  {
    id: 'watermelon_rind_stir_fry',
    name: '炒西瓜皮',
    ingredients: [
      { itemId: 'watermelon', quantity: 2 },
      { itemId: 'chili', quantity: 1 }
    ],
    effect: { staminaRestore: 20, healthRestore: 15, buff: { type: 'speed', value: 8, description: '移动耗时-8%（当天）' } },
    unlockSource: '初始自带',
    description: '西瓜皮切丝爆炒，加点辣椒，清脆爽口，物尽其用。'
  },
  {
    id: 'rice_vinegar_potato',
    name: '醋溜土豆丝',
    ingredients: [
      { itemId: 'potato', quantity: 2 },
      { itemId: 'rice_vinegar', quantity: 1 }
    ],
    effect: { staminaRestore: 25, healthRestore: 15, buff: { type: 'speed', value: 10, description: '移动耗时-10%（当天）' } },
    unlockSource: '初始自带',
    description: '土豆丝切得细，下锅快炒加醋，酸脆爽口，百吃不厌。'
  },
  {
    id: 'osmanthus_honey_steamed_pear',
    name: '桂蜜炖梨',
    ingredients: [
      { itemId: 'osmanthus', quantity: 1 },
      { itemId: 'honey', quantity: 1 },
      { itemId: 'jujube', quantity: 1 }
    ],
    effect: { staminaRestore: 30, healthRestore: 45, buff: { type: 'stamina', value: 20, description: '体力上限+20（当天）' } },
    unlockSource: '秋季限定',
    description: '桂花与蜂蜜同炖，红枣点缀，入口即化，秋日润燥第一方。'
  }
]

/** 根据ID获取食谱 */
export const getRecipeById = (id: string): RecipeDef | undefined => {
  return RECIPES.find(r => r.id === id)
}
