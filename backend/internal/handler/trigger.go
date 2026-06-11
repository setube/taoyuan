package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"taoyuan-backend/internal/llm"
)

// ChatTrigger 游戏事件驱动的系统主动搭话（非玩家发起，不写入对话历史）
func (h *Handler) ChatTrigger(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PersonaID     string         `json:"personaId"`
		TriggerType   string         `json:"triggerType"`
		EventSummary  string         `json:"eventSummary"`
		TemplateHint  string         `json:"templateHint"`
		Affinity      int            `json:"affinity"`
		Context       map[string]any `json:"context"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "请求格式错误", http.StatusBadRequest)
		return
	}
	if req.PersonaID == "" || req.TriggerType == "" || req.EventSummary == "" {
		jsonError(w, "缺少 personaId / triggerType / eventSummary", http.StatusBadRequest)
		return
	}

	client := h.llmClientFast
	if client == nil {
		client = h.llmClient
	}
	if client == nil {
		if req.TemplateHint != "" {
			jsonOK(w, map[string]string{"message": req.TemplateHint, "source": "template"})
			return
		}
		jsonError(w, "灵识未连接", http.StatusServiceUnavailable)
		return
	}

	playerCtx := buildPlayerContextText(req.Context)
	if req.Affinity > 0 {
		playerCtx += fmt.Sprintf("- 系统亲和度：%d/100（越高语气越亲近）\n", req.Affinity)
	}

	userPrompt := buildTriggerUserPrompt(req.TriggerType, req.EventSummary, req.TemplateHint)

	var messages []llm.Message
	messages = append(messages, llm.Message{
		Role:    "system",
		Content: llm.BuildSystemPrompt(req.PersonaID, playerCtx, ""),
	})
	messages = append(messages, llm.Message{Role: "user", Content: userPrompt})

	reply, err := client.Chat(messages, 0.6, 180)
	if err != nil || strings.TrimSpace(reply) == "" {
		fallback := req.TemplateHint
		if fallback == "" {
			fallback = "（系统注意到了什么……）"
		}
		jsonOK(w, map[string]string{"message": fallback, "source": "template"})
		return
	}

	jsonOK(w, map[string]string{"message": llm.SanitizeReply(req.PersonaID, strings.TrimSpace(reply)), "source": "llm"})
}

func buildTriggerUserPrompt(triggerType, eventSummary, templateHint string) string {
	var sb strings.Builder
	sb.WriteString("【系统主动搭话】\n")
	sb.WriteString("游戏中发生了以下事件。请用你的角色性格，主动对玩家说一句话（1～2 句，简洁自然）。\n")
	sb.WriteString("要求：\n")
	sb.WriteString("- 这是系统主动开口，不是回答玩家提问\n")
	sb.WriteString("- 严禁编造游戏中不存在的物品、NPC、地点或机制\n")
	sb.WriteString("- 严禁提及星露谷物语或其他游戏的内容（如防风草、Joja、皮埃尔、姜岛、祝尼魔等）\n")
	sb.WriteString("- 仅引用事件详情与玩家状态中已有信息，禁止凭空布置农活任务\n")
	sb.WriteString("- 不要以 AI/助手 自称，保持角色人设\n")
	sb.WriteString("- 可参考语气锚点，但勿照抄\n\n")
	sb.WriteString(fmt.Sprintf("事件类型：%s\n", triggerType))
	sb.WriteString(fmt.Sprintf("事件详情：%s\n", eventSummary))
	if templateHint != "" {
		sb.WriteString(fmt.Sprintf("语气锚点：%s\n", templateHint))
	}
	return sb.String()
}
