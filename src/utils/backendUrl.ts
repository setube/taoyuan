/** API 基址：生产默认同源；开发默认 localhost:8080；可用 VITE_BACKEND_URL 覆盖 */
export function getBackendUrl(): string {
  const fromEnv = import.meta.env.VITE_BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.DEV) return 'http://localhost:8080'
  return ''
}
