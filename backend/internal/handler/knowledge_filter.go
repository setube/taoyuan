package handler

import (
	"strings"

	"taoyuan-backend/internal/llm"
	"taoyuan-backend/internal/search"
)

func filterKnowledgeResults(results []search.SearchResult) []search.SearchResult {
	if len(results) == 0 {
		return results
	}
	filtered := make([]search.SearchResult, 0, len(results))
	for _, r := range results {
		blob := strings.Join([]string{
			r.Entry.ID,
			r.Entry.Title,
			r.Entry.Content,
			strings.Join(r.Entry.Keywords, " "),
		}, " ")
		if llm.FilterForeignGameContent(blob) {
			filtered = append(filtered, r)
		}
	}
	return filtered
}
