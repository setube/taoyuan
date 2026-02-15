<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-8 px-4"
    @click.once="startBgm"
    :class="{ 'py-10': isWebView }"
    @click="slotMenuOpen = null"
  >
    <!-- 标题 -->
    <div class="flex items-center gap-3">
      <div class="logo" />
      <h1 class="text-accent text-2xl md:text-4xl tracking-widest">
        {{ pkg.title }}
      </h1>
    </div>

    <!-- 主菜单 -->
    <div class="flex flex-col gap-3 w-full md:w-110">
      <button
        class="btn text-center justify-center text-lg py-3"
        @click="showPrivacy = true"
      >
        <Play :size="14" />
        新的旅程
      </button>

      <!-- 存档列表 -->
      <div v-for="info in slots" :key="info.slot" class="w-full">
        <div v-if="info.exists" class="flex gap-1 w-full">
          <button
            class="btn flex-1 justify-between!"
            @click="handleLoadGame(info.slot)"
          >
            <span class="inline-flex items-center gap-1">
              <FolderOpen :size="14" />
              存档 {{ info.slot + 1 }}
            </span>
            <span class="text-muted text-xs">
              {{ info.playerName ?? "未命名" }} · 第{{ info.year }}年
              {{ SEASON_NAMES[info.season as keyof typeof SEASON_NAMES] }} 第{{
                info.day
              }}天
              <span
                v-if="info.isZombieSurvival === false"
                class="text-[10px] text-danger ml-0.5"
                >（旧版）</span
              >
            </span>
          </button>
          <div class="relative">
            <button
              class="btn px-2 text-xs h-full"
              @click.stop="
                slotMenuOpen = slotMenuOpen === info.slot ? null : info.slot
              "
            >
              <Settings :size="12" />
            </button>
            <div
              v-if="slotMenuOpen === info.slot"
              class="absolute right-0 top-full mt-1 z-10 flex flex-col border border-accent/30 rounded-xs overflow-hidden w-30"
            >
              <button
                v-if="!isWebView"
                class="btn text-center rounded-none! justify-center text-sm"
                @click="handleExportSlot(info.slot)"
              >
                <Download :size="12" />
                导出
              </button>
              <button
                class="btn btn-danger rounded-none! text-center justify-center text-sm"
                @click="handleDeleteSlot(info.slot)"
              >
                <Trash2 :size="12" />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 导入存档 -->
      <template v-if="!isWebView">
        <button
          class="btn text-center justify-center text-sm"
          @click="triggerImport"
        >
          <Upload :size="14" />
          导入存档
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".tyx"
          class="hidden"
          @change="handleImportFile"
        />
      </template>
      <!-- 关于 -->
      <button
        class="btn text-center justify-center text-sm text-muted"
        @click="showAbout = true"
      >
        <Info :size="14" />
        关于
      </button>
    </div>

    <!-- 关于弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showAbout"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg/80"
        @click.self="showAbout = false"
      >
        <div class="game-panel w-full max-w-md mx-4 text-center relative">
          <button
            class="absolute top-2 right-2 text-muted hover:text-text"
            @click="showAbout = false"
          >
            <X :size="14" />
          </button>
          <h2 class="text-accent text-lg mb-4">关于{{ pkg.title }}</h2>
          <p class="text-xs text-muted mb-2">
            一款文字田园物语，灵感来自 Stardew Valley
          </p>
          <div class="flex flex-col gap-3 text-sm">
            <div class="border border-accent/20 rounded-xs p-3">
              <p class="text-muted text-xs mb-1">当前版本</p>
              <p class="text-accent">v{{ pkg.version }}</p>
            </div>
            <div class="border border-accent/20 rounded-xs p-3">
              <p class="text-muted text-xs mb-1">QQ 交流群</p>
              <p class="text-accent">{{ pkg.qq }}</p>
            </div>
            <div class="border border-accent/20 rounded-xs p-3">
              <p class="text-muted text-xs mb-1">GitHub 仓库</p>
              <a
                :href="`https://github.com/setube/${pkg.name}`"
                target="_blank"
                rel="noopener"
                class="text-accent underline break-all"
              >
                https://github.com/setube/{{ pkg.name }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 角色创建弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showCharCreate && !showFarmSelect"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg/80"
      >
        <div class="game-panel w-full max-w-xs mx-4 relative">
          <button
            class="absolute top-2 right-2 text-muted hover:text-text"
            @click="handleBackToMenu"
          >
            <X :size="14" />
          </button>
          <p class="text-accent text-sm mb-4 text-center">创建你的角色</p>
          <div class="flex flex-col gap-4">
            <!-- 名字输入 -->
            <div>
              <label class="text-xs text-muted mb-1 block">你的名字</label>
              <input
                v-model="charName"
                type="text"
                maxlength="4"
                placeholder="请输入你的名字"
                class="w-full px-3 py-2 bg-bg border border-accent/30 rounded-xs text-sm focus:border-accent outline-none"
              />
            </div>
            <!-- 性别选择 -->
            <div>
              <label class="text-xs text-muted mb-1 block">性别</label>
              <div class="flex gap-3">
                <button
                  class="btn flex-1 justify-center py-2"
                  :class="
                    charGender === 'male' ? 'border-accent! bg-accent/10!' : ''
                  "
                  @click="charGender = 'male'"
                >
                  男
                </button>
                <button
                  class="btn flex-1 justify-center py-2"
                  :class="
                    charGender === 'female'
                      ? 'border-accent! bg-accent/10!'
                      : ''
                  "
                  @click="charGender = 'female'"
                >
                  女
                </button>
              </div>
            </div>
          </div>
          <div class="flex gap-3 justify-center mt-4">
            <button class="btn text-xs" @click="handleBackToMenu">
              <ArrowLeft :size="12" />
              返回
            </button>
            <button
              class="btn text-xs px-6"
              :disabled="!charName.trim()"
              @click="handleCharCreateNext"
            >
              <Play :size="12" />
              下一步
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 农场选择弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showFarmSelect"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
      >
        <div
          class="game-panel w-full max-w-xl max-h-[80vh] flex flex-col relative"
        >
          <button
            class="absolute top-2 right-2 text-muted hover:text-text z-10"
            @click="handleBackToCharCreate"
          >
            <X :size="14" />
          </button>
          <p class="text-accent text-sm mb-3 text-center shrink-0">
            选择你的田庄类型
          </p>
          <div class="flex-1 overflow-y-auto min-h-0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                v-for="farm in FARM_MAP_DEFS"
                :key="farm.type"
                class="border border-accent/20 rounded-xs p-3 text-left transition-all cursor-pointer hover:border-accent/50"
                @click="handleSelectFarm(farm.type)"
              >
                <div class="text-sm mb-0.5">{{ farm.name }}</div>
                <div class="text-muted text-xs mb-1">
                  {{ farm.description }}
                </div>
                <div class="text-accent text-xs">{{ farm.bonus }}</div>
              </button>
            </div>
          </div>
          <div class="flex justify-center mt-3 shrink-0">
            <button class="btn text-xs" @click="handleBackToCharCreate">
              <ArrowLeft :size="12" />
              返回
            </button>
          </div>
        </div>

        <!-- 田庄确认弹窗 -->
        <Transition name="panel-fade">
          <div
            v-if="showFarmConfirm"
            class="fixed inset-0 z-60 flex items-center justify-center bg-bg/80"
            @click.self="showFarmConfirm = false"
          >
            <div class="game-panel w-full max-w-xs mx-4 text-center relative">
              <button
                class="absolute top-2 right-2 text-muted hover:text-text"
                @click="showFarmConfirm = false"
              >
                <X :size="14" />
              </button>
              <p class="text-accent text-sm mb-3">
                —— {{ selectedFarmDef?.name }} ——
              </p>
              <p class="text-xs text-muted mb-2">
                {{ selectedFarmDef?.description }}
              </p>
              <p class="text-xs text-accent mb-4">
                {{ selectedFarmDef?.bonus }}
              </p>
              <div class="flex gap-3 justify-center">
                <button class="btn text-xs" @click="showFarmConfirm = false">
                  <ArrowLeft :size="12" />
                  取消
                </button>
                <button class="btn text-xs px-6" @click="handleNewGame">
                  <Play :size="12" />
                  开始旅程
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- 旧存档身份设置弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showIdentitySetup"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg/80"
      >
        <div class="game-panel w-full max-w-xs mx-4 relative">
          <p class="text-accent text-sm mb-2 text-center">设置角色信息</p>
          <p class="text-xs text-muted mb-4 text-center">
            检测到角色信息为空，请设置你的角色信息
          </p>
          <div class="flex flex-col gap-4">
            <div>
              <label class="text-xs text-muted mb-1 block">你的名字</label>
              <input
                v-model="charName"
                type="text"
                maxlength="4"
                placeholder="请输入你的名字"
                class="w-full px-3 py-2 bg-bg border border-accent/30 rounded-xs text-sm focus:border-accent outline-none"
              />
            </div>
            <div>
              <label class="text-xs text-muted mb-1 block">性别</label>
              <div class="flex gap-3">
                <button
                  class="btn flex-1 justify-center py-2"
                  :class="
                    charGender === 'male' ? 'border-accent! bg-accent/10!' : ''
                  "
                  @click="charGender = 'male'"
                >
                  男
                </button>
                <button
                  class="btn flex-1 justify-center py-2"
                  :class="
                    charGender === 'female'
                      ? 'border-accent! bg-accent/10!'
                      : ''
                  "
                  @click="charGender = 'female'"
                >
                  女
                </button>
              </div>
            </div>
          </div>
          <div class="flex justify-center mt-4">
            <button
              class="btn text-xs px-6"
              :disabled="!charName.trim()"
              @click="handleIdentityConfirm"
            >
              <Play :size="12" />
              确认并继续
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 删除存档确认弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="deleteTargetSlot !== null"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg/80"
        @click.self="deleteTargetSlot = null"
      >
        <div class="game-panel w-full max-w-xs mx-4 text-center">
          <p class="text-danger text-sm mb-3">
            确定删除存档 {{ deleteTargetSlot + 1 }}？
          </p>
          <p class="text-xs text-muted mb-4">此操作不可恢复。</p>
          <div class="flex gap-3 justify-center">
            <button class="btn text-xs" @click="deleteTargetSlot = null">
              取消
            </button>
            <button class="btn btn-danger text-xs" @click="confirmDeleteSlot">
              确认删除
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 隐私协议弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showPrivacy"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg/80"
        @click.self="handlePrivacyDecline"
      >
        <div class="game-panel w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
          <h2 class="text-accent text-lg mb-3 text-center">
            <ShieldCheck :size="14" class="inline" />
            隐私协议
          </h2>
          <div
            class="flex-1 overflow-y-auto text-xs text-muted space-y-2 mb-4 pr-1"
          >
            <p>欢迎来到桃源乡！在开始游戏之前，请阅读以下隐私协议：</p>
            <p class="text-text">1. 数据存储</p>
            <p>
              本游戏的存档、设置等数据保存在您的浏览器本地存储（localStorage）中。存档数据不会上传至服务器。
            </p>
            <p class="text-text">2. 流量统计</p>
            <p>
              本游戏使用第三方统计服务收集匿名访问数据（如页面浏览量、访问时间、设备类型、浏览器信息等），用于分析游戏使用情况和改进体验。这些数据不包含您的个人身份信息。
            </p>
            <p class="text-text">3. 网络通信</p>
            <p>
              除流量统计外，游戏核心功能均在本地运行，不会将您的游戏存档或操作数据发送至任何服务器。
            </p>
            <p class="text-text">4. 数据安全</p>
            <p>
              清除浏览器数据或更换设备可能导致存档丢失，建议定期使用导出功能备份存档。
            </p>
            <p class="text-text">5. 第三方服务</p>
            <p>
              本游戏使用的第三方统计服务有其独立的隐私政策，我们不对其数据处理方式负责。游戏中的外部链接指向的第三方网站亦不受本协议约束。
            </p>
            <p class="text-text">6. 协议变更</p>
            <p>
              本协议可能随版本更新而调整，届时将在游戏内重新提示。继续使用即视为同意最新版本的协议。
            </p>
          </div>
          <div class="flex gap-3 justify-center">
            <button class="btn text-sm" @click="handlePrivacyDecline">
              <ArrowLeft :size="14" />
              不同意
            </button>
            <button class="btn text-sm px-6" @click="handlePrivacyAgree">
              <ShieldCheck :size="14" />
              同意并继续
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  Play,
  FolderOpen,
  ArrowLeft,
  Trash2,
  Download,
  Upload,
  Info,
  Settings,
  ShieldCheck,
  X,
} from "lucide-vue-next";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useGameStore, SEASON_NAMES } from "@/stores/useGameStore";
import { useSaveStore } from "@/stores/useSaveStore";
import { useFarmStore } from "@/stores/useFarmStore";
import { useAnimalStore } from "@/stores/useAnimalStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useQuestStore } from "@/stores/useQuestStore";
import { FARM_MAP_DEFS } from "@/data/farmMaps";
import _pkg from "../../package.json";
import { useAudio } from "@/composables/useAudio";
import { showFloat } from "@/composables/useGameLog";
import type { FarmMapType, Gender } from "@/types";

