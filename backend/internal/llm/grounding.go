package llm

import (
	"strings"
	"unicode/utf8"
)

// foreignGameMarkers 其他游戏（尤其星露谷物语）特征词，出现即视为串台
var foreignGameMarkers = []string{
	"星露谷", "Stardew", "stardew",
	"防风草", "parsnip", "Parsnip",
	"Joja", "joja", "JOJA",
	"皮埃尔", "Pierre",
	"鹈鹕镇", "Pelican Town",
	"祝尼魔", "Junimo", "junimo",
	"姜岛", "Ginger Island", "ginger island",
	"齐先生", "金核桃", "齐币",
	"社区中心献祭", "社区中心广场",
	"玛妮", "Marnie",
	"刘易斯镇长", "刘易斯",
	"威利", "Willy",
	"冈瑟", "Gunther",
	"科罗布斯", "Krobus",
	"沙漠商人", "赌场二楼",
	"酱料女王",
	"复活节彩蛋节", "花舞节",
}

// ContainsForeignGameContent 检测文本是否混入其他游戏内容
func ContainsForeignGameContent(text string) bool {
	if text == "" {
		return false
	}
	lower := strings.ToLower(text)
	for _, m := range foreignGameMarkers {
		if strings.Contains(text, m) || strings.Contains(lower, strings.ToLower(m)) {
			return true
		}
	}
	return false
}

// FilterForeignGameContent 移除含其他游戏特征的知识库条目
func FilterForeignGameContent(text string) bool {
	return !ContainsForeignGameContent(text)
}

// GroundedChatFallback 闲聊/串台时的安全回退（按人格）
func GroundedChatFallback(personaID string) string {
	fallbacks := map[string]string{
		"qingluan": "小友，此事吾尚无据可答。且依眼前农事行事，勿凭空臆测。",
		"chaofeng": "啧，这问题我没谱。别瞎琢磨了，按你面板里看得见的状态干活就行。",
		"taosu":    "主人，这个桃酥也不太确定呢……先按游戏里能看到的来做吧 (◕ᴗ◕✿)",
		"moyan":    "记录：该问题缺乏可验证数据。建议仅依据当前面板状态行动，禁止臆造。",
	}
	if s, ok := fallbacks[personaID]; ok {
		return s
	}
	return fallbacks["qingluan"]
}

// hallucinatedGameMarkers 模型常编造但游戏中不存在的人名/地点
var hallucinatedGameMarkers = []string{
	"沈伯",
	"溪边渔舍",
}

// ContainsHallucinatedGameContent 检测是否编造了不存在的游戏实体
func ContainsHallucinatedGameContent(text string) bool {
	if text == "" {
		return false
	}
	for _, m := range hallucinatedGameMarkers {
		if strings.Contains(text, m) {
			return true
		}
	}
	return false
}

// FishFryGroundedFallback 鱼苗类问题的纠正回复
func FishFryGroundedFallback(personaID string) string {
	fallbacks := map[string]string{
		"qingluan": "小友，桃源乡并无鱼苗摊贩。请至地图「清溪」钓鱼，将可养殖之鱼自背包放入田庄「鱼塘」即可。清溪李渔翁只谈钓术，不卖鱼苗。",
		"chaofeng": "啧，游戏里没卖鱼苗的商店。去清溪钓鱼，背包里有能养的鱼就回鱼塘面板放进去，别瞎找NPC买。",
		"taosu":    "主人，鱼苗不能买哦～要去「清溪」钓鱼，钓到的鱼从背包放进「鱼塘」就行啦。李渔翁爷爷在清溪，但他不卖鱼苗 (◕ᴗ◕✿)",
		"moyan":    "记录：鱼苗无购买渠道。流程：清溪钓鱼→背包→鱼塘面板「放入鱼苗」。李渔翁（清溪NPC）不提供鱼苗销售。",
	}
	if s, ok := fallbacks[personaID]; ok {
		return s
	}
	return fallbacks["qingluan"]
}

// SanitizeReply 若回复串台或编造实体则替换为安全回退
func SanitizeReply(personaID, reply string) string {
	trimmed := strings.TrimSpace(reply)
	if trimmed == "" {
		return reply
	}
	if ContainsForeignGameContent(trimmed) {
		return GroundedChatFallback(personaID)
	}
	if ContainsHallucinatedGameContent(trimmed) {
		return FishFryGroundedFallback(personaID)
	}
	return reply
}

// TruncateForLog 日志截断
func TruncateForLog(s string, maxRunes int) string {
	if utf8.RuneCountInString(s) <= maxRunes {
		return s
	}
	runes := []rune(s)
	return string(runes[:maxRunes]) + "…"
}
