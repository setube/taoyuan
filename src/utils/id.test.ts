import { describe, it, expect, vi, afterEach } from 'vitest'
import { createId } from './id'

describe('createId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses crypto.randomUUID when available', () => {
    const uuid = vi.fn(() => 'test-uuid')
    vi.stubGlobal('crypto', { randomUUID: uuid })
    expect(createId()).toBe('test-uuid')
    expect(uuid).toHaveBeenCalledOnce()
  })

  it('falls back when randomUUID throws (non-secure HTTP context)', () => {
    vi.stubGlobal('crypto', {
      randomUUID: () => {
        throw new TypeError('crypto.randomUUID is not a function')
      }
    })
    const id = createId()
    expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
  })

  it('falls back when crypto.randomUUID is missing', () => {
    vi.stubGlobal('crypto', {})
    const id = createId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(5)
  })
})
