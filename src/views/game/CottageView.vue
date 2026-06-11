<template>
  <div>
    <h3 class="text-accent text-sm mb-3 flex items-center justify-between">
      <span>
        <component :is="npcStore.getSpouse() ? Heart : Home" :size="14" class="inline" />
        小屋
      </span>
      <button class="text-muted hover:text-accent transition-colors" @click="showCalendarModal = true">
        <Calendar :size="14" />
      </button>
    </h3>

    <!-- 农舍升级 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm text-accent">{{ homeStore.farmhouseName }}</span>
        <span class="text-xs text-muted">等级 {{ homeStore.farmhouseLevel }}</span>
      </div>
      <p class="text-xs text-muted mb-2">{{ currentBenefit }}</p>
      <div
        v-if="homeStore.nextUpgrade"
        class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
        @click="showUpgradeModal = true"
      >
        <span class="text-xs">升级为「{{ homeStore.nextUpgrade.name }}」</span>
        <span class="text-xs text-accent whitespace-nowrap">{{ homeStore.nextUpgrade.cost }}文</span>
      </div>
    </div>

    <!-- 灶台 -->
    <div v-if="homeStore.farmhouseLevel >= 1" class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-1">
        <p class="text-sm text-accent">
          <ChefHat :size="14" class="inline" />
          灶台
          <span class="text-[10px] text-muted ml-1">Lv.{{ skillStore.getSkill('cooking').level }}</span>
        </p>
        <Button class="py-0 px-1" @click="navigateToPanel('cooking')">进入烹饪</Button>
      </div>
      <p class="text-xs text-muted">制作品质受烹饪等级加成，等级越高制作越快。</p>
    </div>

    <!-- 家人 -->
    <div v-if="npcStore.getSpouse()" class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <Users :size="14" class="inline" />
        家人
      </p>

      <!-- 配偶互动 -->
      <div class="border border-accent/10 rounded-xs p-2 mb-2">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-accent">{{ spouseDef?.name }}</span>
          <span class="text-[10px] text-danger">
            <Heart :size="10" class="inline" />
            伴侣
          </span>
        </div>
        <div v-if="spouseDialogue" class="border border-accent/10 rounded-xs p-2 mb-1.5">
          <p class="text-[10px] text-accent mb-0.5">「{{ spouseDef?.name }}」</p>
          <p class="text-xs">{{ spouseDialogue }}</p>
        </div>
        <div class="flex space-x-1.5">
          <Button
            class="flex-1 justify-center py-0.5"
            :icon="MessageCircle"
            :icon-size="10"
            :disabled="spouseState?.talkedToday"
            @click="handleSpouseTalk"
          >
            {{ spouseState?.talkedToday ? '已聊天' : '聊天' }}
          </Button>
          <Button
            class="flex-1 justify-center py-0.5"
            :icon="Gift"
            :icon-size="10"
            :disabled="spouseState?.giftedToday || (spouseState?.giftsThisWeek ?? 0) >= 2"
            @click="showSpouseGiftModal = true"
          >
            {{ spouseState?.giftedToday ? '已送礼' : (spouseState?.giftsThisWeek ?? 0) >= 2 ? '本周已满' : '送礼' }}
          </Button>
        </div>
      </div>

      <!-- 提议通知 -->
      <div v-if="npcStore.childProposalPending" class="border border-accent/30 rounded-xs p-2 mb-2">
        <p class="text-xs text-accent mb-1.5">配偶有话想和你说……</p>
        <Button class="w-full justify-center" @click="showChildProposalDialog">回应</Button>
      </div>

      <!-- 孕期面板 -->
      <div v-if="npcStore.pregnancy" class="border border-success/20 rounded-xs p-2 mb-2">
        <p class="text-xs text-success mb-2">孕期 · {{ PREGNANCY_STAGE_LABELS[npcStore.pregnancy.stage] }}</p>
        <!-- 阶段进度条 -->
        <div class="flex items-center space-x-1 mb-1.5">
          <span class="text-[10px] text-muted w-8 shrink-0">进度</span>
          <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
            <div
              class="h-full rounded-xs bg-success transition-all"
              :style="{ width: Math.floor((npcStore.pregnancy.daysInStage / npcStore.pregnancy.stageDays) * 100) + '%' }"
            />
          </div>
          <span class="text-[10px] text-muted shrink-0">{{ npcStore.pregnancy.daysInStage }}/{{ npcStore.pregnancy.stageDays }}天</span>
        </div>
        <!-- 安产率条 -->
        <div class="flex items-center space-x-1 mb-2">
          <span class="text-[10px] text-muted w-8 shrink-0">安产</span>
          <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
            <div
              class="h-full rounded-xs transition-all"
              :class="npcStore.pregnancy.careScore >= 70 ? 'bg-success' : npcStore.pregnancy.careScore >= 40 ? 'bg-accent' : 'bg-danger'"
              :style="{ width: npcStore.pregnancy.careScore + '%' }"
            />
          </div>
          <span class="text-[10px] text-muted shrink-0">{{ npcStore.pregnancy.careScore }}%</span>
        </div>
        <!-- 阶段提示 -->
        <p class="text-[10px] text-muted/60 mb-2">{{ STAGE_TIPS[npcStore.pregnancy.stage] }}</p>
        <!-- 照料操作 -->
        <div class="grid grid-cols-2 gap-1 mb-1">
          <Button
            class="py-0.5 px-1 text-[10px] justify-center"
            :disabled="npcStore.pregnancy.giftedForPregnancy"
            @click="handlePregnancyCare('gift')"
          >
            {{ npcStore.pregnancy.giftedForPregnancy ? '已送礼' : '送礼物' }}
          </Button>
          <Button
            class="py-0.5 px-1 text-[10px] justify-center"
            :disabled="npcStore.pregnancy.companionToday"
            @click="handlePregnancyCare('companion')"
          >
            {{ npcStore.pregnancy.companionToday ? '已陪伴' : '陪伴聊天' }}
          </Button>
          <Button class="py-0.5 px-1 text-[10px] justify-center" @click="handlePregnancyCare('supplement')">服用补品</Button>
          <Button
            class="py-0.5 px-1 text-[10px] justify-center"
            :disabled="npcStore.pregnancy.caredToday"
            @click="handlePregnancyCare('rest')"
          >
            {{ npcStore.pregnancy.caredToday ? '已休息' : '安排休息' }}
          </Button>
        </div>
        <!-- 医疗方案（待产期） -->
        <div v-if="npcStore.pregnancy.stage === 'ready'" class="border border-accent/20 rounded-xs p-2 mt-2">
          <p class="text-[10px] text-accent mb-1.5">选择接生方式</p>
          <div v-if="!npcStore.pregnancy.medicalPlan" class="flex flex-col space-y-1">
            <Button class="py-0.5 px-1 text-[10px] w-full justify-center" @click="handleChooseMedical('normal')">
              普通接生（1000文 · 80%安全）
            </Button>
            <Button class="py-0.5 px-1 text-[10px] w-full justify-center" @click="handleChooseMedical('advanced')">
              高级接生（5000文 · 95%安全）
            </Button>
            <Button class="py-0.5 px-1 text-[10px] w-full justify-center text-accent" @click="handleChooseMedical('luxury')">
              豪华接生（15000文 · 100%安全）
            </Button>
          </div>
          <p v-else class="text-[10px] text-success">已选择：{{ MEDICAL_LABELS[npcStore.pregnancy.medicalPlan] }}</p>
        </div>
      </div>

      <!-- 无子女无孕期 -->
      <div v-if="npcStore.children.length === 0 && !npcStore.pregnancy && !npcStore.childProposalPending">
        <div class="flex flex-col items-center justify-center py-6 text-muted">
          <Users :size="32" class="mb-2" />
          <p class="text-xs">婚后生活安稳，也许将来会有小生命到来。</p>
        </div>
      </div>

      <!-- 子女列表 -->
      <div v-if="npcStore.children.length > 0" class="flex flex-col space-y-1">
        <div v-for="child in npcStore.children" :key="child.id" class="border border-accent/10 rounded-xs p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-accent">
              {{ child.name }}
              <span v-if="child.birthQuality === 'healthy'" class="text-[10px] text-success ml-0.5">[健康]</span>
              <span v-else-if="child.birthQuality === 'premature'" class="text-[10px] text-muted/60 ml-0.5">[早产]</span>
            </span>
            <div class="flex items-center space-x-1">
              <Button
                v-if="child.stage !== 'baby' && !child.interactedToday"
                class="py-0 px-1"
                :icon="Heart"
                @click="handleInteractChild(child.id)"
              >
                互动
              </Button>
              <span v-else-if="child.stage !== 'baby'" class="text-xs text-muted">已互动</span>
              <span v-else class="text-xs text-muted">还太小</span>
              <Button class="py-0 px-1 text-danger" @click="releaseConfirmChildId = child.id">送走</Button>
            </div>
          </div>
          <p class="text-[10px] text-muted mb-0.5">{{ CHILD_STAGE_NAMES[child.stage] }} · {{ child.daysOld }}天</p>
          <div v-if="child.stage !== 'baby'" class="flex items-center space-x-0.5">
            <Heart
              v-for="h in 10"
              :key="h"
              :size="10"
              class="flex-shrink-0"
              :class="child.friendship >= h * 30 ? 'text-danger' : 'text-muted/30'"
              :fill="child.friendship >= h * 30 ? 'currentColor' : 'none'"
            />
          </div>
        </div>
      </div>
      <!-- 送走子女确认 -->
      <div v-if="releaseConfirmChildId !== null" class="mt-2 game-panel border-danger/40">
        <p class="text-xs text-danger mb-2">确定将{{ getChildName(releaseConfirmChildId) }}送往远方亲戚家吗？（花费10000文）</p>
        <div class="grid grid-cols-2 gap-2">
          <Button class="text-danger" @click="handleReleaseChild">确认</Button>
          <Button @click="releaseConfirmChildId = null">取消</Button>
        </div>
      </div>
    </div>

    <!-- 雇工管理 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">
          <Hammer :size="14" class="inline" />
          雇工
        </p>
        <Button v-if="currentHelpers.length < 2" class="py-0 px-1.5" :icon="UserPlus" :icon-size="12" @click="showHireModal = true">
          招募
        </Button>
      </div>
      <p class="text-xs text-muted mb-2">雇佣好感度≥4心的村民帮忙打理农场，每日支付工资。</p>

      <!-- 当前雇工 -->
      <div v-if="currentHelpers.length > 0" class="flex flex-col space-y-1 mb-2">
        <div
          v-for="h in currentHelpers"
          :key="h.npcId"
          class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
        >
          <div>
            <span class="text-xs text-accent">{{ getNpcById(h.npcId)?.name }}</span>
            <span class="text-xs text-muted ml-1">{{ npcStore.HELPER_TASK_NAMES[h.task] }}</span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="text-[10px] text-muted">{{ h.dailyWage }}文/天</span>
            <Button class="py-0 px-1 btn-danger" :icon="X" :icon-size="10" @click="dismissConfirmNpcId = h.npcId" />
          </div>
        </div>
      </div>
      <div v-if="currentHelpers.length === 0" class="flex flex-col items-center justify-center py-6 text-muted">
        <Hammer :size="32" class="mb-2" />
        <p class="text-xs">暂未雇佣</p>
      </div>
    </div>

    <!-- 前厅酒肆 -->
    <div v-if="homeStore.farmhouseLevel >= 3" class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">
          <Beer :size="14" class="inline" />
          前厅酒肆
          <span v-if="tavernStore.isBuilt" class="text-[10px] text-muted ml-1">
            {{ tavernStore.displayName }} · 口碑 {{ tavernStore.reputation }}
          </span>
        </p>
        <Button v-if="tavernStore.isBuilt" class="py-0 px-1" @click="navigateToPanel('tavern')">进入经营</Button>
      </div>
      <template v-if="!tavernStore.isBuilt">
        <p class="text-xs text-muted mb-2">扩建前厅，经营酒肆变现酒坊与烹饪产出。</p>
        <Button class="w-full justify-center" :disabled="!canBuildTavern" @click="showBuildTavernModal = true">
          建造前厅酒肆（80000 文）
        </Button>
      </template>
      <p v-else class="text-xs text-muted">菜单 {{ activeMenuCount }} 项上架 · 今日{{ todayModeLabel }}</p>
    </div>

    <!-- 酒窖 -->
    <div v-if="homeStore.hasCellar" class="border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">
          <Wine :size="14" class="inline" />
          酒窖·Lv.{{ homeStore.cellarLevel }}
          <span class="text-[10px] text-muted ml-1">（{{ homeStore.cellarSlots.length }}/{{ homeStore.cellarMaxSlots }}）</span>
        </p>
        <Button v-if="homeStore.nextCellarUpgrade" class="py-0 px-1" @click="showCellarUpgradeModal = true">
          <ArrowUp :size="12" class="inline" />
          升级
        </Button>
      </div>
      <div v-if="homeStore.cellarSlots.length > 0" class="flex flex-col space-y-1.5 mb-3">
        <div v-for="(slot, idx) in homeStore.cellarSlots" :key="idx" class="border border-accent/10 rounded-xs p-2">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center space-x-1">
              <span class="text-xs text-accent">{{ getItemName(slot.itemId) }}</span>
              <span v-if="slot.upgradeCount >= 16" class="text-[10px] text-success">陈酿{{ Math.floor(slot.upgradeCount / 16) }}年</span>
            </div>
            <Button class="py-0 px-1" @click="removeAgingConfirmIdx = idx">取出</Button>
          </div>
          <div class="flex items-center justify-between mb-0.5">
            <span class="text-[10px] text-muted">已增值+{{ slot.addedValue }}文（提升{{ slot.upgradeCount }}次）</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="text-[10px] text-muted w-6">周期</span>
            <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
              <div
                class="h-full rounded-xs bg-accent transition-all"
                :style="{ width: Math.min(100, Math.floor((slot.daysAging / 7) * 100)) + '%' }"
              />
            </div>
            <span class="text-[10px] text-muted">{{ slot.daysAging }}/7天</span>
          </div>
        </div>
      </div>
      <div v-if="homeStore.cellarSlots.length === 0" class="flex flex-col items-center justify-center py-6 text-muted mb-3">
        <Wine :size="32" class="mb-2" />
        <p class="text-xs">酒窖空空如也</p>
      </div>

      <!-- 放入新酒 -->
      <Button
        class="w-full"
        v-if="homeStore.cellarSlots.length < homeStore.cellarMaxSlots && ageableInInventory.length > 0"
        @click="showAgingModal = true"
      >
        放入陈酿
      </Button>
    </div>

    <!-- 升级农舍弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showUpgradeModal && homeStore.nextUpgrade"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showUpgradeModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showUpgradeModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">升级农舍</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs">升级为「{{ homeStore.nextUpgrade.name }}」</p>
            <p class="text-xs text-muted mt-0.5">{{ homeStore.nextUpgrade.description }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-1">
            <p class="text-xs text-muted mb-1">所需材料</p>
            <div v-for="mat in homeStore.nextUpgrade.materialCost" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <CombinedMaterialCount :item-id="mat.itemId" :required="mat.quantity" always-show-breakdown />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">铜钱</span>
              <span class="text-xs" :class="playerStore.money >= homeStore.nextUpgrade.cost ? '' : 'text-danger'">
                {{ homeStore.nextUpgrade.cost }}文
              </span>
            </div>
          </div>

          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': canUpgradeFarmhouse }"
            :disabled="!canUpgradeFarmhouse"
            :icon="ArrowUp"
            :icon-size="12"
            @click="handleUpgradeFromModal"
          >
            升级
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 放入陈酿列表弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showAgingModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showAgingModal = false"
      >
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">放入陈酿</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="showAgingModal = false" />
          </div>
          <div class="flex flex-col space-y-1">
            <div
              v-for="item in ageableInInventory"
              :key="item.itemId + item.quality"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleStartAgingFromModal(item.itemId, item.quality)"
            >
              <span
                class="text-xs"
                :class="{
                  'text-quality-fine': item.quality === 'fine',
                  'text-quality-excellent': item.quality === 'excellent',
                  'text-quality-supreme': item.quality === 'supreme'
                }"
              >
                {{ getItemName(item.itemId) }}
              </span>
              <span class="text-xs text-muted">&times;{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 时历弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showCalendarModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showCalendarModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showCalendarModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">
            <Calendar :size="14" class="inline" />
            时历
          </p>

          <!-- 季节切换 -->
          <div class="grid grid-cols-4 gap-2 mb-2">
            <button
              v-for="s in SEASONS"
              :key="s"
              class="text-[10px] px-2 py-0.5 border rounded-xs transition-colors"
              :class="calendarSeason === s ? 'bg-accent/20 border-accent/40 text-accent' : 'border-accent/10 text-muted hover:text-text'"
              @click="handleSelectSeason(s)"
            >
              {{ SEASON_NAMES[s] }}
            </button>
          </div>

          <!-- 28天网格 -->
          <div class="grid grid-cols-7 gap-px">
            <div v-for="wd in WEEKDAYS" :key="wd" class="text-center py-0.5">
              <span class="text-[10px]" :class="wd === 'sat' || wd === 'sun' ? 'text-accent' : 'text-muted'">{{ WEEKDAY_NAMES[wd] }}</span>
            </div>
            <div
              v-for="entry in calendarDays"
              :key="entry.day"
              class="text-center py-1 border border-transparent transition-colors"
              :class="[
                entry.isToday ? 'bg-accent/20 border-accent/40' : '',
                entry.festivals.length > 0 || entry.birthdays.length > 0 ? 'cursor-pointer hover:bg-accent/10 rounded-sm' : '',
                selectedCalendarDay === entry.day ? 'border-accent/30' : ''
              ]"
              @click="handleSelectDay(entry)"
            >
              <span class="text-[10px]" :class="entry.isToday ? 'text-accent' : 'text-muted'">
                {{ entry.day }}
              </span>
              <div class="flex justify-center space-x-px mt-px min-h-1.5">
                <span v-if="entry.festivals.length > 0" class="w-1 h-1 rounded-full bg-danger inline-block" />
                <span v-if="entry.birthdays.length > 0" class="w-1 h-1 rounded-full bg-success inline-block" />
              </div>
            </div>
          </div>

          <!-- 图例 -->
          <div class="flex items-center space-x-3 mt-1.5">
            <span class="text-[10px] text-muted flex items-center space-x-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-danger inline-block" />
              <span>节日</span>
            </span>
            <span class="text-[10px] text-muted flex items-center space-x-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              <span>生日</span>
            </span>
          </div>

          <!-- 选中日详情 -->
          <div
            v-if="selectedDayEntry && (selectedDayEntry.festivals.length > 0 || selectedDayEntry.birthdays.length > 0)"
            class="border border-accent/10 rounded-xs p-2 mt-2"
          >
            <p class="text-[10px] text-accent mb-1">
              {{ SEASON_NAMES[calendarSeason] }}{{ selectedCalendarDay }}日
              <span v-if="selectedDayEntry.isToday" class="text-danger ml-1">(今天)</span>
            </p>
            <div v-for="f in selectedDayEntry.festivals" :key="f.name" class="mb-0.5">
              <span class="text-[10px] text-danger">{{ f.name }}</span>
              <span class="text-[10px] text-muted ml-1">{{ f.description }}</span>
            </div>
            <div v-for="b in selectedDayEntry.birthdays" :key="b.npcName">
              <span class="text-[10px] text-success">{{ b.npcName }}的生日</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 配偶送礼弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showSpouseGiftModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showSpouseGiftModal = false"
      >
        <div class="game-panel max-w-sm w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">送礼给{{ spouseDef?.name }}</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="showSpouseGiftModal = false" />
          </div>
          <div class="flex flex-col space-y-1 max-h-60 overflow-y-auto">
            <div
              v-for="item in spouseGiftableItems"
              :key="item.itemId + item.quality"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleSpouseGift(item.itemId, item.quality)"
            >
              <span class="flex items-center space-x-1">
                <span class="text-xs" :class="qualityTextClass(item.quality)">
                  {{ getItemById(item.itemId)?.name }}
                </span>
                <span
                  v-if="getSpouseGiftPref(item.itemId) !== 'neutral'"
                  class="text-[10px]"
                  :class="GIFT_PREF_CLASS[getSpouseGiftPref(item.itemId)]"
                >
                  {{ GIFT_PREF_LABELS[getSpouseGiftPref(item.itemId)] }}
                </span>
              </span>
              <span class="text-xs text-muted">&times;{{ item.quantity }}</span>
            </div>
          </div>
          <div v-if="spouseGiftableItems.length === 0" class="py-4 text-center text-xs text-muted">背包中没有可赠送的物品</div>
        </div>
      </div>
    </Transition>

    <!-- 招募雇工弹窗 -->
    <Transition name="panel-fade">
      <div v-if="showHireModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="closeHireModal">
        <div class="game-panel max-w-sm w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">招募雇工</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="closeHireModal" />
          </div>

          <!-- 任务选择 -->
          <p class="text-xs text-muted mb-1">选择任务</p>
          <div class="grid grid-cols-4 gap-1 mb-3">
            <button
              v-for="(label, key) in npcStore.HELPER_TASK_NAMES"
              :key="key"
              class="text-xs py-1 rounded-xs border"
              :class="selectedHireTask === key ? 'border-accent text-accent' : 'border-accent/20 text-muted'"
              @click="selectHireTask(key as FarmHelperTask)"
            >
              {{ label }}
            </button>
          </div>
          <p class="text-xs text-muted mb-2">日薪：{{ npcStore.HELPER_WAGES[selectedHireTask] }}文</p>

          <!-- 确认雇佣 -->
          <div v-if="hireConfirmNpc" class="border border-accent/30 rounded-xs p-3 mb-2">
            <p class="text-xs text-accent mb-2">
              确定雇佣
              <span class="text-text">{{ hireConfirmNpc.name }}</span>
              负责
              <span class="text-text">{{ npcStore.HELPER_TASK_NAMES[selectedHireTask] }}</span>
              吗？
            </p>
            <p class="text-[10px] text-muted mb-2">日薪：{{ npcStore.HELPER_WAGES[selectedHireTask] }}文</p>
            <div class="flex space-x-2">
              <Button class="py-0.5 px-2 text-xs" @click="handleHire(hireConfirmNpcId!)">确定</Button>
              <Button class="py-0.5 px-2 text-xs" @click="hireConfirmNpcId = null">取消</Button>
            </div>
          </div>

          <!-- 可雇佣NPC列表 -->
          <div v-else class="flex flex-col space-y-1 max-h-48 overflow-y-auto">
            <div
              v-for="npc in hireableNpcs"
              :key="npc.npcId"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="hireConfirmNpcId = npc.npcId"
            >
              <span class="text-xs">{{ npc.name }}</span>
              <span class="text-[10px] text-muted">
                <Heart :size="10" class="inline" />
                {{ Math.floor(npc.friendship / 250) }}心
              </span>
            </div>
          </div>
          <p v-if="!hireConfirmNpc && hireableNpcs.length === 0" class="text-xs text-muted text-center py-3">
            没有可雇佣的村民（需好感≥4心，且非伴侣/知己）
          </p>
        </div>
      </div>
    </Transition>

    <!-- 解雇确认弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="dismissConfirmNpcId"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="dismissConfirmNpcId = null"
      >
        <div class="game-panel max-w-xs w-full text-center">
          <p class="text-sm text-danger mb-3">确定解雇{{ getNpcById(dismissConfirmNpcId)?.name }}吗？</p>
          <p class="text-xs text-muted mb-4">解雇后需要重新招募。</p>
          <div class="flex space-x-3 justify-center">
            <Button @click="dismissConfirmNpcId = null">取消</Button>
            <Button class="btn-danger" @click="handleDismiss(dismissConfirmNpcId!)">确认解雇</Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 取出陈酿确认弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="removeAgingConfirmSlot"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="removeAgingConfirmIdx = null"
      >
        <div class="game-panel max-w-xs w-full text-center">
          <p class="text-sm text-accent mb-3">确定取出{{ getItemName(removeAgingConfirmSlot.itemId) }}吗？</p>
          <p class="text-xs text-muted mb-2">
            已增值+{{ removeAgingConfirmSlot.addedValue }}文（提升{{ removeAgingConfirmSlot.upgradeCount }}次）
          </p>
          <p v-if="removeAgingConfirmSlot.upgradeCount >= 16" class="text-xs text-success mb-2">
            已成为陈酿{{ Math.floor(removeAgingConfirmSlot.upgradeCount / 16) }}年，取出将点亮图鉴！
          </p>
          <p v-if="removeAgingConfirmSlot.addedValue > 0" class="text-xs text-accent mb-4">
            取出时将获得{{ removeAgingConfirmSlot.addedValue }}文增值铜钱。
          </p>
          <p v-else class="text-xs text-muted mb-4">尚未增值，满7天可提升价值。</p>
          <div class="flex space-x-3 justify-center">
            <Button @click="removeAgingConfirmIdx = null">取消</Button>
            <Button @click="handleRemoveAging(removeAgingConfirmIdx!)">确认取出</Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 酒窖升级弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showCellarUpgradeModal && homeStore.nextCellarUpgrade"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showCellarUpgradeModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showCellarUpgradeModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">升级酒窖</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs">升级为「{{ homeStore.nextCellarUpgrade.name }}」</p>
            <p class="text-xs text-muted mt-0.5">
              每次增值{{ homeStore.nextCellarUpgrade.valuePerCycle }}文，最大容量{{ homeStore.nextCellarUpgrade.maxSlots }}个
            </p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-1">
            <p class="text-xs text-muted mb-1">所需材料</p>
            <div v-for="mat in homeStore.nextCellarUpgrade.materialCost" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <CombinedMaterialCount :item-id="mat.itemId" :required="mat.quantity" always-show-breakdown />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">铜钱</span>
              <span class="text-xs" :class="playerStore.money >= homeStore.nextCellarUpgrade.cost ? '' : 'text-danger'">
                {{ homeStore.nextCellarUpgrade.cost }}文
              </span>
            </div>
          </div>

          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': canUpgradeCellar }"
            :disabled="!canUpgradeCellar"
            :icon="ArrowUp"
            :icon-size="12"
            @click="handleUpgradeCellar"
          >
            升级
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 建造酒肆弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showBuildTavernModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showBuildTavernModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showBuildTavernModal = false">
            <X :size="14" />
          </button>
          <p class="text-sm text-accent mb-2">开张前厅酒肆</p>
          <p class="text-xs text-muted mb-2">为你的酒肆取个店名（1～{{ TAVERN_NAME_MAX_LEN }} 字，可稍后修改）</p>
          <input
            v-model="buildTavernNameInput"
            class="w-full text-xs bg-bg border border-accent/20 rounded-xs px-2 py-1.5 mb-3"
            :maxlength="TAVERN_NAME_MAX_LEN"
            placeholder="如：桃源小馆"
          />
          <div class="border border-accent/10 rounded-xs p-2 mb-3 space-y-1">
            <p class="text-xs text-muted mb-1">初建费用</p>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">铜钱</span>
              <span class="text-xs text-accent">80000 文</span>
            </div>
            <div v-for="mat in buildTavernMaterials" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <CombinedMaterialCount :item-id="mat.itemId" :required="mat.quantity" always-show-breakdown />
            </div>
          </div>
          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': canBuildTavern }"
            :disabled="!canBuildTavern || !buildTavernNameInput.trim()"
            @click="handleBuildTavern"
          >
            开张营业
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { ArrowUp, Beer, Calendar, ChefHat, Gift, Hammer, Home, Heart, MessageCircle, UserPlus, Users, Wine, X } from 'lucide-vue-next'
  import { useTavernStore } from '@/stores/useTavernStore'
  import { getTavernUpgrade, TAVERN_NAME_MAX_LEN } from '@/data/tavern'
  import { useCookingStore } from '@/stores/useCookingStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { useHomeStore } from '@/stores/useHomeStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useNpcStore } from '@/stores/useNpcStore'
  import { useAchievementStore } from '@/stores/useAchievementStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { SEASON_NAMES } from '@/stores/useGameStore'
  import { getCombinedItemCount } from '@/composables/useCombinedInventory'
  import CombinedMaterialCount from '@/components/game/CombinedMaterialCount.vue'
  import { getItemById, getNpcById, NPCS } from '@/data'
  import { SEASON_EVENTS } from '@/data/events'
  import { ACTION_TIME_COSTS, WEEKDAYS, WEEKDAY_NAMES } from '@/data/timeConstants'
  import type { Quality, ChildStage, PregnancyStage, Season, FarmHelperTask } from '@/types'
  import { addLog } from '@/composables/useGameLog'
  import { showChildProposal, triggerHeartEvent } from '@/composables/useDialogs'
  import { handleEndDay } from '@/composables/useEndDay'
  import { navigateToPanel } from '@/composables/useNavigation'
  import Button from '@/components/game/Button.vue'

  const homeStore = useHomeStore()
  const inventoryStore = useInventoryStore()
  const gameStore = useGameStore()
  const npcStore = useNpcStore()
  const playerStore = usePlayerStore()
  const tavernStore = useTavernStore()
  const skillStore = useSkillStore()

  const releaseConfirmChildId = ref<number | null>(null)
  const showUpgradeModal = ref(false)
  const showAgingModal = ref(false)
  const showCalendarModal = ref(false)
  const showSpouseGiftModal = ref(false)
  const showHireModal = ref(false)
  const selectedHireTask = ref<FarmHelperTask>('water')
  const hireConfirmNpcId = ref<string | null>(null)
  const dismissConfirmNpcId = ref<string | null>(null)
  const removeAgingConfirmIdx = ref<number | null>(null)
  const showCellarUpgradeModal = ref(false)
  const showBuildTavernModal = ref(false)
  const buildTavernNameInput = ref('桃源小馆')
  const removeAgingConfirmSlot = computed(() =>
    removeAgingConfirmIdx.value !== null ? (homeStore.cellarSlots[removeAgingConfirmIdx.value] ?? null) : null
  )

  const hireableNpcs = computed(() => npcStore.getHireableNpcs())
  const currentHelpers = computed(() => npcStore.hiredHelpers)
  const hireConfirmNpc = computed(() => (hireConfirmNpcId.value ? getNpcById(hireConfirmNpcId.value) : null))

  const handleHire = (npcId: string) => {
    const result = npcStore.hireHelper(npcId, selectedHireTask.value)
    addLog(result.message)
    if (result.success) {
      hireConfirmNpcId.value = null
      showHireModal.value = false
    }
  }

  const closeHireModal = () => {
    showHireModal.value = false
    hireConfirmNpcId.value = null
  }

  const selectHireTask = (task: FarmHelperTask) => {
    selectedHireTask.value = task
    hireConfirmNpcId.value = null
  }

  const handleDismiss = (npcId: string) => {
    const result = npcStore.dismissHelper(npcId)
    addLog(result.message)
    dismissConfirmNpcId.value = null
  }

  // === 配偶互动 ===

  const spouseState = computed(() => npcStore.getSpouse())
  const spouseDef = computed(() => (spouseState.value ? getNpcById(spouseState.value.npcId) : null))
  const spouseDialogue = ref<string | null>(null)

  const handleSpouseTalk = () => {
    if (!spouseState.value) return
    if (gameStore.isPastBedtime) {
      addLog('太晚了，该休息了。')
      handleEndDay()
      return
    }
    const result = npcStore.talkTo(spouseState.value.npcId)
    if (result) {
      spouseDialogue.value = result.message
      addLog(`与${spouseDef.value?.name}聊天。(+${result.friendshipGain}好感)`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.talk)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }
      const heartEvent = npcStore.checkHeartEvent(spouseState.value.npcId)
      if (heartEvent) triggerHeartEvent(heartEvent)
    }
  }

  type GiftPreference = 'loved' | 'liked' | 'hated' | 'neutral'

  const getSpouseGiftPref = (itemId: string): GiftPreference => {
    if (!spouseDef.value) return 'neutral'
    if (spouseDef.value.lovedItems.includes(itemId)) return 'loved'
    if (spouseDef.value.likedItems.includes(itemId)) return 'liked'
    if (spouseDef.value.hatedItems.includes(itemId)) return 'hated'
    return 'neutral'
  }

  const GIFT_PREF_LABELS: Record<GiftPreference, string> = { loved: '最爱', liked: '喜欢', hated: '讨厌', neutral: '' }
  const GIFT_PREF_CLASS: Record<GiftPreference, string> = { loved: 'text-danger', liked: 'text-success', hated: 'text-muted', neutral: '' }
  const GIFT_PREF_ORDER: Record<GiftPreference, number> = { loved: 0, liked: 1, neutral: 2, hated: 3 }

  const spouseGiftableItems = computed(() => {
    const filtered = inventoryStore.items.filter(i => {
      const def = getItemById(i.itemId)
      return def && def.category !== 'seed'
    })
    if (!spouseDef.value) return filtered
    return [...filtered].sort((a, b) => GIFT_PREF_ORDER[getSpouseGiftPref(a.itemId)] - GIFT_PREF_ORDER[getSpouseGiftPref(b.itemId)])
  })

  const handleSpouseGift = (itemId: string, quality: Quality) => {
    if (!spouseState.value) return
    const cookingStore = useCookingStore()
    const cookingGiftBonus = cookingStore.activeBuff?.type === 'giftBonus' ? cookingStore.activeBuff.value : 1
    const ringGiftBonus = inventoryStore.getRingEffectValue('gift_friendship')
    const giftMultiplier = cookingGiftBonus * (1 + ringGiftBonus)
    const result = npcStore.giveGift(spouseState.value.npcId, itemId, giftMultiplier, quality)
    if (result) {
      const itemName = getItemById(itemId)?.name ?? itemId
      const name = spouseDef.value?.name
      if (result.gain > 0) {
        addLog(`送给${name}${itemName}，${name}觉得${result.reaction}。(+${result.gain}好感)`)
      } else if (result.gain < 0) {
        addLog(`送给${name}${itemName}，${name}${result.reaction}这个……(${result.gain}好感)`)
      } else {
        addLog(`送给${name}${itemName}，${name}觉得${result.reaction}。`)
      }
      showSpouseGiftModal.value = false
      const heartEvent = npcStore.checkHeartEvent(spouseState.value.npcId)
      if (heartEvent) triggerHeartEvent(heartEvent)
    }
  }

  const qualityTextClass = (q: Quality): string => {
    if (q === 'fine') return 'text-quality-fine'
    if (q === 'excellent') return 'text-quality-excellent'
    if (q === 'supreme') return 'text-quality-supreme'
    return ''
  }

  const CHILD_STAGE_NAMES: Record<ChildStage, string> = {
    baby: '婴儿',
    toddler: '幼儿',
    child: '孩童',
    teen: '少年'
  }

  const PREGNANCY_STAGE_LABELS: Record<PregnancyStage, string> = {
    early: '初期（需要营养）',
    mid: '中期（需要陪伴）',
    late: '后期（需要休息）',
    ready: '待产期（准备迎接）'
  }

  const STAGE_TIPS: Record<PregnancyStage, string> = {
    early: '孕初期需要注意营养，送些食物或补品效果最好。',
    mid: '孕中期需要更多陪伴，多聊天可以大幅提升安产率。',
    late: '孕后期要注意休息，让配偶好好休养。',
    ready: '即将临盆，请选择接生方式并做好最后的准备。'
  }

  const MEDICAL_LABELS: Record<string, string> = {
    normal: '普通接生',
    advanced: '高级接生',
    luxury: '豪华接生'
  }

  const AGEABLE_ITEMS = ['watermelon_wine', 'osmanthus_wine', 'peach_wine', 'jujube_wine', 'corn_wine', 'rice_vinegar']

  // === 日历 ===

  const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']
  const calendarSeason = ref<Season>(gameStore.season)
  const selectedCalendarDay = ref<number | null>(null)

  const calendarDays = computed(() => {
    const s = calendarSeason.value
    const entries = []
    for (let d = 1; d <= 28; d++) {
      const festivals = SEASON_EVENTS.filter(e => e.season === s && e.day === d).map(e => ({ name: e.name, description: e.description }))
      const birthdays = NPCS.filter(npc => npc.birthday?.season === s && npc.birthday?.day === d).map(npc => ({ npcName: npc.name }))
      entries.push({ day: d, festivals, birthdays, isToday: s === gameStore.season && d === gameStore.day })
    }
    return entries
  })

  const selectedDayEntry = computed(() => {
    if (selectedCalendarDay.value === null) return null
    return calendarDays.value[selectedCalendarDay.value - 1] ?? null
  })

  const handleSelectSeason = (s: Season) => {
    calendarSeason.value = s
    selectedCalendarDay.value = null
  }

  const handleSelectDay = (entry: { day: number; festivals: { name: string }[]; birthdays: { npcName: string }[] }) => {
    if (entry.festivals.length > 0 || entry.birthdays.length > 0) {
      selectedCalendarDay.value = selectedCalendarDay.value === entry.day ? null : entry.day
    }
  }

  const currentBenefit = computed(() => {
    switch (homeStore.farmhouseLevel) {
      case 0:
        return '简陋的茅屋。'
      case 1:
        return '厨房升级，烹饪恢复+20%。'
      case 2:
        return '宅院扩建，每晚额外恢复10%体力。'
      case 3:
        return '地下酒窖开放，可陈酿美酒提升品质。'
      default:
        return ''
    }
  })

  const canUpgradeFarmhouse = computed(() => {
    const upgrade = homeStore.nextUpgrade
    if (!upgrade) return false
    if (playerStore.money < upgrade.cost) return false
    return upgrade.materialCost.every(mat => getCombinedItemCount(mat.itemId) >= mat.quantity)
  })

  const canBuildTavern = computed(() => {
    if (!tavernStore.canBuild) return false
    const def = tavernStore.nextUpgrade
    if (!def) return false
    if (playerStore.money < def.cost) return false
    return def.materialCost.every(mat => getCombinedItemCount(mat.itemId) >= mat.quantity)
  })

  const activeMenuCount = computed(() => tavernStore.menuSlots.filter(s => s.itemId).length)

  const todayModeLabel = computed(() => {
    if (tavernStore.todayMode === 'manual') return '亲自营业'
    if (tavernStore.todayMode === 'closed') return '打烊'
    return '日结自动'
  })

  const buildTavernMaterials = computed(() => getTavernUpgrade(1)?.materialCost ?? [])

  const handleBuildTavern = () => {
    const name = buildTavernNameInput.value.trim()
    if (!name) return
    if (tavernStore.buildTavern(name)) {
      showBuildTavernModal.value = false
      addLog(`「${tavernStore.displayName}」开张了！去配置菜单开始经营吧。`)
      navigateToPanel('tavern')
    }
  }

  const ageableInInventory = computed(() => {
    return inventoryStore.items.filter(inv => AGEABLE_ITEMS.includes(inv.itemId))
  })

  const getItemName = (itemId: string): string => {
    return getItemById(itemId)?.name ?? itemId
  }

  const getChildName = (childId: number): string => {
    return npcStore.children.find(c => c.id === childId)?.name ?? '孩子'
  }

  // === 操作处理 ===

  const handleUpgradeFromModal = () => {
    const upgrade = homeStore.nextUpgrade
    if (!upgrade) return
    if (homeStore.upgradeFarmhouse()) {
      addLog(`农舍升级为「${upgrade.name}」！${upgrade.description}`)
      showUpgradeModal.value = false
    } else {
      addLog('铜钱或材料不足，无法升级。')
    }
  }

  const handleInteractChild = (childId: number) => {
    const result = npcStore.interactWithChild(childId)
    if (result) {
      addLog(result.message)
      if (result.item) {
        inventoryStore.addItem(result.item)
        const itemDef = getItemById(result.item)
        addLog(`获得了${itemDef?.name ?? result.item}！`)
      }
    }
  }

  const handleReleaseChild = () => {
    if (releaseConfirmChildId.value === null) return
    const result = npcStore.releaseChild(releaseConfirmChildId.value)
    addLog(result.message)
    releaseConfirmChildId.value = null
  }

  const showChildProposalDialog = () => {
    showChildProposal()
  }

  const handlePregnancyCare = (action: 'gift' | 'companion' | 'supplement' | 'rest') => {
    const result = npcStore.performPregnancyCare(action)
    addLog(result.message)
    if (result.careGain > 0) addLog(`安产率 +${result.careGain}%`)
  }

  const handleChooseMedical = (plan: 'normal' | 'advanced' | 'luxury') => {
    const result = npcStore.chooseMedicalPlan(plan)
    addLog(result.message)
  }

  const handleStartAgingFromModal = (itemId: string, quality: Quality) => {
    if (homeStore.startAging(itemId, quality)) {
      const name = getItemName(itemId)
      addLog(`将${name}放入酒窖陈酿。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.aging)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('无法放入酒窖（已满或物品不可陈酿）。')
    }
    // 酒窖满或无剩余可陈酿物品时关闭弹窗
    if (homeStore.cellarSlots.length >= homeStore.cellarMaxSlots || ageableInInventory.value.length === 0) {
      showAgingModal.value = false
    }
  }

  const handleRemoveAging = (index: number) => {
    // 取出前先记录剩余天数
    const slotBeforeRemove = homeStore.cellarSlots[index]
    const remainingDays = slotBeforeRemove?.daysAging ?? 0
    const result = homeStore.removeAging(index)
    if (result) {
      inventoryStore.addItem(result.itemId, 1, result.quality)
      const name = getItemName(result.itemId)
      const totalDays = result.upgradeCount * 7 + remainingDays
      let msg = `从酒窖取出了${name}`
      if (result.addedValue > 0) {
        msg += `（陈酿${totalDays}天，增值+${result.addedValue}文）`
      }
      addLog(msg + '。')
      // 满1年点亮图鉴
      if (result.upgradeCount >= 16) {
        const achievementStore = useAchievementStore()
        achievementStore.discoverItem('aged_' + result.itemId)
        addLog(`点亮了${name}陈酿图鉴！`)
      }
    }
    removeAgingConfirmIdx.value = null
  }

  const canUpgradeCellar = computed(() => {
    const upgrade = homeStore.nextCellarUpgrade
    if (!upgrade) return false
    if (playerStore.money < upgrade.cost) return false
    return upgrade.materialCost.every(mat => getCombinedItemCount(mat.itemId) >= mat.quantity)
  })

  const handleUpgradeCellar = () => {
    const upgrade = homeStore.nextCellarUpgrade
    if (!upgrade) return
    if (homeStore.upgradeCellar()) {
      addLog(`酒窖升级为「${upgrade.name}」！每次增值${upgrade.valuePerCycle}文，最大容量${upgrade.maxSlots}个。`)
      showCellarUpgradeModal.value = false
    } else {
      addLog('铜钱或材料不足，无法升级酒窖。')
    }
  }
</script>
