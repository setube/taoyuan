<template>
  <Transition name="panel-fade">
    <div v-if="open" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div class="game-panel w-full max-w-xs text-center relative">
        <button class="absolute top-2 right-2 text-muted hover:text-text" @click="$emit('close')">
          <X :size="14" />
        </button>
        <Divider title class="my-4" label="设置" />
        <!-- 分类导航 -->
        <div class="grid grid-cols-3 justify-center gap-1 mb-3">
          <button
            v-for="tab in SETTINGS_TABS"
            :key="tab.key"
            class="text-xs py-1 px-3 border rounded-xs transition-colors"
            :class="activeTab === tab.key ? 'border-accent bg-accent/20 text-accent' : 'border-accent/20 text-muted hover:text-text'"
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" :size="12" class="inline-block align-[-2px] mr-1" />
            {{ tab.label }}
          </button>
        </div>

        <div class="flex flex-col space-y-3">
          <!-- ===== 通用 ===== -->
          <template v-if="activeTab === 'general'">
            <div class="max-h-[40vh] overflow-y-auto">
              <!-- 时间控制 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1 mb-2">
                <p class="text-xs text-muted mb-2">时间控制</p>
                <div class="flex items-center justify-center space-x-2">
                  <Button :icon="isPaused ? Play : Pause" :icon-size="12" class="py-1 px-3" @click="togglePause">
                    {{ isPaused ? '继续' : '暂停' }}
                  </Button>
                  <Button class="py-1 px-3" @click="cycleSpeed">速度 {{ gameSpeed }}×</Button>
                </div>
              </div>

              <!-- 音频控制 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1 mb-2">
                <p class="text-xs text-muted mb-2">音频</p>
                <div class="flex items-center justify-center space-x-2">
                  <Button :icon="sfxEnabled ? Volume2 : VolumeX" :icon-size="12" class="py-1 px-3" @click="toggleSfx">音效</Button>
                  <Button :icon="bgmEnabled ? Headphones : HeadphoneOff" :icon-size="12" class="py-1 px-3" @click="toggleBgm">音乐</Button>
                </div>
              </div>

              <!-- 新手提示 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1 mb-2">
                <p class="text-xs text-muted mb-2">新手提示</p>
                <p class="text-[10px] text-muted/50 mb-2">柳村长的晨间建议和面板引导文字</p>
                <div class="flex items-center justify-center space-x-2">
                  <Button class="py-1 px-3" :class="{ '!bg-accent !text-bg': tutorialStore.enabled }" @click="tutorialStore.enabled = true">
                    开
                  </Button>
                  <Button
                    class="py-1 px-3"
                    :class="{ '!bg-accent !text-bg': !tutorialStore.enabled }"
                    @click="tutorialStore.enabled = false"
                  >
                    关
                  </Button>
                </div>
              </div>

              <!-- WebDAV 云同步 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs text-muted">WebDAV 云同步</p>
                  <div class="flex space-x-1">
                    <Button
                      class="py-0.5 px-2 text-[10px]"
                      :class="{ '!bg-accent !text-bg': webdavConfig.enabled }"
                      @click="setWebdavEnabled(true)"
                    >
                      开
                    </Button>
                    <Button
                      class="py-0.5 px-2 text-[10px]"
                      :class="{ '!bg-accent !text-bg': !webdavConfig.enabled }"
                      @click="setWebdavEnabled(false)"
                    >
                      关
                    </Button>
                  </div>
                </div>
                <template v-if="webdavConfig.enabled">
                  <div class="flex flex-col space-y-2">
                    <div>
                      <label class="text-[10px] text-muted mb-0.5 block">服务器地址</label>
                      <input
                        v-model="webdavConfig.serverUrl"
                        placeholder="请输入WebDAV云同步服务器地址"
                        class="w-full px-2 py-1.5 bg-bg border border-accent/30 rounded-xs text-xs text-text focus:border-accent outline-none placeholder:text-muted/40 transition-colors"
                        @change="saveWebdavConfig"
                      />
                    </div>
                    <div>
                      <label class="text-[10px] text-muted mb-0.5 block">存储路径</label>
                      <input
                        v-model="webdavConfig.path"
                        placeholder="如果没有路径需求的话可以为空"
                        class="w-full px-2 py-1.5 bg-bg border border-accent/30 rounded-xs text-xs text-text focus:border-accent outline-none placeholder:text-muted/40 transition-colors"
                        @change="saveWebdavConfig"
                      />
                      <p class="text-[10px] text-muted/50 mt-0.5">填写网盘中已有的文件夹名，留空则存到根目录</p>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-muted mb-0.5 block">用户名</label>
                        <input
                          v-model="webdavConfig.username"
                          placeholder="请输入用户名"
                          class="w-full px-2 py-1.5 bg-bg border border-accent/30 rounded-xs text-xs text-text focus:border-accent outline-none placeholder:text-muted/40 transition-colors"
                          @change="saveWebdavConfig"
                        />
                      </div>
                      <div>
                        <label class="text-[10px] text-muted mb-0.5 block">密码</label>
                        <input
                          v-model="webdavConfig.password"
                          type="password"
                          placeholder="请输入密码"
                          class="w-full px-2 py-1.5 bg-bg border border-accent/30 rounded-xs text-xs text-text focus:border-accent outline-none placeholder:text-muted/40 transition-colors"
                          @change="saveWebdavConfig"
                        />
                      </div>
                    </div>
                    <Button
                      class="py-1 px-3 text-xs w-full justify-center"
                      :disabled="webdavTestStatus === 'testing' || !webdavConfig.serverUrl"
                      @click="handleTestWebdav"
                    >
                      {{ webdavTestStatus === 'testing' ? '测试中...' : '测试连接' }}
                    </Button>
                    <p v-if="webdavTestStatus === 'success'" class="text-success text-xs text-center mt-1 break-words">连接成功</p>
                    <p v-if="webdavTestStatus === 'failed'" class="text-danger text-xs text-center mt-1 break-words">
                      {{ webdavTestError || '连接失败' }}
                    </p>
                    <div v-if="webdavTraceLogs.length" class="border border-accent/20 rounded-xs p-2 bg-bg/40">
                      <div class="flex items-center justify-between mb-1">
                        <p class="text-[10px] text-muted">请求流程日志</p>
                        <button class="text-[10px] text-muted hover:text-text" @click="clearWebdavTrace">清空</button>
                      </div>
                      <div class="max-h-28 overflow-y-auto text-left">
                        <p v-for="(line, idx) in webdavTraceLogs" :key="idx" class="text-[10px] text-muted/80 leading-4 break-all">
                          {{ line }}
                        </p>
                      </div>
                      <button class="webdav-log-copy text-[10px] text-muted hover:text-text">复制日志</button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>

          <!-- ===== 外观 ===== -->
          <template v-if="activeTab === 'display'">
            <!-- 字体大小 -->
            <div class="border border-accent/20 rounded-xs p-3">
              <p class="text-xs text-muted mb-2">字体大小</p>
              <div class="flex items-center justify-center space-x-3">
                <Button
                  class="py-1 px-3"
                  :icon="Minus"
                  :icon-size="12"
                  :disabled="settingsStore.fontSize <= 12"
                  @click="settingsStore.changeFontSize(-1)"
                />
                <span class="text-sm w-8 text-center">{{ settingsStore.fontSize }}</span>
                <Button
                  class="py-1 px-3"
                  :icon="Plus"
                  :icon-size="12"
                  :disabled="settingsStore.fontSize >= 24"
                  @click="settingsStore.changeFontSize(1)"
                />
              </div>
            </div>

            <!-- 配色主题 -->
            <div class="border border-accent/20 rounded-xs p-3">
              <p class="text-xs text-muted mb-2">配色主题</p>
              <div class="flex items-center justify-center space-x-2">
                <button
                  v-for="t in THEMES"
                  :key="t.key"
                  class="w-8 h-8 border rounded-xs flex items-center justify-center text-[10px] transition-colors"
                  :class="settingsStore.theme === t.key ? 'border-accent' : 'border-accent/20'"
                  :style="{ backgroundColor: t.bg, color: t.text }"
                  :title="t.name"
                  @click="settingsStore.changeTheme(t.key)"
                >
                  {{ t.name.charAt(0) }}
                </button>
              </div>
            </div>
          </template>

          <!-- ===== 通知 ===== -->
          <template v-if="activeTab === 'notification'">
            <div class="max-h-[40vh] overflow-y-auto flex flex-col space-y-3">
              <!-- 通知位置 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1">
                <p class="text-xs text-muted mb-2">弹出位置</p>
                <div class="grid grid-cols-3 gap-1 w-24 mx-auto">
                  <button
                    v-for="pos in QMSG_POSITIONS"
                    :key="pos.value"
                    class="w-8 h-6 border rounded-xs transition-colors flex items-center justify-center"
                    :class="
                      settingsStore.qmsgPosition === pos.value ? 'border-accent bg-accent/20 text-accent' : 'border-accent/20 text-muted'
                    "
                    :title="pos.label"
                    @click="settingsStore.changeQmsgPosition(pos.value)"
                  >
                    <component :is="pos.icon" :size="10" />
                  </button>
                </div>
              </div>

              <!-- 持续时间 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1">
                <p class="text-xs text-muted mb-2">持续时间</p>
                <div class="flex items-center justify-center space-x-2">
                  <Button
                    class="py-0 px-1.5"
                    :icon="Minus"
                    :icon-size="10"
                    :disabled="settingsStore.qmsgTimeout <= 500"
                    @click="changeTimeout(-500)"
                  />
                  <span class="text-xs w-12 text-center">{{ (settingsStore.qmsgTimeout / 1000).toFixed(1) }}s</span>
                  <Button
                    class="py-0 px-1.5"
                    :icon="Plus"
                    :icon-size="10"
                    :disabled="settingsStore.qmsgTimeout >= 10000"
                    @click="changeTimeout(500)"
                  />
                </div>
              </div>

              <!-- 最大数量 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1">
                <p class="text-xs text-muted mb-2">最大数量</p>
                <div class="flex items-center justify-center space-x-2">
                  <Button
                    class="py-0 px-1.5"
                    :icon="Minus"
                    :icon-size="10"
                    :disabled="settingsStore.qmsgMaxNums <= 1"
                    @click="changeMaxNums(-1)"
                  />
                  <span class="text-xs w-6 text-center">{{ settingsStore.qmsgMaxNums }}</span>
                  <Button
                    class="py-0 px-1.5"
                    :icon="Plus"
                    :icon-size="10"
                    :disabled="settingsStore.qmsgMaxNums >= 20"
                    @click="changeMaxNums(1)"
                  />
                </div>
              </div>

              <!-- 宽度限制 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1">
                <p class="text-xs text-muted mb-2">限制宽度</p>
                <div class="flex items-center justify-center space-x-1 mb-2">
                  <Button
                    class="py-0 px-2"
                    :class="settingsStore.qmsgIsLimitWidth ? '!bg-accent/20 !text-accent !border-accent' : ''"
                    @click="setBool('qmsgIsLimitWidth', true)"
                  >
                    开
                  </Button>
                  <Button
                    class="py-0 px-2"
                    :class="!settingsStore.qmsgIsLimitWidth ? '!bg-accent/20 !text-accent !border-accent' : ''"
                    @click="setBool('qmsgIsLimitWidth', false)"
                  >
                    关
                  </Button>
                </div>
                <template v-if="settingsStore.qmsgIsLimitWidth">
                  <p class="text-xs text-muted mb-2">宽度(px)</p>
                  <div class="flex items-center justify-center space-x-2 mb-2">
                    <Button
                      class="py-0 px-1.5"
                      :icon="Minus"
                      :icon-size="10"
                      :disabled="settingsStore.qmsgLimitWidthNum <= 100"
                      @click="changeLimitWidth(-50)"
                    />
                    <span class="text-xs w-10 text-center">{{ settingsStore.qmsgLimitWidthNum }}</span>
                    <Button
                      class="py-0 px-1.5"
                      :icon="Plus"
                      :icon-size="10"
                      :disabled="settingsStore.qmsgLimitWidthNum >= 800"
                      @click="changeLimitWidth(50)"
                    />
                  </div>
                  <p class="text-xs text-muted mb-2">超出处理</p>
                  <div class="flex items-center justify-center space-x-1">
                    <Button
                      v-for="opt in WRAP_OPTIONS"
                      :key="opt.value"
                      class="!text-[10px] py-0 px-1.5"
                      :class="settingsStore.qmsgLimitWidthWrap === opt.value ? '!bg-accent/20 !text-accent !border-accent' : ''"
                      @click="changeWrap(opt.value)"
                    >
                      {{ opt.label }}
                    </Button>
                  </div>
                </template>
              </div>

              <!-- 系统碎碎念气泡 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1">
                <p class="text-xs text-muted mb-2">系统碎碎念气泡</p>
                <div class="flex flex-col items-center space-y-2">
                  <div class="flex flex-col items-center space-y-1">
                    <span class="text-xs text-muted">显示气泡</span>
                    <div class="flex items-center space-x-1">
                      <Button
                        class="py-0 px-2"
                        :class="settingsStore.systemBubbleEnabled ? '!bg-accent/20 !text-accent !border-accent' : ''"
                        @click="settingsStore.changeSystemBubbleEnabled(true)"
                      >
                        开
                      </Button>
                      <Button
                        class="py-0 px-2"
                        :class="!settingsStore.systemBubbleEnabled ? '!bg-accent/20 !text-accent !border-accent' : ''"
                        @click="settingsStore.changeSystemBubbleEnabled(false)"
                      >
                        关
                      </Button>
                    </div>
                  </div>
                  <template v-if="settingsStore.systemBubbleEnabled">
                    <div class="flex flex-col items-center space-y-1">
                      <span class="text-xs text-muted">自动关闭</span>
                      <div class="flex items-center space-x-1">
                        <Button
                          class="py-0 px-2"
                          :class="settingsStore.systemBubbleAutoClose ? '!bg-accent/20 !text-accent !border-accent' : ''"
                          @click="settingsStore.changeSystemBubbleAutoClose(true)"
                        >
                          开
                        </Button>
                        <Button
                          class="py-0 px-2"
                          :class="!settingsStore.systemBubbleAutoClose ? '!bg-accent/20 !text-accent !border-accent' : ''"
                          @click="settingsStore.changeSystemBubbleAutoClose(false)"
                        >
                          关
                        </Button>
                      </div>
                    </div>
                    <div v-if="settingsStore.systemBubbleAutoClose" class="flex flex-col items-center space-y-1">
                      <span class="text-xs text-muted">自动关闭时间</span>
                      <div class="flex items-center justify-center space-x-2">
                        <Button
                          class="py-0 px-1.5"
                          :icon="Minus"
                          :icon-size="10"
                          :disabled="settingsStore.systemBubbleAutoCloseMs <= 500"
                          @click="settingsStore.changeSystemBubbleAutoCloseMs(-500)"
                        />
                        <span class="text-xs w-12 text-center">{{ (settingsStore.systemBubbleAutoCloseMs / 1000).toFixed(1) }}s</span>
                        <Button
                          class="py-0 px-1.5"
                          :icon="Plus"
                          :icon-size="10"
                          :disabled="settingsStore.systemBubbleAutoCloseMs >= 10000"
                          @click="settingsStore.changeSystemBubbleAutoCloseMs(500)"
                        />
                      </div>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 开关选项 -->
              <div class="border border-accent/20 rounded-xs p-3 mr-1 flex flex-col space-y-2">
                <div v-for="opt in TOGGLE_OPTIONS" :key="opt.key" class="flex flex-col items-center space-y-1">
                  <span class="text-xs text-muted">{{ opt.label }}</span>
                  <div class="flex items-center space-x-1">
                    <Button
                      class="py-0 px-2"
                      :class="settingsStore[opt.key] ? '!bg-accent/20 !text-accent !border-accent' : ''"
                      @click="setBool(opt.key, true)"
                    >
                      开
                    </Button>
                    <Button
                      class="py-0 px-2"
                      :class="!settingsStore[opt.key] ? '!bg-accent/20 !text-accent !border-accent' : ''"
                      @click="setBool(opt.key, false)"
                    >
                      关
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 存档管理（全局底部） -->
        <Button :icon="FolderOpen" :icon-size="12" class="py-1 px-3 w-full justify-center mt-3" @click="showSaveManager = true">
          存档管理
        </Button>
      </div>
    </div>
  </Transition>

  <!-- 存档管理弹窗 -->
  <Transition name="panel-fade">
    <SaveManager v-if="showSaveManager" @close="showSaveManager = false" />
  </Transition>
