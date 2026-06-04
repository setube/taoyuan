/** 告示栏 · 最新更新公告（任务页顶部展示） */
export interface GameAnnouncement {
  title: string
  lines: string[]
  /** 更新奖励口令（与公告末尾一致） */
  rewardCode: string
  rewardAmount: number
  /** 每存档领取一次，存入 tutorial flag */
  rewardFlag: string
}

export const LATEST_GAME_ANNOUNCEMENT: GameAnnouncement = {
  title: '玩法更新',
  lines: [
    '兼容旧存档。',
    '矿洞：首次解锁新安全点会弹窗，提示下次可直接进入对应层数。',
    '牧场：新增「一键喂食」，可选饲料批量喂养。',
    '钱庄：村落新增钱庄，可借 100～3000 文（7 日期、日息 1%、利息上限 10%），逾期睡觉仅恢复 50% 体力。',
    '商圈：材料不足时，营业店铺有货可「连原材料一起购买」。',
    '熔炉：同类矿石每次可投 1～5 个，1:1 产出金属锭。',
    '农场：山洞产出、果林果实改为手动拾取（同溪流鱼获）；睡前未拾取会提醒。',
    '仓库：家园解锁 500 文；初始 5 槽位、扩建 +3；箱容量 18/36/64/128/64；分类绑定与一键放入、箱子材质扩容。',
    '',
    '更新奖励口令：桃源六月更新（每存档可领 500 文，在下方输入领取）'
  ],
  rewardCode: '桃源六月更新',
  rewardAmount: 500,
  rewardFlag: 'announcementReward_20250603'
}
