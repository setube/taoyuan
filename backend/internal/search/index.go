package search

import (
	"sort"
	"strings"
	"sync"

	"taoyuan-backend/internal/knowledge"
)

// Index 内存搜索索引
type Index struct {
	mu      sync.RWMutex
	entries []knowledge.Entry
	// keyword → entry indices (倒排索引)
	inverted map[string][]int
}

// NewIndex 构建搜索索引
func NewIndex(doc *knowledge.Document) *Index {
	idx := &Index{
		entries:  doc.Entries,
		inverted: make(map[string][]int),
	}
	for i, entry := range doc.Entries {
		for _, kw := range entry.Keywords {
			lower := strings.ToLower(kw)
			idx.inverted[lower] = append(idx.inverted[lower], i)
		}
	}
	return idx
}

// SearchResult 搜索结果
type SearchResult struct {
	Entry knowledge.Entry `json:"entry"`
	Score int              `json:"score"`
}

// Search 关键词搜索，返回按匹配度排序的结果（最多 10 条）
func (idx *Index) Search(query string, category string, limit int) []SearchResult {
	idx.mu.RLock()
	defer idx.mu.RUnlock()

	if limit <= 0 {
		limit = 10
	}

	lower := strings.ToLower(query)
	words := tokenize(lower)

	// 统计每个条目的命中次数
	scores := make(map[int]int)
	for _, word := range words {
		if indices, ok := idx.inverted[word]; ok {
			for _, entryIdx := range indices {
				scores[entryIdx]++
			}
		}
		// 部分匹配：检查关键词是否包含查询词
		for kw, indices := range idx.inverted {
			if strings.Contains(kw, word) {
				for _, entryIdx := range indices {
					scores[entryIdx]++
				}
			}
		}
	}

	// 反向部分匹配：查询词是否包含关键词（中文无空格查询核心）
	for kw, indices := range idx.inverted {
		if strings.Contains(lower, kw) {
			for _, entryIdx := range indices {
				scores[entryIdx] += 2 // 权重高于正向部分匹配
			}
		}
	}

	// 按分数排序
	type scored struct {
		entryIdx int
		score    int
	}
	var ranked []scored
	for entryIdx, score := range scores {
		if category != "" && entryIdx < len(idx.entries) && idx.entries[entryIdx].Category != category {
			continue
		}
		ranked = append(ranked, scored{entryIdx, score})
	}
	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].score > ranked[j].score
	})

	// 截断
	if len(ranked) > limit {
		ranked = ranked[:limit]
	}

	results := make([]SearchResult, len(ranked))
	for i, r := range ranked {
		results[i] = SearchResult{
			Entry: idx.entries[r.entryIdx],
			Score: r.score,
		}
	}
	return results
}

// GetByID 按 ID 获取单条
func (idx *Index) GetByID(id string) *knowledge.Entry {
	idx.mu.RLock()
	defer idx.mu.RUnlock()
	for i := range idx.entries {
		if idx.entries[i].ID == id {
			return &idx.entries[i]
		}
	}
	return nil
}

// Categories 返回有内容的分类列表
func (idx *Index) Categories() []string {
	idx.mu.RLock()
	defer idx.mu.RUnlock()
	seen := make(map[string]bool)
	var cats []string
	for _, e := range idx.entries {
		if !seen[e.Category] {
			seen[e.Category] = true
			cats = append(cats, e.Category)
		}
	}
	sort.Strings(cats)
	return cats
}

func tokenize(s string) []string {
	// 简单分词：按空格和常见分隔符切分
	words := strings.FieldsFunc(s, func(r rune) bool {
		return r == ' ' || r == ',' || r == '，' || r == '、' || r == '?' || r == '？'
	})
	// CJK 二元分字：补充中文查询的分词盲区
	var bigrams []string
	for _, word := range words {
		runes := []rune(word)
		for i := 0; i < len(runes)-1; i++ {
			bigrams = append(bigrams, string(runes[i:i+2]))
		}
	}
	// 去重
	seen := make(map[string]bool)
	var result []string
	for _, w := range append(words, bigrams...) {
		if len(w) >= 1 && !seen[w] {
			seen[w] = true
			result = append(result, w)
		}
	}
	return result
}