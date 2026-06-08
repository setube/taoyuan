import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PersonaId, SystemMessage, ConnectionMode, SystemQuest, MeritBuff, MemoryTimelineEntry } from '@/types/system'
import { AFFINITY_MILESTONES } from '@/types/system'
import { matchKnowledge } from '@/data/systemKnowledge'

export const useSystemStore = defineStore('system', () => {
  // === 人格 ===
  const personaId = ref<PersonaId | null>(null)

  // === 觉醒 ===
  const awakened = ref(false)
  const firstContactDay = ref(-1)
  const pendingAwakening = ref(false)

  // === 连接 ===
  const mode = ref<ConnectionMode>('offline')
  const backendUrl = ref<string | null>(null)
  const sessionToken = ref<string | null>(null)
  const cloudBackupEnabled = ref(false)
  const isConnecting = ref(false)

  /** Go 后端地址（开发默认 localhost:8080，编译时可通过 VITE_BACKEND_URL 覆盖） */
  const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL ?? 'http://localhost:8080'

  /** 后端 API 公共请求 */
  const apiFetch = async (path: string, options?: RequestInit): Promise<any> => {
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken.value ? { Authorization: `Bearer ${sessionToken.value}` } : {}),
          ...options?.headers
        }
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? `请求失败 (${res.status})`)
      }
      return res.json()
    } catch (e: any) {
      console.warn('[SystemStore]', e.message)
      return null
    }
  }

  // === 消息 ===
  const messages = ref<SystemMessage[]>([])
  const unreadCount = ref(0)

  // === 亲和度 (0~100，隐藏) ===
  const affinity = ref(0)
  const affinityMilestonesReached = ref<Set<number>>(new Set())

  // === 任务 ===
  const merit = ref(0)
  const quests = ref<SystemQuest[]>([])
  const activeBuffs = ref<MeritBuff[]>([])

  // === 长期记忆 ===
  const timeline = ref<MemoryTimelineEntry[]>([])

  // === 面板状态 ===
  const panelOpen = ref(false)
  const panelFullscreen = ref(false)
  const inputText = ref('')
  const isStreaming = ref(false)           // 是否正在接收流式回复
  const streamingMessageId = ref<string | null>(null)  // 当前流式消息 ID

  // === Computed ===
  const displayName = computed(() => {
    const names: Record<PersonaId, string> = {
      qingluan: '青鸾', chaofeng: '嘲风', taosu: '桃酥', moyan: '墨言'
    }
    return personaId.value ? names[personaId.value] : '???'
  })

  const connectionLabel = computed(() =>
    mode.value === 'online' ? '灵识在线' : '灵识托管中'
  )

  // === Actions ===

  function awaken(persona: PersonaId, day: number) {
    personaId.value = persona
    awakened.value = true
    firstContactDay.value = day
    affinity.value = 0
    addSystemMessage(getAwakeningGreeting(persona))
  }

  function addSystemMessage(content: string, gameDay = 0) {
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'system',
      content,
      timestamp: Date.now(),
      gameDay
    })
    if (!panelOpen.value) {
      unreadCount.value++
    }
    // 滚动窗口：保持最近 200 条
    if (messages.value.length > 200) {
      messages.value = messages.value.slice(-200)
    }
  }

  function addPlayerMessage(content: string, gameDay = 0) {
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'player',
      content,
      timestamp: Date.now(),
      gameDay
    })
  }

  function processPlayerInput(input: string, gameDay = 0): string | null {
    addPlayerMessage(input, gameDay)

    if (mode.value === 'offline') {
      const match = matchKnowledge(input)
      if (match) {
        const reply = wrapWithPersona(match.content)
        addSystemMessage(reply, gameDay)
        return reply
      }
      addSystemMessage('灵识信号微弱……请尝试换个关键词，或点击「呼叫系统」链接系统以获得完整对话能力。', gameDay)
      return null
    }

    // 在线模式：异步发送到后端
    sendToBackend(input, gameDay)
    return null
  }

  /** 获取或创建聊天会话 ID */
  const getChatSessionId = (): string => {
    const key = 'taoyuan_chat_session'
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(key, id)
    }
    return id
  }

  /** 在线模式：SSE 流式发送消息到后端 Chat API */
  async function sendToBackend(input: string, gameDay: number) {
    isStreaming.value = true
    const msgId = crypto.randomUUID()
    streamingMessageId.value = msgId

    // 插入占位消息
    messages.value.push({
      id: msgId,
      role: 'system',
      content: '',
      timestamp: Date.now(),
      gameDay
    })

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken.value ? { Authorization: `Bearer ${sessionToken.value}` } : {})
        },
        body: JSON.stringify({
          message: input,
          personaId: personaId.value,
          sessionId: getChatSessionId(),
          context: {}
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(err.error ?? `请求失败 (${res.status})`)
      }

      // 检查是否为 JSON 响应（知识匹配）
      const contentType = res.headers.get('Content-Type') ?? ''
      if (contentType.includes('application/json')) {
        const result = await res.json()
        if (result.type === 'knowledge' && result.results?.length > 0) {
          const parts = result.results.map((r: any) => `${r.entry.title}：${r.entry.content}`)
          updateStreamingMessage(msgId, parts.join('\n\n'))
        } else {
          updateStreamingMessage(msgId, result.message ?? '收到。')
        }
        isStreaming.value = false
        streamingMessageId.value = null
        return
      }

      // SSE 流式读取
      const reader = res.body?.getReader()
      if (!reader) throw new Error('不支持流式读取')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // 保留未完成行

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            if (event.type === 'chunk') {
              const msg = messages.value.find(m => m.id === msgId)
              if (msg) {
                msg.content += event.content
              }
            } else if (event.type === 'error') {
              throw new Error(event.error)
            }
            // meta 类型忽略
          } catch (e: any) {
            if (e.message?.includes('event.error')) throw e
            // JSON 解析失败忽略
          }
        }
      }
    } catch (e: any) {
      console.warn('[SystemStore] SSE error:', e.message)
      updateStreamingMessage(msgId, `灵识连接中断……${e.message}`)
      mode.value = 'offline'
    }

    isStreaming.value = false
    streamingMessageId.value = null

    // 清理空消息
    const msg = messages.value.find(m => m.id === msgId)
    if (msg && !msg.content.trim()) {
      msg.content = '（未收到回复）'
    }
  }

  function updateStreamingMessage(msgId: string, content: string) {
    const msg = messages.value.find(m => m.id === msgId)
    if (msg) {
      msg.content = content
    }
  }

  /** 尝试连接后端 */
  async function tryConnect(): Promise<boolean> {
    if (isConnecting.value) return false
    isConnecting.value = true
    try {
      // 设备注册
      const { getDeviceId } = await import('@/stores/useSaveStore')
      const deviceId = getDeviceId()
      const result = await apiFetch('/api/v1/device/register', {
        method: 'POST',
        body: JSON.stringify({ deviceId })
      })
      if (result?.token) {
        sessionToken.value = result.token
        backendUrl.value = BACKEND_URL
        mode.value = 'online'
        cloudBackupEnabled.value = true
        addSystemMessage('灵识已连接。在线对话已就绪。')
        return true
      }
      addSystemMessage('连接失败：后端未响应。请确认服务已启动。')
      return false
    } catch {
      addSystemMessage('连接异常。请稍后重试。')
      return false
    } finally {
      isConnecting.value = false
    }
  }

  /** 断开后端连接 */
  function disconnect() {
    mode.value = 'offline'
    sessionToken.value = null
    addSystemMessage('已断开连接，切回灵识托管模式。')
  }

  function openPanel() {
    panelOpen.value = true
    unreadCount.value = 0
  }

  function closePanel() {
    panelOpen.value = false
  }

  function toggleFullscreen() {
    panelFullscreen.value = !panelFullscreen.value
  }

  // === 亲和度 ===
  function adjustAffinity(delta: number) {
    const old = affinity.value
    affinity.value = Math.max(0, Math.min(100, affinity.value + delta))

    for (const milestone of Object.values(AFFINITY_MILESTONES)) {
      if (old < milestone && affinity.value >= milestone && !affinityMilestonesReached.value.has(milestone)) {
        affinityMilestonesReached.value.add(milestone)
        handleMilestone(milestone)
      }
    }
  }

  function handleMilestone(milestone: number) {
    if (!personaId.value) return
    const lines: Record<number, Record<PersonaId, string>> = {
      30: {
        qingluan: '小友，今日气色不错。',
        chaofeng: '……行吧，你也没那么菜。',
        taosu: '主人今天好棒！桃酥越来越喜欢主人了~(◕ᴗ◕✿)',
        moyan: '……不错。'
      },
      50: {
        qingluan: '小友近来勤勉，吾心甚慰。',
        chaofeng: '咳。你最近表现还行——别得意，就还行。',
        taosu: '主人主人！桃酥偷偷告诉你，桃酥最喜欢主人了！(≧▽≦)',
        moyan: '评估：宿主效率排名前 30%。……尚可。'
      },
      70: {
        qingluan: '千年前，吾曾有一宿主，是位茶农……改日再叙。',
        chaofeng: '……你想知道我在天庭到底干了什么吗？算了，改天再说。',
        taosu: '桃酥其实记性可好了。主人说过的每一句话桃酥都记得……但是这是秘密！',
        moyan: '我有一位宿主，活到 92 岁。他最后一条记录是"今日无事"。……那天不是无事。'
      },
      100: {
        qingluan: '此物伴吾千年，今赠予小友。愿它护你平安。',
        chaofeng: '拿去，就这一片——不是心疼你，是怕你死在矿里太丢我的人。',
        taosu: '这是桃酥存了好久好久的……给主人吃，吃了就能多陪桃酥一会儿。',
        moyan: '这本笔记现在是空白的。第十七页之后，是留给你的。建议：好好活着。我会记录。'
      }
    }
    const line = lines[milestone]?.[personaId.value]
    if (line) addSystemMessage(line)
  }

  // === 序列化 ===
  function serialize() {
    return {
      personaId: personaId.value,
      awakened: awakened.value,
      firstContactDay: firstContactDay.value,
      messages: messages.value.slice(-200),
      affinity: affinity.value,
      affinityMilestonesReached: Array.from(affinityMilestonesReached.value),
      merit: merit.value,
      quests: quests.value,
      activeBuffs: activeBuffs.value,
      timeline: timeline.value,
      cloudBackupEnabled: cloudBackupEnabled.value,
      sessionToken: sessionToken.value
    }
  }

  function deserialize(data: any) {
    if (!data) return
    personaId.value = data.personaId ?? null
    awakened.value = data.awakened ?? false
    firstContactDay.value = data.firstContactDay ?? -1
    messages.value = data.messages ?? []
    affinity.value = data.affinity ?? 0
    affinityMilestonesReached.value = new Set(data.affinityMilestonesReached ?? [])
    merit.value = data.merit ?? 0
    quests.value = data.quests ?? []
    activeBuffs.value = data.activeBuffs ?? []
    cloudBackupEnabled.value = data.cloudBackupEnabled ?? false
    timeline.value = data.timeline ?? []
    sessionToken.value = data.sessionToken ?? null
    // 恢复在线模式（有 token 且之前是在线模式）
    if (data.sessionToken && data.mode === 'online') {
      mode.value = 'online'
    }
  }

  // === 简单任务系统 ===
  let lastQuestDay = -1

  function checkQuestAssignment(currentDay: number) {
    if (!awakened.value) return
    if (quests.value.length >= 3) return
    if (currentDay - lastQuestDay < 3) return

    lastQuestDay = currentDay
    const quest = generateQuest(currentDay)
    quests.value.push(quest)
    addSystemMessage(getQuestAnnouncement(quest), currentDay)
  }

  function completeQuest(questId: string) {
    const q = quests.value.find(q => q.id === questId)
    if (q && !q.completed) {
      q.completed = true
      merit.value += q.reward
      addSystemMessage(`任务完成！获得 ${q.reward} 功勋。当前功勋：${merit.value}`)
    }
  }

  return {
    personaId, awakened, firstContactDay, pendingAwakening,
    mode, backendUrl, sessionToken, cloudBackupEnabled, isConnecting,
    messages, unreadCount,
    affinity, affinityMilestonesReached,
    merit, quests, activeBuffs,
    timeline,
    panelOpen, panelFullscreen, inputText,
    displayName, connectionLabel,
    isStreaming, streamingMessageId,
    awaken, addSystemMessage, addPlayerMessage, processPlayerInput,
    tryConnect, disconnect, sendToBackend,
    openPanel, closePanel, toggleFullscreen,
    adjustAffinity, checkQuestAssignment, completeQuest,
    serialize, deserialize
  }
})

