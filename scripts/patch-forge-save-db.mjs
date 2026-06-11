/**
 * 修补 backend/data/taoyuan.db 中云存档的「春8天」槽位。
 * node scripts/patch-forge-save-db.mjs
 */
import { DatabaseSync } from 'node:sqlite'
import CryptoJS from 'crypto-js'
import path from 'path'
import { fileURLToPath } from 'url'
import { FORGE_MATERIAL_IDS, patchSaveData } from './patch-forge-save.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../backend/data/taoyuan.db')
const KEY = 'taoyuanxiang_2024_secret'

const decrypt = cipher => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, KEY)
    const s = bytes.toString(CryptoJS.enc.Utf8)
    return s || null
  } catch {
    return null
  }
}
const encrypt = json => CryptoJS.AES.encrypt(json, KEY).toString()

const db = new DatabaseSync(DB_PATH)
const rows = db.prepare('SELECT device_id, slot, save_data, updated_at FROM cloud_saves').all()

let patched = 0
for (const row of rows) {
  const raw = row.save_data
  if (!raw) continue
  const json = decrypt(raw)
  if (!json) {
    console.warn(`跳过 device=${row.device_id} slot=${row.slot}：解密失败`)
    continue
  }
  const data = JSON.parse(json)
  const g = data.game
  const season = { spring: '春', summer: '夏', fall: '秋', winter: '冬' }[g?.season] ?? g?.season
  const label = `device=${row.device_id} slot=${row.slot} 第${g?.year}年${season}${g?.day}天`
  if (g?.season !== 'spring' || g?.day !== 8) {
    console.log(`  跳过 ${label}`)
    continue
  }
  patchSaveData(data, { qty: 100, capacity: 10000 })
  const enc = encrypt(JSON.stringify(data))
  db.prepare(
    'UPDATE cloud_saves SET save_data = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ? AND slot = ?'
  ).run(enc, row.device_id, row.slot)
  console.log(`✅ 已修补 ${label}：${FORGE_MATERIAL_IDS.length} 种材料各 +100，背包容量 → 10000`)
  patched++
}

if (patched === 0) {
  console.log('\n未在云存档中找到「春8天」。将扫描所有槽位信息：')
  for (const row of rows) {
    const json = decrypt(row.save_data)
    if (!json) continue
    const g = JSON.parse(json).game
    const season = { spring: '春', summer: '夏', fall: '秋', winter: '冬' }[g?.season] ?? g?.season
    console.log(`  device=${row.device_id} slot=${row.slot}: 第${g?.year}年${season}${g?.day}天`)
  }
} else {
  console.log(`\n共修补 ${patched} 个云存档。游戏中开启云备份并同步/读档即可生效。`)
}
