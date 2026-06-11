package handler

import (
	"testing"

	"taoyuan-backend/internal/knowledge"
	"taoyuan-backend/internal/search"
)

func TestAugmentLocationKnowledge(t *testing.T) {
	doc, err := knowledge.LoadDir("../../internal/knowledge")
	if err != nil {
		t.Fatalf("load kb: %v", err)
	}
	idx := search.NewIndex(doc)

	results := augmentLocationKnowledge(idx, "加工坊每台机器干什么", nil)
	if len(results) == 0 {
		t.Fatal("expected augmented results")
	}
	found := false
	for _, r := range results {
		if r.Entry.ID == "loc_processing_machines_guide" {
			found = true
			break
		}
	}
	if !found {
		t.Fatal("loc_processing_machines_guide not injected")
	}
}

func TestAugmentFishPondCareKnowledge(t *testing.T) {
	doc, err := knowledge.LoadDir("../../internal/knowledge")
	if err != nil {
		t.Fatalf("load kb: %v", err)
	}
	idx := search.NewIndex(doc)

	results := augmentFishPondKnowledge(idx, "鱼塘怎么喂鱼", nil)
	foundCare := false
	for _, r := range results {
		if r.Entry.ID == "mechanic_fish_pond_care" {
			foundCare = true
			break
		}
	}
	if !foundCare {
		t.Fatal("mechanic_fish_pond_care not injected")
	}
}
