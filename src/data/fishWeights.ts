/**
 * 鱼类重量区间（斤，1 位小数）
 * 现实鱼类参考常见渔获体型；虚构/传说鱼按名称与描述设定
 */
export const FISH_WEIGHTS: Record<string, { minWeight: number; maxWeight: number }> = {
  // —— 溪流 ——
  /** 鲫鱼：常见0.1–0.7kg */
  crucian: { minWeight: 0.2, maxWeight: 1.2 },
  /** 鲤鱼：溪边个体1–4kg */
  carp: { minWeight: 1.0, maxWeight: 8.0 },
  /** 鲢鱼：成鱼2–6kg */
  silver_carp: { minWeight: 2.0, maxWeight: 12.0 },
  /** 冰鱼（南极鱼）：体小 */
  ice_fish: { minWeight: 0.1, maxWeight: 0.5 },
  /** 龙鱼（观赏龙鱼/传说）：2–7kg */
  dragonfish: { minWeight: 6.0, maxWeight: 18.0 },
  /** 白条鱼：几两重 */
  minnow: { minWeight: 0.1, maxWeight: 0.4 },
  /** 溪哥（宽鳍鱲）：1–3两 */
  creek_chub: { minWeight: 0.2, maxWeight: 0.8 },
  /** 泥鳅：2–8两 */
  loach: { minWeight: 0.1, maxWeight: 0.5 },
  /** 虹鳟：0.5–3kg */
  rainbow_trout: { minWeight: 1.0, maxWeight: 5.0 },
  /** 溪鲈（河鲈）：0.3–1.5kg */
  creek_perch: { minWeight: 0.5, maxWeight: 2.5 },
  /** 溪间石斑状小鱼 */
  stone_loach: { minWeight: 0.4, maxWeight: 1.8 },
  /** 溪虾：单只几钱 */
  creek_shrimp: { minWeight: 0.1, maxWeight: 0.3 },
  /** 溪鲑（小型鲑科洄游） */
  creek_salmon: { minWeight: 2.0, maxWeight: 6.0 },
  /** 金鲈：稀有鲈鱼 */
  golden_perch: { minWeight: 1.5, maxWeight: 4.0 },
  /** 溪霸：溪流王者（虚构） */
  creek_king: { minWeight: 3.0, maxWeight: 8.0 },

  // —— 池塘 ——
  /** 草鱼：2–15kg */
  grass_carp: { minWeight: 3.0, maxWeight: 18.0 },
  /** 锦鲤：1–10kg */
  koi: { minWeight: 2.0, maxWeight: 12.0 },
  /** 金鲤：偏大鲤鱼 */
  golden_carp: { minWeight: 3.0, maxWeight: 15.0 },
  /** 金甲龟：灵龟（中华草龟级） */
  golden_turtle: { minWeight: 4.0, maxWeight: 16.0 },
  /** 田螺 */
  pond_snail: { minWeight: 0.1, maxWeight: 0.4 },
  /** 塘养鲫鱼：偏肥 */
  crucian_pond: { minWeight: 0.6, maxWeight: 2.5 },
  /** 红尾观赏鱼 */
  red_tail: { minWeight: 0.3, maxWeight: 1.2 },
  /** 荷花鲤 */
  lotus_carp: { minWeight: 2.5, maxWeight: 10.0 },
  /** 乌龟：0.5–2kg */
  pond_turtle: { minWeight: 1.0, maxWeight: 5.0 },
  /** 月光鱼（虚构银鱼） */
  moon_fish: { minWeight: 0.3, maxWeight: 1.5 },

  // —— 江河 ——
  /** 鲈鱼（花鲈等）：0.5–3kg */
  bass: { minWeight: 1.0, maxWeight: 5.0 },
  /** 鲶鱼：1–10kg */
  catfish: { minWeight: 2.0, maxWeight: 15.0 },
  /** 鲟鱼：10–50kg+ */
  sturgeon: { minWeight: 10.0, maxWeight: 40.0 },
  /** 桂花鱼（鳜鱼）：0.5–2kg */
  mandarin_fish: { minWeight: 1.0, maxWeight: 4.0 },
  /** 青鱼：2–20kg */
  green_fish: { minWeight: 5.0, maxWeight: 25.0 },
  /** 鳙鱼：3–15kg */
  bighead_carp: { minWeight: 6.0, maxWeight: 25.0 },
  /** 鳡鱼：5–30kg */
  pike: { minWeight: 8.0, maxWeight: 35.0 },
  /** 刀鱼（刀鲚）：体极细长，半斤内 */
  knife_fish: { minWeight: 0.2, maxWeight: 0.6 },
  /** 河蟹：3–6两/只 */
  river_crab: { minWeight: 0.3, maxWeight: 1.2 },
  /** 河鳗：1–5kg */
  river_eel: { minWeight: 2.0, maxWeight: 8.0 },
  /** 中华鲟：大型洄游，百公斤级（游戏缩放） */
  chinese_sturgeon: { minWeight: 15.0, maxWeight: 50.0 },
  /** 江龙：传说巨鱼（虚构） */
  river_dragon: { minWeight: 20.0, maxWeight: 45.0 },

  // —— 矿洞暗河 ——
  cave_loach: { minWeight: 0.1, maxWeight: 0.4 },
  /** 洞穴盲鱼：几厘米长 */
  cave_blindfish: { minWeight: 0.1, maxWeight: 0.3 },
  /** 荧光鱼（虚构） */
  glowfish: { minWeight: 0.1, maxWeight: 0.5 },
  stone_crab: { minWeight: 0.2, maxWeight: 0.8 },
  crystal_shrimp: { minWeight: 0.1, maxWeight: 0.3 },
  /** 熔岩螺（虚构耐热螺） */
  lava_snail: { minWeight: 0.2, maxWeight: 0.6 },
  /** 暗影鱼（虚构） */
  shadow_fish: { minWeight: 1.0, maxWeight: 4.0 },
  /** 深渊巨蟒：远古巨兽（虚构） */
  abyss_leviathan: { minWeight: 25.0, maxWeight: 80.0 },

  // —— 瀑布 ——
  /** 鳗鱼：1–4kg */
  eel: { minWeight: 2.0, maxWeight: 8.0 },
  mountain_minnow: { minWeight: 0.2, maxWeight: 0.8 },
  rock_fish: { minWeight: 0.5, maxWeight: 2.5 },
  waterfall_crab: { minWeight: 0.3, maxWeight: 1.0 },
  torrent_fish: { minWeight: 1.5, maxWeight: 5.0 },
  /** 飞鱼：0.2–0.5kg */
  flying_fish: { minWeight: 0.3, maxWeight: 1.2 },
  /** 岩鳗：大鳗 */
  rock_eel: { minWeight: 3.0, maxWeight: 12.0 },
  /** 翠龙：灵龙（虚构） */
  jade_dragon: { minWeight: 15.0, maxWeight: 35.0 },

  // —— 沼泽 ——
  /** 娃娃鱼（大鲵）：10–30kg+ */
  giant_salamander: { minWeight: 8.0, maxWeight: 30.0 },
  mud_loach: { minWeight: 0.1, maxWeight: 0.5 },
  /** 蛙鱼（虚构两栖） */
  swamp_frog: { minWeight: 0.5, maxWeight: 2.0 },
  /** 黄鳝：2两–1kg */
  yellow_eel: { minWeight: 0.3, maxWeight: 2.0 },
  /** 鳄龟：5–30kg */
  snapping_turtle: { minWeight: 8.0, maxWeight: 35.0 },
  /** 沼鲶：大型鲶鱼 */
  swamp_catfish: { minWeight: 5.0, maxWeight: 20.0 },
  /** 瘴气鱼（虚构） */
  miasma_fish: { minWeight: 1.5, maxWeight: 5.0 },
  /** 远古蝾螈（虚构） */
  ancient_newt: { minWeight: 3.0, maxWeight: 12.0 }
}
