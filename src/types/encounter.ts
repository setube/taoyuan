/** 末日生存：遭遇结果 */
export interface EncounterResult {
  /** 是否遭遇敌人 */
  encountered: boolean;
  /** 僵尸/怪物 id（遭遇时存在） */
  zombieId?: string;
  /** 尝试潜行时是否成功避开 */
  stealthSuccess?: boolean;
  /** 潜行检定 DC */
  stealthDC?: number;
}