const router = useRouter();
const { startBgm } = useAudio();
const pkg = _pkg as typeof _pkg & {
  title: string;
  qq: string;
  version: string;
  name: string;
};

const gameStore = useGameStore();
const saveStore = useSaveStore();
const farmStore = useFarmStore();
const animalStore = useAnimalStore();
const playerStore = usePlayerStore();
const questStore = useQuestStore();

const slots = ref(saveStore.getSlots());
const showCharCreate = ref(false);
const showFarmSelect = ref(false);
const showIdentitySetup = ref(false);
const showAbout = ref(false);
const slotMenuOpen = ref<number | null>(null);
const selectedMap = ref<FarmMapType>("standard");
const charName = ref("");
const charGender = ref<Gender>("male");
const showPrivacy = ref(false);
const showFarmConfirm = ref(false);

const deleteTargetSlot = ref<number | null>(null);

const selectedFarmDef = computed(() =>
  FARM_MAP_DEFS.find((f) => f.type === selectedMap.value),
);

const handleSelectFarm = (type: FarmMapType) => {
  selectedMap.value = type;
  showFarmConfirm.value = true;
};

// 判断是否webview环境
const isWebView = window.__WEBVIEW__;

const handlePrivacyAgree = () => {
  localStorage.setItem("taoyuan_privacy_agreed", "1");
  showPrivacy.value = false;
  showCharCreate.value = true;
};

