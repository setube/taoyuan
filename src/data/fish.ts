import type { FishDef, FishingLocation } from '@/types'
import { FISH_WEIGHTS } from './fishWeights'

type FishDefDraft = Omit<FishDef, 'minWeight' | 'maxWeight'>

/** 钓鱼地点定义 */
export const FISHING_LOCATIONS: { id: FishingLocation; name: string; description: string }[] = [
  { id: 'creek', name: '溪流', description: '村旁清澈的小溪，适合新手垂钓。' },
  { id: 'pond', name: '池塘', description: '宁静的村中池塘，水面平静如镜。' },
  { id: 'river', name: '江河', description: '湍急的大河，有更大的鱼出没。' },
  { id: 'mine', name: '矿洞暗河', description: '矿洞深处的地下水域，鱼类不受季节影响。' },
  { id: 'waterfall', name: '瀑布', description: '山间瀑布下的深潭，只有好手才能在此收获。' },
  { id: 'swamp', name: '沼泽', description: '桃源乡外的湿地，栖息着奇特的水生生物。' }
]

/** 所有鱼类定义 (61种) */
const FISH_DRAFT: FishDefDraft[] = [
  // ==================== 溪流 (creek) — 15 种 ====================
  {
    id: 'crucian',
    name: '鲫鱼',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 15,
    description: '最常见的淡水鱼，新手的好伙伴。',
    location: 'creek',
    miniGameSpeed: 0.8,
    miniGameDirChange: 0.02
  },
  {
    id: 'carp',
    name: '鲤鱼',
    season: ['spring', 'summer'],
    weather: ['sunny'],
    difficulty: 'easy',
    sellPrice: 25,
    description: '晴天在溪边常能见到的鱼。',
    location: 'creek',
    miniGameSpeed: 1.0,
    miniGameDirChange: 0.03
  },
  {
    id: 'silver_carp',
    name: '银鲢',
    season: ['spring', 'summer'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 20,
    description: '常见的银鲢鱼。',
    location: 'creek',
    miniGameSpeed: 1.2,
    miniGameDirChange: 0.03
  },
  {
    id: 'ice_fish',
    name: '冰鱼',
    season: ['winter'],
    weather: ['snowy'],
    difficulty: 'normal',
    sellPrice: 55,
    description: '冰冷水域中的小鱼。',
    location: 'creek',
    miniGameSpeed: 1.8,
    miniGameDirChange: 0.04
  },
  {
    id: 'dragonfish',
    name: '龙鱼',
    season: ['summer'],
    weather: ['stormy'],
    difficulty: 'legendary',
    sellPrice: 500,
    description: '暴风雨中才会出现的传说之鱼。',
    location: 'creek',
    miniGameSpeed: 5.0,
    miniGameDirChange: 0.1
  },
  // 溪流新增
  {
    id: 'minnow',
    name: '白条鱼',
    season: ['spring', 'summer', 'autumn'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 10,
    description: '最不起眼的溪鱼，三两成群。',
    location: 'creek',
    miniGameSpeed: 0.6,
    miniGameDirChange: 0.02
  },
  {
    id: 'creek_chub',
    name: '溪哥鱼',
    season: ['spring', 'autumn'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 18,
    description: '溪流中灵活的小鱼。',
    location: 'creek',
    miniGameSpeed: 1.3,
    miniGameDirChange: 0.04
  },
  {
    id: 'loach',
    name: '泥鳅',
    season: ['summer', 'autumn'],
    weather: ['rainy'],
    difficulty: 'easy',
    sellPrice: 22,
    description: '雨后活跃的溪间泥鳅。',
    location: 'creek',
    miniGameSpeed: 1.5,
    miniGameDirChange: 0.05
  },
  {
    id: 'rainbow_trout',
    name: '虹鳟',
    season: ['spring', 'summer'],
    weather: ['sunny'],
    difficulty: 'normal',
    sellPrice: 45,
    description: '阳光下闪着七彩光泽的鳟鱼。',
    location: 'creek',
    miniGameSpeed: 2.2,
    miniGameDirChange: 0.05
  },
  {
    id: 'creek_perch',
    name: '溪鲈',
    season: ['autumn', 'winter'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 50,
    description: '深秋溪流中的溪鲈。',
    location: 'creek',
    miniGameSpeed: 1.8,
    miniGameDirChange: 0.03
  },
  {
    id: 'stone_loach',
    name: '石斑鱼',
    season: ['summer'],
    weather: ['sunny', 'windy'],
    difficulty: 'normal',
    sellPrice: 55,
    description: '躲在溪石缝隙间的斑纹鱼。',
    location: 'creek',
    miniGameSpeed: 1.5,
    miniGameDirChange: 0.06
  },
  {
    id: 'creek_shrimp',
    name: '溪虾',
    season: ['spring', 'summer', 'autumn'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 30,
    description: '清澈溪水中的小虾。',
    location: 'creek',
    miniGameSpeed: 2.0,
    miniGameDirChange: 0.06
  },
  {
    id: 'creek_salmon',
    name: '溪鲑',
    season: ['autumn'],
    weather: ['rainy', 'windy'],
    difficulty: 'normal',
    sellPrice: 65,
    description: '秋天洄游的溪鲑。',
    location: 'creek',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.03
  },
  {
    id: 'golden_perch',
    name: '金鲈',
    season: ['summer'],
    weather: ['sunny'],
    difficulty: 'hard',
    sellPrice: 110,
    description: '罕见的金色鲈鱼，价值不菲。',
    location: 'creek',
    miniGameSpeed: 3.5,
    miniGameDirChange: 0.05
  },
  {
    id: 'creek_king',
    name: '溪霸',
    season: ['spring', 'autumn'],
    weather: ['rainy'],
    difficulty: 'hard',
    sellPrice: 140,
    description: '溪流中的王者，力大无穷。',
    location: 'creek',
    miniGameSpeed: 3.5,
    miniGameDirChange: 0.04
  },

  // ==================== 池塘 (pond) — 10 种 ====================
  {
    id: 'grass_carp',
    name: '草鱼',
    season: ['summer', 'autumn'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 40,
    description: '体型较大的淡水鱼。',
    location: 'pond',
    miniGameSpeed: 1.5,
    miniGameDirChange: 0.03
  },
  {
    id: 'koi',
    name: '锦鲤',
    season: ['spring'],
    weather: ['sunny'],
    difficulty: 'hard',
    sellPrice: 120,
    description: '华丽的锦鲤，非常珍贵。',
    location: 'pond',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.08
  },
  {
    id: 'golden_carp',
    name: '金鲤',
    season: ['spring'],
    weather: ['sunny'],
    difficulty: 'hard',
    sellPrice: 150,
    description: '闪闪发光的金色鲤鱼。',
    location: 'pond',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.09
  },
  {
    id: 'golden_turtle',
    name: '金甲龟',
    season: ['autumn'],
    weather: ['sunny'],
    difficulty: 'legendary',
    sellPrice: 450,
    description: '传说中背负金甲的灵龟，据说见者有福。',
    location: 'pond',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.12
  },
  // 池塘新增
  {
    id: 'pond_snail',
    name: '田螺',
    season: ['spring', 'summer', 'autumn'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 12,
    description: '池塘底部的田螺。',
    location: 'pond',
    miniGameSpeed: 0.5,
    miniGameDirChange: 0.01
  },
  {
    id: 'crucian_pond',
    name: '塘鲫',
    season: ['spring', 'summer'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 18,
    description: '池塘里肥美的鲫鱼。',
    location: 'pond',
    miniGameSpeed: 0.9,
    miniGameDirChange: 0.02
  },
  {
    id: 'red_tail',
    name: '红尾鱼',
    season: ['summer', 'autumn'],
    weather: ['sunny'],
    difficulty: 'easy',
    sellPrice: 25,
    description: '尾鳍红艳的观赏鱼。',
    location: 'pond',
    miniGameSpeed: 1.1,
    miniGameDirChange: 0.03
  },
  {
    id: 'lotus_carp',
    name: '荷花鲤',
    season: ['summer'],
    weather: ['sunny', 'rainy'],
    difficulty: 'normal',
    sellPrice: 65,
    description: '在荷叶间穿梭的鲤鱼。',
    location: 'pond',
    miniGameSpeed: 2.2,
    miniGameDirChange: 0.06
  },
  {
    id: 'pond_turtle',
    name: '乌龟',
    season: ['summer', 'autumn'],
    weather: ['sunny'],
    difficulty: 'normal',
    sellPrice: 50,
    description: '晒太阳的池塘小龟。',
    location: 'pond',
    miniGameSpeed: 1.0,
    miniGameDirChange: 0.02
  },
  {
    id: 'moon_fish',
    name: '月光鱼',
    season: ['autumn'],
    weather: ['windy'],
    difficulty: 'normal',
    sellPrice: 75,
    description: '秋风起时浮出水面的银白鱼。',
    location: 'pond',
    miniGameSpeed: 1.8,
    miniGameDirChange: 0.05
  },

  // ==================== 江河 (river) — 12 种 ====================
  {
    id: 'bass',
    name: '鲈鱼',
    season: ['autumn'],
    weather: ['rainy', 'stormy'],
    difficulty: 'normal',
    sellPrice: 60,
    description: '秋雨中出没的美味鱼。',
    location: 'river',
    miniGameSpeed: 2.0,
    miniGameDirChange: 0.04
  },
  {
    id: 'catfish',
    name: '鲶鱼',
    season: ['summer'],
    weather: ['rainy', 'stormy'],
    difficulty: 'normal',
    sellPrice: 45,
    description: '雨天活跃的鲶鱼。',
    location: 'river',
    miniGameSpeed: 2.2,
    miniGameDirChange: 0.05
  },
  {
    id: 'sturgeon',
    name: '鲟鱼',
    season: ['summer', 'autumn'],
    weather: ['sunny'],
    difficulty: 'hard',
    sellPrice: 130,
    description: '体型庞大的古老鱼种。',
    location: 'river',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.03
  },
  {
    id: 'mandarin_fish',
    name: '桂花鱼',
    season: ['autumn'],
    weather: ['sunny'],
    difficulty: 'normal',
    sellPrice: 70,
    description: '肉质鲜美的桂花鱼。',
    location: 'river',
    miniGameSpeed: 2.3,
    miniGameDirChange: 0.05
  },
  // 江河新增
  {
    id: 'green_fish',
    name: '青鱼',
    season: ['spring', 'summer', 'autumn'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 28,
    description: '江河中常见的大型淡水鱼。',
    location: 'river',
    miniGameSpeed: 1.0,
    miniGameDirChange: 0.02
  },
  {
    id: 'bighead_carp',
    name: '鳙鱼',
    season: ['summer', 'autumn'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 30,
    description: '头大身圆的鳙鱼。',
    location: 'river',
    miniGameSpeed: 0.8,
    miniGameDirChange: 0.02
  },
  {
    id: 'pike',
    name: '鳡鱼',
    season: ['summer'],
    weather: ['sunny', 'windy'],
    difficulty: 'normal',
    sellPrice: 65,
    description: '凶猛的淡水掠食者。',
    location: 'river',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.03
  },
  {
    id: 'knife_fish',
    name: '刀鱼',
    season: ['spring'],
    weather: ['windy', 'rainy'],
    difficulty: 'normal',
    sellPrice: 75,
    description: '身形如刀，春汛时洄游。',
    location: 'river',
    miniGameSpeed: 2.8,
    miniGameDirChange: 0.03
  },
  {
    id: 'river_crab',
    name: '河蟹',
    season: ['autumn'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 80,
    description: '秋高蟹肥，膏满黄多。',
    location: 'river',
    miniGameSpeed: 1.5,
    miniGameDirChange: 0.07
  },
  {
    id: 'river_eel',
    name: '河鳗',
    season: ['summer', 'autumn'],
    weather: ['rainy'],
    difficulty: 'hard',
    sellPrice: 100,
    description: '在雨夜活跃的河中鳗鱼。',
    location: 'river',
    miniGameSpeed: 3.5,
    miniGameDirChange: 0.07
  },
  {
    id: 'chinese_sturgeon',
    name: '中华鲟',
    season: ['spring', 'autumn'],
    weather: ['rainy', 'stormy'],
    difficulty: 'hard',
    sellPrice: 180,
    description: '珍稀的大型洄游鱼类。',
    location: 'river',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.03
  },
  {
    id: 'river_dragon',
    name: '江龙',
    season: ['summer'],
    weather: ['stormy'],
    difficulty: 'legendary',
    sellPrice: 550,
    description: '暴风雨中跃出江面的传说巨鱼。',
    location: 'river',
    miniGameSpeed: 5.5,
    miniGameDirChange: 0.05
  },

  // ==================== 矿洞暗河 (mine) — 8 种 ====================
  {
    id: 'cave_loach',
    name: '矿洞泥鳅',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 35,
    description: '矿洞地下水中的泥鳅。',
    location: 'mine',
    miniGameSpeed: 2.0,
    miniGameDirChange: 0.05
  },
  {
    id: 'cave_blindfish',
    name: '洞穴盲鱼',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'hard',
    sellPrice: 100,
    description: '矿洞深处的珍稀盲鱼。',
    location: 'mine',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.09
  },
  // 矿洞新增
  {
    id: 'glowfish',
    name: '荧光鱼',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 25,
    description: '在黑暗中发出微光的小鱼。',
    location: 'mine',
    miniGameSpeed: 0.8,
    miniGameDirChange: 0.03
  },
  {
    id: 'stone_crab',
    name: '石蟹',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 30,
    description: '生活在矿洞岩石间的小蟹。',
    location: 'mine',
    miniGameSpeed: 0.7,
    miniGameDirChange: 0.02
  },
  {
    id: 'crystal_shrimp',
    name: '水晶虾',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 60,
    description: '通体透明的矿洞虾，仿佛水晶。',
    location: 'mine',
    miniGameSpeed: 2.2,
    miniGameDirChange: 0.06
  },
  {
    id: 'lava_snail',
    name: '熔岩螺',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 70,
    description: '靠近熔岩层的耐热螺类。',
    location: 'mine',
    miniGameSpeed: 1.2,
    miniGameDirChange: 0.03
  },
  {
    id: 'shadow_fish',
    name: '暗影鱼',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'hard',
    sellPrice: 120,
    description: '暗影裂隙中出没的幽暗鱼。',
    location: 'mine',
    miniGameSpeed: 3.5,
    miniGameDirChange: 0.08
  },
  {
    id: 'abyss_leviathan',
    name: '深渊巨蟒',
    season: ['spring', 'summer', 'autumn', 'winter'],
    weather: ['any'],
    difficulty: 'legendary',
    sellPrice: 800,
    description: '矿洞最深处的远古巨兽，无人得见其全貌。',
    location: 'mine',
    miniGameSpeed: 4.5,
    miniGameDirChange: 0.15
  },

  // ==================== 瀑布 (waterfall) — 8 种 ====================
  {
    id: 'eel',
    name: '鳗鱼',
    season: ['summer', 'autumn'],
    weather: ['rainy'],
    difficulty: 'hard',
    sellPrice: 85,
    description: '滑溜的鳗鱼，不易捕获。',
    location: 'waterfall',
    miniGameSpeed: 3.5,
    miniGameDirChange: 0.08
  },
  // 瀑布新增
  {
    id: 'mountain_minnow',
    name: '山溪鱼',
    season: ['spring', 'summer', 'autumn'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 20,
    description: '瀑布水潭边的小鱼。',
    location: 'waterfall',
    miniGameSpeed: 1.0,
    miniGameDirChange: 0.03
  },
  {
    id: 'rock_fish',
    name: '岩鱼',
    season: ['spring', 'summer'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 50,
    description: '藏在瀑布岩石间的鱼。',
    location: 'waterfall',
    miniGameSpeed: 1.8,
    miniGameDirChange: 0.04
  },
  {
    id: 'waterfall_crab',
    name: '山溪蟹',
    season: ['summer', 'autumn'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 55,
    description: '瀑布下方岩缝中的螃蟹。',
    location: 'waterfall',
    miniGameSpeed: 1.5,
    miniGameDirChange: 0.06
  },
  {
    id: 'torrent_fish',
    name: '激流鱼',
    season: ['spring', 'summer'],
    weather: ['rainy', 'stormy'],
    difficulty: 'normal',
    sellPrice: 60,
    description: '在激流中逆行的强壮鱼。',
    location: 'waterfall',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.03
  },
  {
    id: 'flying_fish',
    name: '飞鱼',
    season: ['summer'],
    weather: ['windy'],
    difficulty: 'normal',
    sellPrice: 70,
    description: '能跃出水面在风中滑翔的奇鱼。',
    location: 'waterfall',
    miniGameSpeed: 3.0,
    miniGameDirChange: 0.07
  },
  {
    id: 'rock_eel',
    name: '岩鳗',
    season: ['autumn', 'winter'],
    weather: ['rainy', 'snowy'],
    difficulty: 'hard',
    sellPrice: 130,
    description: '盘踞在瀑布深潭岩洞中的大鳗。',
    location: 'waterfall',
    miniGameSpeed: 3.0,
    miniGameDirChange: 0.04
  },
  {
    id: 'jade_dragon',
    name: '翠龙',
    season: ['spring'],
    weather: ['rainy'],
    difficulty: 'legendary',
    sellPrice: 600,
    description: '春雨中化现于瀑布的翠色灵龙。',
    location: 'waterfall',
    miniGameSpeed: 4.5,
    miniGameDirChange: 0.07
  },

  // ==================== 沼泽 (swamp) — 7 种 ====================
  {
    id: 'giant_salamander',
    name: '娃娃鱼',
    season: ['winter'],
    weather: ['snowy'],
    difficulty: 'legendary',
    sellPrice: 300,
    description: '传说中的神秘生物，只在冬雪中出现。',
    location: 'swamp',
    miniGameSpeed: 2.0,
    miniGameDirChange: 0.1
  },
  // 沼泽新增
  {
    id: 'mud_loach',
    name: '沼泽泥鳅',
    season: ['spring', 'summer', 'autumn'],
    weather: ['any'],
    difficulty: 'easy',
    sellPrice: 15,
    description: '泥浆中翻滚的泥鳅。',
    location: 'swamp',
    miniGameSpeed: 1.2,
    miniGameDirChange: 0.04
  },
  {
    id: 'swamp_frog',
    name: '蛙鱼',
    season: ['summer', 'autumn'],
    weather: ['rainy'],
    difficulty: 'normal',
    sellPrice: 35,
    description: '半蛙半鱼的奇特生物。',
    location: 'swamp',
    miniGameSpeed: 2.0,
    miniGameDirChange: 0.08
  },
  {
    id: 'yellow_eel',
    name: '黄鳝',
    season: ['summer'],
    weather: ['rainy', 'stormy'],
    difficulty: 'normal',
    sellPrice: 50,
    description: '雨后钻出泥洞的黄鳝。',
    location: 'swamp',
    miniGameSpeed: 2.3,
    miniGameDirChange: 0.05
  },
  {
    id: 'snapping_turtle',
    name: '鳄龟',
    season: ['summer', 'autumn'],
    weather: ['any'],
    difficulty: 'normal',
    sellPrice: 65,
    description: '脾气暴躁的沼泽龟。',
    location: 'swamp',
    miniGameSpeed: 1.5,
    miniGameDirChange: 0.06
  },
  {
    id: 'swamp_catfish',
    name: '沼鲶',
    season: ['spring', 'summer'],
    weather: ['rainy', 'stormy'],
    difficulty: 'normal',
    sellPrice: 55,
    description: '沼泽深处的巨型鲶鱼。',
    location: 'swamp',
    miniGameSpeed: 1.8,
    miniGameDirChange: 0.04
  },
  {
    id: 'miasma_fish',
    name: '瘴气鱼',
    season: ['autumn', 'winter'],
    weather: ['rainy', 'windy'],
    difficulty: 'hard',
    sellPrice: 110,
    description: '在瘴气弥漫的深沼中出没的诡异鱼。',
    location: 'swamp',
    miniGameSpeed: 2.5,
    miniGameDirChange: 0.09
  },
  {
    id: 'ancient_newt',
    name: '远古蝾螈',
    season: ['spring', 'winter'],
    weather: ['snowy', 'rainy'],
    difficulty: 'hard',
    sellPrice: 160,
    description: '据说从远古时代就生活在沼泽中的蝾螈。',
    location: 'swamp',
    miniGameSpeed: 2.0,
    miniGameDirChange: 0.08
  }
]

export const FISH: FishDef[] = FISH_DRAFT.map(f => ({
  ...f,
  ...FISH_WEIGHTS[f.id]!
}))

/** 根据ID获取鱼 */
export const getFishById = (id: string): FishDef | undefined => {
  return FISH.find(f => f.id === id)
}

/** 获取当前季节、天气和地点可钓到的鱼 */
export const getAvailableFish = (season: string, weather: string, location?: FishingLocation): FishDef[] => {
  return FISH.filter(f => {
    const seasonMatch = f.season.includes(season as any)
    const weatherMatch = f.weather.includes('any') || f.weather.includes(weather as any)
    const locationMatch = !location || (f.location ?? 'creek') === location
    return seasonMatch && weatherMatch && locationMatch
  })
}
