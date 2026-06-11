package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"taoyuan-backend/internal/llm"
)

// EvaluateQuest 生成系统任务完成/失败评价
func (h *Handler) EvaluateQuest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PersonaID string         `json:"personaId"`
		Outcome   string         `json:"outcome"`
		Quest     map[string]any `json:"quest"`
		Context   map[string]any `json:"context"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "请求格式错误", http.StatusBadRequest)
		return
	}
	if req.Outcome != "completed" && req.Outcome != "failed" {
		jsonError(w, "outcome 须为 completed 或 failed", http.StatusBadRequest)
		return
	}

	title := strField(req.Quest, "title")
	if title == "" {
		title = strField(req.Quest, "type")
	}
	desc := strField(req.Quest, "description")
	reward := intField(req.Quest, "reward")
	fine := intField(req.Quest, "fine")
	merit := intField(req.Context, "merit")
	affinity := intField(req.Context, "affinity")
	currentDay := intField(req.Context, "day")

	if h.llmClientFast != nil {
		outcomeLabel := "完成"
		if req.Outcome == "failed" {
			outcomeLabel = "失败（过期）"
		}
		prompt := fmt.Sprintf(`你是桃源乡系统伙伴（人格：%s），请对刚结束的系统任务写一段事后评价（80~180字，中文）。

任务结果：%s
任务标题：%s
任务描述：%s
功勋奖励：%d，罚金：%d
接受日：%v，结束日：%v，期限日：%v
议价轮数：%v
当前功勋：%d，亲和度：%d，游戏日：%d

评价须包含：
1. 对本次结果的一句总结
2. 若失败：分析可能原因与下次可怎么做
3. 对任务难度/期限是否合理的一句判断
语气符合人格，不要 JSON，不要 markdown 标题。`,
			req.PersonaID,
			outcomeLabel,
			title,
			desc,
			reward,
			fine,
			req.Quest["acceptedDay"],
			req.Quest["endedDay"],
			req.Quest["deadline"],
			req.Quest["negotiationRounds"],
			merit,
			affinity,
			currentDay,
		)

		reply, err := h.llmClientFast.Chat([]llm.Message{
			{Role: "system", Content: "你是游戏内系统伙伴，只输出评价正文，不要加引号包裹。"},
			{Role: "user", Content: prompt},
		}, 0.5, 400)
		if err == nil && strings.TrimSpace(reply) != "" {
			jsonOK(w, map[string]any{"evaluation": strings.TrimSpace(reply)})
			return
		}
	}

	jsonOK(w, map[string]any{"evaluation": ""})
}

func strField(m map[string]any, key string) string {
	if m == nil {
		return ""
	}
	v, ok := m[key]
	if !ok || v == nil {
		return ""
	}
	switch t := v.(type) {
	case string:
		return t
	default:
		return fmt.Sprintf("%v", t)
	}
}
