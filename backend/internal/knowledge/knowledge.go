package knowledge

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
)

// Entry 知识库条目
type Entry struct {
	ID         string   `json:"id"`
	Category   string   `json:"category"`
	Keywords   []string `json:"keywords"`
	Title      string   `json:"title"`
	Content    string   `json:"content"`
	RelatedIDs []string `json:"relatedIds,omitempty"`
}

// Category 分类
type Category struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
}

// Document 知识库文档
type Document struct {
	Entries    []Entry    `json:"entries"`
	Categories []Category `json:"categories"`
}

// 分类名映射
var categoryNames = map[string]string{
	"crop":        "作物",
	"fish":        "鱼类",
	"recipe":      "菜谱",
	"processing":  "加工设备",
	"mine":        "矿洞",
	"npc":         "NPC",
	"animal":      "动物",
	"equipment":   "装备",
	"skill":       "技能",
	"mechanic":    "游戏机制",
	"shop":        "商店",
	"festival":    "节日",
	"tavern":      "酒肆经营",
	"fruit_tree":  "果树",
	"hidden_npc":  "隐藏仙灵",
}

// LoadDir 从目录加载多个纯数组 JSON 文件，合并为 Document
func LoadDir(dir string) (*Document, error) {
	entries, err := filepath.Glob(filepath.Join(dir, "kb_part*.json"))
	if err != nil {
		return nil, err
	}
	sort.Strings(entries)

	var all []Entry
	for _, f := range entries {
		data, err := os.ReadFile(f)
		if err != nil {
			return nil, err
		}
		var batch []Entry
		if err := json.Unmarshal(data, &batch); err != nil {
			return nil, err
		}
		all = append(all, batch...)
	}

	categories := deriveCategories(all)
	return &Document{Entries: all, Categories: categories}, nil
}

func deriveCategories(entries []Entry) []Category {
	seen := map[string]bool{}
	var cats []Category
	for _, e := range entries {
		if seen[e.Category] {
			continue
		}
		seen[e.Category] = true
		name := categoryNames[e.Category]
		if name == "" {
			name = e.Category
		}
		cats = append(cats, Category{
			ID:          e.Category,
			Name:        name,
			Description: "",
			Icon:        "",
		})
	}
	return cats
}