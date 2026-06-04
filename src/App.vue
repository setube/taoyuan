<template>
  <RouterView />
  <!-- APK 退出确认弹窗 -->
  <Transition name="panel-fade">
    <div
      v-if="showExitConfirm"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
      @click.self="showExitConfirm = false"
    >
      <div class="game-panel max-w-xs w-full text-center">
        <p class="text-sm text-accent mb-3">确定要退出游戏吗？</p>
        <p class="text-xs text-muted mb-4">未保存的进度将会丢失。</p>
        <div class="flex justify-center space-x-3">
          <button class="btn" @click="showExitConfirm = false">取消</button>
          <button class="btn btn-danger" @click="exitApp">退出</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { RouterView } from 'vue-router'
  import { ref, onMounted } from 'vue'
  import { Capacitor } from '@capacitor/core'
  import { App as CapApp } from '@capacitor/app'

  const showExitConfirm = ref(false)

  const exitApp = () => {
    CapApp.exitApp()
  }

  onMounted(() => {
    if (!import.meta.env.DEV) {
      document.body.classList.add('no-select')
    }

    // Capacitor Android 返回键拦截
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', () => {
        if (showExitConfirm.value) {
          showExitConfirm.value = false
        } else {
          showExitConfirm.value = true
        }
      })
    }
  })
</script>
