<template>
  <div v-if="presentNpcs.length > 0" class="border border-accent/20 rounded-xs p-2 mb-3">
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-xs text-accent">
        <Users :size="12" class="inline" />
        此处的村民
      </span>
      <span class="text-[10px] text-muted">{{ presentNpcs.length }}人在这儿</span>
    </div>

    <div class="flex flex-wrap">
      <button
        v-for="entry in presentNpcs"
        :key="entry.npcId"
        class="border rounded-xs px-2 py-1 mr-1 mb-1 text-left transition-colors"
        :class="entry.talkedToday ? 'border-accent/10 text-muted/60' : 'border-accent/30 hover:bg-accent/5'"
        @click="selected = entry.npcId"
      >
        <span class="text-[10px]">{{ entry.name }}</span>
        <span class="text-[10px] ml-1" :class="entry.hearts > 0 ? 'text-danger' : 'text-muted/40'">
          {{ entry.hearts }}
          <Heart :size="8" class="inline" :fill="entry.hearts > 0 ? 'currentColor' : 'none'" />
        </span>
        <MessageCircle v-if="!entry.talkedToday" :size="8" class="inline ml-0.5 text-success" />
        <Cake v-if="entry.isBirthday" :size="8" class="inline ml-0.5 text-danger" />
      </button>
    </div>

    <!-- 偶遇交互弹窗 -->
    <Transition name="panel-fade">
      <div v-if="selected && selectedDef" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="close">
        <div class="game-panel max-w-xs w-full relative max-h-[80vh] overflow-y-auto">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="close">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent pr-6">
            {{ selectedDisplayName }}
            <span class="text-[10px] text-muted ml-0.5">{{ selectedDef.role }}</span>
          </p>
          <p class="text-[10px] text-muted/60 mb-2">在{{ SPOT_NAMES[spot] }}遇见</p>

          <!-- 好感 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-px">
                <Heart
                  v-for="h in 10"
                  :key="h"
                  :size="10"
                  class="flex-shrink-0"
                  :class="(selectedState?.friendship ?? 0) >= h * 250 ? 'text-danger' : 'text-muted/20'"
                  :fill="(selectedState?.friendship ?? 0) >= h * 250 ? 'currentColor' : 'none'"
                />
              </div>
              <span class="text-[10px] text-muted">{{ selectedState?.friendship ?? 0 }}</span>
            </div>
            <p class="text-[10px] text-accent/70 mt-1">
              当前关系：{{ FRIENDSHIP_LEVEL_INFO[npcStore.getFriendshipLevel(selected!)].name }}
            </p>
          </div>

          <!-- 对话内容 -->
          <div v-if="dialogueText" class="border border-accent/20 rounded-xs p-2 mb-2">
            <p class="text-[10px] text-accent mb-1">「{{ selectedDisplayName }}」</p>
            <p class="text-xs leading-relaxed">{{ dialogueText }}</p>
          </div>

          <!-- 操作 -->
          <div class="flex flex-col space-y-1 mb-2">
            <Button
              class="w-full justify-center"
              :icon="MessageCircle"
              :icon-size="12"
              :disabled="selectedState?.talkedToday"
              @click="handleTalk"
            >
              {{ selectedState?.talkedToday ? '今天已聊过' : '打个招呼' }}
            </Button>
            <!-- 已聊过仍可闲扯：不加好感，但每次都有新内容 -->
            <Button
              v-if="selectedState?.talkedToday"
              class="w-full justify-center"
              :icon="MessageCircle"
              :icon-size="12"
              @click="handleChat"
            >
              再聊两句
            </Button>
            <Button
              v-if="!giftPanelOpen"
              class="w-full justify-center"
              :icon="Gift"
              :icon-size="12"
              :disabled="!canGift"
              @click="giftPanelOpen = true"
            >
              {{ giftLabel }}
            </Button>
          </div>

          <!-- 送礼列表 -->
          <div v-if="giftPanelOpen" class="border border-accent/10 rounded-xs p-2">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] text-muted">选一样送出</span>
              <button class="text-muted hover:text-text" @click="giftPanelOpen = false">
                <X :size="12" />
              </button>
            </div>
            <div v-if="giftableItems.length > 0" class="flex flex-col space-y-1 max-h-40 overflow-y-auto">
              <button
                v-for="item in giftableItems"
                :key="item.itemId + ':' + item.quality"
                class="flex items-center justify-between border border-accent/20 rounded-xs px-2 py-1 hover:bg-accent/5 mr-1"
                @click="handleGift(item.itemId, item.quality)"
              >
                <!-- 品质用颜色 + 标签双重标识，与桃源村面板保持一致 -->
                <span class="text-[10px] truncate" :class="qualityTextClass(item.quality)">
                  {{ getItemById(item.itemId)?.name }}
                  <span v-if="item.quality !== 'normal'">[{{ QUALITY_NAMES[item.quality] }}]</span>
                  <span class="text-muted/60">&times;{{ item.quantity }}</span>
                </span>
                <span v-if="giftPreference(item.itemId)" class="text-[10px] flex-shrink-0 ml-1" :class="giftPreferenceClass(item.itemId)">
                  {{ giftPreference(item.itemId) }}
                </span>
              </button>
            </div>
            <p v-else class="text-[10px] text-muted text-center py-3">暂无物品</p>
          </div>

          <p class="text-[10px] text-muted/40 mt-2">想送定情信物或谈婚论嫁，去「桃源村」面板找对方。</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Users, Heart, MessageCircle, Gift, Cake, X } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import { useGameStore } from '@/stores/useGameStore'
  import { useNpcStore, FRIENDSHIP_LEVEL_INFO } from '@/stores/useNpcStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useCookingStore } from '@/stores/useCookingStore'
  import { getNpcById } from '@/data/npcs'
  import { getItemById } from '@/data/items'
  import { getNpcsAtSpot, SPOT_NAMES, type NpcSpot } from '@/data/npcSchedule'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { QUALITY_NAMES } from '@/composables/useFarmActions'
  import { addLog } from '@/composables/useGameLog'
  import { getGiftableStacks } from '@/composables/useCombinedInventory'
  import { triggerHeartEvent } from '@/composables/useDialogs'
  import { handleEndDay } from '@/composables/useEndDay'
  import type { Quality } from '@/types'

  const props = defineProps<{
    /** 当前面板对应的地点 */
    spot: NpcSpot
  }>()

  const gameStore = useGameStore()
  const npcStore = useNpcStore()
  const inventoryStore = useInventoryStore()
  const cookingStore = useCookingStore()

  const selected = ref<string | null>(null)
  const dialogueText = ref<string | null>(null)
  const giftPanelOpen = ref(false)

  /** 此刻出现在本地点的村民 */
  const presentNpcs = computed(() => {
    return getNpcsAtSpot(props.spot, gameStore.day, gameStore.hour, gameStore.season).map(npcId => {
      const state = npcStore.getNpcState(npcId)
      return {
        npcId,
        name: npcStore.getNpcDisplayName(npcId),
        hearts: Math.min(10, Math.floor((state?.friendship ?? 0) / 250)),
        talkedToday: state?.talkedToday ?? false,
        isBirthday: npcStore.isBirthday(npcId)
      }
    })
  })

  const selectedDef = computed(() => (selected.value ? getNpcById(selected.value) : null))
  const selectedState = computed(() => (selected.value ? npcStore.getNpcState(selected.value) : null))
  const selectedDisplayName = computed(() => (selected.value ? npcStore.getNpcDisplayName(selected.value) : ''))

  const close = () => {
    selected.value = null
    dialogueText.value = null
    giftPanelOpen.value = false
  }

  const canGift = computed(() => {
    if (!selected.value) return false
    return npcStore.canGiftToday(selected.value)
  })

  const giftLabel = computed(() => {
    if (!selected.value) return '送点东西'
    if (npcStore.canGiftToday(selected.value)) {
      return npcStore.isBirthday(selected.value) ? '送生日礼（×4）' : '送点东西'
    }
    return npcStore.getGiftStatusText(selected.value)
  })

  /** 可赠送的物品：背包+仓库合计（种子不参与送礼；点一下就送出，背包里锁定的不列出） */
  const giftableItems = computed(() => {
    const locked = new Set(inventoryStore.items.filter(i => i.locked).map(i => `${i.itemId}:${i.quality}`))
    return getGiftableStacks().filter(i => !locked.has(`${i.itemId}:${i.quality}`))
  })

  const giftPreference = (itemId: string): string => {
    const def = selectedDef.value
    if (!def) return ''
    if (def.lovedItems.includes(itemId)) return '最爱'
    if (def.likedItems.includes(itemId)) return '喜欢'
    if (def.hatedItems.includes(itemId)) return '讨厌'
    return ''
  }

  const giftPreferenceClass = (itemId: string): string => {
    const def = selectedDef.value
    if (!def) return ''
    if (def.lovedItems.includes(itemId)) return 'text-danger'
    if (def.likedItems.includes(itemId)) return 'text-success'
    if (def.hatedItems.includes(itemId)) return 'text-muted'
    return ''
  }

  /** 品质对应的文字颜色 */
  const qualityTextClass = (q: Quality): string => {
    if (q === 'fine') return 'text-quality-fine'
    if (q === 'excellent') return 'text-quality-excellent'
    if (q === 'supreme') return 'text-quality-supreme'
    return ''
  }

  const handleTalk = () => {
    if (!selected.value) return
    if (gameStore.isPastBedtime) {
      addLog('太晚了，人家都睡了。')
      handleEndDay()
      close()
      return
    }
    const result = npcStore.talkTo(selected.value)
    if (!result) return
    dialogueText.value = result.message
    addLog(`在${SPOT_NAMES[props.spot]}遇到${selectedDef.value?.name}，聊了几句。(+${result.friendshipGain}好感)`)

    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.talk)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) {
      handleEndDay()
      close()
      return
    }

    const heartEvent = npcStore.checkHeartEvent(selected.value)
    if (heartEvent) {
      close()
      triggerHeartEvent(heartEvent)
    }
  }

  /** 闲扯：不加好感也不耗时，纯粹多听几句 */
  const handleChat = () => {
    if (!selected.value) return
    const message = npcStore.chatWith(selected.value)
    if (message) dialogueText.value = message
  }

  const handleGift = (itemId: string, quality: Quality) => {
    if (!selected.value) return
    const cookingGiftBonus = cookingStore.activeBuff?.type === 'giftBonus' ? cookingStore.activeBuff.value : 1
    const ringGiftBonus = inventoryStore.getRingEffectValue('gift_friendship')
    const result = npcStore.giveGift(selected.value, itemId, cookingGiftBonus * (1 + ringGiftBonus), quality)
    if (!result) return

    const itemName = getItemById(itemId)?.name ?? itemId
    const npcName = selectedDef.value?.name
    if (result.gain > 0) {
      addLog(`送给${npcName}${itemName}，${npcName}觉得${result.reaction}。(+${result.gain}好感)`)
    } else if (result.gain < 0) {
      addLog(`送给${npcName}${itemName}，${npcName}${result.reaction}这个……(${result.gain}好感)`)
    } else {
      addLog(`送给${npcName}${itemName}，${npcName}觉得${result.reaction}。`)
    }
    giftPanelOpen.value = false

    const heartEvent = npcStore.checkHeartEvent(selected.value)
    if (heartEvent) {
      close()
      triggerHeartEvent(heartEvent)
    }
  }
</script>
