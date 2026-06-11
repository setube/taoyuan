import { getBackendUrl } from '@/utils/backendUrl'
import { createId } from '@/utils/id'
import { useSaveStore } from '@/stores/useSaveStore'

const SESSION_KEY = 'taoyuan_analytics_session'
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let started = false

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) ?? ''
}

function detectPlatform(): string {
  const ua = navigator.userAgent
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile'
  return 'desktop'
}

async function post(path: string, body: object) {
  try {
    await fetch(`${getBackendUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    })
  } catch {
    // 统计失败不影响游戏
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    void post('/api/v1/analytics/session/end', { sessionId: getSessionId() })
  } else if (document.visibilityState === 'visible') {
    void post('/api/v1/analytics/session/heartbeat', { sessionId: getSessionId() })
  }
}

function onPageHide() {
  void post('/api/v1/analytics/session/end', { sessionId: getSessionId() })
}

/** 启动会话统计：打开次数、游玩时长、设备信息（服务端补 IP/地区） */
export function startAnalytics() {
  if (started) return
  started = true

  try {
    const sessionId = createId()
    sessionStorage.setItem(SESSION_KEY, sessionId)

    const saveStore = useSaveStore()
    void post('/api/v1/analytics/session/start', {
      sessionId,
      visitorId: saveStore.getDeviceId(),
      platform: detectPlatform(),
      screen: `${screen.width}x${screen.height}`
    })

    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void post('/api/v1/analytics/session/heartbeat', { sessionId: getSessionId() })
      }
    }, 60_000)

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
  } catch (err) {
    console.warn('[analytics] 会话统计启动失败', err)
    started = false
  }
}

/** 供在线 Chat API 关联访客 */
export function getAnalyticsSessionId(): string {
  return getSessionId()
}

export function getAnalyticsVisitorId(): string {
  return useSaveStore().getDeviceId()
}
