import { forgeRecipeId } from '@/data/forge'

export interface ForgeLessonDef {
  id: string
  npcId: 'sun_tiejiang' | 'a_tie'
  title: string
  theme: string
  requiredForgingLevel: number
  /** 需已完成的前置课 */
  requiresLessonId?: string
  unlockRecipeIds: string[]
  exp: number
  description: string
}

const r = (category: 'weapon' | 'hat' | 'shoe' | 'ring', defId: string) =>
  forgeRecipeId(category, defId)

/** §10.2 铁匠请教课表 */
export const FORGE_LESSONS: ForgeLessonDef[] = [
  {
    id: 'lesson_open_furnace',
    npcId: 'sun_tiejiang',
    title: '开炉',
    theme: '孙铁匠带你认识锻炉与铜戒',
    requiredForgingLevel: 0,
    unlockRecipeIds: [r('ring', 'quartz_ring')],
    exp: 25,
    description: '解锁锻造工坊与铜素戒配方。'
  },
  {
    id: 'lesson_heat_control',
    npcId: 'sun_tiejiang',
    title: '火候',
    theme: '控火锻打入门',
    requiredForgingLevel: 3,
    requiresLessonId: 'lesson_open_furnace',
    unlockRecipeIds: [r('weapon', 'copper_sword')],
    exp: 30,
    description: '解锁铜剑打造。'
  },
  {
    id: 'lesson_hammer',
    npcId: 'a_tie',
    title: '落锤',
    theme: '阿铁教你找准落锤节奏',
    requiredForgingLevel: 5,
    requiresLessonId: 'lesson_heat_control',
    unlockRecipeIds: [],
    exp: 35,
    description: '小游戏目标区略微放宽（被动）。'
  },
  {
    id: 'lesson_quench',
    npcId: 'sun_tiejiang',
    title: '淬火',
    theme: '淬火定品质',
    requiredForgingLevel: 8,
    requiresLessonId: 'lesson_hammer',
    unlockRecipeIds: [r('hat', 'bamboo_hat')],
    exp: 40,
    description: '解锁竹笠打造；优良品质权重微升。'
  },
  {
    id: 'lesson_pattern',
    npcId: 'a_tie',
    title: '识纹',
    theme: '辨认装备纹路',
    requiredForgingLevel: 10,
    requiresLessonId: 'lesson_quench',
    unlockRecipeIds: [r('hat', 'miner_helmet')],
    exp: 45,
    description: '解锁矿工头盔打造。'
  },
  {
    id: 'lesson_refine',
    npcId: 'sun_tiejiang',
    title: '百炼',
    theme: '百炼成钢',
    requiredForgingLevel: 15,
    requiresLessonId: 'lesson_pattern',
    unlockRecipeIds: [r('weapon', 'iron_blade')],
    exp: 50,
    description: '解锁铁刀精品打造。'
  },
  {
    id: 'lesson_heart',
    npcId: 'a_tie',
    title: '心传',
    theme: '心手相传的锻打之道',
    requiredForgingLevel: 18,
    requiresLessonId: 'lesson_refine',
    unlockRecipeIds: [r('ring', 'jade_spirit_ring')],
    exp: 50,
    description: '解锁精铁灵戒；挚友时 T4 词条权重微升。'
  }
]

export const FORGE_LESSON_BY_ID: Record<string, ForgeLessonDef> = Object.fromEntries(
  FORGE_LESSONS.map(l => [l.id, l])
)

export const getAvailableLessons = (
  forgingLevel: number,
  lessonsSeen: string[],
  npcId: string
): ForgeLessonDef[] =>
  FORGE_LESSONS.filter(lesson => {
    if (lesson.npcId !== npcId) return false
    if (lessonsSeen.includes(lesson.id)) return false
    if (forgingLevel < lesson.requiredForgingLevel) return false
    if (lesson.requiresLessonId && !lessonsSeen.includes(lesson.requiresLessonId)) return false
    return true
  })
