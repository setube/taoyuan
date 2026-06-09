<template>
  <div>
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center space-x-1.5 text-sm text-accent">
        <User :size="14" />
        <span>角色信息</span>
      </div>
      <span class="text-xs text-muted">第{{ gameStore.year }}年 {{ SEASON_NAMES[gameStore.season] }}</span>
    </div>

    <!-- 角色身份 + 属性 -->
    <div class="border border-accent/20 rounded-xs p-2 mb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-accent">{{ playerStore.playerName }}</span>
        <span class="text-xs text-muted">{{ genderLabel }}</span>
      </div>

      <div class="flex flex-col space-y-1.5">
        <!-- 体力 -->
        <div class="flex items-center space-x-2">
          <span class="text-xs text-muted shrink-0">体力</span>
          <div class="flex-1 h-1 bg-bg rounded-xs border border-accent/10">
            <div
              class="h-full rounded-xs transition-all"
              :class="playerStore.staminaPercent > 35 ? 'bg-success' : 'bg-danger'"
              :style="{ width: playerStore.staminaPercent + '%' }"
            />
          </div>
          <span class="text-xs whitespace-nowrap">{{ playerStore.stamina }}/{{ playerStore.maxStamina }}</span>
        </div>
        <!-- 生命 -->
        <div class="flex items-center space-x-2">
          <span class="text-xs text-muted shrink-0">生命</span>
          <div class="flex-1 h-1 bg-bg rounded-xs border border-accent/10">
            <div
              class="h-full rounded-xs transition-all"
              :class="playerStore.getHpPercent() > 25 ? 'bg-success' : 'bg-danger'"
              :style="{ width: playerStore.getHpPercent() + '%' }"
            />
          </div>
          <span class="text-xs whitespace-nowrap">{{ playerStore.hp }}/{{ playerStore.getMaxHp() }}</span>
        </div>
        <!-- 铜钱 -->
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">铜钱</span>
          <span class="text-xs text-accent">{{ playerStore.money }}文</span>
        </div>
      </div>
    </div>

    <!-- 装备槽位 -->
    <div class="border border-accent/20 rounded-xs p-2 mb-3">
      <p class="text-xs text-muted mb-1.5">装备</p>
      <div class="grid grid-cols-3 gap-1 mb-1">
        <div
          class="border border-accent/10 rounded-xs px-2 py-1 text-center cursor-pointer hover:bg-accent/5"
          @click="activeSlot = 'weapon'"
        >
          <p class="text-[10px] text-muted">武器</p>
          <p class="text-xs text-accent truncate">{{ equippedWeaponName }}</p>
        </div>
        <div
          class="border border-accent/10 rounded-xs px-2 py-1 text-center cursor-pointer hover:bg-accent/5"
          @click="activeSlot = 'ring1'"
        >
          <p class="text-[10px] text-muted">戒指1</p>
          <p class="text-xs truncate" :class="equippedRing1 ? 'text-accent' : 'text-muted/40'">
            {{ equippedRing1?.name ?? '空' }}
          </p>
        </div>
        <div
          class="border border-accent/10 rounded-xs px-2 py-1 text-center cursor-pointer hover:bg-accent/5"
          @click="activeSlot = 'ring2'"
        >
          <p class="text-[10px] text-muted">戒指2</p>
          <p class="text-xs truncate" :class="equippedRing2 ? 'text-accent' : 'text-muted/40'">
            {{ equippedRing2?.name ?? '空' }}
          </p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-1">
        <div class="border border-accent/10 rounded-xs px-2 py-1 text-center cursor-pointer hover:bg-accent/5" @click="activeSlot = 'hat'">
          <p class="text-[10px] text-muted">帽子</p>
          <p class="text-xs truncate" :class="equippedHatName ? 'text-accent' : 'text-muted/40'">
            {{ equippedHatName ?? '空' }}
          </p>
        </div>
        <div class="border border-accent/10 rounded-xs px-2 py-1 text-center cursor-pointer hover:bg-accent/5" @click="activeSlot = 'shoe'">
          <p class="text-[10px] text-muted">鞋子</p>
          <p class="text-xs truncate" :class="equippedShoeName ? 'text-accent' : 'text-muted/40'">
            {{ equippedShoeName ?? '空' }}
          </p>
        </div>
      </div>
    </div>

    <!-- 装备选择弹窗 -->
    <Transition name="panel-fade">
      <div v-if="activeSlot" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="activeSlot = null">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeSlot = null">
            <X :size="14" />
          </button>

          <!-- 武器弹窗 -->
          <template v-if="activeSlot === 'weapon'">
            <p class="text-sm text-accent mb-2">选择武器</p>
            <div class="flex flex-col space-y-1 max-h-60 overflow-y-auto">
              <div
                v-for="(weapon, index) in inventoryStore.ownedWeapons"
                :key="index"
                class="flex items-center justify-between border rounded-xs px-2 py-1.5 cursor-pointer hover:bg-accent/5 mr-1"
                :class="index === inventoryStore.equippedWeaponIndex ? 'border-accent/30' : 'border-accent/10'"
                @click="handleEquipWeapon(index)"
              >
                <div class="min-w-0">
                  <span class="text-xs" :class="index === inventoryStore.equippedWeaponIndex ? 'text-accent' : ''">
                    {{ getWeaponDisplayName(weapon.defId, weapon.enchantmentId) }}
                  </span>
                  <p class="text-[10px] text-muted truncate">
                    攻{{ getWeaponStats(weapon).attack }} · 暴击{{ Math.round(getWeaponStats(weapon).critRate * 100) }}%
                    <template v-if="weapon.enchantmentId">· {{ getEnchantName(weapon.enchantmentId) }}</template>
                  </p>
                </div>
                <span v-if="index === inventoryStore.equippedWeaponIndex" class="text-[10px] text-accent shrink-0 ml-1">当前</span>
              </div>
            </div>
          </template>

          <!-- 戒指弹窗 -->
          <template v-else-if="activeSlot === 'ring1' || activeSlot === 'ring2'">
            <p class="text-sm text-accent mb-2">选择{{ activeSlot === 'ring1' ? '戒指1' : '戒指2' }}</p>
            <div class="flex flex-col space-y-1 max-h-60 overflow-y-auto">
              <!-- 卸下按钮 -->
              <div
                v-if="(activeSlot === 'ring1' ? inventoryStore.equippedRingSlot1 : inventoryStore.equippedRingSlot2) >= 0"
                class="flex items-center border border-danger/20 rounded-xs px-2 py-1.5 cursor-pointer hover:bg-danger/5 mr-1"
                @click="handleUnequipRingFromPopup"
              >
                <span class="text-xs text-danger">卸下当前戒指</span>
              </div>
              <!-- 戒指列表 -->
              <template v-if="inventoryStore.ownedRings.length > 0">
                <div
                  v-for="(ring, idx) in ownedRingList"
                  :key="idx"
                  class="flex items-center justify-between border rounded-xs px-2 py-1.5 cursor-pointer hover:bg-accent/5 mr-1"
                  :class="isRingInCurrentSlot(idx) ? 'border-accent/30' : 'border-accent/10'"
                  @click="handleEquipRingFromPopup(idx)"
                >
                  <div class="min-w-0">
                    <span class="text-xs" :class="isRingInCurrentSlot(idx) ? 'text-accent' : ''">{{ ring.name }}</span>
                    <p class="text-[10px] text-muted truncate">{{ ring.effectText }}</p>
                  </div>
                  <span v-if="isRingInCurrentSlot(idx)" class="text-[10px] text-accent shrink-0 ml-1">当前</span>
                  <span v-else-if="isRingInOtherSlot(idx)" class="text-[10px] text-muted shrink-0 ml-1">
                    在{{ activeSlot === 'ring1' ? '槽2' : '槽1' }}
                  </span>
                </div>
              </template>
              <p v-else class="text-xs text-muted/40 text-center py-2">暂无戒指</p>
            </div>
          </template>

          <!-- 帽子弹窗 -->
          <template v-else-if="activeSlot === 'hat'">
            <p class="text-sm text-accent mb-2">选择帽子</p>
            <div class="flex flex-col space-y-1 max-h-60 overflow-y-auto">
              <div
                v-if="inventoryStore.equippedHatIndex >= 0"
                class="flex items-center border border-danger/20 rounded-xs px-2 py-1.5 cursor-pointer hover:bg-danger/5 mr-1"
                @click="handleUnequipHatFromPopup"
              >
                <span class="text-xs text-danger">卸下当前帽子</span>
              </div>
              <template v-if="inventoryStore.ownedHats.length > 0">
                <div
                  v-for="hat in ownedHatList"
                  :key="hat.index"
                  class="flex items-center justify-between border rounded-xs px-2 py-1.5 cursor-pointer hover:bg-accent/5 mr-1"
                  :class="hat.index === inventoryStore.equippedHatIndex ? 'border-accent/30' : 'border-accent/10'"
                  @click="handleEquipHatFromPopup(hat.index)"
                >
                  <div class="min-w-0">
                    <span class="text-xs" :class="hat.index === inventoryStore.equippedHatIndex ? 'text-accent' : ''">{{ hat.name }}</span>
                    <p class="text-[10px] text-muted truncate">{{ hat.effectText }}</p>
                  </div>
                  <span v-if="hat.index === inventoryStore.equippedHatIndex" class="text-[10px] text-accent shrink-0 ml-1">当前</span>
                </div>
              </template>
              <p v-else class="text-xs text-muted/40 text-center py-2">暂无帽子</p>
            </div>
          </template>

          <!-- 鞋子弹窗 -->
          <template v-else-if="activeSlot === 'shoe'">
            <p class="text-sm text-accent mb-2">选择鞋子</p>
            <div class="flex flex-col space-y-1 max-h-60 overflow-y-auto">
              <div
                v-if="inventoryStore.equippedShoeIndex >= 0"
                class="flex items-center border border-danger/20 rounded-xs px-2 py-1.5 cursor-pointer hover:bg-danger/5 mr-1"
                @click="handleUnequipShoeFromPopup"
              >
                <span class="text-xs text-danger">卸下当前鞋子</span>
              </div>
              <template v-if="inventoryStore.ownedShoes.length > 0">
                <div
                  v-for="shoe in ownedShoeList"
                  :key="shoe.index"
                  class="flex items-center justify-between border rounded-xs px-2 py-1.5 cursor-pointer hover:bg-accent/5 mr-1"
                  :class="shoe.index === inventoryStore.equippedShoeIndex ? 'border-accent/30' : 'border-accent/10'"
                  @click="handleEquipShoeFromPopup(shoe.index)"
                >
                  <div class="min-w-0">
                    <span class="text-xs" :class="shoe.index === inventoryStore.equippedShoeIndex ? 'text-accent' : ''">
                      {{ shoe.name }}
                    </span>
                    <p class="text-[10px] text-muted truncate">{{ shoe.effectText }}</p>
                  </div>
                  <span v-if="shoe.index === inventoryStore.equippedShoeIndex" class="text-[10px] text-accent shrink-0 ml-1">当前</span>
                </div>
              </template>
              <p v-else class="text-xs text-muted/40 text-center py-2">暂无鞋子</p>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- 工具一览 -->
    <div class="border border-accent/20 rounded-xs p-2 mb-3">
      <div class="flex items-center justify-between mb-1.5">
        <p class="text-xs text-muted">工具</p>
        <button class="text-xs text-accent hover:underline" @click="goToUpgrade">前往升级</button>
      </div>
      <div class="flex flex-col space-y-1">
        <div
          v-for="tool in inventoryStore.tools"
          :key="tool.type"
          class="flex items-center justify-between border border-accent/10 rounded-xs px-2 py-1"
        >
          <div>
            <span class="text-xs">{{ TOOL_NAMES[tool.type] }}</span>
            <span class="text-xs text-muted ml-1">{{ TIER_NAMES[tool.tier] }}</span>
          </div>
          <span class="text-[10px] text-muted">-{{ Math.round((1 - inventoryStore.getToolStaminaMultiplier(tool.type)) * 100) }}%体力</span>
        </div>
      </div>
    </div>

    <!-- 技能总览 -->
    <div class="border border-accent/20 rounded-xs p-2 mb-3">
      <div class="flex items-center justify-between mb-1.5">
        <p class="text-xs text-muted">技能</p>
        <button class="text-xs text-accent hover:underline" @click="goToSkills">查看详情</button>
      </div>
      <div class="flex flex-col space-y-0.5">
        <div v-for="skill in skillStore.skills" :key="skill.type" class="flex items-center justify-between">
          <span class="text-xs text-muted">{{ SKILL_NAMES[skill.type] }}</span>
          <div class="flex items-center space-x-1.5">
            <span class="text-xs text-accent">Lv.{{ skill.level }}</span>
            <span v-if="skill.perk5" class="text-[10px] text-success">{{ PERK_NAMES[skill.perk5] }}</span>
            <span v-if="skill.perk10" class="text-[10px] text-success">{{ PERK_NAMES[skill.perk10] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 被动加成 -->
    <div v-if="unlockedWalletItems.length > 0" class="border border-accent/20 rounded-xs p-2 mb-3">
      <p class="text-xs text-muted mb-1.5">被动加成</p>
      <div class="flex flex-col space-y-0.5">
        <div v-for="item in unlockedWalletItems" :key="item.id" class="flex items-center justify-between">
          <span class="text-xs text-accent">{{ item.name }}</span>
          <span class="text-xs text-muted">{{ item.description }}</span>
        </div>
      </div>
    </div>

    <!-- 家庭 -->
    <div v-if="spouseInfo" class="border border-accent/20 rounded-xs p-2">
      <p class="text-xs text-muted mb-1.5">家庭</p>
      <div class="flex flex-col space-y-0.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">配偶</span>
          <span class="text-xs text-accent">{{ spouseInfo.name }}</span>
        </div>
        <div v-for="child in npcStore.children" :key="child.id" class="flex items-center justify-between">
          <span class="text-xs text-muted">{{ child.name }}</span>
          <span class="text-xs">{{ CHILD_STAGE_NAMES[child.stage] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { User, X } from 'lucide-vue-next'
  import { useGameStore, SEASON_NAMES } from '@/stores/useGameStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useNpcStore } from '@/stores/useNpcStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { useWalletStore } from '@/stores/useWalletStore'
  import { TOOL_NAMES, TIER_NAMES, getNpcById } from '@/data'
  import { getWeaponById, getEnchantmentById, getWeaponDisplayName } from '@/data/weapons'
  import { getRingById } from '@/data/rings'
  import { getHatById } from '@/data/hats'
  import { getShoeById } from '@/data/shoes'
  import type { EquipmentEffectType } from '@/types'
  import { WALLET_ITEMS } from '@/data/wallet'
  import { navigateToPanel } from '@/composables/useNavigation'
  import type { SkillType, SkillPerk5, SkillPerk10, ChildStage, OwnedWeapon } from '@/types'
  import { addLog } from '@/composables/useGameLog'

  const playerStore = usePlayerStore()
  const inventoryStore = useInventoryStore()
  const skillStore = useSkillStore()
  const walletStore = useWalletStore()
  const npcStore = useNpcStore()
  const gameStore = useGameStore()

  // === 身份 ===
  const genderLabel = computed(() => (playerStore.gender === 'male' ? '男' : '女'))

  // === 装备槽位 ===

  const activeSlot = ref<'weapon' | 'ring1' | 'ring2' | 'hat' | 'shoe' | null>(null)

  // === 武器 ===

  const equippedWeaponName = computed(() => {
    const weapon = inventoryStore.ownedWeapons[inventoryStore.equippedWeaponIndex]
    if (!weapon) return '无'
    return getWeaponDisplayName(weapon.defId, weapon.enchantmentId)
  })

  const getWeaponStats = (weapon: OwnedWeapon): { attack: number; critRate: number } => {
    const def = getWeaponById(weapon.defId)
    if (!def) return { attack: 0, critRate: 0 }
    let attack = def.attack
    let critRate = def.critRate
    if (weapon.enchantmentId) {
      const enchant = getEnchantmentById(weapon.enchantmentId)
      if (enchant) {
        attack += enchant.attackBonus
        critRate += enchant.critBonus
      }
    }
    return { attack, critRate }
  }

  const getEnchantName = (enchantmentId: string): string => {
    return getEnchantmentById(enchantmentId)?.name ?? ''
  }

  const handleEquipWeapon = (index: number) => {
    if (inventoryStore.equipWeapon(index)) {
      const weapon = inventoryStore.ownedWeapons[index]!
      const name = getWeaponDisplayName(weapon.defId, weapon.enchantmentId)
      addLog(`装备了${name}。`)
    }
  }

  // === 戒指 ===

  const RING_EFFECT_SHORT: Record<EquipmentEffectType, string> = {
    attack_bonus: '攻击',
    crit_rate_bonus: '暴击',
    defense_bonus: '减伤',
    vampiric: '吸血',
    max_hp_bonus: '生命',
    stamina_reduction: '体力减免',
    mining_stamina: '挖矿体力减免',
    farming_stamina: '农耕体力减免',
    fishing_stamina: '钓鱼体力减免',
    crop_quality_bonus: '品质',
    crop_growth_bonus: '生长加速',
    fish_quality_bonus: '鱼品质',
    fishing_calm: '鱼速降低',
    sell_price_bonus: '售价',
    shop_discount: '折扣',
    gift_friendship: '好感',
    monster_drop_bonus: '掉落',
    exp_bonus: '经验',
    treasure_find: '宝箱',
    ore_bonus: '矿石',
    luck: '幸运',
    travel_speed: '旅行加速'
  }

  const formatRingEffects = (defId: string): string => {
    const def = getRingById(defId)
    if (!def) return ''
    return def.effects
      .map(e => {
        const label = RING_EFFECT_SHORT[e.type]
        return e.value > 0 && e.value < 1 ? `${label}${Math.round(e.value * 100)}%` : `${label}+${e.value}`
      })
      .join(' ')
  }

  const getRingInfo = (index: number): { name: string; effectText: string } | null => {
    if (index < 0 || index >= inventoryStore.ownedRings.length) return null
    const ring = inventoryStore.ownedRings[index]!
    const def = getRingById(ring.defId)
    if (!def) return null
    return { name: def.name, effectText: formatRingEffects(ring.defId) }
  }

  const equippedRing1 = computed(() => getRingInfo(inventoryStore.equippedRingSlot1))
  const equippedRing2 = computed(() => getRingInfo(inventoryStore.equippedRingSlot2))

  const ownedRingList = computed(() =>
    inventoryStore.ownedRings.map((ring, index) => ({
      index,
      name: getRingById(ring.defId)?.name ?? ring.defId,
      effectText: formatRingEffects(ring.defId)
    }))
  )

  const handleEquipRingFromPopup = (ringIndex: number) => {
    const slot: 0 | 1 = activeSlot.value === 'ring1' ? 0 : 1
    if (inventoryStore.equipRing(ringIndex, slot)) {
      const def = getRingById(inventoryStore.ownedRings[ringIndex]!.defId)
      addLog(`将${def?.name ?? '戒指'}装备到槽位${slot + 1}。`)
      activeSlot.value = null
    }
  }

  const handleUnequipRingFromPopup = () => {
    const slot: 0 | 1 = activeSlot.value === 'ring1' ? 0 : 1
    const idx = slot === 0 ? inventoryStore.equippedRingSlot1 : inventoryStore.equippedRingSlot2
    const def = idx >= 0 ? getRingById(inventoryStore.ownedRings[idx]!.defId) : null
    if (inventoryStore.unequipRing(slot)) {
      addLog(`卸下了${def?.name ?? '戒指'}。`)
      activeSlot.value = null
    }
  }

  const isRingInCurrentSlot = (idx: number): boolean => {
    if (activeSlot.value === 'ring1') return inventoryStore.equippedRingSlot1 === idx
    return inventoryStore.equippedRingSlot2 === idx
  }

  const isRingInOtherSlot = (idx: number): boolean => {
    if (activeSlot.value === 'ring1') return inventoryStore.equippedRingSlot2 === idx
    return inventoryStore.equippedRingSlot1 === idx
  }

  // === 帽子 ===

  const equippedHatName = computed(() => {
    const hat = inventoryStore.ownedHats[inventoryStore.equippedHatIndex]
    if (!hat) return null
    return getHatById(hat.defId)?.name ?? null
  })

  const formatEquipEffects = (effects: { type: EquipmentEffectType; value: number }[]): string => {
    return effects
      .map(e => {
        const label = RING_EFFECT_SHORT[e.type]
        return e.value > 0 && e.value < 1 ? `${label}${Math.round(e.value * 100)}%` : `${label}+${e.value}`
      })
      .join(' ')
  }

  const ownedHatList = computed(() =>
    inventoryStore.ownedHats.map((hat, index) => {
      const def = getHatById(hat.defId)
      return {
        index,
        name: def?.name ?? hat.defId,
        effectText: def ? formatEquipEffects(def.effects) : ''
      }
    })
  )

  const handleEquipHatFromPopup = (index: number) => {
    if (inventoryStore.equipHat(index)) {
      const def = getHatById(inventoryStore.ownedHats[index]!.defId)
      addLog(`装备了${def?.name ?? '帽子'}。`)
      activeSlot.value = null
    }
  }

  const handleUnequipHatFromPopup = () => {
    const idx = inventoryStore.equippedHatIndex
    const def = idx >= 0 ? getHatById(inventoryStore.ownedHats[idx]!.defId) : null
    if (inventoryStore.unequipHat()) {
      addLog(`卸下了${def?.name ?? '帽子'}。`)
      activeSlot.value = null
    }
  }

  // === 鞋子 ===

  const equippedShoeName = computed(() => {
    const shoe = inventoryStore.ownedShoes[inventoryStore.equippedShoeIndex]
    if (!shoe) return null
    return getShoeById(shoe.defId)?.name ?? null
  })

  const ownedShoeList = computed(() =>
    inventoryStore.ownedShoes.map((shoe, index) => {
      const def = getShoeById(shoe.defId)
      return {
        index,
        name: def?.name ?? shoe.defId,
        effectText: def ? formatEquipEffects(def.effects) : ''
      }
    })
  )

  const handleEquipShoeFromPopup = (index: number) => {
    if (inventoryStore.equipShoe(index)) {
      const def = getShoeById(inventoryStore.ownedShoes[index]!.defId)
      addLog(`装备了${def?.name ?? '鞋子'}。`)
      activeSlot.value = null
    }
  }

  const handleUnequipShoeFromPopup = () => {
    const idx = inventoryStore.equippedShoeIndex
    const def = idx >= 0 ? getShoeById(inventoryStore.ownedShoes[idx]!.defId) : null
    if (inventoryStore.unequipShoe()) {
      addLog(`卸下了${def?.name ?? '鞋子'}。`)
      activeSlot.value = null
    }
  }

  // === 技能 ===
  const SKILL_NAMES: Record<SkillType, string> = {
    farming: '农耕',
    foraging: '采集',
    fishing: '钓鱼',
    mining: '挖矿',
    combat: '战斗',
    cooking: '烹饪'
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
    tavern_master: '肆尊'
  }

  // === 被动 ===
  const unlockedWalletItems = computed(() => WALLET_ITEMS.filter(w => walletStore.has(w.id)))

  // === 家庭 ===
  const spouseInfo = computed(() => {
    const spouseState = npcStore.getSpouse()
    if (!spouseState) return null
    const npcDef = getNpcById(spouseState.npcId)
    return npcDef ? { name: npcDef.name } : null
  })

  const CHILD_STAGE_NAMES: Record<ChildStage, string> = {
    baby: '婴儿',
    toddler: '幼童',
    child: '孩童',
    teen: '少年'
  }

  // === 导航 ===
  const goToUpgrade = () => {
    navigateToPanel('upgrade')
  }

  const goToSkills = () => {
    navigateToPanel('skills')
  }
</script>
