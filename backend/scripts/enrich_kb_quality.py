#!/usr/bin/env python3
"""Append quality-tier notes to all KB entries."""
import json
import glob
import os
import re

KB_DIR = os.path.join(os.path.dirname(__file__), "..", "internal", "knowledge")

MARKER = "【品质】"

CATEGORY_NOTES = {
    "crop": (
        "【品质】文中作物「售价」均为普通品质基础价。"
        "四档出售价倍率：普通×1、优良×1.25、精品×1.5、极品×2。"
        "收获时按农耕等级与肥料掷品质（3级起出优良、6级精品、9级极品）；"
        "品质肥料可提升高档概率。送礼好感亦按同倍率加成。"
    ),
    "fish": (
        "【品质】鱼售价按四档倍率（普通×1/优良×1.25/精品×1.5/极品×2）。"
        "上钩时掷基础品质，水手专精保底优良，钓具/小游戏评级/戒指/溪流田庄雨天可再升档。"
    ),
    "recipe": (
        "【品质】料理品质取所有食材中的最低品质，出售与食用恢复按倍率加成。"
        "烹饪专精可概率升档或双倍产出。"
    ),
    "animal": (
        "【品质】动物产品（蛋、奶、毛、松露等）收获时掷品质，售价与送礼好感按四档倍率。"
        "每日抚摸与放牧维持高产。"
    ),
    "processing": (
        "【品质】加工品（酒、酱、奶酪、油等）品质继承投入原料品质，"
        "产出售价按四档倍率；机器优先消耗最低品质原料。"
    ),
    "item": (
        "【品质】若该物品支持品质（采集品/鱼/作物/加工品/料理），"
        "售价按普通×1、优良×1.25、精品×1.5、极品×2 结算。"
    ),
    "shop": (
        "【品质】商店收购价按物品品质倍率计算，另受技能专精、戒指、行情系数影响。"
        "材料类（木材/矿石/锭）收购价固定，不区分品质。"
    ),
    "festival": (
        "【品质】节日评比与送礼优先提交精品/极品品质物品，得分与好感加成更高。"
    ),
    "tavern": (
        "【品质】酒肆菜品使用背包中食材烹饪，菜品品质取食材最低档，影响售价与口碑。"
    ),
}

MATERIAL_NOTE = (
    "【品质】本条目涉及木材/矿石/金属锭等基础材料："
    "砍树、挖矿产出固定为普通品质（如木材售价5文/个），建造与配方消耗不区分品质；"
    "背包中若存在同ID不同品质栈，消耗时优先扣最低档。"
)

GENERAL_NOTE = (
    "【品质】桃源乡物品分普通/优良/精品/极品四档，"
    "出售与送礼倍率为×1/×1.25/×1.5/×2（以普通价为基准）。"
    "作物/鱼/采集/畜产品/加工品/料理支持品质；木材矿石等基础材料通常为普通。"
)

MATERIAL_KW = re.compile(r"木材|铜矿|铁矿|金矿|铱矿|矿石|铜锭|铁锭|金锭|铱锭|柴火|石头")


SKIP_IDS = {
    "mechanic_quality_system",
    "quality_price_wood",
    "quality_price_examples",
    "quality_crops_how",
    "quality_fish_how",
    "quality_forage_how",
    "quality_processing_rule",
    "quality_cooking_rule",
    "quality_gift_rule",
    "mechanic_wish_well",
}


def pick_note(entry: dict) -> str:
    eid = entry.get("id", "")
    if eid in SKIP_IDS or eid.startswith("quality_"):
        return ""
    cat = entry.get("category", "")
    content = entry.get("content", "")
    if MARKER in content:
        return ""
    if cat in CATEGORY_NOTES:
        return CATEGORY_NOTES[cat]
    if cat in ("mine", "equipment") or (MATERIAL_KW.search(content) and cat in ("mechanic", "processing")):
        if re.search(r"售价|收购|卖出", content) or MATERIAL_KW.search(content):
            return MATERIAL_NOTE
    if cat == "npc" and re.search(r"送礼|礼物|好感|最爱", content):
        return (
            "【品质】送礼好感=基础值×品质倍率（普通×1/优良×1.25/精品×1.5/极品×2）。"
            "最爱礼物尽量用精品/极品。"
        )
    if cat == "skill":
        return (
            "【品质】技能等级影响产出品质概率：农耕/钓鱼3·6·9级解锁优良/精品/极品门槛；"
            "采集10级植物学家→野外采集恒精品；农耕10级工匠→加工品售价+25%；"
            "钓鱼10级水手→鱼品质至少优良。"
        )
    if cat == "hidden_npc":
        return (
            "【品质】仙灵结缘可获被动加成（如作物祝福升品质、出售加成、钓鱼品质等），"
            "详见各仙灵条目。"
        )
    if eid in ("npc_shops", "npc_schedule_liuniang", "npc_schedule_ashi"):
        return (
            "【品质】商店不出售带品质物品；送礼或卖货时注意背包中的品质档与倍率。"
        )
    if cat == "equipment":
        return (
            "【品质】装备（武器/戒指/帽鞋）无品质档，只有背包物品有品质。"
            "出售装备按固定回收价，不受四档倍率影响。"
        )
    if cat == "mechanic" and re.search(r"节日|祭|节", content):
        return CATEGORY_NOTES["festival"]
    if re.search(r"售价|卖出|收购|文/|文。", content):
        return GENERAL_NOTE
    if cat == "mechanic":
        return (
            "【品质】本条目为系统机制说明，不直接涉及物品品质；"
            "涉及作物/鱼/采集/加工/送礼售价时，四档倍率见「物品品质系统」。"
        )
    return ""


def main():
    files = sorted(glob.glob(os.path.join(KB_DIR, "kb_part*.json")))
    updated = 0
    skipped = 0
    for path in files:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        changed = False
        for e in data:
            note = pick_note(e)
            if not note:
                skipped += 1
                continue
            e["content"] = e["content"].rstrip() + note
            updated += 1
            changed = True
        if changed:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
    print(f"Updated: {updated}, skipped: {skipped}")


if __name__ == "__main__":
    main()
