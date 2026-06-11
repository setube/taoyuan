package handler

import (
	"testing"

	"taoyuan-backend/internal/knowledge"
	"taoyuan-backend/internal/search"
)

func TestAugmentFishPondKnowledge(t *testing.T) {
	doc, err := knowledge.LoadDir("../../internal/knowledge")
	if err != nil {
		t.Fatalf("load kb: %v", err)
	}
	idx := search.NewIndex(doc)

	results := augmentFishPondKnowledge(idx, "鱼苗在哪买", nil)
	if len(results) == 0 {
		t.Fatal("expected augmented results")
	}
	found := false
	for _, r := range results {
		if r.Entry.ID == "mechanic_fish_fry_source" {
			found = true
			break
		}
	}
	if !found {
		t.Fatal("mechanic_fish_fry_source not injected")
	}
}

func TestAugmentFishAcquisitionKnowledge(t *testing.T) {
	doc, err := knowledge.LoadDir("../../internal/knowledge")
	if err != nil {
		t.Fatalf("load kb: %v", err)
	}
	idx := search.NewIndex(doc)

	results := augmentFishPondKnowledge(idx, "鲫鱼怎么获得", nil)
	foundOverview := false
	for _, r := range results {
		if r.Entry.ID == "fish_acquisition_overview" {
			foundOverview = true
			break
		}
	}
	if !foundOverview {
		t.Fatal("fish_acquisition_overview not injected")
	}
	if idx.GetByID("fish_get_crucian") == nil {
		t.Fatal("fish_get_crucian missing from kb")
	}
}
