package handler

import (
	"strings"

	"taoyuan-backend/internal/search"
)

var systemKnowledgeIDs = []string{
	"mechanic_system_quest_overview",
	"mechanic_system_quest_merit",
	"mechanic_merit_shop",
	"mechanic_merit_shop_wish",
	"mechanic_system_quest_trigger",
	"mechanic_system_quest_negotiate",
}

func isSystemMechanicQuery(query string) bool {
	lower := strings.ToLower(query)
	keywords := []string{
		"功勋", "任务", "商店", "许愿", "议价", "merit", "系统任务",
		"功勋点", "功勋商店", "专属定制", "金手指", "灵赐",
	}
	for _, kw := range keywords {
		if strings.Contains(lower, strings.ToLower(kw)) {
			return true
		}
	}
	return false
}

var wishWellKnowledgeIDs = []string{"mechanic_wish_well"}

func isWishWellQuery(query string) bool {
	lower := strings.ToLower(query)
	keywords := []string{"许愿井", "华熙", "小王", "井灵", "心愿井", "wish well"}
	for _, kw := range keywords {
		if strings.Contains(lower, strings.ToLower(kw)) {
			return true
		}
	}
	return strings.Contains(query, "许愿") && strings.Contains(query, "井")
}

func augmentWishWellKnowledge(idx *search.Index, query string, results []search.SearchResult) []search.SearchResult {
	if !isWishWellQuery(query) {
		return results
	}
	seen := make(map[string]bool, len(results))
	for _, r := range results {
		seen[r.Entry.ID] = true
	}
	augmented := make([]search.SearchResult, 0, len(results)+len(wishWellKnowledgeIDs))
	for _, id := range wishWellKnowledgeIDs {
		if seen[id] {
			continue
		}
		entry := idx.GetByID(id)
		if entry == nil {
			continue
		}
		augmented = append(augmented, search.SearchResult{Entry: *entry, Score: 10})
		seen[id] = true
	}
	augmented = append(augmented, results...)
	return augmented
}

var fishPondKnowledgeIDs = []string{
	"mechanic_fish_fry_source",
	"mechanic_fish_pond",
	"mechanic_fish_pond_care",
	"mechanic_fish_pond_species",
	"fish_acquisition_overview",
	"npc_li_yu_fishing",
}

var locationKnowledgeIDs = []string{
	"loc_map_panels",
	"loc_processing_workshop",
	"loc_processing_machines_guide",
	"loc_farm_placeables",
	"loc_animal_ranch_panel",
	"loc_cottage_panel",
	"loc_home_facilities_panel",
	"loc_farm_panel",
	"loc_breeding_panel",
	"loc_cooking_panel",
	"loc_tool_workshop_panel",
	"build_processing_machines",
	"build_animal_buildings",
	"build_farmhouse_cellar",
	"build_greenhouse_pond",
	"build_breeding_station",
}

func isFishPondQuery(query string) bool {
	lower := strings.ToLower(query)
	keywords := []string{
		"鱼苗", "幼鱼", "放鱼", "鱼塘", "养鱼", "养殖鱼",
		"鱼饲料", "喂鱼", "水质", "鱼塘繁殖",
		"鱼怎么获得", "鱼获取", "在哪钓", "怎么钓",
		"fish fry", "fish pond",
	}
	for _, kw := range keywords {
		if strings.Contains(lower, strings.ToLower(kw)) {
			return true
		}
	}
	if strings.Contains(query, "鱼") && (strings.Contains(query, "买") || strings.Contains(query, "购") || strings.Contains(query, "哪")) {
		return true
	}
	return false
}

func augmentFishPondKnowledge(idx *search.Index, query string, results []search.SearchResult) []search.SearchResult {
	if !isFishPondQuery(query) {
		return results
	}
	seen := make(map[string]bool, len(results))
	for _, r := range results {
		seen[r.Entry.ID] = true
	}
	augmented := make([]search.SearchResult, 0, len(results)+len(fishPondKnowledgeIDs))
	for _, id := range fishPondKnowledgeIDs {
		if seen[id] {
			continue
		}
		entry := idx.GetByID(id)
		if entry == nil {
			continue
		}
		augmented = append(augmented, search.SearchResult{Entry: *entry, Score: 12})
		seen[id] = true
	}
	augmented = append(augmented, results...)
	return augmented
}

func isLocationQuery(query string) bool {
	lower := strings.ToLower(query)
	keywords := []string{
		"牧场", "设施", "加工坊", "小屋", "农场", "灶台", "育种", "工坊",
		"地图", "面板", "洒水器", "稻草人", "酒坊", "酱缸", "蜂箱", "熔炉",
		"畜舍", "鸡舍", "温室", "仓库", "山洞", "烹饪", "锻造", "工具升级",
		"加工机器", "加工区", "放置机器",
	}
	for _, kw := range keywords {
		if strings.Contains(lower, strings.ToLower(kw)) {
			return true
		}
	}
	return false
}

func augmentLocationKnowledge(idx *search.Index, query string, results []search.SearchResult) []search.SearchResult {
	if !isLocationQuery(query) {
		return results
	}
	seen := make(map[string]bool, len(results))
	for _, r := range results {
		seen[r.Entry.ID] = true
	}
	augmented := make([]search.SearchResult, 0, len(results)+len(locationKnowledgeIDs))
	for _, id := range locationKnowledgeIDs {
		if seen[id] {
			continue
		}
		entry := idx.GetByID(id)
		if entry == nil {
			continue
		}
		augmented = append(augmented, search.SearchResult{Entry: *entry, Score: 11})
		seen[id] = true
	}
	augmented = append(augmented, results...)
	return augmented
}

func augmentSystemKnowledge(idx *search.Index, query string, results []search.SearchResult) []search.SearchResult {
	if !isSystemMechanicQuery(query) {
		return results
	}
	seen := make(map[string]bool, len(results))
	for _, r := range results {
		seen[r.Entry.ID] = true
	}
	augmented := make([]search.SearchResult, 0, len(results)+len(systemKnowledgeIDs))
	for _, id := range systemKnowledgeIDs {
		if seen[id] {
			continue
		}
		entry := idx.GetByID(id)
		if entry == nil {
			continue
		}
		augmented = append(augmented, search.SearchResult{Entry: *entry, Score: 5})
		seen[id] = true
	}
	augmented = append(augmented, results...)
	return augmented
}
