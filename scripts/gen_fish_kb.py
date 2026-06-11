import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
raw = (ROOT / "src/data/fish.ts").read_text(encoding="utf-8")
marker = "const FISH_DRAFT"
text = raw[raw.index(marker) :] if marker in raw else raw

LOC = {
    "creek": "溪流",
    "pond": "池塘",
    "river": "江河",
    "mine": "矿洞暗河",
    "waterfall": "瀑布",
    "swamp": "沼泽",
}
SEASON = {"spring": "春", "summer": "夏", "autumn": "秋", "winter": "冬"}
WEATHER = {
    "any": "任意",
    "sunny": "晴",
    "rainy": "雨",
    "stormy": "雷雨",
    "snowy": "雪",
    "windy": "大风",
}
DIFF = {
    "easy": "简单",
    "normal": "普通",
    "hard": "困难",
    "legendary": "传说",
}

PONDABLE = {
    "crucian",
    "carp",
    "grass_carp",
    "golden_carp",
    "koi",
    "pond_turtle",
    "bass",
    "catfish",
    "yellow_eel",
    "rainbow_trout",
    "mud_loach",
    "pond_snail",
    "cave_blindfish",
}

pattern = re.compile(
    r"id: '([^']+)'.*?name: '([^']+)'.*?season: \[([^\]]+)\].*?"
    r"weather: \[([^\]]+)\].*?difficulty: '([^']+)'.*?sellPrice: (\d+).*?"
    r"location: '([^']+)'",
    re.S,
)

fish_list = []
for m in pattern.finditer(text):
    fid, name, seasons_raw, weathers_raw, diff, price, loc = m.groups()
    seasons = [SEASON[s.strip().strip("'")] for s in seasons_raw.split(",")]
    weathers = [WEATHER[w.strip().strip("'")] for w in weathers_raw.split(",")]
    fish_list.append(
        {
            "id": fid,
            "name": name,
            "loc": LOC[loc],
            "loc_id": loc,
            "seasons": seasons,
            "weathers": weathers,
            "diff": DIFF[diff],
            "price": int(price),
            "pondable": fid in PONDABLE,
        }
    )

print(f"parsed {len(fish_list)} fish")

OVERVIEW = (
    "【获取通则】①鱼竿钓鱼：地图「清溪」切换六个钓点（溪流/池塘/江河/矿洞暗河/瀑布/沼泽），"
    "在对应季节+天气匹配时抛竿，从该钓点鱼池随机上钩；困难鱼需钓鱼Lv4+且非竹竿，传说鱼需Lv8+（捕猎者专精Lv6+）且非竹竿。"
    "装备魔法鱼饵可无视季节，在当前钓点钓全部鱼种。②蟹笼：万物铺或加工坊获得蟹笼，放清溪钓点并装饵过夜，"
    "产出蜗牛/河虾/螃蟹/龙虾等（itemId与鱼竿鱼不同，不在下列61种内）；矿洞钓点蟹笼产洞虾，沼泽产沼蟹。③鱼塘："
    "13种可养殖鱼须先在清溪钓获，再鱼塘「放入鱼苗」，成熟且每日喂食后收获同种鱼品（不可购买鱼苗）。"
    "【品质重量】鱼竿钓获有重量与四档品质；蟹笼/鱼塘收获无重量。"
)


def fmt(f):
    s = "、".join(f["seasons"])
    w = "、".join(f["weathers"])
    line = (
        f"{f['name']}（{f['diff']}，{f['price']}文）：清溪→{f['loc']}，"
        f"{s}季+{w}天气，鱼竿钓鱼"
    )
    if f["pondable"]:
        line += "；亦可钓获后放鱼塘养殖收获"
    return line


by_loc = {}
for f in fish_list:
    by_loc.setdefault(f["loc_id"], []).append(f)

loc_order = ["creek", "pond", "river", "mine", "waterfall", "swamp"]
entries = []

# full index (may be long — split by location into 6 entries + overview)
entries.append(
    {
        "id": "fish_acquisition_overview",
        "category": "fish",
        "keywords": [
            "鱼怎么获得",
            "鱼获取",
            "钓鱼地点",
            "清溪钓鱼",
            "蟹笼",
            "鱼塘鱼",
            "fish acquisition",
        ],
        "title": "鱼类获取方式通则",
        "content": OVERVIEW,
    }
)

for loc_id in loc_order:
    loc_name = LOC[loc_id]
    fishes = by_loc[loc_id]
    lines = [fmt(f) for f in fishes]
    kw = [loc_name, f"{loc_name}钓鱼", loc_id, f"{loc_name}鱼获取"]
    for f in fishes:
        kw.append(f["name"])
        kw.append(f"{f['name']}怎么获得")
    entries.append(
        {
            "id": f"fish_acquisition_{loc_id}",
            "category": "fish",
            "keywords": kw[:30],
            "title": f"{loc_name}鱼类获取（{len(fishes)}种）",
            "content": OVERVIEW
            + f"【{loc_name}共{len(fishes)}种】"
            + "。".join(lines),
        }
    )

for f in fish_list:
    s = "、".join(f["seasons"])
    w = "、".join(f["weathers"])
    content = (
        f"{f['name']}获取方式：地图「清溪」→{f['loc']}钓点，{s}季且{w}天气时用鱼竿钓鱼"
        f"（难度{f['diff']}，基础价{f['price']}文）。"
    )
    if f["pondable"]:
        content += "另可清溪钓获后放入鱼塘「放入鱼苗」养殖，成熟且每日喂食后收获同种鱼品。"
    else:
        content += "不可购买，NPC不卖鱼；蟹笼无法捕获此鱼种。"
    content += "魔法鱼饵可无视季节在当前钓点尝试。困难/传说鱼需更高钓鱼等级与非竹竿（传说Lv8+，捕猎者专精Lv6+）。"
    entries.append(
        {
            "id": f"fish_get_{f['id']}",
            "category": "fish",
            "keywords": [
                f["name"],
                f"{f['name']}怎么获得",
                f"{f['name']}在哪钓",
                f"{f['name']}获取",
                f"{f['name']}季节",
                f["loc"],
            ],
            "title": f"{f['name']}获取方式",
            "content": content,
        }
    )

LEGENDARY = [f for f in fish_list if f["diff"] == "传说"]
leg_content = OVERVIEW + "【六种传说鱼】" + "。".join(fmt(f) for f in LEGENDARY)
entries.append(
    {
        "id": "fish_acquisition_legendary",
        "category": "fish",
        "keywords": [
            "传说鱼",
            "传说鱼获取",
            "龙鱼",
            "金甲龟",
            "江龙",
            "深渊巨蟒",
            "翠龙",
            "娃娃鱼",
        ],
        "title": "传说鱼获取方式",
        "content": leg_content,
    }
)

out = ROOT / "backend/internal/knowledge/kb_part12_fish_acquisition.json"
out.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {out} with {len(entries)} entries")
