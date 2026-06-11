// 在 http://localhost:5173 游戏页面 DevTools Console 粘贴运行（会自动加载 CryptoJS）
;(async function patchForgeSave() {
  const KEY = 'taoyuanxiang_2024_secret'
  const PREFIX = 'taoyuanxiang_save_'
  const MATERIALS = [
    'copper_ore', 'iron_ore', 'gold_ore',
    'copper_bar', 'iron_bar', 'gold_bar', 'iridium_bar',
    'charcoal', 'wood', 'bamboo', 'quartz',
    'jade', 'ruby', 'diamond', 'ice_crystal', 'dragon_scale', 'prismatic_shard'
  ]
  const QTY = 100
  const CAPACITY = 10000

  if (typeof CryptoJS === 'undefined') {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js'
      s.onload = resolve
      s.onerror = () => reject(new Error('CryptoJS 加载失败'))
      document.head.appendChild(s)
    })
  }

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

  let target = null
  for (let slot = 0; slot < 5; slot++) {
    const raw = localStorage.getItem(PREFIX + slot)
    if (!raw) continue
    const json = decrypt(raw)
    if (!json) continue
    const data = JSON.parse(json)
    const g = data.game
    if (g?.season === 'spring' && g?.day === 8) {
      target = { slot, data }
      break
    }
  }

  if (!target) {
    console.error('未找到「春8天」存档。当前槽位：')
    for (let slot = 0; slot < 5; slot++) {
      const raw = localStorage.getItem(PREFIX + slot)
      if (!raw) { console.log(`  槽${slot}: 空`); continue }
      const json = decrypt(raw)
      if (!json) { console.log(`  槽${slot}: 无法解密`); continue }
      const g = JSON.parse(json).game
      const season = { spring: '春', summer: '夏', fall: '秋', winter: '冬' }[g?.season] ?? g?.season
      console.log(`  槽${slot}: 第${g?.year ?? '?'}年${season}${g?.day ?? '?'}天`)
    }
    return
  }

  const { slot, data } = target
  const items = data.inventory.items ?? []
  for (const itemId of MATERIALS) {
    const existing = items.find(i => i.itemId === itemId && (i.quality ?? 'normal') === 'normal')
    if (existing) existing.quantity = (existing.quantity ?? 0) + QTY
    else items.push({ itemId, quantity: QTY, quality: 'normal' })
  }
  data.inventory.items = items
  data.inventory.capacity = CAPACITY
  localStorage.setItem(PREFIX + slot, encrypt(JSON.stringify(data)))
  console.log(`✅ 已修改槽位 ${slot}（春8天）：${MATERIALS.length} 种材料各 +${QTY}，背包容量 → ${CAPACITY}`)
  console.log('请刷新页面后重新读档生效。')
})()
