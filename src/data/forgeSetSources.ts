/** 套装缺件时的图纸来源提示（§9.13 摘要） */
export const FORGE_SET_SOURCE_HINTS: Record<string, string> = {
  miner_set: '孙铁匠友好礼 + 矿洞 1～39 层掉落',
  fisher_set: '孙铁匠商店 + 秋月友好',
  merchant_set: '孙铁匠商店 + 友好',
  harvest_set: '矿洞 60～79 层 + 农任务',
  dragon_warrior_set: '锻造 Lv8+；矿洞 40～59 层',
  obsidian_set: '矿洞 20～59 层掉落',
  phoenix_set: '锻造 Lv12+；矿洞 60～79 层',
  shadow_set: '暗影层怪物掉落单品图',
  forager_set: '林老友好 + 浅层矿洞',
  mud_king_set: '泥岩巨兽 Boss 首杀',
  frost_queen_set: '冰霜女王 Boss 首杀',
  lava_lord_set: '熔岩君主 Boss 首杀',
  crystal_king_set: '水晶之王 Boss 首杀',
  shadow_sovereign_set: '暗影君主 Boss 首杀',
  dragon_king_set: '深渊龙王 Boss 首杀',
  master_smith_set: '孙铁匠挚友礼',
  hearth_set: '客栈厨师友好',
  tea_zen_set: '茶庄任务链',
  escort_set: '云飞友好',
  furnace_set: '阿石友好',
  shrine_harvest_set: '祠堂任务',
  guild_champion_set: '公会勇士（不可锻造）'
}

export const getSetSourceHint = (setId: string): string =>
  FORGE_SET_SOURCE_HINTS[setId] ?? '锻造图纸或 Boss / NPC 赠送'
