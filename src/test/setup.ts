import { vi } from 'vitest'

vi.mock('@/composables/useGameLog', () => ({
  showFloat: vi.fn(),
  addLog: vi.fn(),
  applyQmsgConfig: vi.fn()
}))
