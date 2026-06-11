/** 许愿井口令（每条口令每个存档仅可领取一次） */
export interface WishWellCode {
  secret: string
  reward: number
  flag: string
}

export const WISH_WELL_CODES: WishWellCode[] = [
  { secret: '桃源谷，启动！', reward: 500, flag: 'wishWell_taoyuan_start' },
  { secret: '我要玩桃源谷', reward: 1000, flag: 'wishWell_want_play' },
  { secret: '20260610', reward: 500, flag: 'wishWell_20260610' },
  { secret: '斯巴拉西', reward: 5000, flag: 'wishWell_subarashi' }
]

/** 旧版存档兼容标记（华熙小王时代口令，已不再可输入） */
export const WISH_WELL_LEGACY_HAOXIANG_FLAG = 'huaxiWishWellClaimed'
