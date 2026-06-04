<template>
  <Transition name="panel-fade">
    <div v-if="open" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3" @click.self="$emit('close')">
      <div class="map-container game-panel w-full max-w-sm md:max-w-150 max-h-[85vh] overflow-y-auto relative">
        <button
          class="absolute top-4 right-4 px-2 py-1 text-xs transition-colors hover:border-accent/60 hover:bg-panel/80 text-muted border border-accent/20"
          @click="$emit('close')"
        >
          <X :size="14" />
        </button>
        <p class="text-accent text-sm text-center mb-3 tracking-widest">桃源乡地图</p>

        <!-- 田庄 -->
        <div class="map-area">
          <p class="map-area-title">田庄</p>
          <div class="map-area-grid">
            <button v-for="t in farmGroup" :key="t.key" class="map-loc" :class="{ 'map-loc-active': current === t.key }" @click="go(t.key)">
              <component :is="t.getIcon ? t.getIcon() : t.icon" :size="18" />
              <span>{{ t.label }}</span>
            </button>
          </div>
        </div>

        <div class="map-path">···</div>

        <!-- 野外 -->
        <div class="flex space-x-2">
          <div class="map-area flex-1">
            <p class="map-area-title">村落</p>
            <div class="map-area-grid">
              <button
                v-for="t in villageGroup"
                :key="t.key"
                class="map-loc"
                :class="{ 'map-loc-active': current === t.key }"
                @click="go(t.key)"
              >
                <component :is="t.getIcon ? t.getIcon() : t.icon" :size="18" />
                <span>{{ t.label }}</span>
              </button>
            </div>
          </div>
          <div class="map-area flex-1">
            <p class="map-area-title">野外</p>
            <div class="map-area-grid">
              <button
                v-for="t in wildGroup"
                :key="t.key"
                class="map-loc"
                :class="{ 'map-loc-active': current === t.key }"
                @click="go(t.key)"
              >
                <component :is="t.getIcon ? t.getIcon() : t.icon" :size="18" />
                <span>{{ t.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="map-path">···</div>

        <!-- 工坊 -->
        <div class="map-area">
          <p class="map-area-title">工坊</p>
          <div class="map-area-grid">
            <button
              v-for="t in craftGroup"
              :key="t.key"
              class="map-loc"
              :class="{ 'map-loc-active': current === t.key }"
              @click="go(t.key)"
            >
              <component :is="t.getIcon ? t.getIcon() : t.icon" :size="18" />
              <span>{{ t.label }}</span>
            </button>
          </div>
        </div>

        <div class="map-path">···</div>

        <!-- 随身 -->
        <div class="map-area">
          <p class="map-area-title">随身</p>
          <div class="map-area-grid">
            <button
              v-for="t in personalGroup"
              :key="t.key"
              class="map-loc"
              :class="{ 'map-loc-active': current === t.key }"
              @click="go(t.key)"
            >
              <component :is="t.getIcon ? t.getIcon() : t.icon" :size="18" />
              <span>{{ t.label }}</span>
            </button>
          </div>
        </div>

        <div class="map-path">···</div>

        <button type="button" class="wish-well-btn" @click="showWishWell = true">华熙小王许愿井</button>
      </div>
    </div>
  </Transition>

  <Transition name="panel-fade">
    <WishWellDialog v-if="showWishWell" @close="showWishWell = false" />
  </Transition>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { X } from 'lucide-vue-next'
  import WishWellDialog from '@/components/game/WishWellDialog.vue'
  import { TABS, navigateToPanel } from '@/composables/useNavigation'
  import type { PanelKey } from '@/composables/useNavigation'

  defineProps<{ open: boolean; current: string }>()
  const emit = defineEmits<{ close: [] }>()

  const tabMap = computed(() => {
    const m = new Map<string, (typeof TABS)[number]>()
    for (const t of TABS) m.set(t.key, t)
    return m
  })

  const pick = (keys: PanelKey[]) => keys.map(k => tabMap.value.get(k)!).filter(Boolean)

  const farmGroup = computed(() => pick(['farm', 'animal', 'cottage', 'home', 'breeding', 'fishpond']))
  const villageGroup = computed(() => pick(['village', 'shop', 'bank', 'museum', 'guild']))
  const wildGroup = computed(() => pick(['forage', 'fishing', 'mining', 'hanhai']))
  const craftGroup = computed(() => pick(['cooking', 'workshop', 'upgrade']))
  const personalGroup = computed(() => pick(['charinfo', 'inventory', 'skills', 'achievement', 'wallet', 'quest']))

  const showWishWell = ref(false)

  const go = (key: PanelKey) => {
    navigateToPanel(key)
    emit('close')
  }
</script>

<style scoped>
  /* 地图菜单 */
  .map-area {
    border: 1px dashed rgba(200, 164, 92, 0.3);
    border-radius: 2px;
    padding: 8px;
  }

  .map-area-title {
    font-size: 10px;
    color: var(--color-muted);
    margin-bottom: 6px;
    letter-spacing: 0.1em;
    text-align: center;
  }

  .map-area-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin: 6px;
  }

  .map-loc {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 2px;
    padding: 6px 8px;
    min-width: 52px;
    font-size: 10px;
    color: rgb(var(--color-text));
    background: rgb(var(--color-bg));
    border: 1px solid rgba(200, 164, 92, 0.2);
    border-radius: 2px;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .map-loc:hover,
  .map-loc:active {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }

  .map-loc-active {
    background: var(--color-accent);
    border-color: var(--color-accent);
  }

  .map-path {
    text-align: center;
    color: rgba(200, 164, 92, 0.3);
    font-size: 10px;
    line-height: 1;
    padding: 4px 0;
    letter-spacing: 0.3em;
  }

  .wish-well-btn {
    display: block;
    width: 100%;
    margin-top: 4px;
    padding: 10px 8px;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-align: center;
    color: var(--color-accent);
    background: rgb(var(--color-bg));
    border: 1px dashed rgba(200, 164, 92, 0.45);
    border-radius: 2px;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .wish-well-btn:hover,
  .wish-well-btn:active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: rgb(var(--color-bg));
  }
</style>
