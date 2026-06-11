/** 从源码提取全部烹饪/锻造配方 id，写入 scripts/recipe-ids.json */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const cooking = [...readFileSync(join(root, 'src/data/recipes.ts'), 'utf8').matchAll(/^\s+id: '([^']+)',/gm)].map(
  m => m[1]
)

const forgeFrom = (file) =>
  [...readFileSync(join(root, file), 'utf8').matchAll(/forgeRecipeId\('([^']+)',\s*'([^']+)'\)/g)].map(
    m => `forge_${m[1]}_${m[2]}`
  )

const accessoryForge = (file, category) =>
  [...readFileSync(join(root, file), 'utf8').matchAll(/^\s+id: '([^']+)',/gm)]
    .map(m => m[1])
    .filter(id => {
      const block = readFileSync(join(root, file), 'utf8')
      const idx = block.indexOf(`id: '${id}'`)
      const slice = block.slice(idx, idx + 400)
      return /recipe:\s*\[/.test(slice) && !/recipe:\s*null/.test(slice)
    })
    .map(id => `forge_${category}_${id}`)

const forge = [
  ...new Set([
    ...forgeFrom('src/data/forge.ts'),
    ...forgeFrom('src/data/forgeSets.ts'),
    ...accessoryForge('src/data/rings.ts', 'ring'),
    ...accessoryForge('src/data/hats.ts', 'hat'),
    ...accessoryForge('src/data/shoes.ts', 'shoe')
  ])
]

writeFileSync(join(root, 'scripts/recipe-ids.json'), JSON.stringify({ cooking, forge }, null, 2))
console.log(`cooking: ${cooking.length}, forge: ${forge.length}`)
