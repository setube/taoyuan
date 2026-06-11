import type { KnowledgeCategory, KnowledgeEntry } from '@/types/system'
import kb1 from '../../backend/internal/knowledge/kb_part1.json'
import kb2 from '../../backend/internal/knowledge/kb_part2.json'
import kb3 from '../../backend/internal/knowledge/kb_part3.json'
import kb4 from '../../backend/internal/knowledge/kb_part4.json'
import kb5 from '../../backend/internal/knowledge/kb_part5.json'
import kb6 from '../../backend/internal/knowledge/kb_part6.json'
import kb7 from '../../backend/internal/knowledge/kb_part7.json'
import kb8 from '../../backend/internal/knowledge/kb_part8_system_quest.json'
import kb9 from '../../backend/internal/knowledge/kb_part9_taoyuan_native.json'
import kb10 from '../../backend/internal/knowledge/kb_part10_buildings_social.json'
import kb11 from '../../backend/internal/knowledge/kb_part11_locations_map.json'
import kb12 from '../../backend/internal/knowledge/kb_part12_fish_acquisition.json'

type RawKbEntry = {
  id: string
  category: string
  keywords: string[]
  title: string
  content: string
}

const LOCAL_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'mechanic_system_quest_overview',
    category: 'mechanic',
    keywords: ['系统任务', '功勋', '任务系统', 'system quest', 'merit', '任务'],
    title: '系统任务概览',
    content:
      '系统觉醒后在面板「任务」页点击「请求新任务」领取（最多同时 2 个）。接受前可议价 1~3 轮；完成须手动提交领功勋，过期扣奖励 50% 罚金。对话中索要任务不受理。'
  },
  {
    id: 'mechanic_system_quest_types',
    category: 'mechanic',
    keywords: ['任务类型', '采集任务', '矿洞任务', '社交任务', '钓鱼任务', '酒肆任务', '技能任务'],
    title: '系统任务七种类型',
    content:
      '采集（收集物品）、矿洞（到达层数）、社交（NPC 好感心数，每心 250 点）、技能（等级）、制作（拥有菜品/加工品）、钓鱼（拥有鱼类）、经营（酒肆收入/口碑/宴席）。达标自动结算。'
  },
  {
    id: 'mechanic_system_quest_negotiate',
    category: 'mechanic',
    keywords: ['讨价还价', '议价', '延长期限', '降低目标', '更换类型'],
    title: '任务讨价还价',
    content:
      '延长期限 +2 天（功勋 −1）；降低目标约 20%（功勋 −2）；更换同难度类型（首轮，功勋 −1）。最多 3 轮后须接受最终方案。'
  },
  {
    id: 'mechanic_merit_shop_wish',
    category: 'mechanic',
    keywords: ['功勋商店', '许愿', '定制', '能不能给我', '兑换', '灵赐'],
    title: '功勋商店许愿',
    content:
      '须在线连接系统后，在对话中主动提出愿望（如「想要 1 万文」「卖东西更贵」「给我 10 个干草」），由 AI 自动识别并评估可行性、定价，可行方案会出现在商店「专属定制」栏（每存档独立）。离线模式仅可查知识库，无法许愿上架。生命/体力上限类各最多兑换 3 次；可发放任意游戏内已实装物品（单次最多 99 个）。功勋不足无法兑换，不可赊账。'
  },
  {
    id: 'mechanic_system_quest_merit',
    category: 'mechanic',
    keywords: ['功勋', '功勋点', 'merit', '任务奖励', '功勋商店'],
    title: '功勋点规则',
    content:
      '功勋主要来自完成任务；各人格觉醒见面礼会赠送少量功勋与物资（仅首次觉醒一次）。简单任务约 2、普通 5、困难 10、史诗 20 功勋。过期罚 50%。可在功勋商店兑换 buff。可为负。'
  },
  {
    id: 'mechanic_system_quest_trigger',
    category: 'mechanic',
    keywords: ['任务怎么触发', '什么时候派任务', '系统派任务', '如何接任务'],
    title: '任务派发时机',
    content:
      '条件：已觉醒、活跃任务 <2。在「任务」页点「请求新任务」生成；议价后点「接受任务」开始计时；达标后点「提交任务」结算功勋。'
  },
  {
    id: 'mechanic_system_quest_collect',
    category: 'mechanic',
    keywords: ['采集任务', '收集铜矿', '收集任务'],
    title: '采集类系统任务',
    content: '要求背包+仓库持有指定数量物品（铜矿、翡翠、五彩碎片等）。卖出会减少计数。'
  },
  {
    id: 'mechanic_system_quest_mine',
    category: 'mechanic',
    keywords: ['矿洞任务', '到达层数', '矿洞层任务'],
    title: '矿洞类系统任务',
    content: '以历史最高矿洞层数验收。下矿探索到达目标层即完成。'
  },
  {
    id: 'mechanic_system_quest_social',
    category: 'mechanic',
    keywords: ['社交任务', '好感任务', 'NPC心数'],
    title: '社交类系统任务',
    content: '指定 NPC 或任意 NPC 最高好感达目标心数（每心 250 点）。送礼、对话提升好感。'
  },
  {
    id: 'mechanic_system_quest_tavern',
    category: 'tavern',
    keywords: ['酒肆任务', '口碑任务', '宴席订单', '酒肆收入'],
    title: '经营类系统任务',
    content: '酒肆单日最高收入、口碑达标或完成宴席订单数。需已建造酒肆。'
  },
  {
    id: 'mechanic_affinity',
    category: 'mechanic',
    keywords: ['亲和度', '系统好感', '系统亲和', 'affinity'],
    title: '系统亲和度（非村民好感）',
    content:
      '隐藏值 0~100，仅衡量宿主与系统（青鸾/嘲风/桃酥/墨言）的默契，与孙铁匠、丹青等村民好感度（0~2500）完全无关。每日打开系统面板 +1、与系统对话满 3 句 +1、接受系统任务 +2（每日上限）。30/50/70/100 有里程碑对话。系统亲和 ≥20 解锁功勋商店「专属定制」许愿上架。'
  },
  {
    id: 'mechanic_companion',
    category: 'mechanic',
    keywords: ['陪伴', '早安', '晚安', '记忆', '长期记忆'],
    title: '系统陪伴机制',
    content:
      '每日早安/晚安问候；记住首次收获、首次钓鱼、矿洞跌倒等里程碑；离线 3 天以上回归会有专属问候；每 7 日生成一次进度摘要写入时间线。'
  },
  {
    id: 'mechanic_fish_fry_source',
    category: 'mechanic',
    keywords: ['鱼苗', '鱼苗在哪', '鱼苗在哪买', '买鱼苗', '幼鱼', '鱼塘鱼苗'],
    title: '鱼塘鱼苗来源（不可购买）',
    content:
      '桃源乡没有鱼苗商店，NPC不卖鱼苗。不存在沈伯、溪边渔舍。正确流程：清溪钓鱼→鱼进背包→田庄鱼塘面板「放入鱼苗」。李渔翁在清溪，只谈钓鱼不卖苗。鱼饵在万物铺买，用于钓鱼或喂鱼。'
  },
  {
    id: 'npc_li_yu_fishing',
    category: 'npc',
    keywords: ['李渔翁', '渔翁', '清溪', '钓鱼NPC'],
    title: 'NPC李渔翁（清溪）',
    content: '李渔翁是清溪老渔夫，可对话送礼解锁菜谱，不出售鱼苗。勿说成沈伯或溪边渔舍。'
  }
]