const handlePrivacyDecline = () => {
  showPrivacy.value = false;
};

const refreshSlots = () => {
  slots.value = saveStore.getSlots();
};

const handleBackToMenu = () => {
  showCharCreate.value = false;
  showFarmSelect.value = false;
  selectedMap.value = "standard";
  charName.value = "";
  charGender.value = "male";
};

const handleCharCreateNext = () => {
  showFarmSelect.value = true;
};

const handleBackToCharCreate = () => {
  showFarmSelect.value = false;
  showFarmConfirm.value = false;
};

const handleNewGame = () => {
  // 分配空闲存档槽位
  const slot = saveStore.assignNewSlot();
  if (slot < 0) {
    showFloat("存档槽位已满，请先删除一个旧存档。");
    return;
  }
  playerStore.setIdentity(
    (charName.value.trim() || "未命名").slice(0, 4),
    charGender.value,
  );
  gameStore.startNewGame(selectedMap.value);
  // 标准农场初始6×6，其余4×4
  farmStore.resetFarm(selectedMap.value === "standard" ? 6 : 4);
  // 草地农场：免费鸡舍 + 2只鸡
  if (selectedMap.value === "meadowlands") {
    const coop = animalStore.buildings.find((b) => b.type === "coop");
    if (coop) coop.built = true;
    animalStore.animals.push(
      {
        id: "chicken_init_1",
        type: "chicken",
        name: "小花",
        friendship: 100,
        mood: 200,
        daysOwned: 0,
        daysSinceProduct: 0,
        wasFed: false,
        fedWith: null,
        wasPetted: false,
        hunger: 0,
        sick: false,
        sickDays: 0,
      },
      {
        id: "chicken_init_2",
        type: "chicken",
        name: "小白",
        friendship: 100,
        mood: 200,
        daysOwned: 0,
        daysSinceProduct: 0,
        wasFed: false,
        fedWith: null,
        wasPetted: false,
        hunger: 0,
        sick: false,
        sickDays: 0,
      },
    );
  }
  questStore.initMainQuest();
  void router.push("/game");
};

