#!/usr/bin/env python3
"""Remove Stardew-contaminated KB entries and rewrite Taoyuan-native replacements."""
import json
import glob
import os
import re

KB_DIR = os.path.join(os.path.dirname(__file__), "..", "internal", "knowledge")

# Mirrors backend/internal/llm/grounding.go foreignGameMarkers
FOREIGN_MARKERS = [
    "星露谷", "Stardew", "stardew",
    "防风草", "parsnip", "Parsnip",
    "Joja", "joja", "JOJA",
    "皮埃尔", "Pierre",
    "鹈鹕镇", "Pelican Town",
    "祝尼魔", "Junimo", "junimo",
    "姜岛", "Ginger Island", "ginger island",
    "齐先生", "金核桃", "齐币",
    "社区中心献祭", "社区中心广场", "社区中心",
    "玛妮", "Marnie",
    "刘易斯镇长", "刘易斯",
    "威利", "Willy",
    "冈瑟", "Gunther",
    "科罗布斯", "Krobus", "克罗布斯",
    "沙漠商人", "赌场二楼",
    "酱料女王",
    "复活节彩蛋节", "花舞节",
    "冬日星祭", "winter star",
    "万灵节", "spirits eve",
    "彩蛋节", "egg festival",
    "秘密森林", "secret woods",
    "采石场", "quarry",
    "下水道", "sewers",
    "巫师塔", "wizard",
    "电影院", "movie theater",
    "完美雕像", "爷爷的神龛",
    "方尖碑", "obelisk",
    "杨桃", "starfruit",
    "甜宝石果", "sweet gem berry",
    "变异鲤鱼", "mutant carp",
    "bundle", "献祭包",
]

DELETE_IDS = {
    "quest_community_center_pantry",
    "quest_community_center_fish_tank",
    "quest_community_center_boiler",
    "quest_community_center_bulletin",
    "quest_community_center_vault",
    "quest_special_orders",
    "mechanic_farm_computer",
    "mechanic_junimo_hut",
    "mechanic_auto_petter",
    "mechanic_auto_grabber",
    "mechanic_deluxe_scarecrow",
    "mechanic_solar_panel",
    "npc_krobus",
    "npc_wizard",
    "npc_dwarf",
    "mechanic_movie_theater",
    "mechanic_statue_of_perfection",
    "mechanic_statue_of_endless_fortune",
    "mechanic_golden_clock",
    "mechanic_obelisk",
    "processing_crystalarium",
    "mechanic_artifact_spots",
    "mechanic_trash_bear",
    "mechanic_casino_daily",
    "mechanic_mushroom_cave",
    "mechanic_marnie_shop_hours",
    "mechanic_robin_shop",
    "item_pearl",
    "item_treasure_chest",
    "item_iridium_sprinkler_nozzle",
    "item_enricher",
    "skill_respec",
    "mechanic_warp_totem",
    "mechanic_crafting_recipes_source",
    "mechanic_tv_channels",
    "npc_gift_universal_love",
    "npc_gift_universal_hate",
    "mechanic_pierre_vs_joja",
    "mechanic_spirit_eve",
    "mechanic_egg_festival",
    "mechanic_flower_dance",
    "mechanic_desert_festival",
    "mechanic_all_bundles_checklist",
    "economy_first_year_million",
    "fish_mutant_carp",
    "crop_sweet_gem_berry",
    "crop_starfruit",
    "mine_ginger_island",
    "mechanic_qi_challenges",
    "mechanic_enchantments_forge",
    "mechanic_ostrich",
    "mechanic_horse_whistle",
    "mechanic_return_scepter",
    "item_galaxy_weapons",
    "mechanic_secret_woods",
    "mechanic_quarry",
    "mechanic_sewers",
    "mechanic_desert",
    "shop_casino",
    "mechanic_community",
    "recipe_fiddlehead_risotto",
    "festival_winter_star",
}

