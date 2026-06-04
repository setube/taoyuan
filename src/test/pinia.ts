import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { toRaw } from 'vue'

/** 与 main.ts 一致：为 setup store 提供 $reset */
export function createTestPinia(): Pinia {
  const pinia = createPinia()
  pinia.use(({ store }) => {
    const initialState = JSON.parse(JSON.stringify(toRaw(store.$state)))
    store.$reset = () => {
      store.$patch(JSON.parse(JSON.stringify(initialState)))
    }
  })
  setActivePinia(pinia)
  return pinia
}
