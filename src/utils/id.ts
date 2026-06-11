/** 生成唯一 ID；HTTP 等非安全上下文下 crypto.randomUUID 不可用 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // 部分环境 isSecureContext 为 false 时调用会抛错
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}
