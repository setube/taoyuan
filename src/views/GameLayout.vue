<template>
  <div
    v-if="gameStore.isGameStarted"
    class="game-layout flex flex-col h-screen p-2 md:p-4"
    :class="{ 'py-10': isWebView }"
  >
    <!-- 移动端顶部：横向状态栏 -->
    <StatusBar class="md:hidden shrink-0 mb-1" />

    <!-- 桌面端：网格布局（顶栏 | 左栏全高 | 中央+右栏 | 底栏仅主区） -->
    <div class="flex-1 min-h-0 flex flex-col md:grid md:gap-2 game-layout-grid">
      <!-- 桌面端顶栏：地点 | 日期时间回合 | [导航图标] 设置 -->
      <div
        class="game-layout-topbar hidden md:flex items-center justify-between gap-4 py-1.5 px-2 text-xs border-b border-accent/20 bg-panel/50 col-span-2"
      >
        <div class="flex items-center gap-4 min-w-0">
          <button
            type="button"
            class="text-accent font-medium hover:bg-accent/10 transition-colors rounded-xs px-0.5 -mx-0.5 py-0 border-0 bg-transparent cursor-pointer shrink-0"
            :title="'打开地图'"
            @click="navigateToPanel('map')"
          >
            {{ locationName }}
          </button>
          <span class="text-muted shrink-0"
            >第{{ gameStore.year }}年 {{ gameStore.seasonName }} 第{{
              gameStore.day
            }}天</span
          >
          <span class="text-muted shrink-0">{{ gameStore.timeDisplay }}</span>
          <span class="text-muted shrink-0"
            >今日 {{ gameStore.turnsUsedToday }} 回合</span
          >
        </div>
        <div class="flex items-center gap-0.5 shrink-0">
          <button
            v-for="t in TABS"
            :key="t.key"
            type="button"
            class="game-layout-topbar-icon p-1.5 rounded-xs border border-transparent text-text hover:bg-accent/10 hover:border-accent/20 hover:text-accent transition-colors cursor-pointer"
            :class="{
              'bg-accent/20 border-accent/30 text-accent':
                currentPanel === t.key,
            }"
            :title="t.label"
            @click="navigateToPanel(t.key)"
          >
            <component :is="t.icon" :size="16" class="block" />
          </button>
          <button
            type="button"
            class="game-layout-topbar-icon p-1.5 rounded-xs border border-transparent text-text hover:bg-accent/10 hover:border-accent/20 hover:text-accent transition-colors cursor-pointer"
            title="设置"
            @click="showSettings = true"
          >
            <SettingsIcon :size="16" class="block" />
          </button>
        </div>
      </div>

      <!-- 左侧：仅状态栏（与中央、底栏同级网格格） -->
      <StatusBar
        vertical
        class="game-layout-left hidden md:flex flex-col shrink-0 w-30 min-h-0"
      />

      <!-- 中央 + 右侧（桌面端为网格一格；移动端为 flex 主区域） -->
      <div
        class="game-layout-row flex-1 min-h-0 flex flex-col md:flex-row gap-2"
      >
        <main
          class="game-panel flex-1 min-w-0 min-h-0 overflow-y-auto rounded-xs"
        >
          <router-view v-slot="{ Component }">
            <Transition name="panel-fade" mode="out-in">
              <component :is="Component" :key="$route.path" />
            </Transition>
          </router-view>
        </main>
        <aside class="game-layout-right hidden md:flex flex-col shrink-0">
          <DynamicBar />
        </aside>
      </div>

      <!-- 左下：背包（与状态栏、中央、底栏同级，独立一节） -->
      <div class="game-layout-backpack hidden md:flex min-h-0 shrink-0">
        <BackpackBar />
      </div>

      <!-- 底部：文本输出框（与背包同行等高） -->
      <div
        class="game-layout-bottom shrink-0 mt-2 md:mt-0 md:flex md:flex-col md:min-h-0"
      >
        <GameLogPanel />
      </div>
    </div>

    <!-- 移动端地图/设置按钮 -->
    <button class="mobile-map-btn md:hidden!" @click="showMobileMap = true">
      <Map :size="20" />
    </button>
    <button class="mobile-setting-btn md:hidden!" @click="showSettings = true">
      <SettingsIcon :size="20" />
    </button>

    <SettingsDialog :open="showSettings" @close="showSettings = false" />

    <!-- 移动端地图菜单 -->
    <MobileMapMenu
      :open="showMobileMap"
      :current="currentPanel"
      @close="showMobileMap = false"
    />

    <!-- 季节事件弹窗 -->
    <Transition name="panel-fade">
      <EventDialog
        v-if="currentEvent"
        :event="currentEvent"
        @close="closeEvent"
      />
    </Transition>

    <!-- 心事件弹窗 -->
    <Transition name="panel-fade">
      <HeartEventDialog
        v-if="pendingHeartEvent"
        :event="pendingHeartEvent"
        @close="closeHeartEvent"
      />
    </Transition>

    <!-- 互动节日 -->
    <Transition name="panel-fade">
      <div
        v-if="currentFestival"
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      >
        <FishingContestView
          v-if="currentFestival === 'fishing_contest'"
          @complete="closeFestival"
        />
        <HarvestFairView
          v-if="currentFestival === 'harvest_fair'"
          @complete="closeFestival"
        />
        <DragonBoatView
          v-if="currentFestival === 'dragon_boat'"
          @complete="closeFestival"
        />
        <LanternRiddleView
          v-if="currentFestival === 'lantern_riddle'"
          @complete="closeFestival"
        />
        <PotThrowingView
          v-if="currentFestival === 'pot_throwing'"
          @complete="closeFestival"
        />
        <DumplingMakingView
          v-if="currentFestival === 'dumpling_making'"
          @complete="closeFestival"
        />
        <FireworkShowView
          v-if="currentFestival === 'firework_show'"
          @complete="closeFestival"
        />
        <TeaContestView
          v-if="currentFestival === 'tea_contest'"
          @complete="closeFestival"
        />
        <KiteFlyingView
          v-if="currentFestival === 'kite_flying'"
          @complete="closeFestival"
        />
      </div>
    </Transition>

    <!-- 技能专精选择弹窗 -->
    <Transition name="panel-fade">
      <PerkSelectDialog
        v-if="pendingPerk"
        :skill-type="pendingPerk.skillType"
        :level="pendingPerk.level"
        @select="handlePerkSelect"
      />
    </Transition>

    <!-- 宠物领养弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="pendingPetAdoption"
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      >
        <div class="game-panel max-w-xs w-full text-center">
          <p class="text-accent text-sm mb-3">—— 小动物来访 ——</p>
          <p class="text-xs leading-relaxed mb-3">
            一只小动物在你家门口徘徊，看起来很想有个家。你要收养它吗？
          </p>
          <div class="flex gap-3 justify-center mb-3">
            <button
              class="btn text-xs"
              :class="petChoice === 'cat' ? 'bg-accent! text-bg!' : ''"
              @click="petChoice = 'cat'"
            >
              猫
            </button>
            <button
              class="btn text-xs"
              :class="petChoice === 'dog' ? 'bg-accent! text-bg!' : ''"
              @click="petChoice = 'dog'"
            >
              狗
            </button>
          </div>
          <div v-if="petChoice" class="mb-3">
            <p class="text-xs text-muted mb-1">给它取个名字：</p>
            <input
              v-model="petNameInput"
              class="w-full bg-bg border border-accent/30 rounded-xs px-2 py-1 text-xs text-text"
              :placeholder="petChoice === 'cat' ? '小花' : '旺财'"
              maxlength="8"
            />
          </div>
          <button
            class="btn text-xs"
            :disabled="!petChoice"
            @click="confirmPetAdoption"
          >
            领养
          </button>
        </div>
      </div>
    </Transition>

    <!-- 休息确认 -->
    <Transition name="panel-fade">
      <div
        v-if="showSleepConfirm"
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      >
        <div class="game-panel max-w-xs w-full text-center">
          <p class="text-accent text-sm mb-3">—— {{ sleepLabel }} ——</p>
          <p class="text-xs leading-relaxed mb-1">{{ sleepSummary }}</p>
          <p v-if="sleepWarning" class="text-danger text-xs mb-1">
            {{ sleepWarning }}
          </p>
          <div class="flex gap-3 justify-center mt-4">
            <button class="btn text-xs" @click="showSleepConfirm = false">
              <X :size="12" />
              再等等
            </button>
            <button class="btn btn-danger text-xs" @click="confirmSleep">
              <Moon :size="12" />
              {{ sleepLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, provide } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGameStore, usePlayerStore, useAnimalStore } from "@/stores";
