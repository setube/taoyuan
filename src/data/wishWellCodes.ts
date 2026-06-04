/** 华熙小王许愿井口令（每条口令每个存档仅可领取一次） */
export interface WishWellCode {
  secret: string
  reward: number
  flag: string
}

export const WISH_WELL_CODES: WishWellCode[] = [
  { secret: '好想华熙小王', reward: 500, flag: 'wishWell_haoxiang' },
  { secret: '疯狂星期四', reward: 50, flag: 'wishWell_kfc' },
  { secret: '华熙小王最帅', reward: 1000, flag: 'wishWell_zuishuai' },
  { secret: '最爱华熙小王', reward: 520, flag: 'wishWell_zuiai' },
  { secret: '宝宝宝宝', reward: 500, flag: 'wishWell_baobao' },
  { secret: '1025', reward: 1025, flag: 'wishWell_1025' }
]

/** 旧版存档兼容：曾用单一标记领取过「好想华熙小王」 */
export const WISH_WELL_LEGACY_HAOXIANG_FLAG = 'huaxiWishWellClaimed'
