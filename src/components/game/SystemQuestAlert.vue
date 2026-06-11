<template>

  <!-- 任务完成/失败 -->

  <Transition name="panel-fade">

    <div

      v-if="store.questOutcomeAlert"

      class="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"

      @click.self="store.dismissQuestOutcomeAlert()"

    >

      <div class="game-panel max-w-sm w-full">

        <Divider
          :label="store.questOutcomeAlert.type === 'completed' ? '任务完成' : '任务失败'"
          title
        />

        <p class="text-sm text-accent font-bold mb-1">{{ store.questOutcomeAlert.title }}</p>

        <p class="text-xs text-gray-300 leading-relaxed mb-2">{{ store.questOutcomeAlert.description }}</p>

        <p class="text-[10px] text-muted mb-1">

          结算日：第 {{ store.questOutcomeAlert.endedDay }} 日

        </p>

        <p

          class="text-xs mb-3"

          :class="store.questOutcomeAlert.type === 'completed' ? 'text-success' : 'text-danger'"

        >

          <template v-if="store.questOutcomeAlert.type === 'completed'">

            获得 {{ store.questOutcomeAlert.reward }} 功勋

          </template>

          <template v-else>

            扣除 {{ store.questOutcomeAlert.fine }} 功勋罚金

          </template>

          · 功勋 {{ store.questOutcomeAlert.meritBefore }} → {{ store.questOutcomeAlert.meritAfter }}

        </p>

        <div class="flex gap-2 justify-end">

          <Button class="!text-xs" @click="store.dismissQuestOutcomeAlert()">知道了</Button>

          <Button class="!text-xs !bg-accent !text-bg" @click="store.viewQuestOutcomeInPanel()">查看任务</Button>

        </div>

      </div>

    </div>

  </Transition>



  <!-- 新派发任务 -->

  <Transition name="panel-fade">

    <div

      v-if="store.newQuestAlert && !store.questOutcomeAlert"

      class="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"

      @click.self="store.dismissNewQuestAlert()"

    >

      <div class="game-panel max-w-sm w-full">

        <Divider title label="系统新任务" />

        <p class="text-sm text-accent font-bold mb-1">{{ store.newQuestAlert.title }}</p>

        <p class="text-xs text-gray-300 leading-relaxed mb-3">{{ store.newQuestAlert.description }}</p>

        <p class="text-[10px] text-muted mb-4">

          功勋 {{ store.newQuestAlert.reward }} 点 · 期限第 {{ store.newQuestAlert.deadline }} 日 · 接受前可议价

        </p>

        <div class="flex gap-2 justify-end">

          <Button class="!text-xs" @click="store.dismissNewQuestAlert()">知道了</Button>

          <Button class="!text-xs !bg-accent !text-bg" @click="store.viewNewQuestAlert()">查看任务</Button>

        </div>

      </div>

    </div>

  </Transition>

</template>



<script setup lang="ts">

import { useSystemStore } from '@/stores/useSystemStore'

import Divider from '@/components/game/Divider.vue'

import Button from '@/components/game/Button.vue'



const store = useSystemStore()

</script>

