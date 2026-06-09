<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-accent text-sm flex items-center space-x-1">
        <Beer :size="14" />
        <span>{{ tavern.displayName }}</span>
        <span v-if="tavern.isBuilt" class="text-[10px] text-muted">
          {{ tavern.customName ? tavern.tierName : '' }}{{ tavern.customName ? ' · ' : '' }}Lv.{{ tavern.tavernLevel }}
        </span>
      </h3>
      <button class="text-xs text-muted hover:text-accent" @click="router.push({ name: 'cottage' })">返回小屋</button>
    </div>

    <div v-if="!tavern.isBuilt" class="border border-accent/20 rounded-xs p-4 text-center text-muted">
      <p class="text-xs">尚未扩建前厅酒肆</p>
    </div>

    <template v-else>
      <div class="flex items-center justify-between border border-accent/20 rounded-xs p-2 mb-3 text-xs">
        <span>口碑 <span class="text-accent">{{ tavern.reputation }}</span>/100</span>
        <span>厨艺等效 <span class="text-accent">{{ tavern.getEffectiveCookingLevel() }}</span></span>
      </div>

      <div class="flex space-x-1 mb-3">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="text-xs px-2 py-1 rounded-xs border"
          :class="tab === t.key ? 'border-accent text-accent bg-accent/10' : 'border-accent/20 text-muted'"
          @click="tab = t.key"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- 概览 -->
      <div v-if="tab === 'overview'" class="space-y-3">
        <div class="border border-accent/20 rounded-xs p-3">
          <p class="text-xs text-muted mb-1">酒肆店名</p>
          <div class="flex space-x-1.5">
            <input
              v-model="renameInput"
              class="flex-1 text-xs bg-bg border border-accent/20 rounded-xs px-2 py-1"
              :maxlength="TAVERN_NAME_MAX_LEN"
              placeholder="如：桃源小馆"
            />
            <Button class="px-2 text-xs justify-center" @click="handleRename">保存</Button>
          </div>
          <p class="text-[10px] text-muted mt-1">1～{{ TAVERN_NAME_MAX_LEN }} 字；扩建等级名「{{ tavern.tierName }}」仍显示在标题旁</p>
        </div>

        <div class="border border-accent/20 rounded-xs p-3">
          <p class="text-xs text-muted mb-2">今日营业方式</p>
          <div class="flex space-x-2">
            <Button
              v-for="m in modes"
              :key="m.key"
              class="flex-1 justify-center text-xs"
              :class="{ '!bg-accent !text-bg': tavern.todayMode === m.key }"
              :disabled="tavern.todayMode === 'manual' && m.key === 'auto'"
              @click="handleSetMode(m.key)"
            >
              {{ m.label }}
            </Button>
          </div>
          <p class="text-[10px] text-muted mt-2">{{ modeHint }}</p>
        </div>

        <div v-if="tavern.nextUpgrade" class="border border-accent/20 rounded-xs p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-accent">升级「{{ tavern.nextUpgrade.name }}」</span>
            <span class="text-xs">{{ tavern.nextUpgrade.cost }} 文</span>
          </div>
          <Button class="w-full justify-center" :disabled="!canUpgrade" @click="handleUpgrade">升级酒肆</Button>
        </div>
      </div>

      <!-- 菜单 -->
      <div v-if="tab === 'menu'" class="space-y-2">
        <div
          v-for="(slot, idx) in tavern.menuSlots"
          :key="idx"
          class="border rounded-xs p-2"
          :class="slot.itemId && tavern.getSlotStock(slot) <= 0 ? 'border-danger/30' : 'border-accent/20'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-accent">{{ slotTypeName(slot.type) }}</span>
            <span v-if="slot.itemId" class="text-[10px]" :class="tavern.getSlotStock(slot) <= 0 ? 'text-danger' : 'text-muted'">
              库存 {{ tavern.getSlotStock(slot) }}
            </span>
          </div>
          <select
            class="w-full text-xs bg-bg border border-accent/20 rounded-xs p-1 mb-1"
            :value="slot.itemId ?? ''"
            @change="handleMenuSelect(idx, $event)"
          >
            <option value="">— 未上架 —</option>
            <option v-for="opt in tavern.getUnlockedMenuItems(slot.type)" :key="opt.id + (opt.cellarIndex ?? '')" :value="opt.cellarIndex != null ? `cellar:${opt.cellarIndex}` : opt.id">
              {{ opt.name }}
            </option>
          </select>
          <div v-if="slot.itemId" class="flex items-center justify-between text-[10px]">
            <span class="text-muted">指导价 {{ tavern.getSlotGuidePrice(slot) }} 文</span>
            <div class="flex items-center space-x-1">
              <button class="px-1 border border-accent/20" @click="tavern.setSlotPriceMult(idx, slot.priceMult - 0.05)">−</button>
              <span>{{ Math.round(slot.priceMult * 100) }}%</span>
              <button class="px-1 border border-accent/20" @click="tavern.setSlotPriceMult(idx, slot.priceMult + 0.05)">+</button>
            </div>
          </div>
          <p v-if="slot.type === 'fruit' && slot.itemId && !isFruitInSeason(slot.itemId, gameStore.season)" class="text-[10px] text-success mt-0.5">
            时鲜反季·客人愿付高价
            <span v-if="hasGreenhouseFruit(slot.itemId)" class="text-accent">·温室供给</span>
          </p>
        </div>
      </div>

      <!-- 员工 -->
      <div v-if="tab === 'staff'" class="space-y-2">
        <Button v-if="tavern.canHireStaff" class="w-full justify-center text-xs" @click="tavern.refreshCandidates()">刷新候选人</Button>
        <p v-else class="text-xs text-muted text-center py-2">员工已满员</p>
        <div v-for="(c, i) in tavern.candidates" :key="i" class="border border-accent/20 rounded-xs p-2">
          <div class="flex items-center justify-between">
            <span class="text-xs text-accent">{{ c.name }}（{{ c.role === 'chef' ? '帮厨' : '跑堂' }}）</span>
            <span class="text-[10px] text-muted">{{ c.salary }} 文/日</span>
          </div>
          <p class="text-[10px] text-muted">厨{{ c.cooking }} 情{{ c.eq }} 智{{ c.iq }}</p>
          <Button class="w-full justify-center text-xs mt-1" @click="tavern.hireCandidate(i)">雇佣</Button>
        </div>
        <div v-for="emp in tavern.employees" :key="emp.id" class="border border-accent/10 rounded-xs p-2">
          <div class="flex items-center justify-between">
            <span class="text-xs">{{ emp.name }} · {{ emp.role === 'chef' ? '帮厨' : '跑堂' }}</span>
            <button class="text-[10px]" :class="emp.onDuty ? 'text-success' : 'text-muted'" @click="tavern.toggleEmployeeDuty(emp.id)">
              {{ emp.onDuty ? '在岗' : '休息' }}
            </button>
          </div>
          <p class="text-[10px] text-muted">厨{{ emp.cooking }} 情{{ emp.eq }} 体力{{ emp.stamina }}/{{ emp.maxStamina }}</p>
          <div class="flex space-x-1 mt-1">
            <Button class="flex-1 text-[10px] justify-center py-0" @click="tavern.trainEmployee(emp.id, 'cooking')">训厨</Button>
            <Button class="flex-1 text-[10px] justify-center py-0" @click="tavern.trainEmployee(emp.id, 'eq')">训情</Button>
          </div>
        </div>
        <p v-if="tavern.employees.length === 0 && tavern.candidates.length === 0" class="text-xs text-muted text-center py-4">
          Lv2 起可招聘员工
        </p>
      </div>

      <!-- 营业 -->
      <div v-if="tab === 'business'" class="space-y-2">
        <template v-if="!tavern.manualSession">
          <Button
            class="w-full justify-center"
            :disabled="tavern.todayMode === 'manual' || playerStore.isExhausted"
            @click="handleStartManual"
          >
            今日亲自营业
          </Button>
          <p class="text-[10px] text-muted text-center">亲自营业当日锁定，日结不再自动演算；收益更高。</p>
        </template>
        <template v-else>
          <p class="text-xs text-accent">营业中 · 已接待 {{ tavern.manualSession.servedCount }} 桌</p>
          <p class="text-[10px] text-muted">步骤：{{ stepLabel }}</p>
          <p class="text-[10px] text-muted">体力已用 {{ tavern.manualStaminaUsed }}/{{ playerStore.maxStamina }}</p>
          <Button class="w-full justify-center" :disabled="playerStore.isExhausted" @click="handleAdvance">下一步</Button>
          <Button class="w-full justify-center mt-1" @click="handleCloseManual">打烊结算</Button>
          <p v-if="manualMsg" class="text-xs text-center text-muted">{{ manualMsg }}</p>
        </template>
      </div>

      <!-- 宴席 -->
      <div v-if="tab === 'feast'" class="space-y-2">
        <div v-for="order in activeFeasts" :key="order.id" class="border border-accent/20 rounded-xs p-2">
          <p class="text-xs text-accent">{{ getNpcName(order.npcId) }}的宴席</p>
          <p class="text-[10px] text-muted">需：{{ order.itemIds.map(getItemName).join('、') }}</p>
          <p class="text-[10px] text-muted">奖励 {{ order.rewardMoney }} 文 · 期限第 {{ order.deadlineDay }} 天</p>
          <Button class="w-full justify-center text-xs mt-1" @click="handleCompleteFeast(order.id)">交付宴席</Button>
        </div>
        <p v-if="activeFeasts.length === 0" class="text-xs text-muted text-center py-6">好感达标后将解锁专属宴席订单</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { Beer } from 'lucide-vue-next'
  import { useTavernStore, type TavernTodayMode } from '@/stores/useTavernStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { getItemById, getNpcById } from '@/data'
  import { useHomeStore } from '@/stores/useHomeStore'
  import { isFruitInSeason } from '@/data/fruitSeason'
  import { getCombinedItemCount, hasGreenhouseFruit } from '@/composables/useCombinedInventory'
  import { addLog, showFloat } from '@/composables/useGameLog'
  import { TAVERN_NAME_MAX_LEN, type TavernMenuSlotType } from '@/data/tavern'
  import Button from '@/components/game/Button.vue'

  const router = useRouter()
  const tavern = useTavernStore()
  const playerStore = usePlayerStore()
  const gameStore = useGameStore()

  const tab = ref<'overview' | 'menu' | 'staff' | 'business' | 'feast'>('overview')
  const manualMsg = ref('')
  const renameInput = ref(tavern.customName || tavern.displayName)

  const tabs = [
    { key: 'overview' as const, label: '概览' },
    { key: 'menu' as const, label: '菜单' },
    { key: 'staff' as const, label: '员工' },
    { key: 'business' as const, label: '营业' },
    { key: 'feast' as const, label: '宴席' }
  ]

  const modes: { key: TavernTodayMode; label: string }[] = [
    { key: 'auto', label: '日结自动' },
    { key: 'closed', label: '今日打烊' }
  ]

  const modeHint = computed(() => {
    if (tavern.todayMode === 'manual') return '今日已选亲自营业，睡前不再自动演算。'
    if (tavern.todayMode === 'closed') return '今日打烊，无收入。'
    return '睡前将按菜单与排班自动演算当晚营业。'
  })

  const stepLabel = computed(() => {
    const s = tavern.manualSession?.step
    const map: Record<string, string> = {
      check: '开铺检查', serve: '接客', kitchen: '后厨', deliver: '上菜', checkout: '结账', done: '已完成'
    }
    return s ? map[s] ?? s : ''
  })

  const activeFeasts = computed(() => tavern.feastOrders.filter(o => !o.completed))

  const canUpgrade = computed(() => {
    const next = tavern.nextUpgrade
    if (!next) return false
    if (playerStore.money < next.cost) return false
    return next.materialCost.every(m => getCombinedItemCount(m.itemId) >= m.quantity)
  })

  const slotTypeName = (t: TavernMenuSlotType) => {
    const map: Record<TavernMenuSlotType, string> = {
      wine: '招牌酒', dish: '热菜', snack: '小食', fruit: '鲜果', cellar: '窖藏'
    }
    return map[t]
  }

  const getItemName = (id: string) => getItemById(id)?.name ?? id
  const getNpcName = (id: string) => getNpcById(id)?.name ?? id

  const handleSetMode = (mode: TavernTodayMode) => {
    if (tavern.setTodayMode(mode)) addLog(mode === 'closed' ? '酒肆今日打烊。' : '酒肆将日结自动营业。')
  }

  const handleUpgrade = () => {
    if (tavern.upgradeTavern()) {
      addLog(`酒肆升级为「${tavern.tierName}」。`)
      showFloat('酒肆升级', 'accent')
    }
  }

  const handleRename = () => {
    if (tavern.setCustomName(renameInput.value)) {
      addLog(`酒肆更名为「${tavern.displayName}」。`)
      showFloat('店名已更新', 'accent')
    } else {
      addLog('店名需 1～12 个字。')
    }
  }

  const handleMenuSelect = (idx: number, ev: Event) => {
    const val = (ev.target as HTMLSelectElement).value
    if (!val) {
      tavern.setMenuSlot(idx, null)
      return
    }
    if (val.startsWith('cellar:')) {
      const cellarIdx = parseInt(val.slice(7), 10)
      const home = useHomeStore()
      const slot = home.cellarSlots[cellarIdx]
      if (slot) tavern.setMenuSlot(idx, slot.itemId, cellarIdx)
    } else {
      tavern.setMenuSlot(idx, val)
    }
  }

  const handleStartManual = () => {
    if (tavern.startManualShift()) {
      manualMsg.value = '亲自营业开始！'
      addLog('你决定今日亲自照看酒肆。')
    } else {
      manualMsg.value = '请先配置菜单并确保有货。'
    }
  }

  const handleAdvance = () => {
    const r = tavern.advanceManualStep()
    manualMsg.value = r.message
    if (r.success && tavern.manualSession?.step === 'done') {
      handleCloseManual()
    }
  }

  const handleCloseManual = () => {
    const { revenue, tips } = tavern.closeManualShift()
    const total = revenue + tips
    if (total > 0) showFloat(`+${total}文`, 'accent')
    addLog(`亲自营业结束：收入 ${revenue} 文，小费 ${tips} 文。`)
    manualMsg.value = ''
  }

  const handleCompleteFeast = (id: string) => {
    if (tavern.completeFeast(id)) {
      addLog('宴席订单完成！')
      showFloat('宴席完成', 'accent')
    }
  }

</script>
