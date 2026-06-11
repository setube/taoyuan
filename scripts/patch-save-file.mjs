/**
 * 离线修补导出的 .tyx 存档或 localStorage 密文
 * node scripts/patch-save-file.mjs <cipher-or.tyx> [out.tyx]
 */
import { readFileSync, writeFileSync } from 'fs'
import CryptoJS from 'crypto-js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const KEY = 'taoyuanxiang_2024_secret'
const { cooking, forge } = JSON.parse(readFileSync(join(root, 'scripts/recipe-ids.json'), 'utf8'))

const input = process.argv[2]
const output = process.argv[3] ?? input
if (!input) {
  console.error('用法: node scripts/patch-save-file.mjs <存档密文或.tyx> [输出路径]')
  process.exit(1)
}

let cipher = readFileSync(input, 'utf8').trim()
const plain = CryptoJS.AES.decrypt(cipher, KEY).toString(CryptoJS.enc.Utf8)
if (!plain) {
  console.error('解密失败，请确认是桃源乡加密存档')
  process.exit(1)
}

const data = JSON.parse(plain)
if (!data.cooking) data.cooking = {}
if (!data.forge) data.forge = {}
const beforeC = (data.cooking.unlockedRecipes ?? []).length
const beforeF = (data.forge.unlockedRecipeIds ?? []).length
data.cooking.unlockedRecipes = [...new Set([...(data.cooking.unlockedRecipes ?? []), ...cooking])]
data.forge.unlockedRecipeIds = [...new Set([...(data.forge.unlockedRecipeIds ?? []), ...forge])]

writeFileSync(output, CryptoJS.AES.encrypt(JSON.stringify(data), KEY).toString())
const g = data.game ?? {}
console.log(
  `已写入 ${output}\n` +
    `  游戏日: ${g.year ?? 1}年 ${g.season ?? '?'} 第${g.day ?? '?'}天\n` +
    `  烹饪配方: ${beforeC} → ${data.cooking.unlockedRecipes.length}\n` +
    `  锻造配方: ${beforeF} → ${data.forge.unlockedRecipeIds.length}`
)