const KNOWN_CATEGORIES = new Set<string>([
  'crop', 'fish', 'recipe', 'mine', 'npc', 'skill', 'equipment',
  'mechanic', 'item', 'tavern', 'animal', 'shop', 'festival',
  'fruit_tree', 'hidden_npc', 'processing', 'gem'
])

function normalizeCategory(raw: string): KnowledgeCategory {
  if (KNOWN_CATEGORIES.has(raw)) return raw as KnowledgeCategory
  return 'mechanic'
}

function mapRaw(entries: RawKbEntry[]): KnowledgeEntry[] {
  return entries.map(e => ({
    id: e.id,
    category: normalizeCategory(e.category),
    keywords: e.keywords,
    title: e.title,
    content: e.content
  }))
}

const backendKb = mapRaw([
  ...(kb1 as RawKbEntry[]),
  ...(kb2 as RawKbEntry[]),
  ...(kb3 as RawKbEntry[]),
  ...(kb4 as RawKbEntry[]),
  ...(kb5 as RawKbEntry[]),
  ...(kb6 as RawKbEntry[]),
  ...(kb7 as RawKbEntry[]),
  ...(kb8 as RawKbEntry[]),
  ...(kb9 as RawKbEntry[]),
  ...(kb10 as RawKbEntry[]),
  ...(kb11 as RawKbEntry[]),
  ...(kb12 as RawKbEntry[])
])

const byId = new Map<string, KnowledgeEntry>()
for (const e of [...LOCAL_ENTRIES, ...backendKb]) {
  byId.set(e.id, e)
}

export const systemKnowledge: KnowledgeEntry[] = [...byId.values()]

export function matchKnowledge(input: string): KnowledgeEntry | null {
  const lower = input.toLowerCase()
  const scored = systemKnowledge
    .map(entry => ({
      entry,
      score: entry.keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || b.entry.content.length - a.entry.content.length)
  return scored[0]?.entry ?? null
}
