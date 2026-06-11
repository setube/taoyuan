/**
 * 修改本地浏览器存档：为「春8天」槽位添加锻造材料并扩容背包。
 * 用法：在游戏页面 (localhost:5173) 打开 DevTools Console，粘贴 scripts/patch-forge-save-console.js 内容。
 * 或由 Node 处理导出的 .tyx 文件（见底部）。
 */
import CryptoJS from 'crypto-js'
import fs from 'fs'

const ENCRYPTION_KEY = 'taoyuanxiang_2024_secret'
const SAVE_KEY_PREFIX = 'taoyuanxiang_save_'
const MAX_SLOTS = 5

/** 锻造系统用到的全部材料 id */
export const FORGE_MATERIAL_IDS = [
  'copper_ore',
  'iron_ore',
  'gold_ore',
  'copper_bar',
  'iron_bar',
  'gold_bar',
  'iridium_bar',
  'charcoal',
  'wood',
  'bamboo',
  'quartz',
  'jade',
  'ruby',
  'diamond',
  'ice_crystal',
  'dragon_scale',
  'prismatic_shard'
]

const decrypt = cipher => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY)
    const result = bytes.toString(CryptoJS.enc.Utf8)
    return result || null
  } catch {
    return null
  }
}

const encrypt = json => CryptoJS.AES.encrypt(json, ENCRYPTION_KEY).toString()

export function patchSaveData(data, { qty = 100, capacity = 10000 } = {}) {
  if (!data?.game || !data?.inventory) {
    throw new Error('无效存档结构')
  }
  const items = data.inventory.items ?? []
  for (const itemId of FORGE_MATERIAL_IDS) {
    const existing = items.find(i => i.itemId === itemId && (i.quality ?? 'normal') === 'normal')
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + qty
    } else {
      items.push({ itemId, quantity: qty, quality: 'normal' })
    }
  }
  data.inventory.items = items
  data.inventory.capacity = capacity
  return data
}

export function findSpringDay8Slot(rawSlots) {
  for (let slot = 0; slot < MAX_SLOTS; slot++) {
    const raw = rawSlots[slot]
    if (!raw) continue
    const json = decrypt(raw)
    if (!json) continue
    const data = JSON.parse(json)
    const g = data.game
    if (g?.season === 'spring' && g?.day === 8) return { slot, data }
  }
  return null
}

/** Node：处理导出的加密存档字符串或 .tyx 文件 */
export function patchRawSave(raw, opts) {
  const json = decrypt(raw.trim())
  if (!json) throw new Error('解密失败')
  const data = JSON.parse(json)
  if (data.game?.season !== 'spring' || data.game?.day !== 8) {
    console.warn(`警告：该档为 ${data.game?.season} 第${data.game?.day}天，仍将继续修改`)
  }
  patchSaveData(data, opts)
  return encrypt(JSON.stringify(data))
}

if (process.argv[1]?.endsWith('patch-forge-save.mjs')) {
  const file = process.argv[2]
  if (!file) {
    console.log('用法: node scripts/patch-forge-save.mjs <存档.tyx或加密文本文件>')
    process.exit(1)
  }
  const raw = fs.readFileSync(file, 'utf8')
  const patched = patchRawSave(raw)
  const out = file.replace(/\.tyx$/, '') + '.patched.tyx'
  fs.writeFileSync(out, patched)
  console.log('已写入:', out)
}