const handleLoadGame = (slot: number) => {
  if (saveStore.loadFromSlot(slot)) {
    if (playerStore.needsIdentitySetup) {
      // 旧存档没有性别/名字数据，先让玩家设置
      showIdentitySetup.value = true;
    } else {
      void router.push("/game");
    }
  } else if (saveStore.loadError) {
    showFloat(saveStore.loadError, "danger");
  }
};

/** 旧存档身份设置完成 */
const handleIdentityConfirm = () => {
  playerStore.setIdentity(
    (charName.value.trim() || "未命名").slice(0, 4),
    charGender.value,
  );
  showIdentitySetup.value = false;
  void router.push("/game");
};

const handleDeleteSlot = (slot: number) => {
  deleteTargetSlot.value = slot;
};

const confirmDeleteSlot = () => {
  if (deleteTargetSlot.value !== null) {
    saveStore.deleteSlot(deleteTargetSlot.value);
    refreshSlots();
    deleteTargetSlot.value = null;
    slotMenuOpen.value = null;
  }
};

const handleExportSlot = (slot: number) => {
  if (!saveStore.exportSave(slot)) {
    showFloat("导出失败。", "danger");
  }
};

const fileInputRef = ref<HTMLInputElement | null>(null);

const triggerImport = () => {
  fileInputRef.value?.click();
};

const handleImportFile = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const content = reader.result as string;
    // 找到第一个空槽位导入，没有则提示
    const emptySlot = slots.value.find((s) => !s.exists);
    if (!emptySlot) {
      showFloat("存档槽位已满，请先删除一个旧存档。");
    } else if (saveStore.importSave(emptySlot.slot, content)) {
      refreshSlots();
      showFloat(`已导入到存档 ${emptySlot.slot + 1}。`, "success");
    } else {
      showFloat("存档文件无效或已损坏。", "danger");
    }
    input.value = "";
  };
  reader.readAsText(file);
};
</script>

<style scoped>
.logo {
  width: 50px;
  height: 50px;
  background: url(@/assets/logo.png) center / contain no-repeat;
  image-rendering: pixelated;
  flex-shrink: 0;
}
</style>
