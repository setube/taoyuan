<template>
  <div>
    <h3 class="text-accent text-sm mb-3">
      <TreePine :size="14" class="inline" />
      竹林采集
    </h3>

    <!-- 采集操作 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">采集</p>
        <span class="text-xs text-muted">消耗 {{ forageCost }} 体力 · {{ forageTimeLabel }}</span>
      </div>
      <p class="text-xs text-muted mb-2">使用斧头在竹林中搜寻各类物资。</p>
      <div
        class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
        @click="handleForage"
      >
        <span class="text-xs">采集一次</span>
        <span class="text-xs text-muted">{{ playerStore.stamina }}/{{ playerStore.maxStamina }} 体力</span>
      </div>
      <!-- 天气/加成提示 -->
      <div class="flex flex-wrap space-x-3 mt-2">
        <span v-if="weatherMod !== 1" class="text-[10px]" :class="weatherMod > 1 ? 'text-success' : 'text-danger'">
          {{ weatherModLabel }}
        </span>
        <span v-if="hasHerbalistPerk" class="text-[10px] text-success">药师：概率+20%</span>
        <span v-if="hasLumberjackPerk" class="text-[10px] text-success">
          {{ foragingSkill.perk10 === 'forester' ? '伐木工：必得木材' : '樵夫：25%额外木材' }}
        </span>
        <span v-if="foragingSkill.perk10 === 'tracker'" class="text-[10px] text-success">追踪者：额外+1物品</span>
        <span v-if="cookingLuckBuff > 0" class="text-[10px] text-success">料理运气+{{ cookingLuckBuff }}%</span>
        <span v-if="isForestFarm" class="text-[10px] text-success">森林农场：经验×1.25</span>
      </div>
    </div>

    <!-- 采集结果 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <Search :size="14" class="inline" />
        采集结果
      </p>
      <div v-if="lastResults.length > 0" class="flex flex-col space-y-1">
        <div
          v-for="(r, i) in lastResults"
          :key="i"
          class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
          :class="r.itemId ? 'cursor-pointer hover:bg-accent/5' : ''"
          @click="r.itemId && (selectedResult = r)"
        >
          <span class="text-xs" :class="r.quality ? QUALITY_COLORS[r.quality] : ''">{{ r.label }}</span>
          <span v-if="r.itemId" class="text-xs text-muted/50">详情 ›</span>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-6 text-muted">
        <Search :size="32" class="mb-2" />
        <p class="text-xs">还没有采集过，去试试吧。</p>
      </div>
    </div>

    <!-- 采集物详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="selectedResult && selectedResultDef"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="selectedResult = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="selectedResult = null">
            <X :size="14" />
          </button>

          <p class="text-sm mb-2" :class="selectedResult.quality ? QUALITY_COLORS[selectedResult.quality] : 'text-accent'">
            {{ selectedResultDef.name }}
            <span v-if="selectedResult.quantity > 1" class="text-muted">×{{ selectedResult.quantity }}</span>
          </p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ selectedResultDef.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">分类</span>
              <span class="text-xs">{{ CATEGORY_NAMES[selectedResultDef.category] ?? selectedResultDef.category }}</span>
            </div>
            <div v-if="selectedResult.quality && selectedResult.quality !== 'normal'" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">品质</span>
              <span class="text-xs" :class="QUALITY_COLORS[selectedResult.quality]">{{ QUALITY_NAMES[selectedResult.quality] }}</span>
            </div>
            <div v-if="selectedResultDef.sellPrice > 0" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">售价</span>
              <span class="text-xs text-accent">{{ selectedResultDef.sellPrice }}文</span>
            </div>
            <div v-if="selectedResultDef.edible" class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">食用效果</span>
              <span class="text-xs text-success">
                {{ selectedResultDef.staminaRestore ? `体力+${selectedResultDef.staminaRestore}` : '' }}
                {{ selectedResultDef.healthRestore ? `HP+${selectedResultDef.healthRestore}` : '' }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">来源</span>
              <span class="text-xs">{{ getItemSource(selectedResult.itemId!) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 当季采集物 -->
    <div class="border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">当季采集物</p>
        <span class="text-xs text-muted">{{ SEASON_NAMES[gameStore.season] }}季</span>
      </div>
      <div class="flex flex-col space-y-1">
        <div
          v-for="item in currentForage"
          :key="item.itemId"
          class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
        >
          <div>
            <span class="text-xs">{{ item.name }}</span>
            <span class="text-[10px] text-muted ml-2">+{{ item.expReward }}经验</span>
          </div>
          <span class="text-xs text-muted">{{ Math.round(item.chance * 100) }}%</span>
        </div>
      </div>
    </div>

    <!-- 温和动物遭遇弹窗 -->
    <Transition name="panel-fade">
      <div v-if="encounter && encounter.type === 'friendly'" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div class="game-panel max-w-xs w-full">
          <p class="text-sm text-accent mb-2">遇到了{{ encounter.animal.name }}！</p>
          <p class="text-xs text-muted mb-3">一只{{ encounter.animal.name }}出现在竹林中，看起来很温顺。</p>
          <div class="flex flex-col space-y-1.5">
            <div
              class="flex items-center justify-between border border-success/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-success/5"
              @click="handleFriendlyCollect"
            >
              <span class="text-xs text-success">收集产物</span>
              <span class="text-[10px] text-muted">+{{ encounter.animal.collectExp }}采集经验</span>
            </div>
            <div
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleFriendlyChase"
            >
              <span class="text-xs">驱赶</span>
              <span class="text-[10px] text-muted">+{{ encounter.animal.chaseExp }}采集经验</span>
            </div>
            <div
              class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="encounter = null"
            >
              <span class="text-xs text-muted">离开</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 野兽战斗弹窗 -->
    <Transition name="panel-fade">
      <div v-if="inForestCombat && forestCombatMonster" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div class="game-panel max-w-xs w-full">
          <p class="text-sm text-danger mb-2">遭遇{{ forestCombatMonster.name }}！</p>

          <!-- 玩家 vs 野兽 -->
          <div class="grid grid-cols-[1fr_auto_1fr] mb-3 items-center" style="column-gap: 6px">
            <!-- 玩家 -->
            <div class="border border-accent/10 rounded-xs p-2">
              <p class="text-xs text-center mb-1.5">你</p>
              <div class="bg-bg rounded-xs h-1.5 mb-1">
                <div
                  class="h-1.5 rounded-xs transition-all"
                  :class="playerStore.getIsLowHp() ? 'bg-danger' : 'bg-success'"
                  :style="{ width: `${playerStore.getHpPercent()}%` }"
                />
              </div>
              <p class="text-[10px]" :class="playerStore.getIsLowHp() ? 'text-danger' : 'text-muted'">
                {{ playerStore.hp }}/{{ playerStore.getMaxHp() }}
              </p>
            </div>
            <span class="text-[10px] text-muted/40">VS</span>
            <!-- 野兽 -->
            <div class="border border-danger/20 rounded-xs p-2">
              <p class="text-xs text-center text-danger mb-1.5">{{ forestCombatMonster.name }}</p>
              <div class="bg-bg rounded-xs h-1.5 mb-1">
                <div
                  class="h-1.5 bg-danger rounded-xs transition-all"
                  :style="{ width: `${(forestCombatMonsterHp / forestCombatMonster.hp) * 100}%` }"
                />
              </div>
              <p class="text-[10px] text-muted">{{ forestCombatMonsterHp }}/{{ forestCombatMonster.hp }}</p>
            </div>
          </div>

          <!-- 操作 -->
          <div class="grid grid-cols-3 mb-3" style="column-gap: 4px">
            <div
              class="flex flex-col items-center border border-accent/20 rounded-xs py-1.5"
              :class="forestCombatAnimLock ? 'opacity-50' : 'cursor-pointer hover:bg-accent/5'"
              @click="!forestCombatAnimLock && handleForestCombat('attack')"
            >
              <span class="text-xs">
                <Swords :size="12" class="inline" />
                攻击
              </span>
              <span class="text-[10px] text-muted">{{ forestWeaponAttack }}攻击力</span>
            </div>
            <div
              class="flex flex-col items-center border border-accent/20 rounded-xs py-1.5"
              :class="forestCombatAnimLock ? 'opacity-50' : 'cursor-pointer hover:bg-accent/5'"
              @click="!forestCombatAnimLock && handleForestCombat('defend')"
            >
              <span class="text-xs">
                <Shield :size="12" class="inline" />
                防御
              </span>
              <span class="text-[10px] text-muted">减免伤害</span>
            </div>
            <div
              class="flex flex-col items-center border border-danger/20 rounded-xs py-1.5 cursor-pointer hover:bg-danger/5"
              :class="forestCombatAnimLock ? 'opacity-50' : ''"
              @click="!forestCombatAnimLock && handleForestCombat('flee')"
            >
              <span class="text-xs text-danger">
                <MoveRight :size="12" class="inline" />
                逃跑
              </span>
            </div>
          </div>

          <!-- 战斗日志 -->
          <div class="text-xs space-y-0.5 max-h-28 overflow-y-auto">
            <p v-for="(msg, i) in forestCombatLog" :key="i" :class="i < forestCombatLog.length - 1 ? 'text-muted' : 'text-text'">
              {{ msg }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { TreePine, Search, X, Swords, Shield, MoveRight } from 'lucide-vue-next'
  import { useAchievementStore } from '@/stores/useAchievementStore'
  import { useCookingStore } from '@/stores/useCookingStore'
  import { useGameStore, SEASON_NAMES } from '@/stores/useGameStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useWarehouseStore } from '@/stores/useWarehouseStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useQuestStore } from '@/stores/useQuestStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { useMiningStore } from '@/stores/useMiningStore'
  import { useWalletStore } from '@/stores/useWalletStore'
  import type { Quality } from '@/types'
  import type { MonsterDef, CombatAction } from '@/types/skill'
  import { getForageItems, getItemById, getItemSource } from '@/data'
  import {
    WEATHER_FORAGE_MODIFIER,
    FOREST_ENCOUNTER_CHANCE,
    FOREST_DEFEAT_MONEY_PENALTY_RATE,
    FOREST_DEFEAT_MONEY_PENALTY_CAP,
    rollForestEncounter
  } from '@/data/forage'
  import type { FriendlyAnimalDef } from '@/data/forage'
  import { getWeaponById, getEnchantmentById } from '@/data/weapons'
  import { ACTION_TIME_COSTS, TOOL_TIME_SAVINGS, SKILL_TIME_REDUCTION_PER_LEVEL, MIN_ACTION_MINUTES } from '@/data/timeConstants'
  import { sfxForage } from '@/composables/useAudio'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'
  import { useHiddenNpcStore } from '@/stores/useHiddenNpcStore'

  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const warehouseStore = useWarehouseStore()
  const skillStore = useSkillStore()
  const gameStore = useGameStore()
  const achievementStore = useAchievementStore()
  const cookingStore = useCookingStore()
  const walletStore = useWalletStore()

  interface ForageResult {
    label: string
    itemId?: string
    quantity: number
    quality?: Quality
  }

  const QUALITY_COLORS: Record<Quality, string> = {
    normal: '',
    fine: 'text-quality-fine',
    excellent: 'text-quality-excellent',
    supreme: 'text-quality-supreme'
  }

  const QUALITY_NAMES: Record<Quality, string> = {
    normal: '普通',
    fine: '优质',
    excellent: '精品',
    supreme: '极品'
  }

  const CATEGORY_NAMES: Record<string, string> = {
    seed: '种子',
    crop: '农作物',
    fish: '鱼类',
    ore: '矿石',
    gem: '宝石',
    gift: '礼物',
    food: '食物',
    material: '材料',
    misc: '杂项',
    processed: '加工品',
    machine: '机器',
    sprinkler: '洒水器',
    fertilizer: '肥料',
    animal_product: '畜产品',
    sapling: '树苗',
    fruit: '水果',
    bait: '鱼饵',
    tackle: '钓具',
    bomb: '炸弹',
    fossil: '化石',
    artifact: '文物',
    weapon: '武器',
    ring: '戒指',
    hat: '帽子',
    shoe: '鞋子'
  }

  const lastResults = ref<ForageResult[]>([])
  const selectedResult = ref<ForageResult | null>(null)

  const selectedResultDef = computed(() => {
    if (!selectedResult.value?.itemId) return null
    return getItemById(selectedResult.value.itemId) ?? null
  })

  const currentForage = computed(() => getForageItems(gameStore.season))
  const foragingSkill = computed(() => skillStore.getSkill('foraging'))

  const forageCost = computed(() =>
    Math.max(
      1,
      Math.floor(
        5 *
          inventoryStore.getToolStaminaMultiplier('axe') *
          (1 - skillStore.getStaminaReduction('foraging')) *
          (1 - inventoryStore.getEquipmentBonus('foraging_stamina'))
      )
    )
  )

  /** 采集耗时（小时），受工具和技能减免 */
  const forageTime = computed(() => {
    const baseMin = ACTION_TIME_COSTS.forage * 60
    const toolTier = inventoryStore.getTool('axe')?.tier ?? 'basic'
    const saving = TOOL_TIME_SAVINGS[toolTier] ?? 0
    const skillReduction = skillStore.getSkill('foraging').level * SKILL_TIME_REDUCTION_PER_LEVEL
    return Math.max(MIN_ACTION_MINUTES, Math.round((baseMin - saving) * (1 - skillReduction))) / 60
  })

  const forageTimeLabel = computed(() => `${Math.round(forageTime.value * 60)}分钟`)

  const weatherMod = computed(() => WEATHER_FORAGE_MODIFIER[gameStore.weather] ?? 1)

  const WEATHER_MOD_LABELS: Record<string, string> = {
    rainy: '雨天：概率+15%',
    stormy: '雷雨：概率-20%',
    snowy: '雪天：概率-10%',
    windy: '大风：概率+10%',
    green_rain: '绿雨：概率+50%'
  }

  const weatherModLabel = computed(() => WEATHER_MOD_LABELS[gameStore.weather] ?? '')

  const hasHerbalistPerk = computed(() => foragingSkill.value.perk5 === 'herbalist')
  const hasLumberjackPerk = computed(() => foragingSkill.value.perk5 === 'lumberjack' || foragingSkill.value.perk10 === 'forester')
  const isForestFarm = computed(() => gameStore.farmMapType === 'forest')
  const cookingLuckBuff = computed(() => (cookingStore.activeBuff?.type === 'luck' ? cookingStore.activeBuff.value : 0))

  const handleForage = () => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法采集了。')
      handleEndDay()
      return
    }

    if (!inventoryStore.isToolAvailable('axe')) {
      addLog('斧头正在升级中，无法采集。')
      return
    }

    const cost = forageCost.value
    if (!playerStore.consumeStamina(cost, 'foraging')) {
      addLog('体力不足，无法采集。')
      return
    }

    sfxForage()

    const items = currentForage.value
    const gathered: ForageResult[] = []
    const skill = foragingSkill.value
    const forestFarm = isForestFarm.value
    const forestXpBonus = forestFarm ? 1.25 : 1.0
    const hiddenNpcStore = useHiddenNpcStore()
    const herbDouble = hiddenNpcStore.isAbilityActive('yue_tu_1')
    const moonHerbChance = hiddenNpcStore.isAbilityActive('yue_tu_3')

    for (const item of items) {
      const herbalistBonus = skill.perk5 === 'herbalist' ? 1.2 : 1.0
      const cookingBuff = cookingStore.activeBuff?.type === 'luck' ? cookingStore.activeBuff.value / 100 : 0
      const adjustedChance = Math.min(
        1,
        item.chance * (WEATHER_FORAGE_MODIFIER[gameStore.weather] ?? 1) * herbalistBonus * (1 + cookingBuff)
      )
      if (Math.random() < adjustedChance) {
        const forageAllSkillsBuff = cookingStore.activeBuff?.type === 'all_skills' ? cookingStore.activeBuff.value : 0
        let quality = skillStore.rollForageQuality(forageAllSkillsBuff)
        const walletBoost = walletStore.getForageQualityBoost()
        if (walletBoost > 0) {
          const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
          const idx = qualityOrder.indexOf(quality)
          const newIdx = Math.min(idx + walletBoost, qualityOrder.length - 1)
          quality = qualityOrder[newIdx]!
        }
        const qty = forestFarm && Math.random() < 0.2 ? 2 : 1
        // 仙缘能力：药知（yue_tu_1）草药采集双倍
        const finalQty = herbDouble && (item.itemId === 'herb' || item.itemId === 'ginseng') ? qty * 2 : qty
        const itemDef = getItemById(item.itemId)
        // 材料类自动放入仓库
        if (itemDef?.category === 'material' && warehouseStore.unlocked) {
          const deposited = warehouseStore.depositToChest(warehouseStore.chests[0]?.id ?? '', item.itemId, finalQty, quality)
          if (deposited < finalQty) {
            inventoryStore.addItem(item.itemId, finalQty - deposited, quality)
          }
        } else {
          inventoryStore.addItem(item.itemId, finalQty, quality)
        }
        achievementStore.discoverItem(item.itemId)
        useQuestStore().onItemObtained(item.itemId, finalQty)
        const name = itemDef?.name ?? item.itemId
        gathered.push({ label: `获得了${finalQty > 1 ? `${name}×${finalQty}` : name}`, itemId: item.itemId, quantity: finalQty, quality })
        skillStore.addExp('foraging', Math.floor(item.expReward * forestXpBonus))
      }
    }

    if (skill.perk10 === 'forester') {
      inventoryStore.addItem('wood')
      gathered.push({ label: '获得了木材', itemId: 'wood', quantity: 1 })
    } else if (skill.perk5 === 'lumberjack' && Math.random() < 0.25) {
      inventoryStore.addItem('wood')
      gathered.push({ label: '获得了木材', itemId: 'wood', quantity: 1 })
    }

    if (skill.perk10 === 'tracker' && items.length > 0) {
      const randomItem = items[Math.floor(Math.random() * items.length)]!
      const trackerAllSkillsBuff = cookingStore.activeBuff?.type === 'all_skills' ? cookingStore.activeBuff.value : 0
      const quality = skillStore.rollForageQuality(trackerAllSkillsBuff)
      inventoryStore.addItem(randomItem.itemId, 1, quality)
      achievementStore.discoverItem(randomItem.itemId)
      const itemDef = getItemById(randomItem.itemId)
      const name = itemDef?.name ?? randomItem.itemId
      gathered.push({ label: `获得了${name}`, itemId: randomItem.itemId, quantity: 1, quality })
    }

    // 仙缘能力：月华（yue_tu_3）采集8%概率获得月草
    if (moonHerbChance && Math.random() < 0.08) {
      inventoryStore.addItem('moon_herb', 1)
      achievementStore.discoverItem('moon_herb')
      gathered.push({ label: '获得了月草', itemId: 'moon_herb', quantity: 1 })
      skillStore.addExp('foraging', 15)
    }

    if (gathered.length === 0) {
      gathered.push({ label: '什么也没找到……', quantity: 0 })
    }

    lastResults.value = gathered
    const { leveledUp, newLevel } = skillStore.addExp('foraging', 0)
    const names = gathered
      .filter(g => g.itemId)
      .map(g => {
        const def = getItemById(g.itemId!)
        const name = def?.name ?? g.itemId!
        return g.quantity > 1 ? `${name}×${g.quantity}` : name
      })
    let msg = `在竹林中采集，获得了${names.join('、') || '空气'}。(-${cost}体力)`
    if (leveledUp) msg += ` 采集提升到${newLevel}级！`
    addLog(msg)

    const tr = gameStore.advanceTime(forageTime.value)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) {
      handleEndDay()
      return
    }

    // 动物遭遇判定
    if (Math.random() < FOREST_ENCOUNTER_CHANCE) {
      const enc = rollForestEncounter(gameStore.season)
      if (enc) {
        if (enc.type === 'friendly') {
          encounter.value = enc
        } else {
          encounter.value = enc
          startForestCombat(enc.monster)
        }
      }
    }
  }

  // ===== 动物遭遇 =====

  const encounter = ref<{ type: 'friendly'; animal: FriendlyAnimalDef } | { type: 'hostile'; monster: MonsterDef } | null>(null)

  // --- 温和动物 ---

  const handleFriendlyCollect = () => {
    if (!encounter.value || encounter.value.type !== 'friendly') return
    const animal = encounter.value.animal
    const forageAllSkillsBuff = cookingStore.activeBuff?.type === 'all_skills' ? cookingStore.activeBuff.value : 0
    let quality = skillStore.rollForageQuality(forageAllSkillsBuff)
    const walletBoost = walletStore.getForageQualityBoost()
    if (walletBoost > 0) {
      const qualityOrder: Quality[] = ['normal', 'fine', 'excellent', 'supreme']
      const idx = qualityOrder.indexOf(quality)
      const newIdx = Math.min(idx + walletBoost, qualityOrder.length - 1)
      quality = qualityOrder[newIdx]!
    }
    inventoryStore.addItem(animal.productItemId, 1, quality)
    achievementStore.discoverItem(animal.productItemId)
    useQuestStore().onItemObtained(animal.productItemId, 1)
    const { leveledUp, newLevel } = skillStore.addExp('foraging', animal.collectExp)
    const itemDef = getItemById(animal.productItemId)
    const qLabel = quality !== 'normal' ? `(${QUALITY_NAMES[quality]})` : ''
    lastResults.value.push({
      label: `从${animal.name}处获得了${itemDef?.name ?? animal.productItemId}${qLabel}`,
      itemId: animal.productItemId,
      quantity: 1,
      quality
    })
    let msg = `在竹林遇到${animal.name}，收集到了${itemDef?.name ?? animal.productItemId}${qLabel}！`
    if (leveledUp) msg += ` 采集提升到${newLevel}级！`
    addLog(msg)
    encounter.value = null
  }

  const handleFriendlyChase = () => {
    if (!encounter.value || encounter.value.type !== 'friendly') return
    const animal = encounter.value.animal
    const { leveledUp, newLevel } = skillStore.addExp('foraging', animal.chaseExp)
    lastResults.value.push({ label: `驱赶了${animal.name}（+${animal.chaseExp}经验）`, quantity: 0 })
    let msg = `在竹林遇到${animal.name}，将其驱赶了。（+${animal.chaseExp}采集经验）`
    if (leveledUp) msg += ` 采集提升到${newLevel}级！`
    addLog(msg)
    encounter.value = null
  }

  // --- 野兽战斗 ---

  const miningStore = useMiningStore()
  const inForestCombat = ref(false)
  const forestCombatMonster = ref<MonsterDef | null>(null)
  const forestCombatMonsterHp = ref(0)
  const forestCombatLog = ref<string[]>([])
  const forestCombatRound = ref(0)
  const forestCombatAnimLock = ref(false)

  const forestWeaponAttack = computed(() => {
    const cookingAllSkillsBuff = cookingStore.activeBuff?.type === 'all_skills' ? cookingStore.activeBuff.value : 0
    const ringAttackBonus = inventoryStore.getRingEffectValue('attack_bonus')
    return (
      inventoryStore.getWeaponAttack() +
      (skillStore.combatLevel + cookingAllSkillsBuff) * 2 +
      ringAttackBonus +
      miningStore.guildBadgeBonusAttack
    )
  })

  const startForestCombat = (monster: MonsterDef) => {
    inForestCombat.value = true
    forestCombatMonster.value = monster
    forestCombatMonsterHp.value = monster.hp
    forestCombatLog.value = [`${monster.name}挡住了去路！`]
    forestCombatRound.value = 0
  }

  const handleForestCombat = (action: CombatAction) => {
    if (!inForestCombat.value || !forestCombatMonster.value) return
    forestCombatRound.value++
    const monster = forestCombatMonster.value

    // 逃跑 —— 竹林100%成功
    if (action === 'flee') {
      forestCombatLog.value.push('你转身逃离了！')
      addLog(`在竹林遭遇${monster.name}，你选择了逃跑。`)
      endForestCombat(false)
      return
    }

    // 防御
    if (action === 'defend') {
      const tankReduction = skillStore.getSkill('combat').perk10 === 'tank' ? 0.7 : 0.6
      const cookingDefBuff = cookingStore.activeBuff?.type === 'defense' ? cookingStore.activeBuff.value / 100 : 0
      const ringDefenseBonus = inventoryStore.getRingEffectValue('defense_bonus')
      const damage = Math.max(
        1,
        Math.floor(
          monster.attack * (1 - tankReduction) * (1 - cookingDefBuff) * (1 - ringDefenseBonus) * (1 - miningStore.guildBonusDefense)
        )
      )
      playerStore.takeDamage(damage)
      let defendMsg = `你举盾防御，受到${damage}点伤害。`
      if (skillStore.getSkill('combat').perk5 === 'defender') {
        playerStore.restoreHealth(5)
        defendMsg += '（守护者回复5HP）'
      }
      forestCombatLog.value.push(defendMsg)

      if (playerStore.hp <= 0) {
        handleForestDefeat()
        return
      }
      return
    }

    // 攻击
    const owned = inventoryStore.getEquippedWeapon()
    const weaponDef = getWeaponById(owned.defId)
    const enchant = owned.enchantmentId ? getEnchantmentById(owned.enchantmentId) : null

    const cookingAllSkillsBuff = cookingStore.activeBuff?.type === 'all_skills' ? cookingStore.activeBuff.value : 0
    const ringAttackBonus = inventoryStore.getRingEffectValue('attack_bonus')
    const baseAttack =
      inventoryStore.getWeaponAttack() +
      (skillStore.combatLevel + cookingAllSkillsBuff) * 2 +
      ringAttackBonus +
      miningStore.guildBadgeBonusAttack

    // 暴击
    const critChance = (weaponDef?.critRate ?? 0.05) + (enchant?.critBonus ?? 0)
    const isCrit = Math.random() < critChance
    const critMultiplier = isCrit ? 2.0 : 1.0
    const bruteBonus = skillStore.getSkill('combat').perk10 === 'brute' ? 1.25 : 1.0

    const playerDmg = Math.max(1, Math.floor(baseAttack * critMultiplier * bruteBonus) - monster.defense)
    forestCombatMonsterHp.value -= playerDmg
    let atkMsg = isCrit ? `暴击！对${monster.name}造成${playerDmg}点伤害！` : `对${monster.name}造成${playerDmg}点伤害。`

    // 吸血附魔
    if (enchant?.special === 'vampiric' && isCrit) {
      const heal = Math.floor(playerDmg * 0.2)
      playerStore.restoreHealth(heal)
      atkMsg += ` 吸血恢复${heal}HP。`
    }

    forestCombatLog.value.push(atkMsg)

    // 检查野兽死亡
    if (forestCombatMonsterHp.value <= 0) {
      handleForestVictory()
      return
    }

    // 野兽反击
    const fighterReduction = skillStore.getSkill('combat').perk5 === 'fighter' ? 0.85 : 1.0
    const ringDefenseBonus = inventoryStore.getRingEffectValue('defense_bonus')
    const monsterDmg = Math.max(
      1,
      Math.floor(monster.attack * fighterReduction * (1 - ringDefenseBonus) * (1 - miningStore.guildBonusDefense))
    )
    playerStore.takeDamage(monsterDmg)
    forestCombatLog.value.push(`${monster.name}反击，造成${monsterDmg}点伤害！`)

    // 杂技师反击
    if (skillStore.getSkill('combat').perk10 === 'acrobat' && Math.random() < 0.25) {
      const counterDmg = Math.floor(monsterDmg * 0.5)
      forestCombatMonsterHp.value -= counterDmg
      forestCombatLog.value.push(`杂技师闪避反击！造成${counterDmg}点伤害！`)
      if (forestCombatMonsterHp.value <= 0) {
        handleForestVictory()
        return
      }
    }

    if (playerStore.hp <= 0) {
      handleForestDefeat()
    }
  }

  const handleForestVictory = () => {
    const monster = forestCombatMonster.value!
    forestCombatLog.value.push(`你击败了${monster.name}！`)

    // 掉落物
    const drops: string[] = []
    const dropRateBonus = miningStore.guildBonusDropRate
    for (const drop of monster.drops) {
      if (Math.random() < drop.chance + dropRateBonus) {
        inventoryStore.addItem(drop.itemId)
        achievementStore.discoverItem(drop.itemId)
        const itemDef = getItemById(drop.itemId)
        drops.push(itemDef?.name ?? drop.itemId)
      }
    }

    // 战斗经验
    const { leveledUp, newLevel } = skillStore.addExp('combat', monster.expReward)

    let msg = `在竹林击败了${monster.name}！`
    if (drops.length > 0) msg += ` 获得了${drops.join('、')}。`
    msg += ` (+${monster.expReward}战斗经验)`
    if (leveledUp) msg += ` 战斗提升到${newLevel}级！`
    addLog(msg)

    // 延迟关闭让玩家看到结果
    forestCombatAnimLock.value = true
    setTimeout(() => {
      endForestCombat(false)
    }, 1200)
  }

  const handleForestDefeat = () => {
    const monster = forestCombatMonster.value!
    forestCombatLog.value.push(`你被${monster.name}击败了……`)

    // 惩罚：损失金钱
    const moneyLoss = Math.min(Math.floor(playerStore.money * FOREST_DEFEAT_MONEY_PENALTY_RATE), FOREST_DEFEAT_MONEY_PENALTY_CAP)
    if (moneyLoss > 0) playerStore.spendMoney(moneyLoss)

    // 清空本次采集结果
    lastResults.value = [{ label: `被${monster.name}击败，采集物散落一地……`, quantity: 0 }]

    // HP恢复50%
    playerStore.restoreHealth(Math.floor(playerStore.getMaxHp() * 0.5))

    let msg = `在竹林被${monster.name}击败了……`
    if (moneyLoss > 0) msg += ` 丢失了${moneyLoss}文。`
    msg += ' 采集物全部散落。'
    addLog(msg)

    forestCombatAnimLock.value = true
    setTimeout(() => {
      endForestCombat(false)
    }, 1200)
  }

  const endForestCombat = (_won: boolean) => {
    inForestCombat.value = false
    forestCombatMonster.value = null
    forestCombatMonsterHp.value = 0
    forestCombatLog.value = []
    forestCombatRound.value = 0
    forestCombatAnimLock.value = false
    encounter.value = null
  }
</script>
