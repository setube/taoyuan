package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"taoyuan-backend/internal/llm"
)

// EvaluateMeritWish 评估玩家功勋商店许愿（纯 LLM）
func (h *Handler) EvaluateMeritWish(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Message   string         `json:"message"`
		PersonaID string         `json:"personaId"`
		Merit     int            `json:"merit"`
		Affinity  int            `json:"affinity"`
		Context   map[string]any `json:"context"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "请求格式错误", http.StatusBadRequest)
		return
	}
	if req.Message == "" {
		jsonError(w, "消息不能为空", http.StatusBadRequest)
		return
	}

	result := h.meritWishEvaluate(req.Message, req.PersonaID, req.Merit, req.Affinity, req.Context)
	jsonOK(w, result)
}

// meritWishEvaluate 由 LLM 判定 isWish 并定价；非许愿返回 {"isWish":false}
func (h *Handler) meritWishEvaluate(message, personaID string, merit, affinity int, ctx map[string]any) map[string]any {
	if affinity < 20 {
		if h.llmClientFast == nil {
			return map[string]any{"isWish": false}
		}
		intent := h.meritWishIntentOnly(message, personaID, merit, affinity, ctx)
		if !intent {
			return map[string]any{"isWish": false}
		}
		return map[string]any{
			"isWish":   true,
			"feasible": false,
			"reply": personaReply(personaID, fmt.Sprintf(
				"系统亲和不足（专属定制需 20/100，当前 %d/100；与村民好感度无关）。多和系统聊天、打开系统面板或完成任务可提升。",
				affinity,
			)),
		}
	}

	if h.llmClientFast == nil {
		return map[string]any{"isWish": false}
	}

	playerCtx := buildPlayerContextText(ctx)
	prompt := fmt.Sprintf(`你是功勋商店许愿评估系统。先判断玩家消息是否为「通过功勋商店专属定制实现的愿望请求」，再定价。

【玩家状态】
%s
当前功勋：%d，系统亲和：%d

【玩家消息】「%s」

【判定 isWish】
- true：玩家希望系统把某效果/物品上架到功勋商店「专属定制」栏（如要钱、要物品、要 buff、要属性提升）
- false：普通玩法咨询、闲聊、打招呼（如「青菜怎么种」「NPC在哪」「你好」），与专属定制无关

【判定 feasible】（仅 isWish=true 时）
- 拒绝（feasible=false）：无限金钱、无敌、秒杀、全NPC满好感、满级、开挂等破坏平衡
- 可行：按规则定价并生成 offer

【定价参考】
- 金钱一次性：功勋参考 pow(amount/500,0.72)*6*(1+day/400)，最低10，超过50万文拒绝
- 永久出售+5%%参考80功勋；+10%%参考180功勋
- 限时buff：永久价×(天数/100)，最低3功勋
- 体力/生命上限每+5参考15功勋；专属定制栏各最多兑换3次（maxPurchases:3）
- 背包扩容：effect.type=expand_bag，功勋约为(500+level*500)/40，最低8
- 发放物品 grant_item：任意游戏内已实装物品（effect 含 itemId 与 quantity，数量 1~99）；功勋定价参考 max(3, ceil(max(基础售价,10)×数量/8))；itemId 须为英文 id（如 hay、ancient_seed）
- 允许的效果类型：grant_money, grant_item, max_stamina, max_hp, expand_bag, sell_price_bonus, crop_yield, crop_growth, stamina_cost_reduction, fishing_rate, fish_rare, ore_drop, mine_damage_reduction, skill_exp, livestock_freq, tavern_guests

仅输出 JSON：
{"isWish":true,"feasible":true,"reply":"人格化回复","offer":{"name":"","description":"","cost":0,"buffType":"permanent","maxPurchases":3,"effect":{"type":"max_hp","value":10}}}
非许愿则 {"isWish":false}
不可行许愿则 isWish=true, feasible=false, offer=null`,
		playerCtx, merit, affinity, message)

	reply, err := h.llmClientFast.Chat([]llm.Message{
		{Role: "system", Content: "你只输出合法 JSON，不要 markdown。"},
		{Role: "user", Content: prompt},
	}, 0.3, 600)
	if err != nil {
		return map[string]any{"isWish": false}
	}

	cleaned := extractJSONObject(reply)
	var parsed map[string]any
	if json.Unmarshal([]byte(cleaned), &parsed) != nil {
		return map[string]any{"isWish": false}
	}
	if isWish, ok := parsed["isWish"].(bool); !ok || !isWish {
		return map[string]any{"isWish": false}
	}
	return parsed
}

// meritWishIntentOnly 亲和不足时仅判断是否为许愿（避免完整定价）
func (h *Handler) meritWishIntentOnly(message, personaID string, merit, affinity int, ctx map[string]any) bool {
	playerCtx := buildPlayerContextText(ctx)
	prompt := fmt.Sprintf(`判断玩家消息是否为「通过功勋商店专属定制实现的愿望请求」。

【玩家状态】
%s

【玩家消息】「%s」

仅输出 JSON：{"isWish":true} 或 {"isWish":false}`, playerCtx, message)

	reply, err := h.llmClientFast.Chat([]llm.Message{
		{Role: "system", Content: "你只输出合法 JSON，不要 markdown。"},
		{Role: "user", Content: prompt},
	}, 0.2, 80)
	if err != nil {
		return false
	}
	cleaned := extractJSONObject(reply)
	var parsed map[string]any
	if json.Unmarshal([]byte(cleaned), &parsed) != nil {
		return false
	}
	isWish, _ := parsed["isWish"].(bool)
	return isWish
}

func extractJSONObject(s string) string {
	start := -1
	end := -1
	for i, r := range s {
		if r == '{' && start < 0 {
			start = i
		}
		if r == '}' {
			end = i
		}
	}
	if start >= 0 && end > start {
		return s[start : end+1]
	}
	return s
}

func personaReply(personaID, core string) string {
	switch personaID {
	case "chaofeng":
		return "嘲风：啧，" + core
	case "taosu":
		return "桃酥：呜……" + core + " (｡•́︿•̀｡)"
	case "moyan":
		return "墨言：" + core
	default:
		return "青鸾：" + core
	}
}
