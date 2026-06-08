import type { KnowledgeEntry } from '@/types/system'

export const systemKnowledge: KnowledgeEntry[] = [
  // === 作物 ===
  {
    id: 'crop_cabbage',
    category: 'crop',
    keywords: ['青菜', 'cabbage', '春季作物', '春天种什么'],
    title: '青菜',
    content: '春季作物。4天成熟。种子售价20文，作物售价60文。可烹饪炒青菜。'
  },
  // 批量生成留到实现阶段 — 对照 src/data/ 填充约160-220条
]

export function matchKnowledge(input: string): KnowledgeEntry | null {
  const lower = input.toLowerCase()
  const scored = systemKnowledge
    .map(entry => ({
      entry,
      score: entry.keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored[0]?.entry ?? null
}