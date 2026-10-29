<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-accent text-sm">
        <Home :size="14" class="inline" />
        牧场
      </h3>
      <Button v-if="unpettedCount > 0" :icon="Hand" @click="handlePetAll">一键抚摸（{{ unpettedCount }}只）</Button>
    </div>

    <!-- 每日例行操作放在最上面，免得为了喂食放牧来回翻屏 -->
    <div v-if="animalStore.animals.length > 0" class="mb-3">
      <div class="flex flex-wrap">
        <Button class="mr-1 mb-1" :icon="Wheat" :icon-size="12" :disabled="unfedCount === 0" @click="unfedCount > 0 && handleFeedAll()">
          {{ unfedCount > 0 ? `喂食全部（${unfedCount}只）` : '都已喂过' }}
        </Button>
        <Button class="mr-1 mb-1" :icon="Sun" :icon-size="12" :disabled="!canGrazeOrFeed" @click="canGrazeOrFeed && handleGraze()">
          {{ grazeButtonLabel }}
        </Button>
      </div>
      <!-- 默认饲料：一键喂食、雇工、配偶都按它喂，不足补干草 -->
      <div class="flex flex-wrap items-center">
        <span class="text-[10px] text-muted mr-1 mb-1">饲料</span>
        <Button
          v-for="feed in feedCounts"
          :key="feed.id"
          class="btn-compact mr-1 mb-1"
          :class="{ '!bg-accent !text-bg': selectedFeed === feed.id }"
          @click="selectedFeed = feed.id"
        >
          {{ feed.name }} {{ feed.count }}
        </Button>
      </div>
    </div>

    <p v-if="tutorialHint" class="text-[10px] text-muted/50 mb-2">
      {{ tutorialHint }}
    </p>

    <!-- 宠物区域 -->
    <div class="mb-4 border border-accent/20 rounded-xs p-3">
      <p class="text-xs text-muted mb-2">宠物</p>
      <template v-if="animalStore.pet">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center space-x-1 min-w-0 mr-2">
            <template v-if="renamingId === 'pet'">
              <input
                v-model="renameInput"
                class="bg-bg border border-accent/30 rounded-xs px-1 py-0.5 text-xs text-text w-20 focus:border-accent outline-none placeholder:text-muted/40 transition-colors"
                maxlength="8"
                @keyup.enter="confirmRename"
                @keyup.escape="cancelRename"
              />
              <Button class="btn-compact" @click="confirmRename">确定</Button>
              <Button class="btn-compact" @click="cancelRename">取消</Button>
            </template>
            <template v-else>
              <span class="text-xs text-accent truncate">
                {{ animalStore.pet.type === 'cat' ? '猫' : '狗' }} — {{ animalStore.pet.name }}
              </span>
              <button class="text-muted hover:text-accent shrink-0" @click="startRename('pet', animalStore.pet!.name)">
                <Pencil :size="10" />
              </button>
            </template>
          </div>
          <Button class="btn-compact" :icon="Hand" :icon-size="12" :disabled="animalStore.pet.wasPetted" @click="handlePetThePet">
            {{ animalStore.pet.wasPetted ? '已摸' : '抚摸' }}
          </Button>
        </div>
        <div class="flex items-center space-x-1">
          <span class="text-[10px] text-muted w-6">好感</span>
          <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
            <div
              class="h-full rounded-xs bg-danger transition-all"
              :style="{
                width: Math.floor(animalStore.pet.friendship / 10) + '%'
              }"
            />
          </div>
          <span class="text-[10px] text-muted">{{ animalStore.pet.friendship }}/1000</span>
        </div>
        <div class="flex flex-wrap items-center mt-1.5">
          <span
            v-for="tag in petAbilityTags"
            :key="tag.id"
            class="text-[10px] border rounded-xs px-1 mr-1 flex items-center space-x-0.5"
            :class="tag.unlocked ? 'text-success border-success/30' : 'text-muted/40 border-muted/10'"
          >
            <span>{{ tag.label }}</span>
            <template v-if="!tag.unlocked">
              <Heart :size="10" />
              <span>{{ tag.unlockFriendship }}</span>
            </template>
          </span>
        </div>
      </template>
      <div v-else class="flex flex-col items-center justify-center py-6 text-muted">
        <Home :size="32" class="mb-2" />
        <p class="text-xs">暂无宠物</p>
        <p class="text-[10px] mt-1">入住后第7天会有小动物来访。</p>
      </div>
    </div>

    <!-- 畜舍列表 (鸡舍和牲口棚) -->
    <div v-for="bDef in mainBuildings" :key="bDef.type" class="mb-4 border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-accent">{{ getBuildingDisplayName(bDef.type) }}</span>
        <div v-if="isBuildingBuilt(bDef.type)" class="flex items-center space-x-2">
          <span class="text-xs text-muted">{{ getAnimalsInBuilding(bDef.type).length }}/{{ getBuildingCapacity(bDef.type) }}</span>
          <Button v-if="getBuildingLevel(bDef.type) < 3" :icon="ArrowUp" @click="openUpgradeModal(bDef.type)">升级</Button>
        </div>
        <Button v-else :icon="Hammer" @click="handleBuildBuilding(bDef.type)">建造 ({{ bDef.cost }}文)</Button>
      </div>

      <template v-if="isBuildingBuilt(bDef.type)">
        <p v-if="animalStore.hasAutoPetter(bDef.type)" class="text-[10px] text-success mb-2">自动抚摸机运行中 — 每日自动抚摸所有动物</p>
        <!-- 鸡舍孵化器（鸡舍2级以上） -->
        <div v-if="bDef.type === 'coop' && getBuildingLevel('coop') >= 2" class="mb-3 p-2 border border-accent/10 rounded-xs">
          <p class="text-xs text-accent mb-1">
            <Egg :size="14" class="inline" />
            孵化器
          </p>
          <div v-if="animalStore.incubating">
            <p class="text-xs text-muted">
              正在孵化：{{ getAnimalName(animalStore.incubating.animalType) }}（剩余{{ animalStore.incubating.daysLeft }}天）
            </p>
          </div>
          <div v-else-if="coopIncubatableEggs.length > 0" class="flex flex-col space-y-1">
            <div
              v-for="eggItem in coopIncubatableEggs"
              :key="eggItem.itemId"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleStartIncubation(eggItem.itemId)"
            >
              <span class="text-xs">{{ eggItem.name }}</span>
              <span class="text-xs text-muted">&times;{{ eggItem.count }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted">背包中没有可孵化的蛋。</p>
        </div>

        <!-- 牲口棚孵化器（牲口棚2级以上） -->
        <div v-if="bDef.type === 'barn' && getBuildingLevel('barn') >= 2" class="mb-3 p-2 border border-accent/10 rounded-xs">
          <p class="text-xs text-accent mb-1">
            <Egg :size="14" class="inline" />
            孵化器
          </p>
          <div v-if="animalStore.barnIncubating">
            <p class="text-xs text-muted">
              正在孵化：{{ getAnimalName(animalStore.barnIncubating.animalType) }}（剩余{{ animalStore.barnIncubating.daysLeft }}天）
            </p>
          </div>
          <div v-else-if="barnIncubatableEggs.length > 0" class="flex flex-col space-y-1">
            <div
              v-for="eggItem in barnIncubatableEggs"
              :key="eggItem.itemId"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleStartBarnIncubation(eggItem.itemId)"
            >
              <span class="text-xs">{{ eggItem.name }}</span>
              <span class="text-xs text-muted">&times;{{ eggItem.count }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted">背包中没有可在牲口棚孵化的蛋。</p>
        </div>

        <!-- 购买动物按钮 -->
        <Button class="w-full md:w-auto mb-3" :icon="ShoppingCart" @click="buyListBuilding = bDef.type">购买动物</Button>

        <!-- 动物列表 -->
        <div v-if="getAnimalsInBuilding(bDef.type).length > 0" class="flex flex-col space-y-1 max-h-60 overflow-y-auto">
          <div v-for="animal in getAnimalsInBuilding(bDef.type)" :key="animal.id" class="border border-accent/10 rounded-xs p-2 mr-1">
            <!-- 名字与按钮组允许换行：小屏放不下时按钮组整体落到第二行，不再把按钮挤成竖排 -->
            <div class="flex flex-wrap items-center justify-between mb-1 -mt-1">
              <div class="flex items-center space-x-1 min-w-0 mr-2 mt-1">
                <template v-if="renamingId === animal.id">
                  <input
                    v-model="renameInput"
                    class="bg-bg border border-accent/30 rounded-xs px-1 py-0.5 text-xs text-text w-20 focus:border-accent outline-none placeholder:text-muted/40 transition-colors"
                    maxlength="8"
                    @keyup.enter="confirmRename"
                    @keyup.escape="cancelRename"
                  />
                  <Button class="btn-compact" @click="confirmRename">确定</Button>
                  <Button class="btn-compact" @click="cancelRename">取消</Button>
                </template>
                <template v-else>
                  <span class="text-xs text-accent truncate">{{ animal.name }}</span>
                  <button class="text-muted hover:text-accent shrink-0" @click="startRename(animal.id, animal.name)">
                    <Pencil :size="10" />
                  </button>
                </template>
              </div>
              <div class="flex items-center space-x-1 shrink-0 ml-auto mt-1">
                <Button
                  class="btn-compact"
                  :icon="Apple"
                  :icon-size="12"
                  :disabled="animal.wasFed"
                  @click="handleFeedAnimal(animal.id, animal.name)"
                >
                  {{ animal.wasFed ? '已喂' : '喂食' }}
                </Button>
                <Button class="btn-compact" :icon="Hand" :icon-size="12" :disabled="animal.wasPetted" @click="handlePetAnimal(animal.id)">
                  {{ animal.wasPetted ? '已摸' : '抚摸' }}
                </Button>
                <Button
                  class="btn-compact"
                  :icon="Coins"
                  :icon-size="12"
                  @click="
                    sellTarget = {
                      id: animal.id,
                      name: animal.name,
                      type: animal.type
                    }
                  "
                >
                  出售
                </Button>
              </div>
            </div>
            <div class="space-y-0.5">
              <div class="flex items-center space-x-1">
                <span class="text-[10px] text-muted w-6">好感</span>
                <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
                  <div class="h-full rounded-xs bg-danger transition-all" :style="{ width: Math.floor(animal.friendship / 10) + '%' }" />
                </div>
              </div>
              <div class="flex items-center space-x-1">
                <span class="text-[10px] text-muted w-6">心情</span>
                <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
                  <div
                    class="h-full rounded-xs transition-all"
                    :class="getMoodBarColor(animal.mood)"
                    :style="{
                      width: Math.floor((animal.mood / 255) * 100) + '%'
                    }"
                  />
                </div>
                <span class="text-[10px] text-muted w-6">{{ getMoodText(animal.mood) }}</span>
              </div>
              <div v-if="animal.hunger > 0" class="flex items-center space-x-1">
                <span class="text-[10px] text-muted w-6">饥饿</span>
                <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
                  <div
                    class="h-full rounded-xs bg-danger transition-all"
                    :style="{
                      width: Math.floor((animal.hunger / 7) * 100) + '%'
                    }"
                  />
                </div>
                <span class="text-[10px] text-danger w-6">{{ animal.hunger }}天</span>
              </div>
            </div>
            <div v-if="animal.sick" class="flex items-center justify-between mt-0.5">
              <p class="text-[10px] text-danger">生病中({{ animal.sickDays }}/5天)</p>
              <Button
                class="btn-compact"
                :icon="Syringe"
                :icon-size="12"
                :disabled="medicineCount <= 0"
                @click="handleHealAnimal(animal.id, animal.name)"
              >
                治疗
              </Button>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-6">
          <Home :size="36" class="text-accent/20 mb-2" />
          <p class="text-xs text-muted">暂无动物</p>
          <p class="text-[10px] text-muted/50 mt-0.5">在商店购买幼崽来饲养吧</p>
        </div>
      </template>
      <template v-else>
        <p class="text-xs text-muted">需要：{{ bDef.materialCost.map(m => `${getItemName(m.itemId)}×${m.quantity}`).join('、') }}</p>
      </template>
    </div>

    <!-- 马厩 -->
    <div class="mb-4 border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-accent">马厩</span>
        <div v-if="animalStore.stableBuilt" class="flex items-center space-x-2">
          <span class="text-xs text-muted">{{ animalStore.getHorse ? '1/1' : '0/1' }}</span>
        </div>
        <Button v-else :icon="Hammer" @click="handleBuildBuilding('stable')">建造 ({{ stableDef?.cost ?? 10000 }}文)</Button>
      </div>

      <template v-if="animalStore.stableBuilt">
        <div v-if="animalStore.getHorse" class="border border-accent/10 rounded-xs p-2">
          <div class="flex flex-wrap items-center justify-between mb-1 -mt-1">
            <div class="flex items-center space-x-1 min-w-0 mr-2 mt-1">
              <template v-if="renamingId === animalStore.getHorse.id">
                <input
                  v-model="renameInput"
                  class="bg-bg border border-accent/30 rounded-xs px-1 py-0.5 text-xs text-text w-20 focus:border-accent outline-none placeholder:text-muted/40 transition-colors"
                  maxlength="8"
                  @keyup.enter="confirmRename"
                  @keyup.escape="cancelRename"
                />
                <Button class="btn-compact" @click="confirmRename">确定</Button>
                <Button class="btn-compact" @click="cancelRename">取消</Button>
              </template>
              <template v-else>
                <span class="text-xs text-accent truncate">{{ animalStore.getHorse.name }}</span>
                <span class="text-[10px] text-muted whitespace-nowrap">{{ animalStore.horseBreedDef.name }}</span>
                <button
                  class="text-muted hover:text-accent shrink-0"
                  @click="startRename(animalStore.getHorse!.id, animalStore.getHorse!.name)"
                >
                  <Pencil :size="10" />
                </button>
              </template>
            </div>
            <div class="flex items-center space-x-1 shrink-0 ml-auto mt-1">
              <Button
                class="btn-compact"
                :icon="Apple"
                :icon-size="12"
                :disabled="animalStore.getHorse.wasFed"
                @click="handleFeedAnimal(animalStore.getHorse.id, animalStore.getHorse.name)"
              >
                {{ animalStore.getHorse.wasFed ? '已喂' : '喂食' }}
              </Button>
              <Button
                class="btn-compact"
                :icon="Hand"
                :icon-size="12"
                :disabled="animalStore.getHorse.wasPetted"
                @click="handlePetAnimal(animalStore.getHorse.id)"
              >
                {{ animalStore.getHorse.wasPetted ? '已摸' : '抚摸' }}
              </Button>
              <Button
                class="btn-compact"
                :icon="Coins"
                :icon-size="12"
                @click="
                  sellTarget = {
                    id: animalStore.getHorse!.id,
                    name: animalStore.getHorse!.name,
                    type: animalStore.getHorse!.type
                  }
                "
              >
                出售
              </Button>
            </div>
          </div>
          <div class="space-y-0.5">
            <!-- 把马的实际收益写明：品种和好感都会影响赶路与放牧 -->
            <p class="text-[10px] text-muted/70">
              {{ animalStore.horseBreedDef.description }}
            </p>
            <p class="text-[10px] text-accent/70">
              赶路耗时 ×{{ animalStore.getHorseTravelTimeMultiplier().toFixed(2) }} · 体力 ×{{
                animalStore.getHorseTravelStaminaMultiplier().toFixed(2)
              }}
              · 放牧协助
              {{ Math.round(animalStore.getHorseGrazeBonusChance() * 100) }}%
            </p>
            <p class="text-[10px] text-muted/50">喂食抚摸提升好感，好感越高赶路越省力、放牧带回的产物越多。</p>
            <!-- 已获得的品种可随时切换（卖马、兑换新品种都不会丢） -->
            <div v-if="unlockedBreedDefs.length > 1" class="flex flex-wrap items-center pt-0.5">
              <span class="text-[10px] text-muted mr-1 mb-1">品种</span>
              <Button
                v-for="breed in unlockedBreedDefs"
                :key="breed.id"
                class="btn-compact mr-1 mb-1"
                :class="{ '!bg-accent !text-bg': animalStore.horseBreedDef.id === breed.id }"
                @click="handleSwitchBreed(breed.id)"
              >
                {{ breed.name }}
              </Button>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-[10px] text-muted w-6">好感</span>
              <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
                <div
                  class="h-full rounded-xs bg-danger transition-all"
                  :style="{
                    width: Math.floor(animalStore.getHorse.friendship / 10) + '%'
                  }"
                />
              </div>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-[10px] text-muted w-6">心情</span>
              <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
                <div
                  class="h-full rounded-xs transition-all"
                  :class="getMoodBarColor(animalStore.getHorse.mood)"
                  :style="{
                    width: Math.floor((animalStore.getHorse.mood / 255) * 100) + '%'
                  }"
                />
              </div>
              <span class="text-[10px] text-muted w-6">{{ getMoodText(animalStore.getHorse.mood) }}</span>
            </div>
            <div v-if="animalStore.getHorse.hunger > 0" class="flex items-center space-x-1">
              <span class="text-[10px] text-muted w-6">饥饿</span>
              <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
                <div
                  class="h-full rounded-xs bg-danger transition-all"
                  :style="{
                    width: Math.floor((animalStore.getHorse.hunger / 7) * 100) + '%'
                  }"
                />
              </div>
              <span class="text-[10px] text-danger w-6">{{ animalStore.getHorse.hunger }}天</span>
            </div>
          </div>
          <div v-if="animalStore.getHorse.sick" class="flex items-center justify-between mt-0.5">
            <p class="text-[10px] text-danger">生病中({{ animalStore.getHorse.sickDays }}/5天)</p>
            <Button
              class="py-0 px-1"
              :icon="Syringe"
              :disabled="medicineCount <= 0"
              @click="handleHealAnimal(animalStore.getHorse!.id, animalStore.getHorse!.name)"
            >
              治疗
            </Button>
          </div>
        </div>
        <div v-else>
          <div
            class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
            @click="
              openBuyModal(
                {
                  type: 'horse' as AnimalType,
                  name: '马',
                  building: 'stable' as AnimalBuildingType,
                  cost: 5000,
                  productId: '',
                  productName: '无',
                  produceDays: 0,
                  friendship: { min: 0, max: 1000 }
                },
                'stable'
              )
            "
          >
            <span class="text-xs">马 · {{ bestBreedDef.name }}</span>
            <span class="text-xs text-accent whitespace-nowrap">5000文</span>
          </div>
          <p class="text-xs text-muted mt-1">拥有马匹可减少{{ horseTravelReduction }}%旅行时间。</p>
        </div>
      </template>
      <template v-else>
        <p class="text-xs text-muted">
          需要：{{ stableDef?.materialCost.map(m => `${getItemName(m.itemId)}×${m.quantity}`).join('、') ?? '' }}
        </p>
        <p class="text-xs text-muted mt-1">拥有马匹可减少{{ horseTravelReduction }}%旅行时间。</p>
      </template>
    </div>

    <!-- 饲养管理 -->
    <div class="border border-accent/20 rounded-xs p-3">
      <h3 class="text-accent text-sm mb-3">
        <Apple :size="14" class="inline" />
        饲养管理
      </h3>

      <!-- 饲料选择 -->
      <div class="mb-3">
        <p class="text-xs text-muted mb-1">饲料选择</p>
        <div class="flex flex-col space-y-1">
          <div
            v-for="feed in feedCounts"
            :key="feed.id"
            class="flex items-center justify-between border rounded-xs px-3 py-1.5 cursor-pointer"
            :class="selectedFeed === feed.id ? 'border-accent bg-accent/10' : 'border-accent/20 hover:bg-accent/5'"
            @click="selectedFeed = feed.id"
          >
            <div class="flex items-center space-x-2">
              <span class="text-xs" :class="selectedFeed === feed.id ? 'text-accent' : ''">{{ feed.name }}</span>
              <span class="text-[10px] text-muted">{{ feed.description }}</span>
            </div>
            <span class="text-xs text-muted">{{ feed.count }}</span>
          </div>
        </div>
      </div>

      <!-- 喂食 -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs text-muted">喂食</p>
          <span class="text-xs text-muted">{{ selectedFeedName }}库存：{{ selectedFeedCount }}</span>
        </div>
        <div class="flex flex-col space-y-1">
          <div
            class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5"
            :class="unfedCount > 0 ? 'cursor-pointer hover:bg-accent/5' : 'opacity-50'"
            @click="unfedCount > 0 && handleFeedAll()"
          >
            <span class="text-xs">喂食全部</span>
            <span class="text-xs text-muted">需{{ selectedFeedName }}&times;{{ unfedCount }}</span>
          </div>
          <div
            class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5"
            :class="playerStore.money >= selectedFeedPrice ? 'cursor-pointer hover:bg-accent/5' : 'opacity-50'"
            @click="playerStore.money >= selectedFeedPrice && handleBuyFeed()"
          >
            <span class="text-xs">购买{{ selectedFeedName }}</span>
            <span class="text-xs text-accent">{{ selectedFeedPrice }}文</span>
          </div>
        </div>
      </div>

      <!-- 放牧 -->
      <div>
        <p class="text-xs text-muted mb-1">放牧</p>
        <div
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5"
          :class="canGraze ? 'cursor-pointer hover:bg-accent/5' : 'opacity-50'"
          @click="canGraze && handleGraze()"
        >
          <span class="text-xs">放牧全部动物</span>
          <span v-if="grazeDisabledReason" class="text-xs text-muted">{{ grazeDisabledReason }}</span>
        </div>
      </div>

      <!-- 治疗 -->
      <div v-if="sickCount > 0" class="mt-3">
        <div class="flex items-center justify-between mb-1">
          <p class="text-xs text-muted">治疗</p>
          <span class="text-xs text-muted">兽药库存：{{ medicineCount }}</span>
        </div>
        <div
          class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5"
          :class="medicineCount > 0 ? 'cursor-pointer hover:bg-accent/5' : 'opacity-50'"
          @click="medicineCount > 0 && handleHealAll()"
        >
          <span class="text-xs">治疗全部生病动物</span>
          <span class="text-xs text-muted">需兽药×{{ sickCount }}</span>
        </div>
      </div>
    </div>

    <!-- 购买动物列表弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="buyListBuilding"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="buyListBuilding = null"
      >
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">购买动物</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="buyListBuilding = null" />
          </div>
          <div class="flex flex-col space-y-1">
            <div
              v-for="aDef in getAnimalDefsForBuilding(buyListBuilding)"
              :key="aDef.type"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleSelectAnimalToBuy(aDef)"
            >
              <span class="text-xs">{{ aDef.name }}</span>
              <span class="text-xs text-accent whitespace-nowrap">{{ aDef.cost }}文</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 购买动物详情弹窗 -->
    <Transition name="panel-fade">
      <div v-if="buyModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4" @click.self="buyModal = null">
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">{{ buyModal.name }}</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="buyModal = null" />
          </div>
          <div class="text-xs space-y-1 mb-3 border-b border-accent/20 pb-2">
            <p v-if="buyModal.productName && buyModal.productName !== '无'" class="text-muted">
              产出：{{ buyModal.productName }}（每{{ buyModal.produceDays }}天）
            </p>
            <p v-else class="text-muted">旅行时间减少{{ horseTravelReduction }}%</p>
            <p>价格：{{ buyModal.cost }}文</p>
          </div>
          <Button class="w-full" :icon="ShoppingCart" :disabled="!buyModal.canBuy()" @click="handleBuyFromModal">购买</Button>
        </div>
      </div>
    </Transition>

    <!-- 出售动物确认弹窗 -->
    <Transition name="panel-fade">
      <div v-if="sellTarget" class="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4" @click.self="sellTarget = null">
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="sellTarget = null">
            <X :size="14" />
          </button>
          <p class="text-accent text-sm mb-2">出售动物</p>
          <p class="text-xs text-text mb-1">
            确定要卖掉
            <span class="text-accent">{{ sellTarget.name }}</span>
            吗？
          </p>
          <p class="text-xs text-muted mb-3">
            出售后不可恢复，将获得
            <span class="text-accent">{{ sellTargetRefund }}文</span>
            （原价一半）。
          </p>
          <div class="flex space-x-2">
            <Button class="flex-1" @click="sellTarget = null">取消</Button>
            <Button class="flex-1 !bg-danger !text-text" :icon="Coins" :icon-size="12" @click="confirmSellAnimal">确认出售</Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 升级畜舍弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="upgradeModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="upgradeModal = null"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="upgradeModal = null">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">升级畜舍</p>

          <!-- 当前等级信息 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">当前</span>
              <span class="text-xs">{{ upgradeModal.currentName }}（Lv.{{ upgradeModal.currentLevel }}）</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">容量</span>
              <span class="text-xs">{{ upgradeModal.currentCapacity }}只</span>
            </div>
          </div>

          <!-- 升级目标 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">升级为</span>
              <span class="text-xs text-accent">{{ upgradeModal.targetName }}（Lv.{{ upgradeModal.targetLevel }}）</span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-muted">容量</span>
              <span class="text-xs text-accent">{{ upgradeModal.targetCapacity }}只</span>
            </div>
          </div>

          <!-- 所需资源 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-3">
            <p class="text-xs text-muted mb-1">所需资源</p>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs">金钱</span>
              <span class="text-xs" :class="playerStore.money >= upgradeModal.cost ? 'text-success' : 'text-danger'">
                {{ playerStore.money }} / {{ upgradeModal.cost }}文
              </span>
            </div>
            <div v-for="mat in upgradeModal.materials" :key="mat.itemId" class="flex items-center justify-between mt-0.5">
              <span class="text-xs">{{ mat.name }}</span>
              <span class="text-xs" :class="mat.have >= mat.need ? 'text-success' : 'text-danger'">{{ mat.have }} / {{ mat.need }}</span>
            </div>
          </div>

          <Button
            class="w-full justify-center"
            :class="canConfirmUpgrade ? '!bg-accent !text-bg' : 'opacity-50'"
            :icon="ArrowUp"
            :icon-size="12"
            :disabled="!canConfirmUpgrade"
            @click="confirmUpgradeBuilding"
          >
            确认升级
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Hammer, ShoppingCart, Hand, Apple, Home, ArrowUp, Egg, X, Coins, Syringe, Pencil, Wheat, Sun, Heart } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import { useAnimalStore } from '@/stores/useAnimalStore'
  import { useGameStore } from '@/stores/useGameStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { ANIMAL_BUILDINGS, ANIMAL_DEFS, HAY_ITEM_ID, getItemById, getBuildingUpgrade, INCUBATION_MAP, FEED_DEFS } from '@/data'
  import { BUILDING_CAPACITY_PER_LEVEL, formatFeedUsage } from '@/data/animals'
  import { HORSE_BREEDS, getHorseBreed, type HorseBreed } from '@/data/horses'
  import { PET_ABILITIES, PET_PETTING_FRIENDSHIP, getPetFetchChance, getCatPestLimit, isPetAbilityUnlocked } from '@/data/pets'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import type { AnimalBuildingType, AnimalType, AnimalDef, PetAbilityDef, PetAbilityId, PetState } from '@/types'
  import { addLog } from '@/composables/useGameLog'
  import { getCombinedItemCount } from '@/composables/useCombinedInventory'
  import { handleEndDay } from '@/composables/useEndDay'
  import { useTutorialStore } from '@/stores/useTutorialStore'

  const animalStore = useAnimalStore()
  const inventoryStore = useInventoryStore()
  const playerStore = usePlayerStore()
  const gameStore = useGameStore()
  const tutorialStore = useTutorialStore()

  const tutorialHint = computed(() => {
    if (!tutorialStore.enabled || gameStore.year > 1) return null
    const coopBuilt = animalStore.buildings.find(b => b.type === 'coop')?.built ?? false
    const barnBuilt = animalStore.buildings.find(b => b.type === 'barn')?.built ?? false
    if (!coopBuilt && !barnBuilt) return '先去商铺的万物铺建造鸡舍或牧场，然后就可以购买和饲养动物了。'
    if (animalStore.animals.length > 0 && animalStore.animals.every(a => !a.wasPetted))
      return '每天抚摸动物可以增进友好度，「一键抚摸」可以批量操作。'
    return null
  })

  // === 购买弹窗 ===

  interface BuyAnimalModalData {
    name: string
    productName: string
    produceDays: number
    cost: number
    onBuy: () => void
    canBuy: () => boolean
  }

  const buyModal = ref<BuyAnimalModalData | null>(null)
  const buyListBuilding = ref<AnimalBuildingType | null>(null)

  const handleSelectAnimalToBuy = (aDef: AnimalDef) => {
    if (!buyListBuilding.value) return
    openBuyModal(aDef, buyListBuilding.value)
    buyListBuilding.value = null
  }

  const openBuyModal = (aDef: AnimalDef, buildingType: AnimalBuildingType) => {
    buyModal.value = {
      name: aDef.name,
      productName: aDef.productName,
      produceDays: aDef.produceDays,
      cost: aDef.cost,
      onBuy: () => handleBuyAnimal(aDef.type),
      canBuy: () => {
        if (buildingType === 'stable') return !animalStore.getHorse && playerStore.money >= aDef.cost
        return getAnimalsInBuilding(buildingType).length < getBuildingCapacity(buildingType) && playerStore.money >= aDef.cost
      }
    }
  }

  const handleBuyFromModal = () => {
    if (!buyModal.value) return
    buyModal.value.onBuy()
    buyModal.value = null
  }

  // === 出售确认弹窗 ===

  const sellTarget = ref<{ id: string; name: string; type: AnimalType } | null>(null)

  const sellTargetRefund = computed(() => {
    if (!sellTarget.value) return 0
    const def = ANIMAL_DEFS.find(d => d.type === sellTarget.value!.type)
    return Math.floor((def?.cost ?? 0) / 2)
  })

  const confirmSellAnimal = () => {
    if (!sellTarget.value) return
    const result = animalStore.sellAnimal(sellTarget.value.id)
    sellTarget.value = null
    if (result.success) {
      addLog(`卖掉了${result.name}，获得${result.refund}文。`)
    }
  }

  // === 数据计算 ===

  /** 只显示鸡舍和牲口棚（马厩单独渲染） */
  const mainBuildings = computed(() => ANIMAL_BUILDINGS.filter(b => b.type !== 'stable'))

  /** 马厩建筑定义 */
  const stableDef = computed(() => ANIMAL_BUILDINGS.find(b => b.type === 'stable'))

  /** 默认饲料（随存档保存，雇工、配偶代喂也用它） */
  const selectedFeed = computed({
    get: () => animalStore.preferredFeed,
    set: (feedId: string) => animalStore.setPreferredFeed(feedId)
  })

  /** 各类饲料库存数量（背包+仓库，喂食两边都会扣） */
  const feedCounts = computed(() =>
    FEED_DEFS.map(f => ({
      ...f,
      count: getCombinedItemCount(f.id)
    }))
  )

  /** 当前选中饲料的名称 */
  const selectedFeedName = computed(() => FEED_DEFS.find(f => f.id === selectedFeed.value)?.name ?? '干草')

  /** 当前选中饲料的库存 */
  const selectedFeedCount = computed(() => feedCounts.value.find(f => f.id === selectedFeed.value)?.count ?? 0)

  /** 默认饲料不足时补干草，两样都没有才喂不了 */
  const hasUsableFeed = computed(() => selectedFeedCount.value > 0 || getCombinedItemCount(HAY_ITEM_ID) > 0)

  /** 已获得的马匹品种 */
  const unlockedBreedDefs = computed(() => HORSE_BREEDS.filter(b => animalStore.unlockedHorseBreeds.includes(b.id)))

  /** 新买的马用的品种 */
  const bestBreedDef = computed(() => getHorseBreed(animalStore.bestUnlockedBreed))

  /** 新买的马减少的旅行时间（%） */
  const horseTravelReduction = computed(() => Math.round((1 - bestBreedDef.value.travelTimeMultiplier) * 100))

  /** 当前选中饲料的价格 */
  const selectedFeedPrice = computed(() => FEED_DEFS.find(f => f.id === selectedFeed.value)?.price ?? 50)

  /** 未喂食动物数量 */
  const unfedCount = computed(() => animalStore.animals.filter(a => !a.wasFed).length)

  /** 兽药库存数量 */
  const medicineCount = computed(() => inventoryStore.getItemCount('animal_medicine'))

  /** 生病动物数量 */
  const sickCount = computed(() => animalStore.animals.filter(a => a.sick).length)

  /** 可在鸡舍孵化的蛋列表 */
  const coopIncubatableEggs = computed(() => {
    const result: { itemId: string; name: string; count: number }[] = []
    for (const [itemId, mapping] of Object.entries(INCUBATION_MAP)) {
      if (mapping.building !== 'coop') continue
      const count = inventoryStore.getItemCount(itemId)
      if (count > 0) {
        const itemDef = getItemById(itemId)
        result.push({ itemId, name: itemDef?.name ?? itemId, count })
      }
    }
    return result
  })

  /** 可在牲口棚孵化的蛋列表 */
  const barnIncubatableEggs = computed(() => {
    const result: { itemId: string; name: string; count: number }[] = []
    for (const [itemId, mapping] of Object.entries(INCUBATION_MAP)) {
      if (mapping.building !== 'barn') continue
      const count = inventoryStore.getItemCount(itemId)
      if (count > 0) {
        const itemDef = getItemById(itemId)
        result.push({ itemId, name: itemDef?.name ?? itemId, count })
      }
    }
    return result
  })

  // === 工具函数 ===

  const getAnimalName = (type: AnimalType): string => {
    return ANIMAL_DEFS.find(d => d.type === type)?.name ?? type
  }

  const getItemName = (itemId: string): string => {
    return getItemById(itemId)?.name ?? itemId
  }

  const isBuildingBuilt = (type: AnimalBuildingType): boolean => {
    return animalStore.buildings.find(b => b.type === type)?.built ?? false
  }

  const getAnimalsInBuilding = (type: AnimalBuildingType) => {
    return animalStore.animals.filter(a => {
      const def = ANIMAL_DEFS.find(d => d.type === a.type)
      return def?.building === type
    })
  }

  const getAnimalDefsForBuilding = (type: AnimalBuildingType) => {
    return ANIMAL_DEFS.filter(d => d.building === type)
  }

  const getBuildingLevel = (type: AnimalBuildingType): number => {
    return animalStore.buildings.find(b => b.type === type)?.level ?? 0
  }

  const getBuildingDisplayName = (type: AnimalBuildingType): string => {
    const level = getBuildingLevel(type)
    if (level >= 2) {
      const upgrade = getBuildingUpgrade(type, level)
      if (upgrade) return upgrade.name
    }
    return ANIMAL_BUILDINGS.find(b => b.type === type)?.name ?? type
  }

  const getBuildingCapacity = (type: AnimalBuildingType): number => {
    const level = getBuildingLevel(type)
    if (type === 'stable') return 1
    return level * BUILDING_CAPACITY_PER_LEVEL
  }

  const getMoodText = (mood: number): string => {
    if (mood > 200) return '开心'
    if (mood > 100) return '一般'
    return '低落'
  }

  const getMoodBarColor = (mood: number): string => {
    if (mood > 200) return 'bg-success'
    if (mood > 100) return 'bg-accent'
    return 'bg-danger'
  }

  // === 放牧 ===

  const canGraze = computed(() => {
    if (animalStore.grazedToday) return false
    if (gameStore.isRainy) return false
    if (gameStore.season === 'winter') {
      return animalStore.animals.some(a => a.wasFed && a.type === 'yak')
    }
    const hasGrazeableAnimals = animalStore.animals.some(a => a.wasFed && a.type !== 'horse')
    return hasGrazeableAnimals
  })

  const grazeDisabledReason = computed(() => {
    if (animalStore.animals.filter(a => a.type !== 'horse').length === 0) return '没有牲畜'
    if (animalStore.grazedToday) return '今天已放牧'
    if (gameStore.isRainy) return '雨天不能放牧'
    if (gameStore.season === 'winter') {
      const hasYak = animalStore.animals.some(a => a.wasFed && a.type === 'yak')
      return hasYak ? '' : '冬天只有牦牛可放牧'
    }
    if (!animalStore.animals.some(a => a.wasFed && a.type !== 'horse')) return '先喂食再放牧'
    return ''
  })

  /**
   * 放牧按钮是否可点。
   * 一早进牧场时牲畜都还没喂，按严格规则会直接变灰；这里允许「未喂食但有饲料」也能点，
   * 由 handleGraze 先自动喂一遍再放牧，省掉来回两次操作。
   */
  const canGrazeOrFeed = computed(() => {
    if (canGraze.value) return true
    if (animalStore.grazedToday || gameStore.isRainy) return false
    if (unfedCount.value === 0) return false
    // 冬天只有牦牛能放牧，没牦牛就别自动喂了
    if (gameStore.season === 'winter' && !animalStore.animals.some(a => a.type === 'yak')) return false
    return hasUsableFeed.value
  })

  const grazeButtonLabel = computed(() => {
    if (canGraze.value) return '放牧全部'
    if (canGrazeOrFeed.value) return '喂食并放牧'
    return grazeDisabledReason.value || '放牧全部'
  })

  // === 升级弹窗 ===

  interface UpgradeModalData {
    buildingType: AnimalBuildingType
    currentName: string
    currentLevel: number
    currentCapacity: number
    targetName: string
    targetLevel: number
    targetCapacity: number
    cost: number
    materials: { itemId: string; name: string; need: number; have: number }[]
  }

  const upgradeModal = ref<UpgradeModalData | null>(null)

  const openUpgradeModal = (type: AnimalBuildingType) => {
    const level = getBuildingLevel(type)
    const upgrade = getBuildingUpgrade(type, level + 1)
    if (!upgrade) return
    upgradeModal.value = {
      buildingType: type,
      currentName: getBuildingDisplayName(type),
      currentLevel: level,
      currentCapacity: level * BUILDING_CAPACITY_PER_LEVEL,
      targetName: upgrade.name,
      targetLevel: upgrade.level,
      targetCapacity: upgrade.capacity,
      cost: upgrade.cost,
      materials: upgrade.materialCost.map(m => ({
        itemId: m.itemId,
        name: getItemName(m.itemId),
        need: m.quantity,
        have: inventoryStore.getItemCount(m.itemId)
      }))
    }
  }

  const canConfirmUpgrade = computed(() => {
    if (!upgradeModal.value) return false
    if (playerStore.money < upgradeModal.value.cost) return false
    return upgradeModal.value.materials.every(m => inventoryStore.getItemCount(m.itemId) >= m.need)
  })

  const confirmUpgradeBuilding = () => {
    if (!upgradeModal.value) return
    const type = upgradeModal.value.buildingType
    const targetName = upgradeModal.value.targetName
    const targetCapacity = upgradeModal.value.targetCapacity
    upgradeModal.value = null
    const success = animalStore.upgradeBuilding(type)
    if (success) {
      addLog(`成功升级为${targetName}！容量增至${targetCapacity}。`)
      const tr = gameStore.advanceTime(2)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('升级失败，请检查铜钱和材料是否充足。')
    }
  }

  // === 操作处理 ===

  const handleBuildBuilding = (type: AnimalBuildingType) => {
    const success = animalStore.buildBuilding(type)
    const bDef = ANIMAL_BUILDINGS.find(b => b.type === type)
    if (success) {
      addLog(`成功建造了${bDef?.name ?? '畜舍'}！`)
      const tr = gameStore.advanceTime(2)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog(`建造${bDef?.name ?? '畜舍'}失败，请检查铜钱和材料是否充足。`)
    }
  }

  const handleBuyAnimal = (type: AnimalType) => {
    const aDef = ANIMAL_DEFS.find(d => d.type === type)
    if (!aDef) return
    const count = animalStore.animals.filter(a => a.type === type).length
    const defaultName = `${aDef.name}${count + 1}`
    const success = animalStore.buyAnimal(type, defaultName)
    if (success) {
      addLog(`买了一只${aDef.name}，取名「${defaultName}」。`)
    } else {
      addLog(`购买${aDef.name}失败，请检查铜钱和畜舍容量。`)
    }
  }

  const handlePetAnimal = (id: string) => {
    const success = animalStore.petAnimal(id)
    if (success) {
      const animal = animalStore.animals.find(a => a.id === id)
      addLog(`抚摸了${animal?.name ?? '动物'}，友好度提升了。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.petAnimal)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('今天已经抚摸过了。')
    }
  }

  const handlePetThePet = () => {
    const result = animalStore.petThePet()
    if (result.success) {
      const staminaText = result.staminaGained > 0 ? `，体力+${result.staminaGained}` : ''
      addLog(`抚摸了${animalStore.pet?.name ?? '宠物'}，好感度+${PET_PETTING_FRIENDSHIP}${staminaText}。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.petAnimal)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('今天已经抚摸过了。')
    }
  }

  // === 宠物能力 ===

  interface PetAbilityTag {
    id: PetAbilityId
    label: string
    unlocked: boolean
    unlockFriendship: number
  }

  /** 已解锁能力的标签：叼物带当前概率，捕虫带每日处数 */
  const getPetAbilityLabel = (ability: PetAbilityDef, current: PetState): string => {
    if (ability.id === 'fetch') return `${ability.name} ${Math.round(getPetFetchChance(current.friendship) * 100)}%`
    if (ability.id === 'pest') return `${ability.name} ${getCatPestLimit(current.friendship)}处`
    return ability.name
  }

  /** 宠物卡能力标签：已解锁高亮，未解锁带好感门槛 */
  const petAbilityTags = computed<PetAbilityTag[]>(() => {
    const current = animalStore.pet
    if (!current) return []
    return PET_ABILITIES.filter(a => a.petTypes.includes(current.type)).map(a => {
      const unlocked = isPetAbilityUnlocked(current.type, a.id, current.friendship)
      return {
        id: a.id,
        label: unlocked ? getPetAbilityLabel(a, current) : a.name,
        unlocked,
        unlockFriendship: a.unlockFriendship
      }
    })
  })

  const unpettedCount = computed(() => {
    let count = animalStore.animals.filter(a => !a.wasPetted).length
    if (animalStore.pet && !animalStore.pet.wasPetted) count++
    return count
  })

  const handlePetAll = () => {
    const STAMINA_COST = 2
    if (!playerStore.consumeStamina(STAMINA_COST)) {
      addLog('体力不足，无法一键抚摸。')
      return
    }
    const { count, staminaGained } = animalStore.petAllAnimals()
    if (count > 0) {
      const staminaText = staminaGained > 0 ? `体力+${staminaGained}。` : ''
      addLog(`一口气抚摸了${count}只动物，大家都很开心！${staminaText}`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.batchPet)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('今天已经全部抚摸过了。')
    }
  }

  const handleStartIncubation = (itemId: string) => {
    const result = animalStore.startIncubation(itemId)
    addLog(result.message)
  }

  const handleStartBarnIncubation = (itemId: string) => {
    const result = animalStore.startBarnIncubation(itemId)
    addLog(result.message)
  }

  const handleFeedAnimal = (animalId: string, animalName: string) => {
    const success = animalStore.feedAnimal(animalId, selectedFeed.value)
    if (success) {
      addLog(`用${selectedFeedName.value}喂食了${animalName}。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.petAnimal)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog(`${selectedFeedName.value}不足，无法喂食。`)
    }
  }

  const handleFeedAll = () => {
    const result = animalStore.feedAll()
    if (result.fedCount > 0) {
      addLog(`喂食了${result.fedCount}只动物（${formatFeedUsage(result.used)}）。`)
    }
    if (result.noFeedCount > 0) {
      addLog(`饲料不足，${result.noFeedCount}只动物未喂。`)
    }
    if (result.fedCount === 0 && result.noFeedCount === 0) {
      addLog('所有动物今天都已喂过了。')
    }
    if (result.fedCount > 0) {
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.feedAnimals)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    }
  }

  const handleBuyFeed = () => {
    const feed = FEED_DEFS.find(f => f.id === selectedFeed.value)
    if (!feed) return
    // 检查背包主区是否有空间（已有同类栈或有空位），防止溢出到临时背包导致无法使用
    const hasStack = inventoryStore.items.some(s => s.itemId === feed.id && s.quality === 'normal' && s.quantity < 999)
    if (!hasStack && inventoryStore.isFull) {
      addLog('背包已满，无法购买。')
      return
    }
    if (!playerStore.spendMoney(feed.price)) {
      addLog(`铜钱不足，无法购买${feed.name}。`)
      return
    }
    if (!inventoryStore.addItem(feed.id)) {
      // addItem 异常失败，退款
      playerStore.earnMoney(feed.price)
      addLog('购买失败，已退款。')
      return
    }
    addLog(`购买了1份${feed.name}，花费${feed.price}文。`)
  }

  const handleGraze = () => {
    // 还没喂就先喂一遍：一早进牧场时这两步本来就是连着做的
    if (!canGraze.value && unfedCount.value > 0) {
      handleFeedAll()
      if (!canGraze.value) return
    }
    const result = animalStore.grazeAnimals()
    addLog(result.message)
    if (result.success) {
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.graze)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    }
  }

  const handleSwitchBreed = (breed: HorseBreed) => {
    const result = animalStore.switchHorseBreed(breed)
    if (result.success) addLog(result.message)
  }

  const handleHealAnimal = (animalId: string, animalName: string) => {
    const success = animalStore.healAnimal(animalId)
    if (success) addLog(`用兽药治好了${animalName}。`)
    else addLog('治疗失败，请检查是否有兽药。')
  }

  const handleHealAll = () => {
    const result = animalStore.healAllSick()
    if (result.healedCount > 0) addLog(`用兽药治疗了${result.healedCount}只动物。`)
    if (result.noMedicineCount > 0) addLog(`兽药不足，${result.noMedicineCount}只动物未能治疗。`)
  }

  // === 改名 ===

  const renamingId = ref<string | null>(null)
  const renameInput = ref('')

  const startRename = (id: string, currentName: string) => {
    renamingId.value = id
    renameInput.value = currentName
  }

  const confirmRename = () => {
    if (!renamingId.value) return
    const success = animalStore.renameAnimal(renamingId.value, renameInput.value)
    if (success) {
      addLog(`改名为「${renameInput.value.trim()}」。`)
    } else {
      addLog('改名失败，名称需要1-8个字。')
    }
    renamingId.value = null
  }

  const cancelRename = () => {
    renamingId.value = null
  }
</script>