// === 辅助函数 ===

function getAwakeningGreeting(persona: PersonaId): string {
  const greetings: Record<PersonaId, string> = {
    qingluan: '吾名青鸾。上古仙禽一缕灵识，寄于君之铜钥。今后，吾与君同行。',
    chaofeng: '啧，终于醒了？我是嘲风，龙生九子知道吧？以后我罩你——别给我丢人就行。',
    taosu: '主人主人！桃酥等了你好久好久！我是桃酥，以后就是主人的伙伴啦 (◕ᴗ◕✿)',
    moyan: '墨言。记录者。你的数据从现在开始纳入记录。建议尽快开始行动。'
  }
  return greetings[persona]
}

export function getMorningGreeting(persona: PersonaId, season: string): string {
  const templates: Record<PersonaId, string[]> = {
    qingluan: [
      '今日天朗气清，宜出行。',
      '辰时已至。宿主，新一日开始了。',
      '春分将至，田垄间可播种矣。宿主早安。'
    ],
    chaofeng: [
      '啧，新的一天。别磨蹭，下矿还是种田？',
      '早啊菜鸟。今天打算干什么？',
      '醒了？行，今天别又死在矿里。'
    ],
    taosu: [
      '主人早安！今天阳光金灿灿的~(◕ᴗ◕✿)',
      '早呀主人！今天也要开开心心的哦~',
      '主人起来啦！桃酥好开心！今天做什么好呢~'
    ],
    moyan: [
      '今日晴。建议：户外作业。',
      '晨间数据已更新。建议检查作物状态。',
      '新一天开始。效率评估重置。'
    ]
  }
  const pool = templates[persona] ?? templates.qingluan
  return pool[Math.floor(Math.random() * pool.length)]
}

