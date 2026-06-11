/**
 * 生成可在 Chrome 游戏页控制台粘贴运行的解锁脚本。
 * 用法：node scripts/unlock-all-recipes-browser.mjs > scripts/unlock-all-recipes-paste.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { cooking, forge } = JSON.parse(readFileSync(join(root, 'scripts/recipe-ids.json'), 'utf8'))

const script = `/**
 * 桃源乡：解锁全部烹饪 + 锻造配方（Chrome 控制台粘贴运行）
 * 1. 打开游戏页并保持当前存档已加载过
 * 2. F12 → Console → 粘贴本段 → Enter
 * 3. 刷新页面，主菜单读档
 */
(async () => {
  const KEY = 'taoyuanxiang_2024_secret'
  const PREFIX = 'taoyuanxiang_save_'
  const COOKING = ${JSON.stringify(cooking)}
  const FORGE = ${JSON.stringify(forge)}

  if (typeof CryptoJS === 'undefined') {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js'
      s.onload = resolve
      s.onerror = () => reject(new Error('无法加载 crypto-js'))
      document.head.appendChild(s)
    })
  }

  const decrypt = (cipher) => {
    try {
      const text = CryptoJS.AES.decrypt(cipher, KEY).toString(CryptoJS.enc.Utf8)
      return text || null
    } catch {
      return null
    }
  }
  const encrypt = (json) => CryptoJS.AES.encrypt(json, KEY).toString()

  const patched = []
  for (let slot = 0; slot < 5; slot++) {
    const raw = localStorage.getItem(PREFIX + slot)
    if (!raw) continue
    const plain = decrypt(raw)
    if (!plain) {
      console.warn('槽位', slot, '解密失败，跳过')
      continue
    }
    let data
    try {
      data = JSON.parse(plain)
    } catch {
      console.warn('槽位', slot, 'JSON 无效，跳过')
      continue
    }
    if (!data.cooking) data.cooking = {}
    if (!data.forge) data.forge = {}
    const beforeCook = (data.cooking.unlockedRecipes || []).length
    const beforeForge = (data.forge.unlockedRecipeIds || []).length
    data.cooking.unlockedRecipes = [...new Set([...(data.cooking.unlockedRecipes || []), ...COOKING])]
    data.forge.unlockedRecipeIds = [...new Set([...(data.forge.unlockedRecipeIds || []), ...FORGE])]
    localStorage.setItem(PREFIX + slot, encrypt(JSON.stringify(data)))
    const g = data.game || {}
    patched.push({
      slot,
      day: g.day,
      season: g.season,
      year: g.year,
      cooking: data.cooking.unlockedRecipes.length,
      forge: data.forge.unlockedRecipeIds.length,
      addedCook: data.cooking.unlockedRecipes.length - beforeCook,
      addedForge: data.forge.unlockedRecipeIds.length - beforeForge
    })
  }

  if (!patched.length) {
    alert('未找到任何存档（taoyuanxiang_save_0~4）。请确认在游戏同源页面运行。')
    return
  }
  console.table(patched)
  alert(
    '已解锁全部配方！共处理 ' + patched.length + ' 个槽位。\\n' +
    patched.map(p => '槽' + p.slot + ': 春' + (p.season === 'spring' ? '' : p.season) + ' 第' + p.day + '天 → 烹饪' + p.cooking + ' / 锻造' + p.forge).join('\\n') +
    '\\n\\n请刷新页面后重新读档。'
  )
})()
`

writeFileSync(join(root, 'scripts/unlock-all-recipes-paste.js'), script)
console.log('Wrote scripts/unlock-all-recipes-paste.js (' + cooking.length + ' cooking, ' + forge.length + ' forge)')
