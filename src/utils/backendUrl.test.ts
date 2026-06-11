import { describe, it, expect, vi, afterEach } from 'vitest'

describe('getBackendUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('uses same origin in production when env unset', async () => {
    vi.stubEnv('VITE_BACKEND_URL', '')
    vi.stubEnv('DEV', '')
    vi.stubEnv('PROD', '1')
    const { getBackendUrl } = await import('./backendUrl')
    expect(getBackendUrl()).toBe('')
  })

  it('uses localhost in dev when env unset', async () => {
    vi.stubEnv('VITE_BACKEND_URL', '')
    vi.stubEnv('DEV', '1')
    const { getBackendUrl } = await import('./backendUrl')
    expect(getBackendUrl()).toBe('http://localhost:8080')
  })

  it('respects VITE_BACKEND_URL override', async () => {
    vi.stubEnv('VITE_BACKEND_URL', 'http://example.com:8005/')
    const { getBackendUrl } = await import('./backendUrl')
    expect(getBackendUrl()).toBe('http://example.com:8005')
  })
})