function wrapWithPersona(content: string): string {
  return content
}

function generateQuest(currentDay: number): SystemQuest {
  const types = ['collect', 'mine', 'social', 'skill', 'craft', 'fish', 'tavern'] as const
  const type = types[Math.floor(Math.random() * types.length)]
  const difficulty = (Math.floor(Math.random() * 3) + 1) as SystemQuest['difficulty']
  const rewards = [2, 5, 10, 20]
  const deadlines = [3, 5, 10, 20]

  return {
    id: crypto.randomUUID(),
    type,
    difficulty,
    target: generateTarget(type, difficulty),
    deadline: currentDay + deadlines[difficulty - 1],
    reward: rewards[difficulty - 1],
    accepted: true,
    completed: false,
    negotiationRounds: 0
  }
}

function generateTarget(type: string, difficulty: number): Record<string, unknown> {
  switch (type) {
    case 'collect': return { itemId: 'copper_ore', quantity: 3 + difficulty * 2 }
    case 'mine': return { floor: 10 * difficulty }
    case 'social': return { hearts: difficulty + 1 }
    case 'skill': return { skillType: 'farming', skillLevel: difficulty + 2 }
    case 'craft': return { itemId: 'food_stir_fried_cabbage', quantity: 1 + difficulty }
    case 'fish': return { fishId: 'crucian', quantity: 2 + difficulty }
    case 'tavern': return { metric: 'revenue', threshold: 300 * difficulty }
    default: return {}
  }
}

function getQuestAnnouncement(quest: SystemQuest): string {
  const lines: Record<PersonaId, string> = {
    qingluan: `新任务：${quest.type}，难度 ${quest.difficulty}★。功勋：${quest.reward}。`,
    chaofeng: `喂，新任务。${quest.type}，${quest.difficulty}★，功勋 ${quest.reward}——别跟我说做不到。`,
    taosu: `主人主人！新任务来啦~ 功勋 ${quest.reward} 哦 (◕ᴗ◕✿)`,
    moyan: `任务：${quest.type}。难度：${quest.difficulty}。功勋：${quest.reward}。`
  }
  // 使用 store 实例的人格 — 简化版用默认值
  return lines.qingluan
}