</template>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, type Component } from 'vue'
  import {
    X,
    Pause,
    Play,
    Volume2,
    VolumeX,
    Headphones,
    HeadphoneOff,
    FolderOpen,
    Minus,
    Plus,
    ArrowUpLeft,
    ArrowUp,
    ArrowUpRight,
    ArrowLeft,
    Circle,
    ArrowRight,
    ArrowDownLeft,
    ArrowDown,
    ArrowDownRight,
    Settings,
    Palette,
    Bell
  } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import Divider from '@/components/game/Divider.vue'
  import { useAudio } from '@/composables/useAudio'
  import { useGameClock } from '@/composables/useGameClock'
  import { useGameLog } from '@/composables/useGameLog'
  import { useSettingsStore, type QmsgPosition, type QmsgLimitWidthWrap } from '@/stores/useSettingsStore'
  import { useTutorialStore } from '@/stores/useTutorialStore'
  import { useWebdav } from '@/composables/useWebdav'
  import { THEMES } from '@/data/themes'
  import SaveManager from '@/components/game/SaveManager.vue'
  import ClipboardJS from 'clipboard'

  type SettingsTab = 'general' | 'display' | 'notification'

  type BoolSettingKey = 'qmsgIsLimitWidth' | 'qmsgAnimation' | 'qmsgAutoClose' | 'qmsgShowClose' | 'qmsgShowIcon' | 'qmsgShowReverse'

  const SETTINGS_TABS: { key: SettingsTab; label: string; icon: Component }[] = [
    { key: 'general', label: '通用', icon: Settings },
    { key: 'display', label: '外观', icon: Palette },
    { key: 'notification', label: '通知', icon: Bell }
  ]

  const QMSG_POSITIONS: { value: QmsgPosition; label: string; icon: Component }[] = [
    { value: 'topleft', label: '左上', icon: ArrowUpLeft },
    { value: 'top', label: '上', icon: ArrowUp },
    { value: 'topright', label: '右上', icon: ArrowUpRight },
    { value: 'left', label: '左', icon: ArrowLeft },
    { value: 'center', label: '中', icon: Circle },
    { value: 'right', label: '右', icon: ArrowRight },
    { value: 'bottomleft', label: '左下', icon: ArrowDownLeft },
    { value: 'bottom', label: '下', icon: ArrowDown },
    { value: 'bottomright', label: '右下', icon: ArrowDownRight }
  ]

  const WRAP_OPTIONS: { value: QmsgLimitWidthWrap; label: string }[] = [
    { value: 'no-wrap', label: '不处理' },
    { value: 'wrap', label: '换行' },
    { value: 'ellipsis', label: '省略号' }
  ]

  const TOGGLE_OPTIONS: { key: BoolSettingKey; label: string }[] = [
    { key: 'qmsgAnimation', label: '弹出动画' },
    { key: 'qmsgAutoClose', label: '自动关闭' },
    { key: 'qmsgShowClose', label: '显示关闭图标' },
    { key: 'qmsgShowIcon', label: '显示左侧图标' },
    { key: 'qmsgShowReverse', label: '弹出方向逆反' }
  ]

  defineProps<{ open: boolean }>()
  defineEmits<{ close: [] }>()

  const activeTab = ref<SettingsTab>('general')
  const { sfxEnabled, bgmEnabled, toggleSfx, toggleBgm } = useAudio()
  const { isPaused, gameSpeed, togglePause, cycleSpeed } = useGameClock()
  const { showFloat } = useGameLog()
  const settingsStore = useSettingsStore()
  const tutorialStore = useTutorialStore()
  const {
    webdavConfig,
    webdavTestStatus,
    webdavTestError,
    webdavTraceLogs,
    saveConfig: saveWebdavConfig,
    clearTrace: clearWebdavTrace,
    testConnection
  } = useWebdav()

  const showSaveManager = ref(false)
  let clipboard: ClipboardJS | null = null

  onMounted(() => {
    clipboard = new ClipboardJS('.webdav-log-copy', {
      text: () => webdavTraceLogs.value.join('\n')
    })
    clipboard.on('success', e => {
      e.clearSelection()
      showFloat('日志已复制', 'success')
    })
    clipboard.on('error', () => {
      document.body.classList.remove('select-none')
      showFloat('复制失败，请手动复制', 'danger')
    })
  })

  onBeforeUnmount(() => {
    clipboard?.destroy()
    clipboard = null
  })

  const handleTestWebdav = async () => {
    await testConnection()
  }

  const setWebdavEnabled = (val: boolean) => {
    webdavConfig.value.enabled = val
    saveWebdavConfig()
  }

  const changeTimeout = (delta: number) => {
    settingsStore.qmsgTimeout = Math.min(10000, Math.max(500, settingsStore.qmsgTimeout + delta))
    settingsStore.syncQmsgConfig()
  }

  const changeMaxNums = (delta: number) => {
    settingsStore.qmsgMaxNums = Math.min(20, Math.max(1, settingsStore.qmsgMaxNums + delta))
    settingsStore.syncQmsgConfig()
  }

  const changeLimitWidth = (delta: number) => {
    settingsStore.qmsgLimitWidthNum = Math.min(800, Math.max(100, settingsStore.qmsgLimitWidthNum + delta))
    settingsStore.syncQmsgConfig()
  }

  const changeWrap = (value: QmsgLimitWidthWrap) => {
    settingsStore.qmsgLimitWidthWrap = value
    settingsStore.syncQmsgConfig()
  }

  const setBool = (key: BoolSettingKey, value: boolean) => {
    settingsStore[key] = value
    settingsStore.syncQmsgConfig()
  }
</script>

<style scoped>
  .yes-select {
    -webkit-user-select: unset;
    user-select: unset;
    -webkit-touch-callout: unset;
  }
</style>
