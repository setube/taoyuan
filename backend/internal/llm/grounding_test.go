package llm

import (
	"strings"
	"testing"
)

func TestContainsForeignGameContent(t *testing.T) {
	cases := []struct {
		text string
		want bool
	}{
		{"去捡点野生的防风草种子", true},
		{"Joja超市会员卡", true},
		{"春2天，体力60/120，去种青菜", false},
		{"下矿洞注意体力，孙铁匠可以升级工具", false},
		{"铱锭在熔炉冶炼", false},
	}
	for _, c := range cases {
		got := ContainsForeignGameContent(c.text)
		if got != c.want {
			t.Errorf("ContainsForeignGameContent(%q) = %v, want %v", c.text, got, c.want)
		}
	}
}

func TestSanitizeReply(t *testing.T) {
	bad := "明天去锄门口的草，捡防风草种子。"
	out := SanitizeReply("chaofeng", bad)
	if ContainsForeignGameContent(out) {
		t.Fatalf("sanitized still foreign: %q", out)
	}
	if out == bad {
		t.Fatal("expected replacement")
	}
}

func TestSanitizeReplyHallucinatedNPC(t *testing.T) {
	bad := "溪边渔舍的沈伯处有售鱼苗，每尾50文。"
	out := SanitizeReply("moyan", bad)
	if out == bad {
		t.Fatal("expected replacement for hallucinated reply")
	}
	if !strings.Contains(out, "清溪") {
		t.Fatalf("expected fish fry guidance, got %q", out)
	}
}