REWRITES = {
    "mechanic_farm_map_choice": {
        "id": "mechanic_farm_map_choice",
        "category": "mechanic",
        "keywords": ["农场地图", "farm map", "田庄选择", "桃源田庄", "溪流田庄"],
        "title": "农场地图选择",
        "content": "创建角色时可选择六种田庄（影响专长与开局加成）：桃源田庄（标准）→初始6×6可扩至10×10，换季自动施肥，15%额外收获，适合大规模种植。溪流田庄→钓鱼经验+25%、鱼售价+10%、每日溪流鱼获、雨天鱼品质提升。竹林田庄→采集经验+25%、20%双倍采集、每日林中拾遗。山丘田庄→挖矿经验+25%、矿石+1、农场地表矿脉。荒野田庄→战斗经验+50%、每日获矿石、夜间野兽遭遇。草甸田庄→开局鸡舍+2鸡、动物友好度+50%、动物不生病、额外产出。新手推荐桃源田庄或草甸田庄。",
    },
    "mechanic_museum_rewards": {
        "id": "mechanic_museum_rewards",
        "category": "mechanic",
        "keywords": ["博物馆奖励", "museum rewards", "捐赠里程碑", "博物馆捐赠"],
        "title": "博物馆捐赠里程碑",
        "content": "桃源乡博物馆共40件可捐赠藏品（矿石7、宝石7、金属锭4、化石8、古物10、仙灵4）。捐赠来源：矿洞各层宝箱与采集、竹林稀有采集、深层怪物掉落。里程碑奖励：5件「初窥门径」→300文；10件「小有收藏」→500文+远古种子×1；15件「矿石鉴赏家」→1000文；20件「博古通今」→1500文+五彩碎片×1；25件「文物守护者」→3000文；30件「远古探秘」→5000文+铱锭×3；36件「博物馆之星」→10000文；40件「灵物全鉴」→8000文+月光石×3。捐赠宝石类藏品可提升系统亲和（墨言+2）。",
    },
    "npc_schedule_liuniang": {
        "id": "npc_schedule_liuniang",
        "category": "npc",
        "keywords": ["柳娘行程", "柳娘在哪", "柳娘位置", "柳娘时间表"],
        "title": "柳娘每日行程",
        "content": "柳娘（花店老板）每日行程：春季→大部分时间在花店（8:00-18:00），周二下午在竹林采花（14:00-17:00）。夏季→花店（8:00-18:00），周五在溪边（13:00-17:00）。秋季→花店（8:00-18:00），周三在村中广场（12:00-16:00）。冬季→花店（10:00-16:00），周日在家。雨天→全天在花店。生日（春14日）→花店开放至20:00。",
    },
    "crop_greenhouse": {
        "id": "crop_greenhouse",
        "category": "mechanic",
        "keywords": ["温室", "greenhouse", "温室种植", "全年种植"],
        "title": "温室种植策略",
        "content": "温室解锁：35000文+木材×200+铁矿×30+金矿×10，初始12格耕地，全年可种任意季节作物。可扩建两次：扩建·壹（50000文+木材300+铁锭20）→20格5×4；扩建·贰（100000文+木材500+金锭15）→30格6×5。冬季无室外作物时温室是核心收入来源。推荐种植：高价值反复收获作物、跨季抢收作物、冬季专用茶苗等。秘密纸条#12也提示：有温室则冬季可继续种植。",
    },
    "shop_traveling_cart": {
        "id": "shop_traveling_cart",
        "category": "shop",
        "keywords": ["旅行商人", "traveling merchant", "旅行货车", "周五商人", "周日商人"],
        "title": "旅行商人",
        "content": "旅行商人每周五、周日出摊（村口，6:00-20:00）。每次从商品池随机上架3-4件稀有物+1-2种反季种子。固定池含：龙玉、五彩碎片、月光石、人参、腊梅、铱矿、布匹、幸运兔脚、松露、雨图腾、丝帕等，售价约为物品回收价的2倍以上（±15%浮动）。反季种子溢价约4倍种子价。幻商（狐仙亲和2100）被动可额外+1件稀有商品。建议每周五、日必访补货。",
    },
    "festival_stardew_fair": {
        "id": "festival_harvest_fair",
        "category": "festival",
        "keywords": ["丰收祭", "农展会", "农产品比赛", "丰收祭攻略"],
        "title": "秋季丰收祭攻略",
        "content": "秋季丰收祭（秋22日）可提交农产品参加评比，按品质与多样性打分。策略：每类最多1件（作物、鱼、加工品、矿石、动物产品、料理等）；优先铱星品质与高价值物品（传说鱼、传说作物、稀有加工品）。高分可获得节日限定菜谱与装饰奖励，是展示全年农耕成果的舞台。",
    },
    "mine_skull_cavern": {
        "id": "mine_skull_cavern",
        "category": "mine",
        "keywords": ["骷髅矿穴", "skull cavern", "无限矿洞", "铱矿"],
        "title": "骷髅矿穴",
        "content": "骷髅矿穴在云隐矿洞120层通关后解锁，楼层无限生成、难度逐层递增。专属怪物含骷髅飞蛇、铱金魔像、远古木乃伊等；矿石池以铱矿、虚空矿为主。每25层出现缩放小BOSS。公会发布骷髅矿穴讨伐任务。成就：到达10/25/50/100层分别解锁对应成就。是后期刷铱矿与战斗经验的主要场所。",
    },
    "mine_skull_cavern_prep": {
        "id": "mine_skull_cavern_prep",
        "category": "mine",
        "keywords": ["骷髅矿穴准备", "skull prep", "下矿准备"],
        "title": "骷髅矿穴准备清单",
        "content": "下骷髅矿穴前建议：携带充足食物（恢复体力与生命）、炸弹/武器、楼梯（如需快速下探）。优先升级武器与戒指；战斗技能10级选战士路线更稳。铱锭护甲与吸血附魔可大幅提升续航。每层怪物属性随深度缩放，50层后难度陡增，建议分批探索并及时存档。",
    },
    "item_prismatic_shard": {
        "id": "item_prismatic_shard",
        "category": "item",
        "keywords": ["五彩碎片", "prismatic shard", "五彩石", "万能宝石"],
        "title": "五彩碎片",
        "content": "五彩碎片是桃源乡最稀有的宝石之一。获取：深层矿洞宝箱极稀有掉落、旅行商人偶现、博物馆捐赠20件里程碑奖励×1、功勋商店等。用途：博物馆捐赠、高价值出售、部分NPC最爱礼物、系统任务奖励。不可被复制机复制（如有该设备）。",
    },
    "crop_ancient_fruit": {
        "id": "crop_ancient_fruit",
        "category": "crop",
        "keywords": ["远古种子", "ancient seed", "古物种子"],
        "title": "远古种子",
        "content": "远古种子是博物馆级古物，非普通作物种子。获取：矿洞深层宝箱极稀有、博物馆捐赠10件里程碑奖励×1、功勋商店兑换。种植后为高价值反复收获作物（具体以游戏内说明为准），温室全年种植可最大化收益。种子制造机可将果实转化为更多远古种子以扩大规模。",
    },
    "mechanic_secret_notes": {
        "id": "mechanic_secret_notes",
        "category": "mechanic",
        "keywords": ["秘密纸条", "secret notes", "纸条", "隐藏信息"],
        "title": "秘密纸条系统",
        "content": "秘密纸条散布于矿洞、竹林、钓鱼、宝箱等玩法中，共25张，收集后可在背包查看线索。内容涵盖：NPC喜好提示、隐藏地点、温室秘诀、矿洞层数秘密、许愿井口令线索等。例如纸条#12提示冬季可在温室继续种植。齐集可解锁「纸条猎人」类成就。",
    },
    "mechanic_children": {
        "id": "mechanic_children",
        "category": "mechanic",
        "keywords": ["孩子", "children", "生娃", "育儿"],
        "title": "孩子系统",
        "content": "与可婚NPC结婚后，配偶会随机询问是否要孩子。同意后经过数周孩子出生，经历婴儿→幼儿→儿童阶段，最多2个孩子。主线任务「添丁进口」要求迎来第一个孩子。孩子无需喂养，为陪伴与角色扮演元素，可参加部分节日活动。",
    },
    "economy_best_profit_per_day": {
        "id": "economy_best_profit_per_day",
        "category": "mechanic",
        "keywords": ["最高日利润", "best profit", "赚钱攻略", "最快赚钱"],
        "title": "最高日利润策略",
        "content": "桃源乡高收益思路：1. 温室高价值作物+酒桶酿酒（售价×3） 2. 反复收获作物配酱缸/酒坊 3. 秋季松露+榨油机 4. 蜂箱产蜜（秋季桂花蜜尤高） 5. 鱼塘养殖日产 6. 酒肆经营口碑菜 7. 骷髅矿穴刷铱矿。核心原则：能加工则加工，反复收获优于单次作物，冬季靠温室+矿洞+畜牧补收入。",
    },
    "mechanic_winter_crop_supplement": {
        "id": "mechanic_winter_crop_supplement",
        "category": "mechanic",
        "keywords": ["冬季赚钱", "winter money", "冬季收入"],
        "title": "冬季收入来源",
        "content": "冬季室外作物稀少，收入来源：1. 温室全年种植 2. 云隐矿洞/骷髅矿穴采矿 3. 冬季专属鱼类（冰鱼等） 4. 畜牧产品加工（奶酪、蛋黄酱、松露油等） 5. 酒桶持续出货 6. 酒肆营业 7. 瀚海驿站玩法。冬季适合升级工具、整理加工链、推进主线与博物馆捐赠。",
    },
    "mechanic_farm_animals_priority": {
        "id": "mechanic_farm_animals_priority",
        "category": "mechanic",
        "keywords": ["动物优先级", "动物购买顺序", "最值得养的动物"],
        "title": "动物购买优先级",
        "content": "动物推荐顺序：S级→猪（松露+榨油机，日利润高）、鸡（鸡蛋→蛋黄酱稳定）。A级→鸭（鸭蛋加工）、牛（牛奶→奶酪）。B级→羊（羊毛→布料）、兔（兔脚稀有掉落）。草甸田庄开局送鸡舍+2鸡，可加速早期蛋奶收入。动物好感影响产物品质，每日抚摸+室外放牧可维持高好感。",
    },
    "crop_quality_fertilizer": {
        "id": "crop_quality_fertilizer",
        "category": "mechanic",
        "keywords": ["肥料选择", "fertilizer choice", "加速肥料", "品质肥料"],
        "title": "肥料选择策略",
        "content": "加速肥料→缩短生长周期，适合短周期高价值作物、跨季抢收、与农耕专精叠加。品质肥料→提升作物品质概率，适合传说作物、节日评比、高售价出货。桃源田庄换季自动施肥（随种植等级提升）。反复收获作物优先加速多收一茬，一次性高价值作物优先品质。",
    },
    "processing_seed_maker_strat": {
        "id": "processing_seed_maker_strat",
        "category": "mechanic",
        "keywords": ["种子制造机策略", "seed maker strategy", "远古种子刷法"],
        "title": "种子制造机策略",
        "content": "种子制造机：普通作物果实→约2颗种子；远古种子果实→远古种子（有小概率混合种子）。策略：第一批远古种子果留作繁殖而非出售，扩大温室种植规模；高溢价反季种子优先从万物铺购买而非制造。作物品质不影响产出种子数量。",
    },
    "mechanic_keg_vs_jar": {
        "id": "mechanic_keg_vs_jar",
        "category": "mechanic",
        "keywords": ["酒桶", "酱缸", "keg vs jar", "酿酒还是腌菜"],
        "title": "酒桶vs酱缸收益对比",
        "content": "酒桶（酿酒）：作物基础售价×3，加工时间2~4天。酱缸（腌菜）：作物基础售价×2+50，加工时间1~2天。高价作物（>100文）优先酿酒；低价作物（<50文）腌菜更稳。水果→酿酒；蔬菜→腌菜。茶叶→制茶机（售价更高）优于酿酒。",
    },
    "recipe_wine": {
        "id": "recipe_wine",
        "category": "recipe",
        "keywords": ["果酒", "wine", "水果酿酒"],
        "title": "果酒",
        "content": "果酒（任意水果×1放入酒桶，3天，水果售价×3）：水果酒售价为原料水果的3倍。高价值果酒优先选高售价水果（如蜜桃、葡萄、甜瓜等）再入桶。反复收获水果可滚动投料，酒坊批量摆放可稳定日收。部分果酒陈酿后售价更高（以游戏内说明为准）。",
    },
    "recipe_jelly": {
        "id": "recipe_jelly",
        "category": "recipe",
        "keywords": ["果酱", "jelly", "水果酱"],
        "title": "果酱",
        "content": "果酱（任意水果×1放入酱缸，3天，水果售价×2+50）：加工时间比酿酒短，适合周转快的水果。高售价水果做酱仍可观，但同价水果一般优先酒桶（×3倍率更高）。",
    },
    "mechanic_dog_cat": {
        "id": "mechanic_dog_cat",
        "category": "mechanic",
        "keywords": ["宠物", "dog", "cat", "狗", "猫", "宠物好感"],
        "title": "宠物系统",
        "content": "宠物可在游戏中领养猫或狗并取名。每日抚摸维持好感，满水碗可额外加分。宠物无经济产出，为陪伴与氛围元素；狗偶会叼来小物件，猫会在田边闲逛。与牲畜互动可触发系统亲和（宠物/喂食行为）。",
    },
    "mechanic_foraging_xp_fast": {
        "id": "mechanic_foraging_xp_fast",
        "category": "skill",
        "keywords": ["采集快速升级", "foraging xp", "砍树练级"],
        "title": "采集快速升级技巧",
        "content": "采集经验来自砍树、采野果、竹林拾遗等。快速升级：1. 竹林田庄每日林中拾遗+双倍采集加成 2. 野外采集区按季节刷野果（春笋、秋实等） 3. 矿洞周边砍树清障 4. 吃加采集经验料理。冬季可转向矿洞木柴与腊梅等冬季采集物。",
    },
    "mechanic_farming_xp_fast": {
        "id": "mechanic_farming_xp_fast",
        "category": "skill",
        "keywords": ["农耕快速升级", "farming xp", "种地练级"],
        "title": "农耕快速升级技巧",
        "content": "农耕经验来自种植与收获（高售价作物经验更多）。快速升级：1. 春种土豆/四季豆等短周期作物多季轮收 2. 秋种南瓜等高价作物 3. 动物抚摸与收蛋挤奶也加农耕经验 4. 加速肥料缩短周期=更多收获轮次 5. 桃源田庄换季自动施肥可省人工。正常游玩第一年内可达10级。",
    },
}


