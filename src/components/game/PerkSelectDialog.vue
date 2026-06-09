<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
    <div class="game-panel max-w-md w-full">
      <h3 class="text-accent text-sm mb-2">{{ SKILL_NAMES[skillType] }} 达到{{ level }}级！</h3>
      <p class="text-xs text-muted mb-4">选择一个专精方向：</p>

      <div class="flex flex-col space-y-3">
        <button
          v-for="option in options"
          :key="option.id"
          class="btn text-xs text-left flex flex-col space-y-1 py-3"
          @click="handleSelect(option.id)"
        >
          <span class="text-accent">{{ option.name }}</span>
          <span class="text-muted">{{ option.description }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { SkillType, SkillPerk5, SkillPerk10 } from '@/types'
  import { useSkillStore } from '@/stores/useSkillStore'

  const props = defineProps<{
    skillType: SkillType
    level: 5 | 10
  }>()

  const emit = defineEmits<{
    select: [perk: SkillPerk5 | SkillPerk10]
  }>()

  const skillStore = useSkillStore()

  const SKILL_NAMES: Record<SkillType, string> = {
    farming: '农耕',
    foraging: '采集',
    fishing: '钓鱼',
    mining: '挖矿',
    combat: '战斗',
    cooking: '烹饪'
  }

  interface PerkOption {
    id: SkillPerk5 | SkillPerk10
    name: string
    description: string
  }

  const PERK5_OPTIONS: Record<SkillType, PerkOption[]> = {
    farming: [
      { id: 'harvester', name: '丰收者', description: '作物售价+10%' },
      { id: 'rancher', name: '牧人', description: '动物产品售价+20%' }
    ],
    foraging: [
      { id: 'lumberjack', name: '樵夫', description: '采集时25%概率额外获得木材' },
      { id: 'herbalist', name: '药师', description: '采集物品概率+20%' }
    ],
    fishing: [
      { id: 'fisher', name: '渔夫', description: '鱼售价+25%' },
      { id: 'trapper', name: '捕手', description: '挣扎时成功率+15%' }
    ],
    mining: [
      { id: 'miner', name: '矿工', description: '50%概率矿石+1' },
      { id: 'geologist', name: '地质学家', description: '稀有矿石概率大幅提升' }
    ],
    combat: [
      { id: 'fighter', name: '斗士', description: '受伤-15%，+25最大生命值' },
      { id: 'defender', name: '守护者', description: '防御时恢复5HP' }
    ],
    cooking: [
      { id: 'prep_cook', name: '备料手', description: '烹饪时20%概率节省一种主料' },
      { id: 'vendor_chef', name: '市厨', description: '食物售价+15%（当老板的选这个）' }
    ]
  }

  /** Lv10 专精按 Lv5 分支分组 */
  const PERK10_BRANCHES: Record<SkillType, Record<string, PerkOption[]>> = {
    farming: {
      harvester: [
        { id: 'artisan', name: '匠人', description: '加工品售价+25%' },
        { id: 'intensive', name: '精耕', description: '收获时20%概率双倍' }
      ],
      rancher: [
        { id: 'coopmaster', name: '牧场主', description: '动物亲密度获取+50%' },
        { id: 'shepherd', name: '牧羊人', description: '动物产品品质提升一档' }
      ]
    },
    foraging: {
      lumberjack: [
        { id: 'forester', name: '伐木工', description: '采集时必定获得额外木材' },
        { id: 'tracker', name: '追踪者', description: '每次采集额外获得1件物品' }
      ],
      herbalist: [
        { id: 'botanist', name: '植物学家', description: '采集物必定精品品质' },
        { id: 'alchemist', name: '炼金师', description: '食物恢复+50%' }
      ]
    },
    fishing: {
      fisher: [
        { id: 'angler', name: '垂钓大师', description: '传说鱼出现率大幅提升' },
        { id: 'aquaculture', name: '水产商', description: '鱼售价+50%' }
      ],
      trapper: [
        { id: 'mariner', name: '水手', description: '钓上的鱼品质至少为优良' },
        { id: 'luremaster', name: '诱饵师', description: '鱼饵效果翻倍' }
      ]
    },
    mining: {
      miner: [
        { id: 'prospector', name: '探矿者', description: '矿石15%概率双倍' },
        { id: 'blacksmith', name: '铁匠', description: '金属矿石售价+50%' }
      ],
      geologist: [
        { id: 'excavator', name: '挖掘者', description: '使用炸弹时30%概率不消耗' },
        { id: 'mineralogist', name: '宝石学家', description: '击败怪物额外掉落矿石' }
      ]
    },
    combat: {
      fighter: [
        { id: 'warrior', name: '武者', description: '+40最大生命值' },
        { id: 'brute', name: '蛮力者', description: '攻击伤害+25%' }
      ],
      defender: [
        { id: 'acrobat', name: '杂技师', description: '25%概率闪避反击' },
        { id: 'tank', name: '重甲者', description: '防御时伤害减少70%' }
      ]
    },
    cooking: {
      prep_cook: [
        { id: 'double_batch', name: '双灶', description: '烹饪成功15%概率额外+1份' },
        { id: 'gourmet_craft', name: '匠心', description: '25%概率成品品质+1档' }
      ],
      vendor_chef: [
        { id: 'buff_chef', name: '膳修', description: 'buff效果+30%，持续时段+1' },
        { id: 'tavern_master', name: '肆尊', description: '酒肆经营加成：厨艺+2、失误-3%、食物指导价+10%' }
      ]
    }
  }

  const options = computed<PerkOption[]>(() => {
    if (props.level === 5) return PERK5_OPTIONS[props.skillType]
    // Lv10：根据 Lv5 选择的专精确定分支
    const perk5 = skillStore.getSkill(props.skillType).perk5
    if (perk5) {
      const branches = PERK10_BRANCHES[props.skillType]
      return branches[perk5] ?? []
    }
    return []
  })

  const handleSelect = (perkId: SkillPerk5 | SkillPerk10) => {
    emit('select', perkId)
  }
</script>
