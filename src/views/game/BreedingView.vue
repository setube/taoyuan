<template>
  <div>
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center space-x-1.5 text-sm text-accent">
        <FlaskConical :size="14" />
        <span>育种</span>
      </div>
      <span class="text-xs text-muted">种子箱 {{ breedingStore.boxCount }}/{{ breedingStore.maxSeedBox }}</span>
    </div>

    <!-- 两栏切换 -->
    <div class="flex space-x-1 mb-3">
      <Button class="flex-1 justify-center" :class="{ '!bg-accent !text-bg': tab === 'breeding' }" @click="tab = 'breeding'">育种台</Button>
      <Button class="flex-1 justify-center" :class="{ '!bg-accent !text-bg': tab === 'compendium' }" @click="tab = 'compendium'">
        图鉴
      </Button>
    </div>

    <!-- ===== 育种台 Tab ===== -->
    <template v-if="tab === 'breeding'">
      <!-- 育种台区 -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-muted">育种台 {{ breedingStore.stationCount }}/{{ MAX_BREEDING_STATIONS }}</span>
          <Button v-if="breedingStore.stationCount < MAX_BREEDING_STATIONS" :icon="Plus" :icon-size="12" @click="showCraftModal = true">
            建造
          </Button>
        </div>

        <!-- 无育种台空状态 -->
        <div v-if="breedingStore.stationCount === 0" class="border border-accent/10 rounded-xs py-6 flex flex-col items-center space-y-2">
          <Dna :size="32" class="text-muted/30" />
          <p class="text-xs text-muted">尚未建造育种台</p>
          <p class="text-xs text-muted/60">建造育种台后可进行杂交育种</p>
        </div>

        <!-- 育种台列表 -->
        <div v-else class="flex flex-col space-y-1.5">
          <div v-for="(slot, idx) in breedingStore.stations" :key="idx" class="border border-accent/20 rounded-xs px-3 py-2">
            <!-- 空闲 -->
            <template v-if="!slot.parentA && !slot.ready">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5">
                  <FlaskConical :size="12" class="text-muted/40" />
                  <span class="text-xs text-muted">育种台 #{{ idx + 1 }} · 空闲</span>
                </div>
                <Button :icon="Dna" :icon-size="12" :disabled="breedingStore.boxCount < 2" @click="openBreedingSelect(idx)">育种</Button>
              </div>
            </template>
            <!-- 加工中 -->
            <template v-else-if="slot.parentA && !slot.ready">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center space-x-1.5">
                  <FlaskConical :size="12" class="text-accent" />
                  <span class="text-xs text-accent">育种台 #{{ idx + 1 }} · 培育中</span>
                </div>
                <span class="text-xs text-muted">{{ slot.daysProcessed }}/{{ slot.totalDays }}天</span>
              </div>
              <div class="h-1 bg-bg rounded-xs border border-accent/10">
                <div
                  class="h-full rounded-xs bg-accent transition-all"
                  :style="{ width: (slot.daysProcessed / slot.totalDays) * 100 + '%' }"
                />
              </div>
            </template>
            <!-- 完成 -->
            <template v-else-if="slot.ready">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1.5">
                  <Sprout :size="12" class="text-success" />
                  <span class="text-xs text-success">育种台 #{{ idx + 1 }} · 完成</span>
                </div>
                <Button :icon="Check" :icon-size="12" @click="handleCollect(idx)">收取</Button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 种子箱 -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-muted">种子箱 {{ breedingStore.boxCount }}/{{ breedingStore.maxSeedBox }}</span>
          <button
            v-if="nextSeedBoxUpgrade || breedingStore.seedBoxLevel > 0"
            class="text-[10px] px-2 py-0.5 border rounded-xs"
            :class="nextSeedBoxUpgrade ? 'border-accent/30 text-accent hover:bg-accent/5 cursor-pointer' : 'border-accent/10 text-muted'"
            @click="showSeedBoxUpgradeModal = true"
          >
            <ArrowUpCircle :size="10" class="inline mr-0.5" />
            Lv.{{ breedingStore.seedBoxLevel }}
          </button>
        </div>
        <!-- 空状态 -->
        <div v-if="breedingStore.boxCount === 0" class="border border-accent/10 rounded-xs py-6 flex flex-col items-center space-y-2">
          <PackageOpen :size="32" class="text-muted/30" />
          <p class="text-xs text-muted">种子箱为空</p>
          <p class="text-xs text-muted/60">通过种子制造机收取产物时有概率获得育种种子</p>
        </div>
        <div v-else class="grid grid-cols-3 md:grid-cols-5 gap-1 max-h-60 overflow-y-auto">
          <button
            v-for="seed in breedingStore.breedingBox"
            :key="seed.genetics.id"
            class="border rounded-xs px-1 py-1.5 text-center cursor-pointer hover:bg-accent/5 transition-colors mr-1"
            :class="selectedSeedIds.includes(seed.genetics.id) ? 'border-accent bg-accent/10' : 'border-accent/20'"
            @click="openSeedDetail(seed)"
          >
            <p class="text-xs truncate" :class="seedStarColor(seed.genetics)">{{ getCropName(seed.genetics.cropId) }}</p>
            <p class="text-xs text-muted">G{{ seed.genetics.generation }}</p>
            <p class="text-xs flex items-center justify-center space-x-px" :class="seedStarColor(seed.genetics)">
              <Star v-for="n in getStarRating(seed.genetics)" :key="n" :size="10" />
            </p>
          </button>
        </div>
      </div>
    </template>

    <!-- ===== 图鉴 Tab ===== -->
    <template v-if="tab === 'compendium'">
      <!-- 育种规则 -->
      <div class="border border-accent/10 rounded-xs mb-2">
        <button class="w-full flex items-center justify-between p-2 text-xs text-accent hover:bg-accent/5" @click="showRules = !showRules">
          <span>育种规则</span>
          <ChevronDown :size="12" :class="{ 'transform rotate-180': showRules }" />
        </button>
        <div v-if="showRules" class="px-2 pb-2 border-t border-accent/10">
          <ul class="text-xs text-muted leading-relaxed mt-1.5 flex flex-col space-y-1">
            <li>
              · 收获作物时有
              <span class="text-accent">30%+种植等级×3%</span>
              概率获得育种种子
            </li>
            <li>· 种子制造机加工作物也有概率产出育种种子</li>
            <li>· 育种种子拥有独立遗传属性（甜度/产量/抗性），与物品品质无关</li>
            <li>
              ·
              <span class="text-accent">同种培育</span>
              ：两颗相同作物的育种种子杂交，可提升后代遗传属性
            </li>
            <li>
              ·
              <span class="text-accent">异种杂交</span>
              ：两颗不同作物的育种种子杂交，当亲本平均属性达标时可发现新品种
            </li>
            <li>· 先通过同种培育提升属性，再尝试异种杂交效果更佳</li>
          </ul>
        </div>
      </div>
      <!-- 说明提示 -->
      <div v-if="totalDiscovered === 0" class="border border-accent/10 rounded-xs p-2 mb-2">
        <p class="text-xs text-muted leading-relaxed">
          图鉴收录通过
          <span class="text-accent">异种杂交</span>
          发现的新品种。将两种
          <span class="text-accent">不同作物</span>
          的育种种子放入育种台，当亲本平均属性达标时即可发现杂交品种。
        </p>
        <p class="text-xs text-muted mt-1 leading-relaxed">
          提示：先通过
          <span class="text-accent">同种培育</span>
          提升种子的甜度和产量属性，再尝试异种杂交。
        </p>
      </div>
      <!-- 阶层筛选 -->
      <div class="flex flex-wrap mb-1">
        <Button
          v-for="tf in TIER_FILTERS"
          :key="tf.value"
          class="grow shrink-0 basis-[calc(25%-4px)] md:grow-0 md:shrink md:basis-auto justify-center mr-1 mb-1"
          :class="{ '!bg-accent !text-bg': tierFilter === tf.value }"
          @click="tierFilter = tf.value"
        >
          {{ tf.label }}
        </Button>
      </div>

      <!-- 进度 -->
      <p class="text-xs text-muted mb-2">已发现 {{ filteredDiscoveredCount }}/{{ filteredHybrids.length }}</p>

      <!-- 图鉴网格 -->
      <div class="grid grid-cols-3 md:grid-cols-5 gap-1 max-h-72 overflow-y-auto">
        <div
          v-for="hybrid in filteredHybrids"
          :key="hybrid.id"
          class="border rounded-xs p-1.5 text-xs text-center transition-colors truncate mr-1"
          :class="
            isDiscovered(hybrid.id)
              ? 'border-accent/20 cursor-pointer hover:bg-accent/5 ' + tierColor(hybrid.id)
              : 'border-accent/10 text-muted/30'
          "
          @click="isDiscovered(hybrid.id) && (activeHybrid = hybrid)"
        >
          <template v-if="isDiscovered(hybrid.id)">{{ hybrid.name }}</template>
          <Lock v-else :size="12" class="mx-auto text-muted/30" />
        </div>
      </div>

      <!-- 图鉴完成度 -->
      <div class="mt-3 border border-accent/20 rounded-xs p-2">
        <div class="flex items-center space-x-2 text-xs mb-1.5">
          <span class="text-xs text-muted shrink-0">完成度</span>
          <div class="flex-1 h-1 bg-bg rounded-xs border border-accent/10">
            <div class="h-full bg-accent rounded-xs transition-all" :style="{ width: completionPercent + '%' }" />
          </div>
          <span class="text-xs text-accent whitespace-nowrap">{{ totalDiscovered }}/{{ HYBRID_DEFS.length }}</span>
        </div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div v-for="ts in tierStats" :key="ts.tier" class="flex items-center justify-between">
            <span class="text-xs text-muted">{{ ts.label }}</span>
            <span class="text-xs">{{ ts.discovered }}/{{ ts.total }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 建造确认弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showCraftModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showCraftModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showCraftModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">建造育种台</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted mb-1">所需材料</p>
            <div v-for="mat in craftMaterials" :key="mat.itemId" class="flex items-center justify-between mt-0.5">
              <span class="text-xs">{{ mat.name }}</span>
              <span class="text-xs" :class="mat.enough ? 'text-success' : 'text-danger'">{{ mat.owned }}/{{ mat.required }}</span>
            </div>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">费用</span>
              <span class="text-xs" :class="playerStore.money >= BREEDING_STATION_COST.money ? 'text-accent' : 'text-danger'">
                {{ BREEDING_STATION_COST.money }}文
              </span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">当前持有</span>
              <span class="text-xs">{{ playerStore.money }}文</span>
            </div>
          </div>

          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': canCraftStation }"
            :icon="Plus"
            :icon-size="12"
            :disabled="!canCraftStation"
            @click="handleCraftStation"
          >
            确认建造
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 种子详情弹窗 -->
    <Transition name="panel-fade">
      <div v-if="detailSeed" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="detailSeed = null">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="detailSeed = null">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">{{ getCropName(detailSeed.genetics.cropId) }} · G{{ detailSeed.genetics.generation }}</p>
          <p class="text-xs mb-2 flex items-center space-x-1" :class="seedStarColor(detailSeed.genetics)">
            <span class="flex items-center space-x-px">
              <Star v-for="n in getStarRating(detailSeed.genetics)" :key="n" :size="10" />
            </span>
            <span>（总{{ getTotalStats(detailSeed.genetics) }}）</span>
          </p>

          <!-- 属性条 -->
          <div class="flex flex-col space-y-1 mb-3">
            <div v-for="attr in seedAttributes" :key="attr.key" class="flex items-center space-x-2">
              <span class="text-xs text-muted w-10 shrink-0">{{ attr.label }}</span>
              <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
                <div class="h-full rounded-xs transition-all" :class="attr.barClass" :style="{ width: attr.value + '%' }" />
              </div>
              <span class="text-xs w-6 text-right">{{ attr.value }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-col space-y-1">
            <Button class="w-full justify-center text-danger" :icon="Trash2" :icon-size="12" @click="handleDiscard">丢弃</Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 图鉴详情弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="activeHybrid"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="activeHybrid = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="activeHybrid = null">
            <X :size="14" />
          </button>

          <p class="text-sm mb-2" :class="tierColor(activeHybrid.id)">{{ activeHybrid.name }}</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs text-muted">{{ activeHybrid.discoveryText }}</p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">阶层</span>
              <span class="text-xs">{{ TIER_LABELS[getHybridTier(activeHybrid.id)] ?? '一' }}代</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">亲本A</span>
              <span class="text-xs">{{ getCropName(activeHybrid.parentCropA) }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">亲本B</span>
              <span class="text-xs">{{ getCropName(activeHybrid.parentCropB) }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">甜度要求</span>
              <span class="text-xs text-accent">≥{{ activeHybrid.minSweetness }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">产量要求</span>
              <span class="text-xs text-accent">≥{{ activeHybrid.minYield }}</span>
            </div>
          </div>

          <div class="border border-accent/10 rounded-xs p-2">
            <p class="text-xs text-muted mb-1">基础属性</p>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">甜度</span>
              <span class="text-xs">{{ activeHybrid.baseGenetics.sweetness }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">产量</span>
              <span class="text-xs">{{ activeHybrid.baseGenetics.yield }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">抗性</span>
              <span class="text-xs">{{ activeHybrid.baseGenetics.resistance }}</span>
            </div>
            <div v-if="getCompendiumEntry(activeHybrid.id)" class="flex items-center justify-between mt-1 pt-1 border-t border-accent/10">
              <span class="text-xs text-muted">种植次数</span>
              <span class="text-xs">{{ getCompendiumEntry(activeHybrid.id)?.timesGrown ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 种子箱升级弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showSeedBoxUpgradeModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showSeedBoxUpgradeModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showSeedBoxUpgradeModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">
            <ArrowUpCircle :size="14" class="inline mr-0.5" />
            种子箱信息
          </p>

          <!-- 当前状态 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">当前等级</span>
              <span class="text-xs text-accent">Lv.{{ breedingStore.seedBoxLevel }}</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">容量上限</span>
              <span class="text-xs text-text">{{ breedingStore.maxSeedBox }} 格</span>
            </div>
          </div>

          <!-- 下一级升级 -->
          <template v-if="nextSeedBoxUpgrade">
            <div class="border border-accent/10 rounded-xs p-2 mb-2">
              <p class="text-xs text-muted mb-1">升级至 Lv.{{ breedingStore.seedBoxLevel + 1 }}</p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">容量上限</span>
                <span class="text-xs text-text">
                  {{ breedingStore.maxSeedBox }} → {{ breedingStore.maxSeedBox + SEED_BOX_UPGRADE_INCREMENT }}
                </span>
              </div>
            </div>

            <!-- 所需材料 -->
            <div class="border border-accent/10 rounded-xs p-2 mb-2">
              <p class="text-xs text-muted mb-1">所需材料</p>
              <div v-for="mat in nextSeedBoxUpgrade.materials" :key="mat.itemId" class="flex items-center justify-between">
                <span class="text-xs text-muted">{{ getItemById(mat.itemId)?.name }}</span>
                <CombinedMaterialCount :item-id="mat.itemId" :required="mat.quantity" always-show-breakdown />
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <span class="text-xs text-muted">铜钱</span>
                <span class="text-xs" :class="playerStore.money >= nextSeedBoxUpgrade.cost ? '' : 'text-danger'">
                  {{ nextSeedBoxUpgrade.cost }}文
                </span>
              </div>
            </div>

            <!-- 扩容按钮 -->
            <Button
              v-if="!showSeedBoxUpgradeConfirm"
              class="w-full justify-center"
              :class="{ '!bg-accent !text-bg': canUpgradeSeedBox }"
              :icon="ArrowUpCircle"
              :icon-size="12"
              :disabled="!canUpgradeSeedBox"
              @click="showSeedBoxUpgradeConfirm = true"
            >
              扩容种子箱
            </Button>

            <!-- 确认 -->
            <div v-else class="flex space-x-1">
              <Button class="flex-1 justify-center" @click="showSeedBoxUpgradeConfirm = false">取消</Button>
              <Button class="flex-1 justify-center !bg-accent !text-bg" :icon="ArrowUpCircle" :icon-size="12" @click="handleSeedBoxUpgrade">
                确认扩容
              </Button>
            </div>
          </template>

          <p v-else class="text-[10px] text-muted text-center">种子箱已达到最高等级。</p>
        </div>
      </div>
    </Transition>

    <!-- 育种选种弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="breedingSelectSlot !== null"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="cancelBreedingSelect"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="cancelBreedingSelect">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-1">选择两颗种子</p>
          <p class="text-xs text-muted mb-2">已选 {{ selectedSeedIds.length }}/2</p>

          <div class="flex flex-col space-y-1 max-h-60 overflow-y-auto mb-3">
            <button
              v-for="seed in breedingStore.breedingBox"
              :key="seed.genetics.id"
              class="flex items-center justify-between px-2 py-1 border rounded-xs text-xs cursor-pointer hover:bg-accent/5"
              :class="selectedSeedIds.includes(seed.genetics.id) ? 'border-accent bg-accent/10' : 'border-accent/20'"
              @click="toggleSeedSelect(seed.genetics.id)"
            >
              <span :class="seedStarColor(seed.genetics)">{{ getCropName(seed.genetics.cropId) }} G{{ seed.genetics.generation }}</span>
              <span class="text-muted flex items-center space-x-1">
                <span class="flex items-center space-x-px">
                  <Star v-for="n in getStarRating(seed.genetics)" :key="n" :size="10" />
                </span>
                <span>{{ getTotalStats(seed.genetics) }}</span>
              </span>
            </button>
          </div>

          <!-- 杂交配方提示 -->
          <div
            v-if="crossBreedHint"
            class="border rounded-xs p-2 mb-3"
            :class="crossBreedHint.type === 'recipe' && crossBreedHint.canSucceed ? 'border-success/30' : 'border-accent/10'"
          >
            <template v-if="crossBreedHint.type === 'same'">
              <p class="text-xs text-muted">同种培育：提升后代属性，不会产生新品种。</p>
            </template>
            <template v-else-if="crossBreedHint.type === 'no_recipe'">
              <p class="text-xs text-muted">这两个品种没有已知的杂交配方。</p>
            </template>
            <template v-else-if="crossBreedHint.type === 'recipe'">
              <p class="text-xs text-accent mb-1">可杂交：{{ crossBreedHint.name }}</p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted">甜度</span>
                <span class="text-xs" :class="crossBreedHint.sweetOk ? 'text-success' : 'text-danger'">
                  {{ crossBreedHint.avgSweet }} / {{ crossBreedHint.minSweet }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <span class="text-xs text-muted">产量</span>
                <span class="text-xs" :class="crossBreedHint.yieldOk ? 'text-success' : 'text-danger'">
                  {{ crossBreedHint.avgYield }} / {{ crossBreedHint.minYield }}
                </span>
              </div>
              <p v-if="!crossBreedHint.canSucceed" class="text-xs text-danger mt-1">属性未达标，杂交将失败。请先同种培育提升属性。</p>
              <p v-else class="text-xs text-success mt-1">属性达标，可以杂交成功！</p>
            </template>
          </div>

          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': selectedSeedIds.length === 2 }"
            :icon="Dna"
            :icon-size="12"
            :disabled="selectedSeedIds.length !== 2"
            @click="handleStartBreeding"
          >
            开始育种
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { FlaskConical, Plus, Check, ChevronDown, X, Dna, Trash2, Sprout, PackageOpen, Star, Lock, ArrowUpCircle } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import { useBreedingStore } from '@/stores/useBreedingStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { getCombinedItemCount, removeCombinedItem } from '@/composables/useCombinedInventory'
  import CombinedMaterialCount from '@/components/game/CombinedMaterialCount.vue'
  import { getCropById } from '@/data/crops'
  import { getItemById } from '@/data/items'
  import {
    MAX_BREEDING_STATIONS,
    BREEDING_STATION_COST,
    SEED_BOX_UPGRADE_INCREMENT,
    getStarRating,
    getTotalStats,
    HYBRID_DEFS,
    getHybridTier,
    findPossibleHybrid
  } from '@/data/breeding'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'
  import type { BreedingSeed, HybridDef } from '@/types/breeding'

  const breedingStore = useBreedingStore()
  const playerStore = usePlayerStore()
  const gameStore = useGameStore()

  // === Tabs ===

  type Tab = 'breeding' | 'compendium'
  const tab = ref<Tab>('breeding')

  // === 育种规则展示 ===
  const showRules = ref(false)

  // === 图鉴阶层筛选 ===

  const TIER_LABELS: Record<number, string> = {
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
    6: '六',
    7: '七',
    8: '八',
    9: '九',
    10: '十'
  }

  const TIER_FILTERS = [
    { value: 0, label: '全部' },
    { value: 1, label: '一代' },
    { value: 2, label: '二代' },
    { value: 3, label: '三代' },
    { value: 4, label: '四代' },
    { value: 5, label: '五代' },
    { value: 6, label: '六代' },
    { value: 7, label: '七代' },
    { value: 8, label: '八代' },
    { value: 9, label: '九代' },
    { value: 10, label: '十代' }
  ]

  const tierFilter = ref(0)

  const filteredHybrids = computed(() => {
    if (tierFilter.value === 0) return HYBRID_DEFS
    return HYBRID_DEFS.filter(h => getHybridTier(h.id) === tierFilter.value)
  })

  const filteredDiscoveredCount = computed(() => {
    return filteredHybrids.value.filter(h => isDiscovered(h.id)).length
  })

  const totalDiscovered = computed(() => {
    return breedingStore.compendium.length
  })

  const completionPercent = computed(() => {
    if (HYBRID_DEFS.length === 0) return 0
    return Math.floor((totalDiscovered.value / HYBRID_DEFS.length) * 100)
  })

  const tierStats = computed(() => {
    const stats: { tier: number; label: string; total: number; discovered: number }[] = []
    for (let t = 1; t <= 10; t++) {
      const hybrids = HYBRID_DEFS.filter(h => getHybridTier(h.id) === t)
      const discovered = hybrids.filter(h => isDiscovered(h.id)).length
      stats.push({ tier: t, label: `${TIER_LABELS[t]}代`, total: hybrids.length, discovered })
    }
    return stats
  })

  /** 根据阶层给已发现品种上色 */
  const TIER_COLOR_MAP: Record<number, string> = {
    1: 'text-accent',
    2: 'text-quality-fine',
    3: 'text-accent',
    4: 'text-quality-fine',
    5: 'text-quality-excellent',
    6: 'text-quality-excellent',
    7: 'text-quality-supreme',
    8: 'text-quality-supreme',
    9: 'text-quality-supreme',
    10: 'text-quality-supreme'
  }

  const tierColor = (hybridId: string): string => {
    return TIER_COLOR_MAP[getHybridTier(hybridId)] ?? 'text-accent'
  }

  // === 图鉴详情 ===

  const activeHybrid = ref<HybridDef | null>(null)

  // === 种子详情 ===

  const detailSeed = ref<BreedingSeed | null>(null)

  const openSeedDetail = (seed: BreedingSeed) => {
    detailSeed.value = seed
  }

  const seedAttributes = computed(() => {
    if (!detailSeed.value) return []
    const g = detailSeed.value.genetics
    return [
      { key: 'sweetness', label: '甜度', value: g.sweetness, barClass: 'bg-accent' },
      { key: 'yield', label: '产量', value: g.yield, barClass: 'bg-success' },
      { key: 'resistance', label: '抗性', value: g.resistance, barClass: 'bg-water' },
      { key: 'stability', label: '稳定', value: g.stability, barClass: 'bg-muted' },
      { key: 'mutationRate', label: '变异', value: g.mutationRate, barClass: 'bg-danger' }
    ]
  })

  const handleDiscard = () => {
    if (!detailSeed.value) return
    breedingStore.removeFromBox(detailSeed.value.genetics.id)
    addLog('丢弃了一颗育种种子。')
    detailSeed.value = null
  }

  // === 育种选种 ===

  const breedingSelectSlot = ref<number | null>(null)
  const selectedSeedIds = ref<string[]>([])

  const openBreedingSelect = (slotIdx: number) => {
    breedingSelectSlot.value = slotIdx
    selectedSeedIds.value = []
  }

  const cancelBreedingSelect = () => {
    breedingSelectSlot.value = null
    selectedSeedIds.value = []
  }

  const toggleSeedSelect = (id: string) => {
    const idx = selectedSeedIds.value.indexOf(id)
    if (idx >= 0) {
      selectedSeedIds.value.splice(idx, 1)
    } else if (selectedSeedIds.value.length < 2) {
      selectedSeedIds.value.push(id)
    }
  }

  /** 选中两颗种子时，检查是否存在杂交配方并显示属性要求 */
  const crossBreedHint = computed(() => {
    if (selectedSeedIds.value.length !== 2) return null
    const seedA = breedingStore.breedingBox.find(s => s.genetics.id === selectedSeedIds.value[0])
    const seedB = breedingStore.breedingBox.find(s => s.genetics.id === selectedSeedIds.value[1])
    if (!seedA || !seedB) return null
    const a = seedA.genetics
    const b = seedB.genetics
    if (a.cropId === b.cropId) return { type: 'same' as const }
    const hybrid = findPossibleHybrid(a.cropId, b.cropId)
    if (!hybrid) return { type: 'no_recipe' as const }
    const avgSweet = Math.round((a.sweetness + b.sweetness) / 2)
    const avgYield = Math.round((a.yield + b.yield) / 2)
    const sweetOk = avgSweet >= hybrid.minSweetness
    const yieldOk = avgYield >= hybrid.minYield
    return {
      type: 'recipe' as const,
      name: hybrid.name,
      avgSweet,
      avgYield,
      minSweet: hybrid.minSweetness,
      minYield: hybrid.minYield,
      sweetOk,
      yieldOk,
      canSucceed: sweetOk && yieldOk
    }
  })

  const handleStartBreeding = () => {
    if (breedingSelectSlot.value === null || selectedSeedIds.value.length !== 2) return
    const ok = breedingStore.startBreeding(breedingSelectSlot.value, selectedSeedIds.value[0]!, selectedSeedIds.value[1]!)
    if (ok) {
      addLog('育种开始，2天后可收取结果。')
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.breeding)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) {
        handleEndDay()
      }
    } else {
      addLog('育种启动失败。')
    }
    cancelBreedingSelect()
  }

  const handleCollect = (slotIdx: number) => {
    const result = breedingStore.collectResult(slotIdx)
    if (result) {
      const crop = getCropById(result.cropId)
      const stars = getStarRating(result)
      addLog(`收取了育种种子：${crop?.name ?? result.cropId}（${stars}星）。`)
    }
  }

  // === 制造育种台 ===

  const showCraftModal = ref(false)

  const canCraftStation = computed(() => {
    return breedingStore.canCraftStation(playerStore.money, (id: string) => getCombinedItemCount(id))
  })

  const craftMaterials = computed(() => {
    return BREEDING_STATION_COST.materials.map(m => ({
      itemId: m.itemId,
      name: getItemById(m.itemId)?.name ?? m.itemId,
      required: m.quantity,
      owned: getCombinedItemCount(m.itemId),
      enough: getCombinedItemCount(m.itemId) >= m.quantity
    }))
  })

  const handleCraftStation = () => {
    if (!canCraftStation.value) return
    breedingStore.craftStation(
      (amount: number) => playerStore.spendMoney(amount),
      (id: string, qty: number) => removeCombinedItem(id, qty)
    )
    addLog('建造了一台育种台。')
    showCraftModal.value = false
    const tr = gameStore.advanceTime(ACTION_TIME_COSTS.breeding)
    if (tr.message) addLog(tr.message)
    if (tr.passedOut) {
      handleEndDay()
    }
  }

  // === 种子箱升级 ===

  const showSeedBoxUpgradeModal = ref(false)
  const showSeedBoxUpgradeConfirm = ref(false)

  const nextSeedBoxUpgrade = computed(() => breedingStore.getNextSeedBoxUpgrade())

  const canUpgradeSeedBox = computed(() => {
    return breedingStore.canUpgradeSeedBox(playerStore.money, (id: string) => getCombinedItemCount(id))
  })

  const handleSeedBoxUpgrade = () => {
    const result = breedingStore.upgradeSeedBox(
      (amount: number) => playerStore.spendMoney(amount),
      (id: string, qty: number) => removeCombinedItem(id, qty)
    )
    addLog(result.message)
    if (result.success) {
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.breeding)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    }
    showSeedBoxUpgradeConfirm.value = false
    showSeedBoxUpgradeModal.value = false
  }

  // === 图鉴 ===

  const isDiscovered = (hybridId: string): boolean => {
    return breedingStore.compendium.some(e => e.hybridId === hybridId)
  }

  const getCompendiumEntry = (hybridId: string) => {
    return breedingStore.compendium.find(e => e.hybridId === hybridId) ?? null
  }

  // === 辅助 ===

  const getCropName = (cropId: string): string => {
    return getCropById(cropId)?.name ?? cropId
  }

  const seedStarColor = (g: { sweetness: number; yield: number; resistance: number }): string => {
    const total = g.sweetness + g.yield + g.resistance
    if (total >= 250) return 'text-quality-supreme'
    if (total >= 200) return 'text-quality-excellent'
    if (total >= 150) return 'text-quality-fine'
    return ''
  }
</script>