import { getLocationName } from "@/data/locations";
import { TABS, navigateToPanel } from "@/composables/useNavigation";
import { useDialogs } from "@/composables/useDialogs";
import { handleEndDay } from "@/composables/useEndDay";
import { useGameClock } from "@/composables/useGameClock";
import { useAudio } from "@/composables/useAudio";
import { Moon, X, Map, Settings as SettingsIcon } from "lucide-vue-next";
import MobileMapMenu from "@/components/game/MobileMapMenu.vue";
import StatusBar from "@/components/game/StatusBar.vue";
import BackpackBar from "@/components/game/BackpackBar.vue";
import DynamicBar from "@/components/game/DynamicBar.vue";
import GameLogPanel from "@/components/game/GameLogPanel.vue";
import EventDialog from "@/components/game/EventDialog.vue";
import HeartEventDialog from "@/components/game/HeartEventDialog.vue";
import PerkSelectDialog from "@/components/game/PerkSelectDialog.vue";
import FishingContestView from "@/components/game/FishingContestView.vue";
import HarvestFairView from "@/components/game/HarvestFairView.vue";
import DragonBoatView from "@/components/game/DragonBoatView.vue";
import LanternRiddleView from "@/components/game/LanternRiddleView.vue";
import PotThrowingView from "@/components/game/PotThrowingView.vue";
import DumplingMakingView from "@/components/game/DumplingMakingView.vue";
import FireworkShowView from "@/components/game/FireworkShowView.vue";
import TeaContestView from "@/components/game/TeaContestView.vue";
import KiteFlyingView from "@/components/game/KiteFlyingView.vue";
import SettingsDialog from "@/components/game/SettingsDialog.vue";

