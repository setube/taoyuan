import type { PersonaId } from '@/types/system'

export interface PersonaAwakeningGift {
  merit?: number
  money?: number
  items?: { itemId: string; quantity: number }[]
  /** 见面礼台词（紧接觉醒问候之后） */
  giftLine: string
}

/** 各人格首次觉醒时的见面礼（仅新觉醒时发放一次） */
export const PERSONA_AWAKENING_GIFTS: Record<PersonaId, PersonaAwakeningGift> = {
  qingluan: {
    merit: 10,
    money: 300,
    items: [{ itemId: 'ancient_seed', quantity: 1 }],
    giftLine: '「初逢之礼，谨备在此。远古种子一枚、铜钱三百、功勋十点，望小友善用。」'
  },
  chaofeng: {
    merit: 8,
    items: [
      { itemId: 'copper_ore', quantity: 15 },
      { itemId: 'iron_ore', quantity: 5 }
    ],
    giftLine: '「见面礼——铜矿铁矿拿着，别还没下矿就饿死。功勋八点，省着点花。」'
  },
  taosu: {
    merit: 8,
    items: [
      { itemId: 'peach', quantity: 5 },
      { itemId: 'wild_berry', quantity: 3 }
    ],
    giftLine: '「主人！桃酥把最好吃的桃子和野果都留给主人啦！还有功勋八点哦~(◕ᴗ◕✿)」'
  },
  moyan: {
    merit: 15,
    money: 150,
    giftLine: '「见面礼：功勋十五、铜钱一百五十。已记录。建议优先完成今日待办。」'
  }
}
