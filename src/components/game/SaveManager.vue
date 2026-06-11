<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="game-panel w-full max-w-md text-center relative max-h-[80vh] flex flex-col">
      <button class="absolute top-2 right-2 text-muted hover:text-text" @click="$emit('close')">
        <X :size="14" />
      </button>
      <div class="flex items-center justify-center gap-2 my-4">
        <Divider title label="存档管理" />
        <button
          @click="saveStore.toggleCloudBackup()"
          class="text-[9px] px-1.5 py-0.5 rounded border transition-colors flex items-center gap-0.5 shrink-0"
          :class="saveStore.cloudBackupEnabled ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-gray-600/40 text-gray-500'"
        >
          <span>☁</span>
          {{ saveStore.cloudBackupEnabled ? '云' : '云' }}
        </button>
      </div>
      <div class="flex-1 flex flex-col space-y-2 mb-3" @click="menuOpen = null">
        <div v-for="info in slots" :key="info.slot">
          <div v-if="info.exists" class="flex space-x-1 w-full">
            <button v-if="allowLoad" class="btn flex-1 !justify-between text-xs" @click="$emit('load', info.slot)">
              <span class="inline-flex items-center space-x-1">
                <FolderOpen :size="12" />
                <span>存档 {{ info.slot + 1 }}</span>
              </span>
              <span class="text-muted text-xs inline-flex items-center gap-1">
                <span>
                  {{ info.playerName ?? '未命名' }} · 第{{ info.year }}年 {{ SEASON_NAMES[info.season as keyof typeof SEASON_NAMES] }} 第{{
                    info.day
                  }}天
                </span>
                <span
                  v-if="saveStore.cloudBackupEnabled && cloudStatus[info.slot] === 'cloud_newer'"
                  class="text-[9px] text-amber-400 border border-amber-500/30 px-1 rounded"
                >云端较新</span>
                <span
                  v-else-if="saveStore.cloudBackupEnabled && cloudStatus[info.slot] === 'local_newer'"
                  class="text-[9px] text-sky-400 border border-sky-500/30 px-1 rounded"
                >本地较新</span>
              </span>
            </button>
            <div v-else class="btn flex-1 !justify-between text-xs cursor-default">
              <span class="inline-flex items-center space-x-1">
                <FolderOpen :size="12" />
                <span>存档 {{ info.slot + 1 }}</span>
              </span>
              <span class="text-muted text-xs">
                {{ info.playerName ?? '未命名' }} · 第{{ info.year }}年 {{ SEASON_NAMES[info.season as keyof typeof SEASON_NAMES] }} 第{{
                  info.day
                }}天
              </span>
            </div>
            <div class="relative">
              <Button
                class="px-2 h-full"
                :icon="Settings"
                :icon-size="12"
                @click.stop="menuOpen = menuOpen === info.slot ? null : info.slot"
              />
              <div
                v-if="menuOpen === info.slot"
                class="absolute right-0 top-full mt-1 z-10 flex flex-col border border-accent/30 rounded-xs overflow-hidden w-30"
              >
                <Button
                  v-if="webdavReady"
                  :icon="CloudUpload"
                  :icon-size="12"
                  class="text-center !rounded-none justify-center text-sm"
                  :disabled="uploading"
                  @click="handleUpload(info.slot)"
                >
                  {{ uploading ? '上传中...' : 'WebDAV上传' }}
                </Button>
                <Button
                  v-if="webdavReady"
                  :icon="CloudDownload"
                  :icon-size="12"
                  class="text-center !rounded-none justify-center text-sm"
                  :disabled="downloading"
                  @click="handleDownload(info.slot)"
                >
                  {{ downloading ? '下载中...' : 'WebDAV下载' }}
                </Button>
                <Button
                  v-if="saveStore.cloudBackupEnabled"
                  :icon="Database"
                  :icon-size="12"
                  class="text-center !rounded-none justify-center text-sm"
                  :disabled="cloudUploading"
                  @click="handleCloudUpload(info.slot)"
                >
                  {{ cloudUploading ? '上传中...' : '后台上传' }}
                </Button>
                <Button
                  v-if="saveStore.cloudBackupEnabled"
                  :icon="Database"
                  :icon-size="12"
                  class="text-center !rounded-none justify-center text-sm"
                  :disabled="cloudDownloading"
                  @click="handleCloudDownload(info.slot)"
                >
                  {{ cloudDownloading ? '下载中...' : '后台下载' }}
                </Button>
                <Button
                  v-if="saveStore.cloudBackupEnabled && cloudStatus[info.slot] === 'cloud_newer'"
                  :icon="Database"
                  :icon-size="12"
                  class="text-center !rounded-none justify-center text-sm text-amber-400"
                  :disabled="cloudDownloading"
                  @click="handleCloudResolve(info.slot, 'cloud')"
                >
                  用云端覆盖本地
                </Button>
                <Button
                  v-if="saveStore.cloudBackupEnabled && cloudStatus[info.slot] === 'local_newer'"
                  :icon="Database"
                  :icon-size="12"
                  class="text-center !rounded-none justify-center text-sm text-sky-400"
                  :disabled="cloudUploading"
                  @click="handleCloudResolve(info.slot, 'local')"
                >
                  用本地上传云端
                </Button>
                <Button
                  v-if="!Capacitor.isNativePlatform()"
                  :icon="Download"
                  :icon-size="12"
                  class="text-center !rounded-none justify-center text-sm"
                  @click="handleExport(info.slot)"
                >
                  导出存档
                </Button>
                <Button
                  :icon="Trash2"
                  :icon-size="12"
                  class="btn-danger !rounded-none text-center justify-center text-sm"
                  @click="handleDelete(info.slot)"
                >
                  删除存档
                </Button>
              </div>
            </div>
          </div>
          <div v-else class="flex space-x-1 w-full">
            <div class="text-xs text-muted border border-accent/10 rounded-xs px-3 py-2 flex-1">存档 {{ info.slot + 1 }} — 空</div>
            <Button
              v-if="webdavReady"
              :icon="CloudDownload"
              :icon-size="12"
              class="px-2"
              :disabled="downloading"
              @click="handleDownload(info.slot)"
            >
              <span class="text-xs">{{ downloading ? '下载中...' : 'WebDAV' }}</span>
            </Button>
            <Button
              v-if="saveStore.cloudBackupEnabled"
              :icon="Database"
              :icon-size="12"
              class="px-2"
              :disabled="cloudDownloading"
              @click="handleCloudDownload(info.slot)"
            >
              <span class="text-xs">{{ cloudDownloading ? '下载中...' : '后台' }}</span>
            </Button>
          </div>
        </div>
      </div>

      <!-- 导入存档 -->
      <template v-if="!Capacitor.isNativePlatform()">
        <Button :icon="Upload" class="text-center justify-center text-sm w-full" @click="triggerImport">导入存档</Button>
        <input ref="fileInputRef" type="file" accept=".tyx" class="hidden" @change="handleImportFile" />
      </template>

      <!-- 删除存档确认弹窗 -->
      <Transition name="panel-fade">
        <div
          v-if="deleteTargetSlot !== null"
          class="fixed inset-0 z-60 flex items-center justify-center bg-bg/80"
          @click.self="deleteTargetSlot = null"
        >
          <div class="game-panel w-full max-w-xs mx-4 text-center">
            <p class="text-danger text-sm mb-3">确定删除存档 {{ deleteTargetSlot + 1 }}？</p>
            <p class="text-xs text-muted mb-4">此操作不可恢复。</p>
            <div class="flex space-x-3 justify-center">
              <Button @click="deleteTargetSlot = null">取消</Button>
              <Button class="btn-danger" @click="confirmDelete">确认删除</Button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { X, FolderOpen, Settings, Download, Trash2, Upload, CloudUpload, CloudDownload, Database } from 'lucide-vue-next'
  import Button from '@/components/game/Button.vue'
  import Divider from '@/components/game/Divider.vue'
  import { SEASON_NAMES } from '@/stores/useGameStore'
  import { useSaveStore, type CloudConflictStatus } from '@/stores/useSaveStore'
  import { showFloat } from '@/composables/useGameLog'
  import { useWebdav } from '@/composables/useWebdav'
  import { Capacitor } from '@capacitor/core'

  defineProps<{ allowLoad?: boolean }>()
  const emit = defineEmits<{ close: []; load: [slot: number]; change: [] }>()

  const saveStore = useSaveStore()
  const { webdavReady, uploadSave, downloadSave } = useWebdav()

  const slots = ref(saveStore.getSlots())
  const menuOpen = ref<number | null>(null)
  const uploading = ref(false)
  const downloading = ref(false)
  const cloudUploading = ref(false)
  const cloudDownloading = ref(false)
  const cloudStatus = ref<Record<number, CloudConflictStatus>>({})

  const refreshSlots = () => {
    slots.value = saveStore.getSlots()
  }

  const refreshCloudStatus = async () => {
    if (!saveStore.cloudBackupEnabled) {
      cloudStatus.value = {}
      return
    }
    const map: Record<number, CloudConflictStatus> = {}
    for (const s of slots.value) {
      if (s.exists) {
        map[s.slot] = await saveStore.compareCloudWithLocal(s.slot)
      }
    }
    cloudStatus.value = map
  }

  onMounted(() => {
    void refreshCloudStatus()
  })

  watch(
    () => saveStore.cloudBackupEnabled,
    () => {
      void refreshCloudStatus()
    }
  )

  const handleExport = (slot: number) => {
    if (!saveStore.exportSave(slot)) {
      showFloat('导出失败。', 'danger')
    }
  }

  const deleteTargetSlot = ref<number | null>(null)

  const handleDelete = (slot: number) => {
    deleteTargetSlot.value = slot
  }

  const confirmDelete = () => {
    if (deleteTargetSlot.value !== null) {
      saveStore.deleteSlot(deleteTargetSlot.value)
      refreshSlots()
      emit('change')
      deleteTargetSlot.value = null
      menuOpen.value = null
    }
  }

  const fileInputRef = ref<HTMLInputElement | null>(null)

  const triggerImport = () => {
    fileInputRef.value?.click()
  }

  const handleImportFile = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      const emptySlot = slots.value.find(s => !s.exists)
      if (!emptySlot) {
        showFloat('存档槽位已满，请先删除一个旧存档。')
      } else if (saveStore.importSave(emptySlot.slot, content)) {
        refreshSlots()
        emit('change')
        showFloat(`已导入到存档 ${emptySlot.slot + 1}。`, 'success')
      } else {
        showFloat('存档文件无效或已损坏。', 'danger')
      }
      input.value = ''
    }
    reader.readAsText(file)
  }

  const handleUpload = async (slot: number) => {
    uploading.value = true
    const result = await uploadSave(slot)
    uploading.value = false
    showFloat(result.message, result.success ? 'success' : 'danger')
    menuOpen.value = null
  }

  const handleDownload = async (slot: number) => {
    downloading.value = true
    const result = await downloadSave(slot)
    downloading.value = false
    if (result.success) {
      refreshSlots()
      emit('change')
    }
    showFloat(result.message, result.success ? 'success' : 'danger')
    menuOpen.value = null
  }

  /** Go 后端云存档上传 */
  const handleCloudUpload = async (slot: number) => {
    cloudUploading.value = true
    const ok = await saveStore.uploadToCloud(slot)
    cloudUploading.value = false
    showFloat(ok ? '云端备份成功。' : '云端备份失败，请确认后端已启动。', ok ? 'success' : 'danger')
    if (ok) await refreshCloudStatus()
    menuOpen.value = null
  }

  /** Go 后端云存档下载 */
  const handleCloudDownload = async (slot: number) => {
    cloudDownloading.value = true
    const ok = await saveStore.downloadFromCloud(slot)
    cloudDownloading.value = false
    if (ok) {
      refreshSlots()
      emit('change')
      await refreshCloudStatus()
    }
    showFloat(ok ? '云端存档已恢复到本地。' : '云端下载失败，请确认后端已启动。', ok ? 'success' : 'danger')
    menuOpen.value = null
  }

  const handleCloudResolve = async (slot: number, choice: 'local' | 'cloud') => {
    if (choice === 'cloud') cloudDownloading.value = true
    else cloudUploading.value = true
    const ok = await saveStore.resolveCloudConflict(slot, choice)
    if (choice === 'cloud') cloudDownloading.value = false
    else cloudUploading.value = false
    if (ok) {
      refreshSlots()
      emit('change')
      await refreshCloudStatus()
    }
    showFloat(ok ? '冲突已解决。' : '操作失败，请确认后端已启动。', ok ? 'success' : 'danger')
    menuOpen.value = null
  }
</script>
