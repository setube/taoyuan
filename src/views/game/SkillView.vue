<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <Star :size="14" class="inline" />
      技能
    </h3>
    <div class="space-y-3">
      <div v-for="skill in skillStore.skills" :key="skill.type" class="game-panel">
        <!-- 标题行：图标 + 名称等级 + 经验 -->
        <div class="flex justify-between items-center mb-1.5">
          <div class="flex items-center space-x-1.5">
            <component :is="SKILL_ICONS[skill.type]" :size="14" class="text-accent" />
            <span class="text-sm">{{ SKILL_NAMES[skill.type] }}</span>
            <span class="text-xs text-accent">Lv.{{ skill.level }}</span>
          </div>
          <p v-if="expInfo(skill.type)" class="text-[10px] text-muted">
            {{ expInfo(skill.type)!.current }}/{{ expInfo(skill.type)!.required }}
          </p>
          <span v-else class="text-[10px] text-accent border border-accent/30 rounded-xs px-1">MAX</span>
        </div>

        <!-- 经验条 -->
        <div class="bg-bg rounded-xs h-1.5 mb-2">
          <div class="h-full bg-accent rounded-xs transition-all" :style="{ width: expPercent(skill.type) + '%' }" />
        </div>

        <!-- 介绍 + 每级加成 -->
        <div class="border border-accent/20 rounded-xs px-2 py-1.5 mb-2">
          <p class="text-[10px] text-muted leading-relaxed">{{ SKILL_DESCS[skill.type] }}</p>
          <p class="text-[10px] text-muted mt-0.5">每级：体力消耗-1%，{{ SKILL_LEVEL_BONUS[skill.type] }}</p>
        </div>

        <!-- 天赋 -->
        <div v-if="skill.perk5 || skill.perk10 || skill.perk15 || skill.perk20" class="flex flex-col space-y-1">
          <div v-if="skill.perk5" class="flex items-center space-x-1.5 border border-water rounded-xs px-2 py-1">
            <span class="text-[10px] text-water shrink-0">Lv5</span>
            <span class="text-xs text-water shrink-0">{{ perkLabel(skill, skill.perk5) }}</span>
            <span class="text-[10px] text-muted">{{ perkDesc(skill, skill.perk5) }}</span>
          </div>
          <div v-if="skill.perk10" class="flex items-center space-x-1.5 border border-water rounded-xs px-2 py-1">
            <span class="text-[10px] text-water shrink-0">Lv10</span>
            <span class="text-xs text-water shrink-0">{{ perkLabel(skill, skill.perk10) }}</span>
            <span class="text-[10px] text-muted">{{ perkDesc(skill, skill.perk10) }}</span>
          </div>
          <div v-if="skill.perk15" class="flex items-center space-x-1.5 border border-water rounded-xs px-2 py-1">
            <span class="text-[10px] text-water shrink-0">Lv15</span>
            <span class="text-xs text-water shrink-0">{{ perkLabel(skill, skill.perk15) }}</span>
            <span class="text-[10px] text-muted">{{ perkDesc(skill, skill.perk15) }}</span>
          </div>
          <div v-if="skill.perk20" class="flex items-center space-x-1.5 border border-water rounded-xs px-2 py-1">
            <span class="text-[10px] text-water shrink-0">Lv20</span>
            <span class="text-xs text-water shrink-0">{{ perkLabel(skill, skill.perk20) }}</span>
            <span class="text-[10px] text-muted">{{ perkDesc(skill, skill.perk20) }}</span>
          </div>
        </div>
        <p v-else-if="skill.level < 5" class="text-[10px] text-muted">Lv5 / 10 / 15 / 20 时可选择专精天赋</p>
        <p v-else class="text-[10px] text-muted">升级到 Lv{{ nextPerkLevel(skill) }} 后可选择天赋</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { type Component } from 'vue'
  import { Star, Wheat, TreePine, Fish, Pickaxe, Sword, ChefHat, Hammer } from 'lucide-vue-next'
  import { useSkillStore } from '@/stores/useSkillStore'
  import type { SkillType, SkillPerk5, SkillPerk10, SkillState } from '@/types'
  import { FORGING_PERK15_BRANCHES, FORGING_PERK20_BRANCHES } from '@/data/skills'

  const skillStore = useSkillStore()

  const SKILL_ICONS: Record<SkillType, Component> = {
    farming: Wheat,
    foraging: TreePine,
    fishing: Fish,
    mining: Pickaxe,
    combat: Sword,
    cooking: ChefHat,
    forging: Hammer
  }

  const SKILL_NAMES: Record<SkillType, string> = {
    farming: '农耕',
    foraging: '采集',
    fishing: '钓鱼',
    mining: '挖矿',
    combat: '战斗',
    cooking: '烹饪',
    forging: '锻造'
  }

  const SKILL_DESCS: Record<SkillType, string> = {
    farming: '种植作物、收获农产品。等级越高，作物品质越好。',
    foraging: '采集野外资源、伐木。等级越高，采集品质越好。',
    fishing: '在各水域钓鱼。等级越高，钓鱼成功率越高。',
    mining: '在矿洞中采矿和战斗。等级越高，矿石产出越多。',
    combat: '与矿洞中的怪物战斗。等级越高，生命值上限越高。',
    cooking: '烹制料理。等级越高，成品品质越好。',
    forging: '亲手打铁铸器。孙铁匠处习得开炉后可升级。'
  }

  const SKILL_LEVEL_BONUS: Record<SkillType, string> = {
    farming: '作物品质概率提升',
    foraging: '采集品质概率提升',
    fishing: '钓鱼成功率提升',
    mining: '矿石产出提升',
    combat: '生命值上限+5',
    cooking: '烹饪升档概率提升',
    forging: '打造品质与词条提升'
  }

  const PERK_DESCS: Record<SkillPerk5 | SkillPerk10, string> = {
    harvester: '作物售价+10%',
    rancher: '畜产品售价+20%',
    lumberjack: '采集时25%概率额外获得木材',
    herbalist: '采集物发现概率+20%',
    fisher: '鱼类售价+25%',
    trapper: '搏鱼成功率+15%',
    miner: '50%概率矿石+1',
    geologist: '稀有矿石概率大幅提升',
    fighter: '受伤减少15%，生命上限+25',
    defender: '防御时恢复5点生命',
    intensive: '20%概率双倍收获',
    artisan: '加工品售价+25%',
    coopmaster: '动物亲密度获取+50%',
    shepherd: '畜产品品质提升一级',
    forester: '采集时必定额外获得木材',
    tracker: '每次采集额外+1物品',
    botanist: '采集物品质必定为精品',
    alchemist: '食物恢复效果+50%',
    angler: '传说鱼出现概率大幅提升',
    aquaculture: '鱼类售价+50%',
    mariner: '钓到的鱼品质至少为优质',
    luremaster: '鱼饵效果翻倍',
    prospector: '15%概率矿石翻倍',
    blacksmith: '金属矿石售价+50%',
    excavator: '使用炸弹时30%概率不消耗',
    mineralogist: '击败怪物额外掉落矿石',
    warrior: '生命上限+40',
    brute: '攻击伤害+25%',
    acrobat: '25%概率闪避并反击',
    tank: '防御时伤害减免70%',
    prep_cook: '烹饪时20%概率节省一种主料',
    vendor_chef: '食物售价+15%（当老板的选这个）',
    double_batch: '烹饪成功15%概率额外+1份',
    gourmet_craft: '25%概率成品品质+1档',
    buff_chef: 'buff效果+30%，持续时段+1',
    tavern_master: '酒肆经营加成：厨艺+2、失误-3%、食物指导价+10%',
    apprentice: '锻造经验+15%',
    merchant: '打造装备出售+10%',
    smith_sword: '武器打造目标区宽度+20%',
    smith_tool: '工具升级材料-20%',
    enchanter: '词条重刷材料-20%',
    smith_armor: '帽/鞋/戒打造铜钱-15%'
  }

  const PERK_NAMES: Record<SkillPerk5 | SkillPerk10, string> = {
    harvester: '丰收者',
    rancher: '牧人',
    lumberjack: '樵夫',
    herbalist: '药师',
    fisher: '渔夫',
    trapper: '捕手',
    miner: '矿工',
    geologist: '地质学家',
    fighter: '斗士',
    defender: '守护者',
    intensive: '精耕',
    artisan: '匠人',
    coopmaster: '牧场主',
    shepherd: '牧羊人',
    botanist: '植物学家',
    alchemist: '炼金师',
    forester: '伐木工',
    tracker: '追踪者',
    angler: '垂钓大师',
    aquaculture: '水产商',
    mariner: '水手',
    luremaster: '诱饵师',
    prospector: '探矿者',
    blacksmith: '铁匠',
    excavator: '挖掘者',
    mineralogist: '宝石学家',
    warrior: '武者',
    brute: '蛮力者',
    acrobat: '杂技师',
    tank: '重甲者',
    prep_cook: '备料手',
    vendor_chef: '市厨',
    double_batch: '双灶',
    gourmet_craft: '匠心',
    buff_chef: '膳修',
    tavern_master: '肆尊',
    apprentice: '学徒',
    merchant: '行商',
    smith_sword: '铸剑',
    smith_tool: '工具匠',
    enchanter: '附魔师',
    smith_armor: '护甲匠'
  }

  const expInfo = (type: SkillType) => {
    return skillStore.getExpToNextLevel(type)
  }

  const expPercent = (type: SkillType): number => {
    const info = skillStore.getExpToNextLevel(type)
    if (!info) return 100
    return Math.round((info.current / info.required) * 100)
  }

  const forgingPerkMeta = (): Record<string, { name: string; description: string }> => {
    const map: Record<string, { name: string; description: string }> = {}
    for (const branch of Object.values(FORGING_PERK15_BRANCHES)) {
      for (const p of branch) map[p.id] = { name: p.name, description: p.description }
    }
    for (const branch of Object.values(FORGING_PERK20_BRANCHES)) {
      for (const p of branch) map[p.id] = { name: p.name, description: p.description }
    }
    return map
  }

  const FORGING_EXTRA = forgingPerkMeta()

  const perkLabel = (skill: SkillState, id: string) => {
    if (skill.type === 'forging' && FORGING_EXTRA[id]) return FORGING_EXTRA[id].name
    return PERK_NAMES[id as SkillPerk5 | SkillPerk10] ?? id
  }

  const perkDesc = (skill: SkillState, id: string) => {
    if (skill.type === 'forging' && FORGING_EXTRA[id]) return FORGING_EXTRA[id].description
    return PERK_DESCS[id as SkillPerk5 | SkillPerk10] ?? ''
  }

  const nextPerkLevel = (skill: SkillState): number => {
    if (!skill.perk5) return 5
    if (!skill.perk10) return 10
    if (!skill.perk15) return 15
    if (!skill.perk20) return 20
    return 20
  }
</script>
