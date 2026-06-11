<template>
  <div>
    <!-- Tab 切换按钮 -->
    <h3 class="text-accent text-sm mb-3">桃源村</h3>

    <div class="flex space-x-1.5 mb-3">
      <Button
        class="flex-1 justify-center"
        :class="{ '!bg-accent !text-bg': activeTab === 'villager' }"
        :icon="Users"
        @click="activeTab = 'villager'"
      >
        村民
      </Button>
      <Button
        class="flex-1 justify-center"
        :class="{ '!bg-accent !text-bg': activeTab === 'spirit' }"
        :icon="Sparkles"
        @click="activeTab = 'spirit'"
      >
        仙灵
      </Button>
    </div>

    <!-- 村民 Tab -->
    <div v-if="activeTab === 'villager'">
      <p v-if="tutorialHint" class="text-[10px] text-muted/50 mb-2">{{ tutorialHint }}</p>

      <!-- NPC 网格：移动端紧凑，桌面端详细 -->
      <div class="grid grid-cols-4 md:grid-cols-3 gap-1.5 md:gap-2">
        <div
          v-for="npc in NPCS"
          :key="npc.id"
          class="border border-accent/20 rounded-xs p-1.5 md:p-2 transition-colors"
          :class="[npcAvailable(npc.id) ? 'cursor-pointer hover:bg-accent/5' : 'opacity-50', 'text-center md:text-left']"
          @click="handleSelectNpc(npc.id)"
        >
          <!-- 移动端：紧凑布局 -->
          <div class="md:hidden">
            <p class="text-xs truncate" :class="levelColor(npcStore.getFriendshipLevel(npc.id))">
              {{ npc.name }}
            </p>
            <p class="text-[10px] flex items-center justify-center" :class="heartCount(npc.id) > 0 ? 'text-danger' : 'text-muted/30'">
              {{ heartCount(npc.id) }}
              <Heart :size="10" :fill="heartCount(npc.id) > 0 ? 'currentColor' : 'none'" />
              <span class="text-muted/50 ml-0.5">{{ npcStore.getNpcState(npc.id)?.friendship ?? 0 }}</span>
            </p>
            <div class="flex items-center justify-center space-x-1 mt-0.5 min-h-3.5">
              <MessageCircle :size="10" :class="npcStore.getNpcState(npc.id)?.talkedToday ? 'text-muted/20' : 'text-success'" />
              <Gift :size="10" :class="npcGiftClass(npc.id)" />
              <Heart v-if="npcStore.getNpcState(npc.id)?.married" :size="10" class="text-danger" />
              <Heart v-else-if="npcStore.getNpcState(npc.id)?.dating" :size="10" class="text-danger/50" />
              <Heart v-else-if="npcStore.getNpcState(npc.id)?.zhiji" :size="10" class="text-accent" />
              <Heart v-else-if="npc.marriageable" :size="10" class="text-muted/30" />
              <Cake v-if="npcStore.isBirthday(npc.id)" :size="10" class="text-danger" />
            </div>
          </div>
          <!-- 桌面端：显示更多信息 -->
          <div class="hidden md:block">
            <div class="flex items-center justify-between">
              <span class="text-xs" :class="levelColor(npcStore.getFriendshipLevel(npc.id))">
                {{ npc.name }}
                <span v-if="npcStore.getNpcState(npc.id)?.married" class="text-danger text-[10px] ml-0.5">[伴侣]</span>
                <span v-else-if="npcStore.getNpcState(npc.id)?.dating" class="text-danger/70 text-[10px] ml-0.5">[约会中]</span>
                <span v-else-if="npcStore.getNpcState(npc.id)?.zhiji" class="text-accent text-[10px] ml-0.5">[知己]</span>
              </span>
              <div class="flex items-center space-x-1">
                <MessageCircle :size="10" :class="npcStore.getNpcState(npc.id)?.talkedToday ? 'text-muted/20' : 'text-success'" />
                <Gift :size="10" :class="npcGiftClass(npc.id)" />
                <span v-if="npc.marriageable" class="text-danger/50">
                  <Heart :size="10" />
                </span>
                <Cake v-if="npcStore.isBirthday(npc.id)" :size="10" class="text-danger" />
              </div>
            </div>
            <p class="text-[10px] text-muted truncate">{{ npc.role }}</p>
            <div class="flex items-center justify-between mt-0.5">
              <div class="flex items-center space-x-px">
                <Heart
                  v-for="h in 10"
                  :key="h"
                  :size="10"
                  class="flex-shrink-0"
                  :class="(npcStore.getNpcState(npc.id)?.friendship ?? 0) >= h * 250 ? 'text-danger' : 'text-muted/30'"
                  :fill="(npcStore.getNpcState(npc.id)?.friendship ?? 0) >= h * 250 ? 'currentColor' : 'none'"
                />
              </div>
              <span class="text-[10px] text-muted/50">{{ npcStore.getNpcState(npc.id)?.friendship ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 仙灵 Tab -->
    <div v-if="activeTab === 'spirit'">
      <!-- 已显现的仙灵 -->
      <template v-if="revealedHiddenNpcs.length > 0">
        <div class="grid grid-cols-4 md:grid-cols-3 gap-1.5 md:gap-2">
          <div
            v-for="npc in revealedHiddenNpcs"
            :key="npc.id"
            class="border border-accent/20 rounded-xs p-1.5 md:p-2 cursor-pointer hover:bg-accent/5 text-center md:text-left"
            @click="selectedHiddenNpc = npc.id"
          >
            <!-- 移动端：紧凑布局 -->
            <div class="md:hidden">
              <p class="text-xs text-accent truncate">{{ npc.name }}</p>
              <p
                class="text-[10px] flex items-center justify-center"
                :class="hiddenHeartCount(npc.id) > 0 ? 'text-accent' : 'text-muted/30'"
              >
                {{ hiddenHeartCount(npc.id) }}
                <Diamond :size="10" :fill="hiddenHeartCount(npc.id) > 0 ? 'currentColor' : 'none'" />
                <span class="text-muted/50 ml-0.5">{{ hiddenNpcStore.getHiddenNpcState(npc.id)?.affinity ?? 0 }}</span>
              </p>
            </div>
            <!-- 桌面端：显示更多信息 -->
            <div class="hidden md:block">
              <div class="flex items-center justify-between">
                <span class="text-xs text-accent">{{ npc.name }}</span>
              </div>
              <p class="text-[10px] text-muted truncate">{{ npc.title }}</p>
              <div class="flex items-center justify-between mt-0.5">
                <div class="flex items-center space-x-px">
                  <Diamond
                    v-for="d in 12"
                    :key="d"
                    :size="8"
                    class="flex-shrink-0"
                    :class="(hiddenNpcStore.getHiddenNpcState(npc.id)?.affinity ?? 0) >= d * 250 ? 'text-accent' : 'text-muted/20'"
                    :fill="(hiddenNpcStore.getHiddenNpcState(npc.id)?.affinity ?? 0) >= d * 250 ? 'currentColor' : 'none'"
                  />
                </div>
                <span class="text-[10px] text-muted/50">{{ hiddenNpcStore.getHiddenNpcState(npc.id)?.affinity ?? 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 传闻区（显示rumor/glimpse阶段的线索） -->
      <div v-if="rumorHiddenNpcs.length > 0" :class="{ 'mt-4': revealedHiddenNpcs.length > 0 }">
        <h3 class="text-muted/60 text-sm mb-2">传闻</h3>
        <div class="flex flex-col space-y-1">
          <div v-for="npc in rumorHiddenNpcs" :key="npc.id" class="border border-muted/10 rounded-xs px-2 py-1 text-[10px] text-muted/50">
            <span v-if="hiddenNpcStore.getHiddenNpcState(npc.id)?.discoveryPhase === 'rumor'">
              {{ getLastDiscoveryLog(npc.id) ?? '似乎有什么隐约的传说……' }}
            </span>
            <span v-else>
              {{ getLastDiscoveryLog(npc.id) ?? '你曾看到某种异象……' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 仙灵空状态 -->
      <div
        v-if="revealedHiddenNpcs.length === 0 && rumorHiddenNpcs.length === 0"
        class="flex flex-col items-center justify-center py-12 text-muted"
      >
        <Sparkles :size="32" class="mb-2" />
        <p class="text-xs">尚未发现任何仙灵的踪迹。</p>
      </div>
    </div>

    <!-- 仙灵交互弹窗 -->
    <Transition name="panel-fade">
      <HiddenNpcModal v-if="selectedHiddenNpc" :npc-id="selectedHiddenNpc" @close="selectedHiddenNpc = null" />
    </Transition>

    <!-- NPC 交互弹窗 -->
    <Transition name="panel-fade">
      <div v-if="selectedNpc" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="selectedNpc = null">
        <div class="game-panel max-w-lg w-full max-h-[80vh] overflow-y-auto">
          <!-- 头部：名称 + 关闭 -->
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="text-sm text-accent">
                {{ selectedNpcDef?.name }}
                <span class="text-xs text-muted ml-0.5">{{ selectedNpcDef?.role }}</span>
                <span v-if="selectedNpcState?.married" class="text-[10px] text-danger border border-danger/30 rounded-xs px-1 ml-1">
                  伴侣
                </span>
                <span v-else-if="selectedNpcState?.dating" class="text-[10px] text-danger/70 border border-danger/20 rounded-xs px-1 ml-1">
                  约会中
                </span>
                <span v-else-if="selectedNpcState?.zhiji" class="text-[10px] text-accent border border-accent/30 rounded-xs px-1 ml-1">
                  知己
                </span>
              </p>
              <p class="text-[10px] text-muted/60 mt-0.5">{{ selectedNpcDef?.personality }}</p>
            </div>
            <Button @click="selectedNpc = null">关闭</Button>
          </div>

          <!-- 好感度条 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center space-x-px">
                <Heart
                  v-for="h in 10"
                  :key="h"
                  :size="12"
                  class="flex-shrink-0"
                  :class="(selectedNpcState?.friendship ?? 0) >= h * 250 ? 'text-danger' : 'text-muted/20'"
                  :fill="(selectedNpcState?.friendship ?? 0) >= h * 250 ? 'currentColor' : 'none'"
                />
              </div>
              <span class="text-xs" :class="levelColor(npcStore.getFriendshipLevel(selectedNpc!))">
                {{ selectedNpcState?.friendship ?? 0 }}
                <span class="text-muted/40">/{{ nextHeartThreshold }}</span>
              </span>
            </div>
            <!-- 状态标签 -->
            <div class="flex items-center space-x-1.5 flex-wrap">
              <span
                class="text-[10px] border rounded-xs px-1 flex items-center space-x-0.5"
                :class="selectedNpcState?.talkedToday ? 'text-muted/40 border-muted/10' : 'text-success border-success/30'"
              >
                <MessageCircle :size="10" />
                <span>{{ selectedNpcState?.talkedToday ? '已聊天' : '可聊天' }}</span>
              </span>
              <span class="text-[10px] border rounded-xs px-1 flex items-center space-x-0.5" :class="giftTagClass">
                <Gift :size="10" />
                <span>{{ giftTagText }}</span>
              </span>
              <span
                v-if="selectedNpcDef?.birthday"
                class="text-[10px] border border-muted/10 rounded-xs px-1 text-muted flex items-center space-x-0.5"
              >
                <Cake :size="10" />
                <span>{{ SEASON_NAMES_MAP[selectedNpcDef.birthday.season] }}{{ selectedNpcDef.birthday.day }}日</span>
              </span>
              <span v-if="npcStore.isBirthday(selectedNpc!)" class="text-[10px] text-danger border border-danger/30 rounded-xs px-1">
                生日! 送礼×4
              </span>
            </div>
          </div>

          <!-- 已触发的心事件 -->
          <div v-if="selectedNpcState && selectedNpcState.triggeredHeartEvents.length > 0" class="mb-3">
            <p class="text-xs text-muted mb-1">回忆：</p>
            <div class="flex space-x-1 flex-wrap">
              <span v-for="eid in selectedNpcState.triggeredHeartEvents" :key="eid" class="text-xs border border-accent/20 rounded-xs px-1">
                {{ getHeartEventTitle(eid) }}
              </span>
            </div>
          </div>

          <!-- 对话 -->
          <div class="mb-3 flex space-y-2 flex-wrap">
            <Button class="w-full" :icon="MessageCircle" :disabled="selectedNpcState?.talkedToday" @click="handleTalk">
              {{ selectedNpcState?.talkedToday ? '今天已聊过' : '聊天' }}
            </Button>
            <Button
              v-if="isForgeTeacher"
              class="w-full"
              :icon="GraduationCap"
              :disabled="forgeLessonTakenToday"
              @click="showForgeLessonModal = true"
            >
              {{ forgeLessonTakenToday ? '今日已请教' : '请教' }}
            </Button>
            <!-- 每日提示按钮 -->
            <Button
              v-if="selectedNpc && npcStore.hasDailyTip(selectedNpc)"
              class="w-full text-success border-success/40"
              :icon="Lightbulb"
              :disabled="!!(selectedNpc && npcStore.isTipGivenToday(selectedNpc))"
              @click="handleDailyTip"
            >
              {{ selectedNpc && npcStore.isTipGivenToday(selectedNpc) ? '今天已提示' : TIP_NPC_LABELS[selectedNpc as TipNpcId] }}
            </Button>
            <!-- 离婚按钮 -->
            <Button v-if="selectedNpcState?.married" class="w-full text-danger border-danger/40" @click="showDivorceConfirm = true">
              休书
            </Button>
          </div>

          <!-- 婚礼倒计时 -->
          <p v-if="npcStore.weddingCountdown > 0 && npcStore.weddingNpcId === selectedNpc" class="text-xs text-accent mb-3">
            婚礼将在 {{ npcStore.weddingCountdown }} 天后举行！
          </p>

          <!-- 恋爱/求婚面板 -->
          <div
            v-if="selectedNpcDef?.marriageable && !selectedNpcState?.married && selectedNpcDef.gender !== playerStore.gender"
            class="border border-danger/20 rounded-xs p-2 mb-3"
          >
            <p class="text-xs text-danger/80 mb-1.5 flex items-center space-x-1">
              <Heart :size="12" />
              <span>姻缘</span>
            </p>
            <template v-if="!selectedNpcState?.dating && !(npcStore.weddingCountdown > 0 && npcStore.weddingNpcId === selectedNpc)">
              <p v-if="npcStore.npcStates.some(s => s.married)" class="text-[10px] text-muted/50 mb-1">你已有伴侣，无法再赠帕。</p>
              <template v-else>
                <div class="flex flex-col space-y-0.5 mb-1.5">
                  <span
                    class="text-[10px] flex items-center space-x-1"
                    :class="(selectedNpcState?.friendship ?? 0) >= 2000 ? 'text-success' : 'text-muted/50'"
                  >
                    <CircleCheck v-if="(selectedNpcState?.friendship ?? 0) >= 2000" :size="10" />
                    <Circle v-else :size="10" />
                    <span>好感≥2000（8心）</span>
                    <span class="text-muted/40">— 当前{{ selectedNpcState?.friendship ?? 0 }}</span>
                  </span>
                  <span
                    class="text-[10px] flex items-center space-x-1"
                    :class="inventoryStore.hasItem('silk_ribbon') ? 'text-success' : 'text-muted/50'"
                  >
                    <CircleCheck v-if="inventoryStore.hasItem('silk_ribbon')" :size="10" />
                    <Circle v-else :size="10" />
                    <span>持有丝帕</span>
                    <span class="text-muted/40">— 绸缎庄有售</span>
                  </span>
                </div>
                <Button class="w-full text-danger border-danger/40" :icon="Heart" :disabled="!canStartDating" @click="handleStartDating">
                  赠帕（开始约会）
                </Button>
              </template>
            </template>
            <template v-else-if="selectedNpcState?.dating">
              <p class="text-[10px] text-danger/60 mb-1">
                约会中
                <Heart :size="10" class="inline" />
              </p>
              <div class="flex flex-col space-y-0.5 mb-1.5">
                <span
                  class="text-[10px] flex items-center space-x-0.5"
                  :class="(selectedNpcState?.friendship ?? 0) >= 2500 ? 'text-success' : 'text-muted/50'"
                >
                  <CircleCheck v-if="(selectedNpcState?.friendship ?? 0) >= 2500" :size="10" />
                  <Circle v-else :size="10" />
                  好感≥2500（10心）
                  <span class="text-muted/40">— 当前{{ selectedNpcState?.friendship ?? 0 }}</span>
                </span>
                <span
                  class="text-[10px] flex items-center space-x-0.5"
                  :class="inventoryStore.hasItem('jade_ring') ? 'text-success' : 'text-muted/50'"
                >
                  <CircleCheck v-if="inventoryStore.hasItem('jade_ring')" :size="10" />
                  <Circle v-else :size="10" />
                  持有翡翠戒指
                  <span class="text-muted/40">— 绸缎庄有售</span>
                </span>
              </div>
              <Button class="w-full text-danger border-danger/40" :icon="Heart" :disabled="!canPropose" @click="handlePropose">求婚</Button>
            </template>
          </div>

          <!-- 知己面板（同性可婚NPC，未约会/未结婚） -->
          <div
            v-if="
              selectedNpcDef?.marriageable &&
              !selectedNpcState?.married &&
              !selectedNpcState?.dating &&
              selectedNpcDef.gender === playerStore.gender
            "
            class="border border-accent/20 rounded-xs p-2 mb-3"
          >
            <p class="text-xs text-accent/80 mb-1.5 flex items-center space-x-1">
              <Heart :size="12" />
              <span>知己</span>
            </p>
            <template v-if="selectedNpcState?.zhiji">
              <p class="text-[10px] text-accent/60 mb-1">{{ selectedNpcDef.gender === 'male' ? '蓝颜知己' : '红颜知己' }} ♦</p>
              <Button class="w-full text-danger border-danger/40" @click="showZhijiDissolveConfirm = true">断缘</Button>
            </template>
            <template v-else-if="npcStore.npcStates.some(s => s.zhiji)">
              <p class="text-[10px] text-muted/50">你已有知己，无法再结缘。</p>
            </template>
            <template v-else>
              <div class="flex flex-col space-y-0.5 mb-1.5">
                <span
                  class="text-[10px] flex items-center space-x-0.5"
                  :class="(selectedNpcState?.friendship ?? 0) >= 2000 ? 'text-success' : 'text-muted/50'"
                >
                  <CircleCheck v-if="(selectedNpcState?.friendship ?? 0) >= 2000" :size="10" />
                  <Circle v-else :size="10" />
                  好感≥2000（8心）
                  <span class="text-muted/40">— 当前{{ selectedNpcState?.friendship ?? 0 }}</span>
                </span>
                <span
                  class="text-[10px] flex items-center space-x-0.5"
                  :class="inventoryStore.hasItem('zhiji_jade') ? 'text-success' : 'text-muted/50'"
                >
                  <CircleCheck v-if="inventoryStore.hasItem('zhiji_jade')" :size="10" />
                  <Circle v-else :size="10" />
                  持有知己玉佩
                  <span class="text-muted/40">— 绸缎庄有售</span>
                </span>
              </div>
              <Button class="w-full text-accent border-accent/40" :icon="Heart" :disabled="!canBecomeZhiji" @click="handleBecomeZhiji">
                赠玉（结为知己）
              </Button>
            </template>
          </div>

          <!-- 断缘确认 -->
          <div v-if="showZhijiDissolveConfirm" class="game-panel mb-3 border-accent/40">
            <p class="text-xs text-danger mb-2">确定要与{{ selectedNpcDef?.name }}断缘吗？（花费10000文）</p>
            <div class="flex space-x-2">
              <Button class="text-danger" @click="handleDissolveZhiji">确认</Button>
              <Button @click="showZhijiDissolveConfirm = false">取消</Button>
            </div>
          </div>

          <!-- 离婚确认 -->
          <div v-if="showDivorceConfirm" class="game-panel mb-3 border-danger/40">
            <p class="text-xs text-danger mb-2">确定要与{{ selectedNpcDef?.name }}和离吗？（花费30000文）</p>
            <div class="flex space-x-2">
              <Button class="text-danger" @click="handleDivorce">确认</Button>
              <Button @click="showDivorceConfirm = false">取消</Button>
            </div>
          </div>

          <!-- 对话内容 -->
          <div v-if="dialogueText" class="game-panel mb-3 text-xs">
            <p class="text-accent mb-1">「{{ selectedNpcDef?.name }}」</p>
            <p>{{ dialogueText }}</p>
          </div>

          <!-- 送礼 -->
          <div>
            <p class="text-xs text-muted mb-2">
              送礼（选择背包中的物品）
              <span v-if="npcStore.isBirthday(selectedNpc!)" class="text-danger">— 生日加成中!</span>
            </p>
            <template v-if="selectedNpcState?.giftedToday">
              <div class="flex flex-col items-center justify-center py-6 text-muted">
                <Gift :size="32" class="mb-2" />
                <p class="text-xs">今天已送过礼物了。</p>
              </div>
            </template>
            <template v-else-if="(selectedNpcState?.giftsThisWeek ?? 0) >= 2">
              <div class="flex flex-col items-center justify-center py-6 text-muted">
                <Gift :size="32" class="mb-2" />
                <p class="text-xs">本周已送过2次礼物了。</p>
              </div>
            </template>
            <template v-else>
              <div class="flex flex-col space-y-1 max-h-40 overflow-y-auto">
                <div
                  v-for="item in giftableItems"
                  :key="`${item.itemId}_${item.quality ?? 'normal'}`"
                  class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5 mr-1"
                  @click="activeGiftKey = item.itemId + ':' + item.quality"
                >
                  <span class="flex items-center space-x-1">
                    <span class="text-xs" :class="qualityTextClass(item.quality)">
                      {{ getItemById(item.itemId)?.name }}
                    </span>
                    <span
                      v-if="getGiftPreference(item.itemId) !== 'neutral'"
                      class="text-[10px]"
                      :class="GIFT_PREF_CLASS[getGiftPreference(item.itemId)]"
                    >
                      {{ GIFT_PREF_LABELS[getGiftPreference(item.itemId)] }}
                    </span>
                  </span>
                  <Gift :size="12" class="text-muted" />
                </div>
              </div>
              <div v-if="giftableItems.length === 0" class="flex flex-col items-center justify-center py-6 text-muted">
                <Package :size="32" class="mb-2" />
                <p class="text-xs">背包为空</p>
              </div>
            </template>
          </div>

          <!-- 送礼物品详情弹窗 -->
          <Transition name="panel-fade">
            <div
              v-if="activeGiftItem && activeGiftDef"
              class="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4"
              @click.self="activeGiftKey = null"
            >
              <div class="game-panel max-w-xs w-full relative">
                <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeGiftKey = null">
                  <X :size="14" />
                </button>
                <p class="text-sm mb-2 pr-6" :class="qualityTextClass(activeGiftItem.quality, 'text-accent')">
                  {{ activeGiftDef.name }}
                </p>
                <div class="border border-accent/10 rounded-xs p-2 mb-2">
                  <p class="text-xs text-muted">{{ activeGiftDef.description }}</p>
                </div>
                <div class="border border-accent/10 rounded-xs p-2 mb-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted">数量</span>
                    <span class="text-xs">&times;{{ activeGiftItem.quantity }}</span>
                  </div>
                  <div v-if="activeGiftItem.quality !== 'normal'" class="flex items-center justify-between mt-0.5">
                    <span class="text-xs text-muted">品质</span>
                    <span class="text-xs" :class="qualityTextClass(activeGiftItem.quality)">
                      {{ QUALITY_NAMES[activeGiftItem.quality] }}
                    </span>
                  </div>
                </div>
                <div v-if="activeGiftReaction" class="border border-accent/10 rounded-xs p-2 mb-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted">{{ selectedNpcDef?.name }}觉得</span>
                    <span class="text-xs" :class="activeGiftReaction.className">
                      {{ activeGiftReaction.text }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Button :icon="Gift" class="w-full justify-center" @click="handleGift(activeGiftItem!.itemId, activeGiftItem!.quality)">
                    赠送给{{ selectedNpcDef?.name }}
                  </Button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- 锻造请教弹窗 -->
          <Transition name="panel-fade">
            <div
              v-if="showForgeLessonModal && isForgeTeacher"
              class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
              @click.self="showForgeLessonModal = false"
            >
              <div class="game-panel max-w-sm w-full relative">
                <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showForgeLessonModal = false">
                  <X :size="14" />
                </button>
                <p class="text-sm text-accent mb-2">{{ selectedNpcDef?.name }} · 请教</p>
                <p class="text-xs text-muted mb-2">每日可与工坊请教共用 1 次。</p>
                <div class="flex flex-col space-y-2 max-h-64 overflow-y-auto">
                  <div
                    v-for="lesson in npcForgeLessons"
                    :key="lesson.id"
                    class="border border-accent/20 rounded-xs px-3 py-2 cursor-pointer hover:bg-accent/5"
                    @click="handleNpcForgeLesson(lesson.id)"
                  >
                    <p class="text-sm">{{ lesson.title }}</p>
                    <p class="text-xs text-muted">{{ lesson.description }}</p>
                    <p class="text-[10px] text-accent mt-0.5">需锻造 Lv{{ lesson.requiredForgingLevel }}</p>
                  </div>
                  <p v-if="npcForgeLessons.length === 0" class="text-xs text-muted text-center py-4">暂无可学课目</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { MessageCircle, Heart, Gift, Cake, X, Package, Lightbulb, Circle, CircleCheck, Users, Sparkles, Diamond, GraduationCap } from 'lucide-vue-next'
  import { useCookingStore } from '@/stores/useCookingStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useNpcStore } from '@/stores/useNpcStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { useTutorialStore } from '@/stores/useTutorialStore'
  import { useHiddenNpcStore } from '@/stores/useHiddenNpcStore'
  import { useForgeStore } from '@/stores/useForgeStore'
  import { useSkillStore } from '@/stores/useSkillStore'
  import { getAvailableLessons } from '@/data/forgeLessons'
  import { NPCS, getNpcById, getItemById, getHeartEventById } from '@/data'
  import { getHiddenNpcById } from '@/data/hiddenNpcs'
  import { ACTION_TIME_COSTS, isNpcAvailable } from '@/data/timeConstants'
  import { TIP_NPC_LABELS } from '@/data/npcTips'
  import type { TipNpcId } from '@/data/npcTips'
  import { addLog } from '@/composables/useGameLog'
  import { triggerHeartEvent } from '@/composables/useDialogs'
  import { handleEndDay } from '@/composables/useEndDay'
  import type { FriendshipLevel, Quality } from '@/types'
  import Button from '@/components/game/Button.vue'
  import HiddenNpcModal from '@/components/game/HiddenNpcModal.vue'

  const npcStore = useNpcStore()
  const inventoryStore = useInventoryStore()
  const cookingStore = useCookingStore()
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const tutorialStore = useTutorialStore()
  const hiddenNpcStore = useHiddenNpcStore()
  const forgeStore = useForgeStore()
  const skillStore = useSkillStore()

  const FORGE_TEACHER_IDS = ['sun_tiejiang', 'a_tie'] as const
  const showForgeLessonModal = ref(false)

  const isForgeTeacher = computed(
    () => selectedNpc.value != null && FORGE_TEACHER_IDS.includes(selectedNpc.value as (typeof FORGE_TEACHER_IDS)[number])
  )

  const forgeLessonTakenToday = computed(() => forgeStore.lastLessonDay === gameStore.day)

  const npcForgeLessons = computed(() => {
    if (!selectedNpc.value || !isForgeTeacher.value) return []
    return getAvailableLessons(
      skillStore.getSkill('forging').level,
      forgeStore.lessonsSeen,
      selectedNpc.value
    )
  })

  const activeTab = ref<'villager' | 'spirit'>('villager')
  const selectedHiddenNpc = ref<string | null>(null)

  const revealedHiddenNpcs = computed(() => hiddenNpcStore.getRevealedNpcs)
  const rumorHiddenNpcs = computed(() => hiddenNpcStore.getRumorNpcs)

  const hiddenHeartCount = (npcId: string): number => {
    const affinity = hiddenNpcStore.getHiddenNpcState(npcId)?.affinity ?? 0
    return Math.min(12, Math.floor(affinity / 250))
  }

  const getLastDiscoveryLog = (npcId: string): string | null => {
    const npcDef = getHiddenNpcById(npcId)
    const state = hiddenNpcStore.getHiddenNpcState(npcId)
    if (!npcDef || !state) return null
    const lastStepId = state.completedSteps[state.completedSteps.length - 1]
    const step = npcDef.discoverySteps.find(s => s.id === lastStepId)
    return step?.logMessage ?? null
  }

  const tutorialHint = computed(() => {
    if (!tutorialStore.enabled || gameStore.year > 1) return null
    if (npcStore.npcStates.every(n => n.friendship === 0)) return '点击村民头像可以聊天和送礼，经常互动能增进友好度。'
    return null
  })

  const selectedNpc = ref<string | null>(null)
  const dialogueText = ref<string | null>(null)
  const showDivorceConfirm = ref(false)
  const showZhijiDissolveConfirm = ref(false)
  const activeGiftKey = ref<string | null>(null)

  const activeGiftItem = computed(() => {
    if (!activeGiftKey.value) return null
    const [itemId, quality] = activeGiftKey.value.split(':')
    return inventoryStore.items.find(i => i.itemId === itemId && i.quality === quality) ?? null
  })

  const activeGiftDef = computed(() => {
    if (!activeGiftItem.value) return null
    return getItemById(activeGiftItem.value.itemId) ?? null
  })

  const selectedNpcDef = computed(() => (selectedNpc.value ? getNpcById(selectedNpc.value) : null))
  const selectedNpcState = computed(() => (selectedNpc.value ? npcStore.getNpcState(selectedNpc.value) : null))

  const npcAvailable = (npcId: string): boolean => {
    const state = npcStore.getNpcState(npcId)
    if (state?.married) return true
    return isNpcAvailable(npcId, gameStore.day, gameStore.hour, gameStore.season)
  }

  const handleSelectNpc = (npcId: string) => {
    if (npcAvailable(npcId)) {
      selectedNpc.value = npcId
      dialogueText.value = null
      showDivorceConfirm.value = false
      showZhijiDissolveConfirm.value = false
    }
  }

  const heartCount = (npcId: string): number => {
    const friendship = npcStore.getNpcState(npcId)?.friendship ?? 0
    return Math.min(10, Math.floor(friendship / 250))
  }

  const npcGiftClass = (npcId: string): string => {
    const state = npcStore.getNpcState(npcId)
    if ((state?.giftsThisWeek ?? 0) >= 2) return 'text-muted/20'
    if (state?.giftedToday) return 'text-muted/20'
    return 'text-accent'
  }

  /** 弹窗中下一颗心的阈值 */
  const nextHeartThreshold = computed(() => {
    const f = selectedNpcState.value?.friendship ?? 0
    const hearts = Math.min(10, Math.floor(f / 250))
    return hearts >= 10 ? 2500 : (hearts + 1) * 250
  })

  /** 弹窗中送礼标签样式 */
  const giftTagClass = computed(() => {
    const state = selectedNpcState.value
    if ((state?.giftsThisWeek ?? 0) >= 2) return 'text-muted/40 border-muted/10'
    if (state?.giftedToday) return 'text-muted/40 border-muted/10'
    return 'text-accent border-accent/30'
  })

  /** 弹窗中送礼标签文字 */
  const giftTagText = computed(() => {
    const state = selectedNpcState.value
    if ((state?.giftsThisWeek ?? 0) >= 2) return '本周已送满'
    if (state?.giftedToday) return '今日已送'
    return `可送礼 ${state?.giftsThisWeek ?? 0}/2`
  })

  const giftableItems = computed(() => {
    const filtered = inventoryStore.items.filter(i => {
      const def = getItemById(i.itemId)
      return def && def.category !== 'seed'
    })
    if (!selectedNpcDef.value) return filtered
    return [...filtered].sort((a, b) => GIFT_PREF_ORDER[getGiftPreference(a.itemId)] - GIFT_PREF_ORDER[getGiftPreference(b.itemId)])
  })

  /** 是否可以赠帕开始约会 */
  const canStartDating = computed(() => {
    if (!selectedNpcDef.value?.marriageable) return false
    if (selectedNpcDef.value.gender === playerStore.gender) return false
    if (selectedNpcState.value?.dating) return false
    if (selectedNpcState.value?.married) return false
    if (npcStore.npcStates.some(s => s.married)) return false
    if ((selectedNpcState.value?.friendship ?? 0) < 2000) return false
    if (!inventoryStore.hasItem('silk_ribbon')) return false
    return true
  })

  /** 是否可以求婚 */
  const canPropose = computed(() => {
    if (!selectedNpcDef.value?.marriageable) return false
    if (selectedNpcDef.value.gender === playerStore.gender) return false
    if (!selectedNpcState.value?.dating) return false
    if (selectedNpcState.value?.married) return false
    if (npcStore.npcStates.some(s => s.married)) return false
    if (npcStore.weddingCountdown > 0) return false
    if ((selectedNpcState.value?.friendship ?? 0) < 2500) return false
    if (!inventoryStore.hasItem('jade_ring')) return false
    return true
  })

  /** 是否可以结为知己 */
  const canBecomeZhiji = computed(() => {
    if (!selectedNpcDef.value?.marriageable) return false
    if (selectedNpcDef.value.gender !== playerStore.gender) return false
    if (selectedNpcState.value?.zhiji || selectedNpcState.value?.dating || selectedNpcState.value?.married) return false
    if (npcStore.npcStates.some(s => s.zhiji)) return false
    if ((selectedNpcState.value?.friendship ?? 0) < 2000) return false
    if (!inventoryStore.hasItem('zhiji_jade')) return false
    return true
  })

  const SEASON_NAMES_MAP: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }

  const qualityTextClass = (q: Quality, fallback = ''): string => {
    if (q === 'fine') return 'text-quality-fine'
    if (q === 'excellent') return 'text-quality-excellent'
    if (q === 'supreme') return 'text-quality-supreme'
    return fallback
  }

  const QUALITY_NAMES: Record<Quality, string> = {
    normal: '普通',
    fine: '优良',
    excellent: '精品',
    supreme: '极品'
  }

  // === 送礼偏好 ===

  type GiftPreference = 'loved' | 'liked' | 'hated' | 'neutral'

  const getGiftPreference = (itemId: string): GiftPreference => {
    const npcDef = selectedNpcDef.value
    if (!npcDef) return 'neutral'
    if (npcDef.lovedItems.includes(itemId)) return 'loved'
    if (npcDef.likedItems.includes(itemId)) return 'liked'
    if (npcDef.hatedItems.includes(itemId)) return 'hated'
    return 'neutral'
  }

  const GIFT_PREF_LABELS: Record<GiftPreference, string> = {
    loved: '最爱',
    liked: '喜欢',
    hated: '讨厌',
    neutral: ''
  }
  const GIFT_PREF_CLASS: Record<GiftPreference, string> = {
    loved: 'text-danger',
    liked: 'text-success',
    hated: 'text-muted',
    neutral: ''
  }
  const GIFT_PREF_ORDER: Record<GiftPreference, number> = {
    loved: 0,
    liked: 1,
    neutral: 2,
    hated: 3
  }
  const GIFT_REACTION_TEXT: Record<GiftPreference, string> = {
    loved: '非常喜欢',
    liked: '还不错',
    hated: '讨厌',
    neutral: '一般'
  }

  const activeGiftReaction = computed(() => {
    if (!activeGiftItem.value || !selectedNpcDef.value) return null
    const pref = getGiftPreference(activeGiftItem.value.itemId)
    return { text: GIFT_REACTION_TEXT[pref], className: GIFT_PREF_CLASS[pref] }
  })

  const levelColor = (level: FriendshipLevel): string => {
    switch (level) {
      case 'stranger':
        return 'text-muted'
      case 'acquaintance':
        return 'text-water'
      case 'friendly':
        return 'text-success'
      case 'bestFriend':
        return 'text-accent'
    }
  }

  const getHeartEventTitle = (eventId: string): string => {
    return getHeartEventById(eventId)?.title ?? eventId
  }

  const handleTalk = () => {
    if (!selectedNpc.value) return
    if (gameStore.isPastBedtime) {
      addLog('太晚了，人家都睡了。')
      handleEndDay()
      return
    }
    const result = npcStore.talkTo(selectedNpc.value)
    if (result) {
      dialogueText.value = result.message
      addLog(`与${selectedNpcDef.value?.name}聊天。(+${result.friendshipGain}好感)`)

      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.talk)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
        return
      }

      // 检查心事件触发
      const heartEvent = npcStore.checkHeartEvent(selectedNpc.value)
      if (heartEvent) {
        triggerHeartEvent(heartEvent)
      }
    }
  }

  const handleNpcForgeLesson = (lessonId: string) => {
    if (gameStore.isPastBedtime) {
      addLog('太晚了，没法请教了。')
      handleEndDay()
      return
    }
    const res = forgeStore.attendLesson(lessonId)
    if (res.ok) {
      addLog(res.message ?? '请教完成。')
      showForgeLessonModal.value = false
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.talk)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else if (res.reason === 'daily_limit') {
      addLog('今天已经请教过了。')
    } else if (res.reason === 'prerequisite') {
      addLog('还需先完成前置课目。')
    } else {
      addLog('暂时无法请教。')
    }
  }

  const handleDailyTip = () => {
    if (!selectedNpc.value) return
    const tip = npcStore.getDailyTip(selectedNpc.value)
    if (tip) {
      dialogueText.value = tip
      addLog(`${selectedNpcDef.value?.name}告诉了你一些有用的信息。`)
    }
  }

  const handleGift = (itemId: string, quality: Quality = 'normal') => {
    if (!selectedNpc.value) return
    const cookingGiftBonus = cookingStore.activeBuff?.type === 'giftBonus' ? cookingStore.activeBuff.value : 1
    const ringGiftBonus = inventoryStore.getRingEffectValue('gift_friendship')
    const giftMultiplier = cookingGiftBonus * (1 + ringGiftBonus)
    const result = npcStore.giveGift(selectedNpc.value, itemId, giftMultiplier, quality)
    if (result) {
      const itemName = getItemById(itemId)?.name ?? itemId
      const npcName = selectedNpcDef.value?.name
      if (result.gain > 0) {
        addLog(`送给${npcName}${itemName}，${npcName}觉得${result.reaction}。(+${result.gain}好感)`)
      } else if (result.gain < 0) {
        addLog(`送给${npcName}${itemName}，${npcName}${result.reaction}这个……(${result.gain}好感)`)
      } else {
        addLog(`送给${npcName}${itemName}，${npcName}觉得${result.reaction}。`)
      }

      // 关闭送礼弹窗
      activeGiftKey.value = null

      // 送礼后也检查心事件
      const heartEvent = npcStore.checkHeartEvent(selectedNpc.value)
      if (heartEvent) {
        triggerHeartEvent(heartEvent)
      }
    }
  }

  const handlePropose = () => {
    if (!selectedNpc.value) return
    const result = npcStore.propose(selectedNpc.value)
    if (result.success) {
      dialogueText.value = result.message
      addLog(result.message)
    } else {
      addLog(result.message)
    }
  }

  const handleStartDating = () => {
    if (!selectedNpc.value) return
    const result = npcStore.startDating(selectedNpc.value)
    if (result.success) {
      dialogueText.value = result.message
      addLog(result.message)
    } else {
      addLog(result.message)
    }
  }

  const handleBecomeZhiji = () => {
    if (!selectedNpc.value) return
    const result = npcStore.becomeZhiji(selectedNpc.value)
    if (result.success) {
      dialogueText.value = result.message
      addLog(result.message)
    } else {
      addLog(result.message)
    }
  }

  const handleDissolveZhiji = () => {
    const result = npcStore.dissolveZhiji()
    if (result.success) {
      addLog(result.message)
      dialogueText.value = result.message
    } else {
      addLog(result.message)
    }
    showZhijiDissolveConfirm.value = false
  }

  const handleDivorce = () => {
    const result = npcStore.divorce()
    if (result.success) {
      addLog(result.message)
      dialogueText.value = result.message
    } else {
      addLog(result.message)
    }
    showDivorceConfirm.value = false
  }
</script>
