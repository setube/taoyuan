/** 开发/测试口令：斯巴拉西 + 9999 + 功勋 */
export function tryMeritDevCheat(input: string): { matched: boolean; grant: number } {
  if (!/斯巴拉西/i.test(input)) return { matched: false, grant: 0 }
  if (!/9999/.test(input)) return { matched: false, grant: 0 }
  if (!/功勋/.test(input)) return { matched: false, grant: 0 }
  return { matched: true, grant: 9999 }
}
