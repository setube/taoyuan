package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"taoyuan-backend/internal/config"
	"taoyuan-backend/internal/llm"
	"taoyuan-backend/internal/search"
	"taoyuan-backend/internal/store"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	idx           *search.Index
	db            store.Store
	cfg           *config.Config
	llmClient     *llm.Client
	llmClientFast *llm.Client
	sessions      *llm.SessionStore
}

func New(idx *search.Index, db store.Store, cfg *config.Config) *Handler {
	h := &Handler{
		idx:      idx,
		db:       db,
		cfg:      cfg,
		sessions: llm.NewSessionStore(),
	}
	if cfg.LLMAPIKey != "" {
		h.llmClient = llm.New(cfg.LLMAPIKey, cfg.LLMAPIURL, cfg.LLMModel)
		if cfg.LLMModelFast != "" {
			h.llmClientFast = llm.New(cfg.LLMAPIKey, cfg.LLMAPIURL, cfg.LLMModelFast)
		}
	}
	return h
}

// SearchKnowledge 知识库搜索
func (h *Handler) SearchKnowledge(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		jsonError(w, "缺少查询参数 q", http.StatusBadRequest)
		return
	}
	cat := r.URL.Query().Get("category")
	limit := 10
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 50 {
			limit = n
		}
	}
	results := h.idx.Search(q, cat, limit)
	jsonOK(w, results)
}

// ListCategories 列出所有分类
func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	cats := h.idx.Categories()
	jsonOK(w, cats)
}

// GetKnowledgeEntry 获取单条知识
func (h *Handler) GetKnowledgeEntry(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	entry := h.idx.GetByID(id)
	if entry == nil {
		jsonError(w, "条目不存在", http.StatusNotFound)
		return
	}
	jsonOK(w, entry)
}

// buildPlayerContextText 将前端传来的 context map 格式化为 LLM 可读的文本
func buildPlayerContextText(ctx map[string]any) string {
	if ctx == nil || len(ctx) == 0 {
		return ""
	}

	var sb strings.Builder

	// 季节和天数
	season := stringField(ctx, "season")
	day := intField(ctx, "day")
	if season != "" {
		seasonNames := map[string]string{"spring": "春", "summer": "夏", "autumn": "秋", "winter": "冬"}
		name := seasonNames[season]
		if name == "" {
			name = season
		}
		sb.WriteString(fmt.Sprintf("- 季节：%s，第 %d 天\n", name, day))
	}

	// 玩家信息
	name := stringField(ctx, "playerName")
	gender := stringField(ctx, "gender")
	money := intField(ctx, "money")
	stamina := intField(ctx, "stamina")
	maxStamina := intField(ctx, "maxStamina")
	if name != "" {
		genderText := "男"
		if gender == "female" {
			genderText = "女"
		}
		sb.WriteString(fmt.Sprintf("- 玩家：%s（%s），%d 文铜钱，体力 %d/%d\n", name, genderText, money, stamina, maxStamina))
	}

	// 技能等级
	if skills, ok := ctx["skills"].(map[string]any); ok {
		skillNames := map[string]string{
			"farming": "农耕", "mining": "挖矿", "fishing": "钓鱼",
			"foraging": "采集", "combat": "战斗", "cooking": "烹饪",
		}
		sb.WriteString("- 技能：")
		first := true
		for _, key := range []string{"farming", "mining", "fishing", "foraging", "combat", "cooking"} {
			lv := intField(skills, key)
			if lv > 0 || key == "farming" {
				if !first {
					sb.WriteString("、")
				}
				sb.WriteString(fmt.Sprintf("%s Lv%d", skillNames[key], lv))
				first = false
			}
		}
		sb.WriteString("\n")
	}

	// 建筑等级
	farmLv := intField(ctx, "farmhouseLevel")
	tavernLv := intField(ctx, "tavernLevel")
	farmNames := map[int]string{0: "茅屋", 1: "砖房", 2: "宅院", 3: "酒窖宅院"}
	farmName := farmNames[farmLv]
	if farmName == "" {
		farmName = fmt.Sprintf("Lv%d", farmLv)
	}
	sb.WriteString(fmt.Sprintf("- 农舍：%s", farmName))
	if tavernLv > 0 {
		sb.WriteString(fmt.Sprintf("，酒肆 Lv%d", tavernLv))
	}
	sb.WriteString("\n")

	// 背包摘要
	if topItems, ok := ctx["topItems"].([]any); ok && len(topItems) > 0 {
		sb.WriteString("- 背包：")
		itemStrs := make([]string, 0, len(topItems))
		for _, item := range topItems {
			if s, ok := item.(string); ok {
				itemStrs = append(itemStrs, s)
			}
		}
		sb.WriteString(strings.Join(itemStrs, "、"))
		sb.WriteString("\n")
	}

	return sb.String()
}

