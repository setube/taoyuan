<template>
  <div>
    <div class="flex flex-wrap gap-1.5 mb-3">
      <Button
        v-for="tab in tabs"
        :key="tab.key"
        class="text-xs py-1 px-2"
        :class="{ '!bg-accent !text-bg': activeTab === tab.key }"
        @click="onTabChange(tab.key)"
      >
        {{ tab.label }}
      </Button>
    </div>

    <!-- 未开炉 -->
    <div
      v-if="!forgeStore.forgePanelUnlocked && activeTab === 'forge'"
      class="border border-accent/20 rounded-xs p-4 text-center"
    >
      <p class="text-sm text-muted mb-3">尚未开炉。向孙铁匠请教「开炉」后即可锻造。</p>
      <Button @click="activeTab = 'lessons'">去请教</Button>
    </div>

    <!-- 锻造 -->
    <template v-else-if="activeTab === 'forge'">
      <p v-if="weatherHint" class="text-[10px] text-muted mb-2">{{ weatherHint }}</p>
      <p class="text-muted text-xs mb-2">
        已学配方 {{ unlockedRecipes.length }} 条 · 锻造 Lv{{ forgingLevel }} · 每次约
        {{ forgeStaminaCost }} 体力 / {{ forgeTimeLabel }}
      </p>
      <div class="flex flex-col space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="recipe in unlockedRecipes"
          :key="recipe.id"
          class="flex items-center justify-between border rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
          :class="canCraft(recipe.id) ? 'border-success/50' : 'border-accent/20 opacity-80'"
          @click="openForge(recipe.id)"
        >
          <div>
            <p class="text-sm">{{ recipeName(recipe) }}</p>
            <p class="text-muted text-xs">{{ recipeCostText(recipe) }}</p>
          </div>
          <span class="text-xs text-accent">Lv{{ recipe.requiredForgingLevel }}</span>
        </div>
        <p v-if="unlockedRecipes.length === 0" class="text-xs text-muted text-center py-4">暂无已学配方</p>
      </div>
    </template>

    <!-- 练习 -->
    <template v-else-if="activeTab === 'practice'">
      <p class="text-muted text-xs mb-2">
        空炉练习落锤节奏，不耗材料，按得分获锻造经验。每次约 {{ forgeStaminaCost }} 体力 / {{ forgeTimeLabel }}。
      </p>
      <p class="text-[10px] text-muted mb-3">累计练习 {{ forgeStore.forgeStats.practiceCount }} 次</p>
      <Button class="w-full" :disabled="!forgeStore.forgePanelUnlocked" @click="startPractice">
        开始练习
      </Button>
      <p v-if="!forgeStore.forgePanelUnlocked" class="text-xs text-muted text-center mt-2">需先请教「开炉」</p>
    </template>

    <!-- 图纸店 -->
    <template v-else-if="activeTab === 'blueprints'">
      <p class="text-muted text-xs mb-2">
        孙铁匠图纸店 ·
        {{ !sunAcquaintance ? '需相识' : sunFriendly ? '友好价目' : '相识价目' }}
      </p>
      <div class="flex flex-col space-y-2">
        <div
          v-for="entry in shopBlueprints"
          :key="entry.blueprintId"
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2"
          :class="canBuyBlueprint(entry) ? 'cursor-pointer hover:bg-accent/5' : 'opacity-50'"
          @click="buyBlueprint(entry)"
        >
          <div>
            <p class="text-sm">{{ blueprintName(entry.blueprintId) }}</p>
            <p class="text-muted text-xs">{{ blueprintDesc(entry.blueprintId) }}</p>
          </div>
          <span class="text-xs whitespace-nowrap" :class="alreadyBought(entry.blueprintId) ? 'text-success' : 'text-accent'">
            {{ alreadyBought(entry.blueprintId) ? '已购' : `${entry.price}文` }}
          </span>
        </div>
      </div>
    </template>

    <!-- 请教 -->
    <template v-else-if="activeTab === 'lessons'">
      <p class="text-muted text-xs mb-2">每日可向孙铁匠或阿铁请教一次</p>
      <div class="flex flex-col space-y-2">
        <div
          v-for="lesson in visibleLessons"
          :key="lesson.id"
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
          @click="doLesson(lesson.id)"
        >
          <div>
            <p class="text-sm">{{ lesson.title }} · {{ lesson.npcId === 'sun_tiejiang' ? '孙铁匠' : '阿铁' }}</p>
            <p class="text-muted text-xs">{{ lesson.description }}</p>
          </div>
          <span class="text-xs text-accent">Lv{{ lesson.requiredForgingLevel }}</span>
        </div>
        <p v-if="visibleLessons.length === 0" class="text-xs text-muted text-center py-4">暂无新课目</p>
      </div>
    </template>

    <!-- 工具升级 -->
    <template v-else-if="activeTab === 'tools'">
      <ToolForgePanel />
    </template>

    <!-- 重刷词条 -->
    <template v-else-if="activeTab === 'reroll'">
      <p class="text-muted text-xs mb-2">重刷消耗 200文 + 铜锭×1 + 木炭×2（品质与底材不变）</p>
      <p class="text-muted text-[10px] mb-2">点击装备展开具体数值</p>
      <div class="flex flex-col space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="item in craftedItems"
          :key="item.key"
          class="border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
          @click="toggleRerollExpand(item.key)"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-sm">{{ item.label }}</p>
              <p class="text-muted text-xs truncate">{{ item.affixText }}</p>
            </div>
            <Button class="text-xs py-0.5 px-2 shrink-0" @click.stop="doReroll(item.category, item.index)">重刷</Button>
          </div>
          <div
            v-if="expandedRerollKey === item.key"
            class="mt-2 pt-2 border-t border-accent/10 space-y-2"
            @click.stop
          >
            <div v-if="item.baseLines.length > 0">
              <p class="text-[10px] text-muted mb-1">底材属性</p>
              <div
                v-for="line in item.baseLines"
                :key="`base-${line.label}`"
                class="flex items-center justify-between text-xs"
              >
                <span class="text-muted">{{ line.label }}</span>
                <span class="text-success">{{ line.value }}</span>
              </div>
            </div>
            <div v-for="affix in item.affixDetails" :key="affix.id">
              <p class="text-xs text-accent mb-0.5">{{ affix.name }}</p>
              <div
                v-for="line in affix.lines"
                :key="`${affix.id}-${line.label}`"
                class="flex items-center justify-between text-xs pl-2"
              >
                <span class="text-muted">{{ line.label }}</span>
                <span class="text-success">{{ line.value }}</span>
              </div>
            </div>
            <p v-if="item.affixDetails.length === 0" class="text-xs text-muted">无词条</p>
          </div>
        </div>
        <p v-if="craftedItems.length === 0" class="text-xs text-muted text-center py-4">暂无打造装备可重刷</p>
      </div>
    </template>

    <!-- 任务 -->
    <template v-else-if="activeTab === 'quests'">
      <h4 class="text-accent text-sm mb-2">任务板</h4>
      <div class="flex flex-col space-y-2 mb-4">
        <div
          v-for="board in visibleBoardQuests"
          :key="board.templateId"
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-2"
        >
          <div>
            <p class="text-sm">{{ questDesc(board.templateId) }}</p>
            <p class="text-[10px] text-muted">{{ questRewardText(board.templateId) }}</p>
          </div>
          <Button class="text-xs py-0.5 px-2 shrink-0" @click="acceptQuest(board.templateId)">接取</Button>
        </div>
        <p v-if="visibleBoardQuests.length === 0" class="text-xs text-muted">本周暂无任务</p>
      </div>

      <h4 class="text-accent text-sm mb-2">进行中</h4>
      <p class="text-muted text-[10px] mb-2">达成条件后点击「提交任务」领取奖励</p>
      <div class="flex flex-col space-y-2 mb-4">
        <div
          v-for="quest in forgeStore.activeForgeQuests"
          :key="quest.instanceId"
          class="border border-accent/20 rounded-xs px-3 py-2"
        >
          <p class="text-sm">{{ questDesc(quest.templateId) }}</p>
          <p class="text-[10px] text-accent">{{ questRewardText(quest.templateId) }}</p>
          <p class="text-muted text-xs">
            进度 {{ questProgressText(quest) }} · 剩余
            {{ Math.max(0, quest.deadlineDay - gameStore.day) }} 天
          </p>
          <Button
            class="text-xs py-0.5 px-2 mt-1"
            :disabled="!forgeStore.canSubmitForgeQuest(quest.instanceId)"
            @click="submitQuest(quest.instanceId)"
          >
            提交任务
          </Button>
        </div>
        <p v-if="forgeStore.activeForgeQuests.length === 0" class="text-xs text-muted">暂无进行中任务</p>
      </div>

      <h4 class="text-accent text-sm mb-2">已完成</h4>
      <div class="flex flex-col space-y-2 max-h-40 overflow-y-auto">
        <div
          v-for="done in forgeStore.completedForgeQuests"
          :key="done.instanceId"
          class="border border-accent/10 rounded-xs px-3 py-2 opacity-80"
        >
          <p class="text-sm">{{ questDesc(done.templateId) }}</p>
          <p class="text-muted text-xs">第 {{ done.completedDay }} 天完成</p>
        </div>
        <p v-if="forgeStore.completedForgeQuests.length === 0" class="text-xs text-muted">暂无已完成任务</p>
      </div>
    </template>

    <!-- 锻造小游戏（点击遮罩不关闭，避免误触退出） -->
    <div
      v-if="showMinigame"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <ForgeMinigame auto-start @complete="onMinigameComplete" @cancel="cancelMinigame" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import Button from '@/components/game/Button.vue'
  import ForgeMinigame from '@/components/game/ForgeMinigame.vue'
  import ToolForgePanel from '@/components/game/ToolForgePanel.vue'
  import { FORGE_RECIPES } from '@/data/forge'
  import { getBlueprintById, getShopBlueprintsForSun } from '@/data/forgeBlueprints'
  import { FORGE_LESSONS } from '@/data/forgeLessons'
  import { FORGE_QUEST_TEMPLATES, formatForgeQuestRewardText, type ActiveForgeQuest } from '@/data/forgeQuests'
  import { getItemById } from '@/data/items'
  import { getRingById } from '@/data/rings'
  import { getHatById } from '@/data/hats'
  import { getShoeById } from '@/data/shoes'
  import { getWeaponById } from '@/data/weapons'
  import { addLog, showFloat } from '@/composables/useGameLog'
  import { getForgeStaminaCost, getForgeTimeHours } from '@/composables/forgeCosts'
  import { handleEndDay } from '@/composables/useEndDay'
  import { useForgeStore } from '@/stores/useForgeStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { useNpcStore } from '@/stores/useNpcStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { getForgeWeatherHint } from '@/data/forgeWeather'
  import { getAffixById } from '@/data/affixes'
  import { getAffixDisplayDetail, getCraftedBaseLines } from '@/composables/craftedEquipment'
  import { QUALITY_NAMES } from '@/composables/useFarmActions'
  import type { ForgeCategory, ForgeRecipeDef } from '@/types/forge'
  import type { Quality } from '@/types'

  type TabKey = 'forge' | 'practice' | 'blueprints' | 'lessons' | 'quests' | 'reroll' | 'tools'

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'forge', label: '锻造' },
    { key: 'practice', label: '练习' },
    { key: 'blueprints', label: '图纸店' },
    { key: 'tools', label: '工具' },
    { key: 'reroll', label: '重刷' },
    { key: 'lessons', label: '请教' },
    { key: 'quests', label: '任务' }
  ]

  const forgeStore = useForgeStore()
  const gameStore = useGameStore()
  const npcStore = useNpcStore()
  const playerStore = usePlayerStore()
  const skillStore = useSkillStore()
  const inventoryStore = useInventoryStore()

  const activeTab = ref<TabKey>('forge')
  const weatherHint = computed(() => getForgeWeatherHint(gameStore.weather))
  const showMinigame = ref(false)
  const minigameMode = ref<'forge' | 'practice'>('forge')
  const expandedRerollKey = ref<string | null>(null)

  const toggleRerollExpand = (key: string) => {
    expandedRerollKey.value = expandedRerollKey.value === key ? null : key
  }

  const forgingLevel = computed(() => skillStore.getSkill('forging').level)
  const forgeStaminaCost = computed(() => getForgeStaminaCost(forgingLevel.value))
  const forgeTimeLabel = computed(() => {
    const h = getForgeTimeHours(forgingLevel.value)
    const mins = Math.round(h * 60)
    return mins >= 60 ? `${h.toFixed(1)} 游戏小时` : `${mins} 分钟`
  })

  const sunFriendship = computed(() => npcStore.getNpcState('sun_tiejiang')?.friendship ?? 0)
  const sunAcquaintance = computed(() => sunFriendship.value >= 500)
  const sunFriendly = computed(() => sunFriendship.value >= 1000)

  const shopBlueprints = computed(() => getShopBlueprintsForSun(sunFriendly.value))

  const unlockedRecipes = computed(() =>
    FORGE_RECIPES.filter(r => forgeStore.isRecipeUnlocked(r.id)).sort(
      (a, b) => a.requiredForgingLevel - b.requiredForgingLevel
    )
  )

  const craftedItems = computed(() => {
    const list: {
      key: string
      category: ForgeCategory
      index: number
      label: string
      affixText: string
      baseLines: ReturnType<typeof getCraftedBaseLines>
      affixDetails: ReturnType<typeof getAffixDisplayDetail>[]
    }[] = []
    const push = (
      category: ForgeCategory,
      defId: string,
      quality: string,
      affixes: { id: string; rolledValue: number }[] | undefined,
      index: number,
      piece: { rolledAttack?: number; rolledCritRate?: number }
    ) => {
      const name =
        category === 'weapon'
          ? getWeaponById(defId)?.name
          : category === 'ring'
            ? getRingById(defId)?.name
            : category === 'hat'
              ? getHatById(defId)?.name
              : getShoeById(defId)?.name
      const affixNames = (affixes ?? []).map(a => getAffixById(a.id)?.name ?? a.id).join(' · ')
      const key = `${category}-${index}`
      list.push({
        key,
        category,
        index,
        label: `${QUALITY_NAMES[quality as keyof typeof QUALITY_NAMES] ?? quality} ${name ?? defId}`,
        affixText: affixNames || '无词条',
        baseLines: getCraftedBaseLines(category, { defId, quality: quality as Quality, ...piece }),
        affixDetails: (affixes ?? []).map(getAffixDisplayDetail)
      })
    }
    inventoryStore.ownedWeapons.forEach((w, i) => {
      if (w.quality && w.recipeId) {
        push('weapon', w.defId, w.quality, w.affixes, i, {
          rolledAttack: w.rolledAttack,
          rolledCritRate: w.rolledCritRate
        })
      }
    })
    inventoryStore.ownedRings.forEach((r, i) => {
      if (r.quality && r.recipeId) push('ring', r.defId, r.quality, r.affixes, i, {})
    })
    inventoryStore.ownedHats.forEach((h, i) => {
      if (h.quality && h.recipeId) push('hat', h.defId, h.quality, h.affixes, i, {})
    })
    inventoryStore.ownedShoes.forEach((s, i) => {
      if (s.quality && s.recipeId) push('shoe', s.defId, s.quality, s.affixes, i, {})
    })
    return list
  })

  const visibleBoardQuests = computed(() => {
    const activeIds = new Set(forgeStore.activeForgeQuests.map(q => q.templateId))
    return forgeStore.forgeBoardQuests.filter(b => !activeIds.has(b.templateId))
  })

  const questRewardText = (templateId: string) => {
    const tpl = FORGE_QUEST_TEMPLATES.find(t => t.id === templateId)
    return tpl ? formatForgeQuestRewardText(tpl) : ''
  }

  const visibleLessons = computed(() => {
    const seen = forgeStore.lessonsSeen
    const lvl = forgingLevel.value
    return FORGE_LESSONS.filter(l => {
      if (seen.includes(l.id)) return false
      if (lvl < l.requiredForgingLevel) return false
      if (l.requiresLessonId && !seen.includes(l.requiresLessonId)) return false
      return true
    })
  })

  onMounted(() => {
    forgeStore.ensureForgeBoard()
  })

  const onTabChange = (key: TabKey) => {
    activeTab.value = key
    if (key === 'quests') forgeStore.ensureForgeBoard()
  }

  const recipeName = (recipe: ForgeRecipeDef): string => {
    const def =
      recipe.category === 'weapon'
        ? getWeaponById(recipe.targetDefId)
        : recipe.category === 'ring'
          ? getRingById(recipe.targetDefId)
          : recipe.category === 'hat'
            ? getHatById(recipe.targetDefId)
            : getShoeById(recipe.targetDefId)
    return def?.name ?? recipe.targetDefId
  }

  const recipeCostText = (recipe: ForgeRecipeDef): string => {
    const mats = recipe.ingredients
      .map(i => `${getItemById(i.itemId)?.name ?? i.itemId}×${i.quantity}`)
      .join(' ')
    const money = forgeStore.effectiveForgeMoney(recipe)
    return `${mats} · ${money}文`
  }

  const canCraft = (recipeId: string) => forgeStore.canStartForge(recipeId).ok

  const applyForgeActivityCost = (): boolean => {
    const staminaNeed = getForgeStaminaCost(forgingLevel.value)
    if (playerStore.stamina < staminaNeed) {
      addLog(`体力不足（需要 ${staminaNeed} 点）。`)
      return false
    }
    playerStore.consumeStamina(staminaNeed)
    const tr = gameStore.advanceTime(getForgeTimeHours(forgingLevel.value))
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) handleEndDay()
    return true
  }

  const startPractice = () => {
    if (!forgeStore.forgePanelUnlocked) {
      addLog('尚未开炉，无法练习。')
      return
    }
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没力气开炉了。')
      handleEndDay()
      return
    }
    const staminaNeed = getForgeStaminaCost(forgingLevel.value)
    if (playerStore.stamina < staminaNeed) {
      addLog(`体力不足，练习需要 ${staminaNeed} 点体力。`)
      return
    }
    minigameMode.value = 'practice'
    showMinigame.value = true
  }

  const openForge = (recipeId: string) => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没力气开炉了。')
      handleEndDay()
      return
    }
    const staminaNeed = getForgeStaminaCost(forgingLevel.value)
    if (playerStore.stamina < staminaNeed) {
      addLog(`体力不足，打造需要 ${staminaNeed} 点体力。`)
      return
    }
    const check = forgeStore.canStartForge(recipeId)
    if (!check.ok) {
      addLog(
        check.reason === 'materials'
          ? '材料不足。'
          : check.reason === 'money'
            ? '铜钱不足。'
            : check.reason === 'skill_level'
              ? '锻造等级不足。'
              : '暂时无法锻造。'
      )
      return
    }
    const start = forgeStore.startForge(recipeId)
    if (!start.ok) {
      addLog('开炉失败。')
      return
    }
    minigameMode.value = 'forge'
    showMinigame.value = true
  }

  const cancelMinigame = () => {
    if (minigameMode.value === 'forge') forgeStore.cancelPendingForge()
    showMinigame.value = false
  }

  const onMinigameComplete = (score: number) => {
    showMinigame.value = false
    if (minigameMode.value === 'practice') {
      if (!applyForgeActivityCost()) return
      const res = forgeStore.completePractice(score)
      showFloat(`+${res.exp} 锻造经验`, 'success')
      addLog(`练习完成，得分 ${score}，获得 ${res.exp} 经验。`)
      return
    }
    const staminaNeed = getForgeStaminaCost(forgingLevel.value)
    if (playerStore.stamina < staminaNeed) {
      addLog(`体力不足，无法完成锻造（需要 ${staminaNeed} 点）。`)
      forgeStore.cancelPendingForge()
      return
    }
    const res = forgeStore.completeForge(score)
    if (res.ok) {
      playerStore.consumeStamina(staminaNeed)
      showFloat('锻造完成！', 'success')
      addLog(`锻造完成，得分 ${score}。`)
      const tr = gameStore.advanceTime(getForgeTimeHours(forgingLevel.value))
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('锻造结算失败。')
    }
  }

  const blueprintName = (id: string) => getBlueprintById(id)?.name ?? id
  const blueprintDesc = (id: string) => getBlueprintById(id)?.description ?? ''

  const alreadyBought = (id: string) => forgeStore.sunBlueprintShopPurchased.includes(id)

  const canBuyBlueprint = (entry: { blueprintId: string; price: number; requiresFriendly?: boolean }) => {
    if (!sunAcquaintance.value) return false
    if (entry.requiresFriendly && !sunFriendly.value) return false
    return !alreadyBought(entry.blueprintId) && playerStore.money >= entry.price
  }

  const buyBlueprint = (entry: { blueprintId: string; price: number; requiresFriendly?: boolean }) => {
    if (!sunAcquaintance.value) {
      addLog('与孙铁匠相识后才可购买图纸。')
      return
    }
    if (entry.requiresFriendly && !sunFriendly.value) {
      addLog('与孙铁匠友好后才可购买此图纸。')
      return
    }
    const res = forgeStore.purchaseSunBlueprint(entry.blueprintId)
    if (res.ok) {
      showFloat(`-${entry.price}文`, 'danger')
      addLog(`购得图纸：${blueprintName(entry.blueprintId)}`)
    } else if (res.reason === 'already_purchased') {
      addLog('已经买过了。')
    } else if (res.reason === 'insufficient_money') {
      addLog('铜钱不足。')
    }
  }

  const doLesson = (lessonId: string) => {
    const res = forgeStore.attendLesson(lessonId)
    if (res.ok) {
      addLog(res.message ?? '请教完成。')
      showFloat('+锻造经验', 'success')
    } else if (res.reason === 'daily_limit') {
      addLog('今天已经请教过了。')
    } else if (res.reason === 'prerequisite') {
      addLog('还需先完成前置课目。')
    } else {
      addLog('暂时无法请教。')
    }
  }

  const questDesc = (templateId: string) =>
    FORGE_QUEST_TEMPLATES.find(t => t.id === templateId)?.description ?? templateId

  const questTarget = (templateId: string) => {
    const tpl = FORGE_QUEST_TEMPLATES.find(t => t.id === templateId)
    if (!tpl) return 1
    if (tpl.type === 'forge_material') return tpl.materialQty ?? 1
    if (tpl.type === 'forge_deliver') return 1
    return tpl.count ?? 1
  }

  const questProgressText = (quest: ActiveForgeQuest): string => {
    const tpl = FORGE_QUEST_TEMPLATES.find(t => t.id === quest.templateId)
    if (!tpl) return `${quest.progress}/?`
    if (tpl.type === 'forge_deliver') {
      return forgeStore.canSubmitForgeQuest(quest.instanceId) ? '可交付 1/1' : '待交付 0/1'
    }
    if (tpl.type === 'forge_material') {
      return forgeStore.canSubmitForgeQuest(quest.instanceId) ? '材料已齐' : '材料不足'
    }
    return `${quest.progress}/${questTarget(quest.templateId)}`
  }

  const acceptQuest = (templateId: string) => {
    const res = forgeStore.acceptForgeQuest(templateId)
    if (res.ok) {
      showFloat('已接取', 'success')
      addLog('已接取铁匠任务。')
    } else if (res.reason === 'max_active') {
      addLog('同时进行任务已达上限（2个）。')
    } else if (res.reason === 'already_active') {
      addLog('该任务已在进行中。')
    } else if (res.reason === 'not_on_board') {
      addLog('任务已过期或不在板上，请刷新任务页。')
      forgeStore.ensureForgeBoard()
    } else {
      addLog('无法接取该任务。')
    }
  }

  const submitQuest = (instanceId: string) => {
    const res = forgeStore.submitForgeQuest(instanceId)
    if (res.ok) {
      addLog(res.message ?? '任务完成。')
      if (res.rewardText) showFloat(res.rewardText, 'success')
    } else if (res.reason === 'materials') {
      addLog('材料不足。')
    } else if (res.reason === 'equipped') {
      addLog('请先切换装备中的武器再提交。')
    } else if (res.reason === 'not_ready') {
      addLog('尚未达成提交条件。')
    } else {
      addLog('提交失败。')
    }
  }

  const doReroll = (category: ForgeCategory, index: number) => {
    const res = forgeStore.rerollAffixes(category, index)
    if (res.ok) {
      addLog('词条重刷完成。')
      showFloat('重刷成功', 'success')
    } else if (res.reason === 'money' || res.reason === 'materials') {
      addLog('重刷材料不足。')
    } else {
      addLog('无法重刷该装备。')
    }
  }
</script>
