package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"taoyuan-backend/internal/llm"
)

// DispatchQuest AI 派发系统任务（在线模式；失败时前端回退模板池）
func (h *Handler) DispatchQuest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PersonaID  string         `json:"personaId"`
		Affinity   int            `json:"affinity"`
		Merit      int            `json:"merit"`
		CurrentDay int            `json:"currentDay"`
		Context    map[string]any `json:"context"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "请求格式错误", http.StatusBadRequest)
		return
	}
	if req.PersonaID == "" {
		req.PersonaID = "qingluan"
	}
	if req.CurrentDay <= 0 {
		req.CurrentDay = intField(req.Context, "day")
	}

	playerCtx := buildPlayerContextText(req.Context)

	if h.llmClientFast == nil {
		jsonOK(w, map[string]any{"feasible": false})
		return
	}

	prompt := fmt.Sprintf(`你是桃源乡系统任务策划。根据玩家当前进度派发一条可完成的系统任务（非村民委托）。

【玩家状态】
%s
当前游戏日：%d，系统亲和：%d，功勋：%d

【任务类型】仅限其一：
- collect / craft：收集或制作物品（target.itemId + target.quantity）
- fish：钓到鱼（target.fishId + target.quantity）
- mine：到达矿洞层数（target.floor）
- social：NPC好感（target.npcId 可选，target.hearts 为心数1~4）
- skill：技能等级（target.skillType: farming|fishing|mining|cooking|combat|foraging|any，target.skillLevel 1~10）
- tavern：酒肆（须 tavernLevel>=1；metric=revenue|reputation|feast，threshold 为数值）

【难度 difficulty】1~4（1最易，奖励功勋 2/5/10/20）
【期限】由前端按难度计算，你只需设 difficulty
【要求】
- 目标须与玩家当前能力匹配（勿派未解锁酒肆/矿层远超进度）
- itemId / fishId / npcId 须为游戏内英文 id（如 copper_ore, wood, sun_tiejiang）
- title 8字内，description 30字内，说清楚目标
- announcement 为人格化派发语（60字内，告知新任务与功勋奖励区间）

仅输出 JSON：
{"feasible":true,"reply":"派发语","quest":{"type":"collect","difficulty":2,"title":"木炭补给","description":"收集 8 个木炭交给系统记录","target":{"itemId":"charcoal","quantity":8}}}
不可行则 {"feasible":false,"reply":"原因"}`,
		playerCtx, req.CurrentDay, req.Affinity, req.Merit)

	reply, err := h.llmClientFast.Chat([]llm.Message{
		{Role: "system", Content: "你只输出合法 JSON，不要 markdown。"},
		{Role: "user", Content: prompt},
	}, 0.35, 600)
	if err != nil {
		jsonOK(w, map[string]any{"feasible": false})
		return
	}

	cleaned := extractJSONObject(reply)
	var parsed map[string]any
	if json.Unmarshal([]byte(cleaned), &parsed) != nil {
		jsonOK(w, map[string]any{"feasible": false})
		return
	}

	feasible, _ := parsed["feasible"].(bool)
	if !feasible {
		replyText, _ := parsed["reply"].(string)
		if strings.TrimSpace(replyText) == "" {
			replyText = "暂无合适任务，稍后再试。"
		}
		jsonOK(w, map[string]any{"feasible": false, "reply": personaReply(req.PersonaID, replyText)})
		return
	}

	quest, ok := parsed["quest"].(map[string]any)
	if !ok || quest == nil {
		jsonOK(w, map[string]any{"feasible": false})
		return
	}

	replyText, _ := parsed["reply"].(string)
	jsonOK(w, map[string]any{
		"feasible": true,
		"reply":    strings.TrimSpace(replyText),
		"quest":    quest,
	})
}