func stringField(m map[string]any, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func intField(m map[string]any, key string) int {
	if v, ok := m[key]; ok {
		switch n := v.(type) {
		case float64:
			return int(n)
		case int:
			return n
		}
	}
	return 0
}

// Chat AI 对话（带 session + 历史）
func (h *Handler) Chat(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Message   string         `json:"message"`
		PersonaID string         `json:"personaId"`
		SessionID string         `json:"sessionId"`
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
	if req.SessionID == "" {
		req.SessionID = "default"
	}

	// 从数据库恢复对话历史
	h.ensureHistory(req.SessionID, req.PersonaID)

	// 构建玩家状态文本
	playerCtx := buildPlayerContextText(req.Context)

	results := h.idx.Search(req.Message, "", 5)
	bestScore := 0
	if len(results) > 0 {
		bestScore = results[0].Score
	}

	// 知识匹配：用快速模型包装，或不走 LLM 直接返回
	if bestScore >= 1 && len(results) > 0 {
		var kbText strings.Builder
		for i, r := range results {
			if i >= 3 {
				break
			}
			kbText.WriteString(fmt.Sprintf("- %s：%s\n", r.Entry.Title, r.Entry.Content))
		}
		if h.llmClientFast != nil {
			reply, err := h.chatWithHistory(req.SessionID, req.PersonaID, req.Message, playerCtx, kbText.String(), h.llmClientFast)
			if err == nil {
				jsonOK(w, map[string]any{"type": "llm", "message": reply})
				return
			}
		}
		jsonOK(w, map[string]any{
			"type":    "knowledge",
			"results": results[:min(len(results), 3)],
		})
		return
	}

	// 闲聊 / 低匹配 → LLM 流式输出
	if h.llmClient == nil {
		jsonError(w, "灵识未连接。请配置 LLM API Key。", http.StatusServiceUnavailable)
		return
	}

	var kbText strings.Builder
	for _, r := range results {
		kbText.WriteString(fmt.Sprintf("- %s：%s\n", r.Entry.Title, r.Entry.Content))
	}
	h.chatWithHistoryStream(w, req.SessionID, req.PersonaID, req.Message, playerCtx, kbText.String(), h.llmClient)
}

// chatWithHistory 带历史的 LLM 调用（非流式）
func (h *Handler) chatWithHistory(sessionID, personaID, message, playerContext, knowledgeContext string, client *llm.Client) (string, error) {
	h.sessions.Get(sessionID, personaID) // 确保会话存在

	var messages []llm.Message
	messages = append(messages, llm.Message{Role: "system", Content: llm.BuildSystemPrompt(personaID, playerContext, knowledgeContext)})

	history := h.sessions.GetHistory(sessionID)
	for _, msg := range history {
		if msg.Role != "system" {
			messages = append(messages, msg)
		}
	}
	messages = append(messages, llm.Message{Role: "user", Content: message})

	reply, err := client.Chat(messages, 0.8, 512)
	if err != nil {
		return "", err
	}

	h.sessions.AddMessage(sessionID, llm.Message{Role: "user", Content: message})
	h.sessions.AddMessage(sessionID, llm.Message{Role: "assistant", Content: reply})

	// 持久化到数据库
	if h.db != nil {
		h.db.SaveChatMessage(sessionID, "user", message)
		h.db.SaveChatMessage(sessionID, "assistant", reply)
	}

	return reply, nil
}

// chatWithHistoryStream 带历史的 LLM 流式调用，直接写 SSE 到 ResponseWriter
func (h *Handler) chatWithHistoryStream(w http.ResponseWriter, sessionID, personaID, message, playerContext, knowledgeContext string, client *llm.Client) {
	h.sessions.Get(sessionID, personaID)

	var messages []llm.Message
	messages = append(messages, llm.Message{Role: "system", Content: llm.BuildSystemPrompt(personaID, playerContext, knowledgeContext)})

	history := h.sessions.GetHistory(sessionID)
	for _, msg := range history {
		if msg.Role != "system" {
			messages = append(messages, msg)
		}
	}
	messages = append(messages, llm.Message{Role: "user", Content: message})

	contentChan, done := client.ChatStream(messages, 0.8, 512)

	flusher, ok := w.(http.Flusher)
	if !ok {
		jsonError(w, "不支持流式传输", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(200)

	var fullReply strings.Builder

	// 先发送 sessionId 事件
	fmt.Fprintf(w, "data: {\"type\":\"meta\",\"sessionId\":\"%s\"}\n\n", sessionID)
	flusher.Flush()

	for content := range contentChan {
		fullReply.WriteString(content)
		// JSON 编码避免换行符破坏 SSE
		escaped, _ := json.Marshal(map[string]string{
			"type":    "chunk",
			"content": content,
		})
		fmt.Fprintf(w, "data: %s\n\n", escaped)
		flusher.Flush()
	}

	// 等待完成信号
	err := <-done

	if err != nil {
		errEscaped, _ := json.Marshal(map[string]string{
			"type":  "error",
			"error": err.Error(),
		})
		fmt.Fprintf(w, "data: %s\n\n", errEscaped)
		flusher.Flush()
		return
	}

	// 完成标记
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()

	// 存入历史
	h.sessions.AddMessage(sessionID, llm.Message{Role: "user", Content: message})
	h.sessions.AddMessage(sessionID, llm.Message{Role: "assistant", Content: fullReply.String()})

	// 持久化到数据库
	if h.db != nil {
		h.db.SaveChatMessage(sessionID, "user", message)
		h.db.SaveChatMessage(sessionID, "assistant", fullReply.String())
	}
}

// ensureHistory 从数据库恢复对话历史到内存会话
func (h *Handler) ensureHistory(sessionID, personaID string) {
	session := h.sessions.Get(sessionID, personaID)
	if len(session.Messages) > 0 || h.db == nil {
		return
	}
	msgs, err := h.db.GetChatHistory(sessionID, 20)
	if err != nil {
		return
	}
	for _, m := range msgs {
		session.Messages = append(session.Messages, llm.Message{Role: m.Role, Content: m.Content})
	}
}

// ListSaves 云端存档列表
func (h *Handler) ListSaves(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		jsonError(w, "数据库未连接", http.StatusServiceUnavailable)
		return
	}
	deviceID := r.URL.Query().Get("deviceId")
	if deviceID == "" {
		jsonError(w, "缺少 deviceId", http.StatusBadRequest)
		return
	}
	saves, err := h.db.GetSaves(deviceID)
	if err != nil {
		jsonError(w, "查询失败: "+err.Error(), http.StatusInternalServerError)
		return
	}
	jsonOK(w, saves)
}

// UploadSave 上传存档
func (h *Handler) UploadSave(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		jsonError(w, "数据库未连接", http.StatusServiceUnavailable)
		return
	}
	var req struct {
		DeviceID string `json:"deviceId"`
		Slot     int    `json:"slot"`
		Data     string `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "请求格式错误", http.StatusBadRequest)
		return
	}
	if req.DeviceID == "" || req.Slot < 0 || req.Slot > 4 {
		jsonError(w, "参数无效", http.StatusBadRequest)
		return
	}
	if err := h.db.UpsertSave(store.SaveData{
		DeviceID: req.DeviceID, Slot: req.Slot, Data: req.Data,
	}); err != nil {
		jsonError(w, "保存失败: "+err.Error(), http.StatusInternalServerError)
		return
	}
	jsonOK(w, map[string]string{"status": "ok"})
}

// DownloadSave 下载存档
func (h *Handler) DownloadSave(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		jsonError(w, "数据库未连接", http.StatusServiceUnavailable)
		return
	}
	deviceID := r.URL.Query().Get("deviceId")
	if deviceID == "" {
		jsonError(w, "缺少 deviceId", http.StatusBadRequest)
		return
	}
	slot, _ := strconv.Atoi(chi.URLParam(r, "slot"))
	saves, err := h.db.GetSaves(deviceID)
	if err != nil {
		jsonError(w, "查询失败", http.StatusInternalServerError)
		return
	}
	for _, s := range saves {
		if s.Slot == slot {
			jsonOK(w, s)
			return
		}
	}
	jsonError(w, "存档不存在", http.StatusNotFound)
}

// DeleteSave 删除云端存档
func (h *Handler) DeleteSave(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		jsonError(w, "数据库未连接", http.StatusServiceUnavailable)
		return
	}
	deviceID := r.URL.Query().Get("deviceId")
	if deviceID == "" {
		jsonError(w, "缺少 deviceId", http.StatusBadRequest)
		return
	}
	slot, _ := strconv.Atoi(chi.URLParam(r, "slot"))
	if err := h.db.DeleteSave(deviceID, slot); err != nil {
		jsonError(w, "删除失败", http.StatusInternalServerError)
		return
	}
	jsonOK(w, map[string]string{"status": "ok"})
}

// RegisterDevice 注册设备
func (h *Handler) RegisterDevice(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		jsonError(w, "数据库未连接", http.StatusServiceUnavailable)
		return
	}
	var req struct {
		DeviceID string `json:"deviceId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "请求格式错误", http.StatusBadRequest)
		return
	}
	token, err := h.db.RegisterDevice(req.DeviceID)
	if err != nil {
		jsonError(w, "注册失败", http.StatusInternalServerError)
		return
	}
	jsonOK(w, map[string]string{"token": token})
}

func jsonOK(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(data)
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}