const router = useRouter();
const route = useRoute();
const gameStore = useGameStore();
const playerStore = usePlayerStore();
/** 当前地点名（顶栏显示） */
const locationName = computed(() =>
  getLocationName(gameStore.currentCityLocation),
);

/** 当前面板（顶栏图标高亮） */
const currentPanel = computed(() => (route.name as string) ?? "base");
const { switchToSeasonalBgm } = useAudio();

// 游戏未开始时重定向到主菜单
if (!gameStore.isGameStarted) {
  void router.replace("/");
}

const {
  currentEvent,
  pendingHeartEvent,
  currentFestival,
  pendingPerk,
  pendingPetAdoption,
  closeEvent,
  closeHeartEvent,
  closeFestival,
  handlePerkSelect,
  closePetAdoption,
} = useDialogs();

const { startClock, stopClock, pauseClock, resumeClock } = useGameClock();

/** 移动端地图菜单 */
const showMobileMap = ref(false);

/** 休息确认弹窗 */
const showSleepConfirm = ref(false);

/** 设置弹窗 */
const showSettings = ref(false);

/** 供子视图（如基地）请求打开休息/结束今日确认 */
provide("requestSleep", () => {
  showSleepConfirm.value = true;
});

// 实时时钟生命周期
onMounted(() => startClock());
onUnmounted(() => stopClock());

// 弹窗打开时自动暂停时钟，全部关闭后恢复
watch(
  () =>
    !!(
      currentEvent.value ||
      pendingHeartEvent.value ||
      currentFestival.value ||
      pendingPerk.value ||
      pendingPetAdoption.value ||
      showSleepConfirm.value
    ),
  (hasModal) => {
    if (hasModal) pauseClock();
    else resumeClock();
  },
);

// 判断是否webview环境
const isWebView = window.__WEBVIEW__;

const sleepLabel = computed(() => {
  if (gameStore.hour >= 24) return "倒头就睡";
  if (gameStore.hour >= 20) return "回家休息";
  return "休息";
});

const sleepSummary = computed(() => {
  if (playerStore.stamina <= 0 || gameStore.hour >= 26) {
    return "你已经精疲力竭……将在原地昏倒。";
  }
  if (gameStore.hour >= 24) {
    return "已经过了午夜，拖着疲惫的身体回家……";
  }
  return "回到家中，安稳入睡。明日又是新的一天。";
});

const sleepWarning = computed(() => {
  if (playerStore.stamina <= 0 || gameStore.hour >= 26) {
    return "体力仅恢复50%，并损失10%金币（上限1000文）";
  }
  if (gameStore.hour >= 24) {
    return "体力仅恢复75%";
  }
  return "";
});

/** 宠物领养 */
const petChoice = ref<"cat" | "dog" | null>(null);
const petNameInput = ref("");

const confirmPetAdoption = () => {
  if (!petChoice.value) return;
  const animalStore = useAnimalStore();
  const defaultName = petChoice.value === "cat" ? "小花" : "旺财";
  const name = petNameInput.value.trim() || defaultName;
  animalStore.adoptPet(petChoice.value, name);
  closePetAdoption();
  petChoice.value = null;
  petNameInput.value = "";
};

const confirmSleep = () => {
  showSleepConfirm.value = false;
  pauseClock();
  handleEndDay();
  switchToSeasonalBgm();
  resumeClock();
};
</script>

<style scoped>
@media (min-width: 768px) {
  .game-layout-grid {
    grid-template-rows: auto 1fr minmax(140px, 200px);
    grid-template-columns: 120px 1fr;
  }
}

.game-layout-backpack {
  min-height: 0;
  overflow: hidden;
}

/* 移动端地图按钮 */
.mobile-map-btn,
.mobile-setting-btn {
  position: fixed;
  bottom: calc(
    calc(var(--spacing) * 10) + constant(safe-area-inset-bottom, 0px)
  );
  bottom: calc(calc(var(--spacing) * 10) + env(safe-area-inset-bottom, 0px));
  right: 12px;
  z-index: 40;
  width: 40px;
  height: 40px;
  border-radius: 2px;
  background: var(--color-panel);
  border: 2px solid var(--color-accent);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  transition:
    background-color 0.15s,
    color 0.15s;
}

.mobile-setting-btn {
  bottom: calc(
    calc(var(--spacing) * 10) + 48px + constant(safe-area-inset-bottom, 0px)
  );
  bottom: calc(
    calc(var(--spacing) * 10) + 48px + env(safe-area-inset-bottom, 0px)
  );
}

.mobile-map-btn:hover,
.mobile-map-btn:active {
  background: var(--color-accent);
  color: var(--color-bg);
}
</style>