def contains_foreign(text: str) -> bool:
    lower = text.lower()
    for m in FOREIGN_MARKERS:
        if m in text or m.lower() in lower:
            return True
    return False


def entry_blob(e: dict) -> str:
    return " ".join([
        e.get("id", ""),
        e.get("title", ""),
        e.get("content", ""),
        " ".join(e.get("keywords", [])),
    ])


def main():
    files = sorted(glob.glob(os.path.join(KB_DIR, "kb_part*.json")))
    total_before = 0
    total_after = 0
    deleted = []
    rewritten = []
    still_dirty = []

    for path in files:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        total_before += len(data)
        new_data = []
        for e in data:
            eid = e.get("id", "")
            if eid in DELETE_IDS:
                deleted.append((os.path.basename(path), eid, e.get("title", "")))
                continue
            if eid in REWRITES:
                new_e = REWRITES[eid]
                if new_e is not None:
                    new_data.append(new_e)
                    rewritten.append((os.path.basename(path), eid))
                continue
            # festival_stardew_fair -> rewrite with new id
            if eid == "festival_stardew_fair":
                new_data.append(REWRITES["festival_stardew_fair"])
                rewritten.append((os.path.basename(path), eid, "festival_harvest_fair"))
                continue
            blob = entry_blob(e)
            if contains_foreign(blob):
                still_dirty.append((os.path.basename(path), eid, e.get("title", "")))
            new_data.append(e)
        total_after += len(new_data)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(new_data, f, ensure_ascii=False, indent=2)
            f.write("\n")

    print(f"Before: {total_before} entries")
    print(f"After:  {total_after} entries")
    print(f"Deleted: {len(deleted)}")
    for f, eid, title in deleted:
        print(f"  - [{f}] {eid}: {title}")
    print(f"Rewritten: {len(rewritten)}")
    for item in rewritten:
        print(f"  - {item}")
    if still_dirty:
        print(f"Still contaminated ({len(still_dirty)}):")
        for f, eid, title in still_dirty:
            print(f"  ! [{f}] {eid}: {title}")
    else:
        print("All remaining entries clean.")


if __name__ == "__main__":
    main()
