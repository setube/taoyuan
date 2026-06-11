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
	hour := intField(ctx, "hour")
	if summary := stringField(ctx, "statusSummary"); summary != "" {
		sb.WriteString("【实时状态快照】" + summary + "\n")
	}
	if season != "" {
		seasonNames := map[string]string{"spring": "春", "summer": "夏", "autumn": "秋", "winter": "冬"}
		name := seasonNames[season]
		if name == "" {
			name = season
		}
		sb.WriteString(fmt.Sprintf("- 季节：%s，第 %d 天", name, day))
		if hour > 0 {
			sb.WriteString(fmt.Sprintf("，%d 时", hour))
		}
		sb.WriteString("\n")
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

	// 农场与建筑
	if farmSize := stringField(ctx, "farmSize"); farmSize != "" {
		sb.WriteString(fmt.Sprintf("- 农场规模：%s\n", farmSize))
	}
	if home, ok := ctx["homeState"].(map[string]any); ok && len(home) > 0 {
		parts := make([]string, 0, 6)
		if s := stringField(home, "farmhouse"); s != "" {
			parts = append(parts, "农舍="+s)
		}
		if cellar := stringField(home, "cellarSlots"); cellar != "" {
			parts = append(parts, "酒窖槽"+cellar)
		}
		if gh := stringField(home, "greenhouse"); gh != "" {
			parts = append(parts, "温室="+gh)
		}
		if cave := stringField(home, "cave"); cave != "" {
			parts = append(parts, "山洞="+cave)
		}
		if len(parts) > 0 {
			sb.WriteString("- 小屋设施：" + strings.Join(parts, "，") + "\n")
		}
	}
	tavernLv := intField(ctx, "tavernLevel")
	if tavernLv > 0 {
		sb.WriteString(fmt.Sprintf("- 酒肆：Lv%d\n", tavernLv))
	} else {
		sb.WriteString("- 酒肆：未建造\n")
	}
	if ranch, ok := ctx["ranchState"].(map[string]any); ok {
		if buildings, ok := ranch["buildings"].([]any); ok && len(buildings) > 0 {
			names := make([]string, 0, len(buildings))
			for _, b := range buildings {
				if s, ok := b.(string); ok {
					names = append(names, s)
				}
			}
			if len(names) > 0 {
				total := intField(ranch, "totalAnimals")
				sb.WriteString(fmt.Sprintf("- 牧场：%s（共%d只牲畜）\n", strings.Join(names, "、"), total))
			}
		}
		if pet := ranch["pet"]; pet != nil && pet != "" {
			sb.WriteString(fmt.Sprintf("- 宠物：%v\n", pet))
		}
	}
	if pond := stringField(ctx, "fishPondState"); pond != "" {
		sb.WriteString(fmt.Sprintf("- 鱼塘：%s\n", pond))
	}
	if rule := stringField(ctx, "fishFryRule"); rule != "" {
		sb.WriteString("- 鱼苗规则：" + rule + "\n")
	}
	if pondable := intField(ctx, "pondableFishInBag"); pondable > 0 {
		sb.WriteString(fmt.Sprintf("- 背包可放入鱼塘的鱼：%d 尾", pondable))
		if types, ok := ctx["pondableFishTypes"].([]any); ok && len(types) > 0 {
			names := make([]string, 0, len(types))
			for _, t := range types {
				if s, ok := t.(string); ok {
					names = append(names, s)
				}
			}
			if len(names) > 0 {
				sb.WriteString("（" + strings.Join(names, "、") + "）")
			}
		}
		sb.WriteString("\n")
	}
	if bait := intField(ctx, "fishBaitCount"); bait > 0 {
		sb.WriteString(fmt.Sprintf("- 普通鱼饵：%d 份（钓鱼/喂鱼用，非购买鱼苗）\n", bait))
	}
	if stations := intField(ctx, "breedingStations"); stations > 0 {
		sb.WriteString(fmt.Sprintf("- 育种台：%d 台\n", stations))
	}
	if floor := intField(ctx, "highestMineFloor"); floor > 0 {
		sb.WriteString(fmt.Sprintf("- 矿洞最高层：%d\n", floor))
	}

	// 系统亲和与时间线
	if affinity := intField(ctx, "systemAffinity"); affinity > 0 || intField(ctx, "affinity") > 0 {
		if affinity <= 0 {
			affinity = intField(ctx, "affinity")
		}
		sb.WriteString(fmt.Sprintf("- 系统亲和度：%d/100（与村民好感度无关，专属定制门槛 20）\n", affinity))
	}
	if npcTop, ok := ctx["npcFriendshipTop"].([]any); ok && len(npcTop) > 0 {
		names := make([]string, 0, len(npcTop))
		for _, t := range npcTop {
			if s, ok := t.(string); ok && s != "" {
				names = append(names, s)
			}
		}
		if len(names) > 0 {
			sb.WriteString("- 村民好感（与系统亲和无关）：" + strings.Join(names, "、") + "\n")
		}
	}

	if persona := stringField(ctx, "personaId"); persona != "" {
		personaNames := map[string]string{"qingluan": "青鸾", "chaofeng": "嘲风", "taosu": "桃酥", "moyan": "墨言"}
		if name := personaNames[persona]; name != "" {
			sb.WriteString(fmt.Sprintf("- 系统人格：%s\n", name))
		}
	}
	if timeline, ok := ctx["timeline"].([]any); ok && len(timeline) > 0 {
		sb.WriteString("- 近期记忆摘要：")
		parts := make([]string, 0, len(timeline))
		for _, t := range timeline {
			if s, ok := t.(string); ok {
				parts = append(parts, s)
			}
		}
		sb.WriteString(strings.Join(parts, "；"))
		sb.WriteString("\n")
	}
	if milestones, ok := ctx["memoryMilestones"].(map[string]any); ok && len(milestones) > 0 {
		sb.WriteString("- 里程碑记忆：")
		first := true
		for k, v := range milestones {
			if v == nil || v == "" || v == 0 {
				continue
			}
			if !first {
				sb.WriteString("、")
			}
			sb.WriteString(fmt.Sprintf("%s=%v", k, v))
			first = false
		}
		if !first {
			sb.WriteString("\n")
		}
	}

	// 系统任务 / 功勋 / 商店（当前存档状态）
	if boolField(ctx, "systemAwakened") {
		sb.WriteString("- 系统状态：已觉醒\n")
	}
	if _, hasMerit := ctx["systemMerit"]; hasMerit {
		merit := intField(ctx, "systemMerit")
		sb.WriteString(fmt.Sprintf("- 当前功勋点：%d\n", merit))
	}
	if quests, ok := ctx["systemQuests"].([]any); ok && len(quests) > 0 {
		sb.WriteString("- 活跃系统任务：\n")
		for _, q := range quests {
			if m, ok := q.(map[string]any); ok {
				title := stringField(m, "title")
				if title == "" {
					title = stringField(m, "type")
				}
				status := stringField(m, "status")
				deadline := intField(m, "deadline")
				reward := intField(m, "reward")
				sb.WriteString(fmt.Sprintf("  · %s（%s，期限第%d日，奖励%d功勋）\n", title, status, deadline, reward))
			}
		}
	}
	if buffs, ok := ctx["meritBuffs"].([]any); ok && len(buffs) > 0 {
		sb.WriteString("- 已激活功勋加成：")
		names := make([]string, 0, len(buffs))
		for _, b := range buffs {
			if s, ok := b.(string); ok && s != "" {
				names = append(names, s)
			}
		}
		sb.WriteString(strings.Join(names, "、"))
		sb.WriteString("\n")
	}
	if customN := intField(ctx, "customShopCount"); customN > 0 {
		sb.WriteString(fmt.Sprintf("- 专属定制商品：%d 项\n", customN))
	}

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

	// 仓库摘要
	if boolField(ctx, "warehouseUnlocked") {
		chests := stringField(ctx, "warehouseChests")
		if chests != "" {
			sb.WriteString(fmt.Sprintf("- 仓库：已解锁（%s）\n", chests))
		}
		if whItems, ok := ctx["warehouseItems"].([]any); ok && len(whItems) > 0 {
			itemStrs := make([]string, 0, len(whItems))
			for _, item := range whItems {
				if s, ok := item.(string); ok {
					itemStrs = append(itemStrs, s)
				}
			}
			if len(itemStrs) > 0 {
				sb.WriteString("- 仓库存货：" + strings.Join(itemStrs, "、") + "\n")
			}
		}
	} else {
		sb.WriteString("- 仓库：未解锁\n")
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

func boolField(m map[string]any, key string) bool {
	if v, ok := m[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return false
}

// Chat AI 对话（带 session + 历史）
func (h *Handler) Chat(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Message   string         `json:"message"`
		PersonaID string         `json:"personaId"`
		SessionID string         `json:"sessionId"`
		VisitorID string         `json:"visitorId"`
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

	merit := intField(req.Context, "systemMerit")
	affinity := intField(req.Context, "systemAffinity")
	if affinity <= 0 {
		affinity = intField(req.Context, "affinity")
	}
	if wish := h.meritWishEvaluate(req.Message, req.PersonaID, merit, affinity, req.Context); wish != nil {
		if isWish, ok := wish["isWish"].(bool); ok && isWish {
			wish["type"] = "wish"
			jsonOK(w, wish)
			return
		}
	}

	// 从数据库恢复对话历史
	h.ensureHistory(req.SessionID, req.PersonaID)

	// 构建玩家状态文本
	playerCtx := buildPlayerContextText(req.Context)
	chatMeta := h.buildChatMeta(r, req.VisitorID, req.PersonaID)

	results := h.idx.Search(req.Message, "", 5)
	results = augmentWishWellKnowledge(h.idx, req.Message, results)
	results = augmentFishPondKnowledge(h.idx, req.Message, results)
	results = augmentLocationKnowledge(h.idx, req.Message, results)
	results = augmentSystemKnowledge(h.idx, req.Message, results)
	results = filterKnowledgeResults(results)
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
			reply, err := h.chatWithHistory(req.SessionID, req.PersonaID, req.Message, playerCtx, kbText.String(), h.llmClientFast, chatMeta)
			if err == nil {
				jsonOK(w, map[string]any{"type": "llm", "message": llm.SanitizeReply(req.PersonaID, reply)})
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
	h.chatWithHistoryStream(w, req.SessionID, req.PersonaID, req.Message, playerCtx, kbText.String(), h.llmClient, chatMeta)
}

// chatWithHistory 带历史的 LLM 调用（非流式）
func (h *Handler) chatWithHistory(sessionID, personaID, message, playerContext, knowledgeContext string, client *llm.Client, meta *store.ChatMeta) (string, error) {
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

	reply, err := client.Chat(messages, 0.55, 512)
	if err != nil {
		return "", err
	}
	reply = llm.SanitizeReply(personaID, reply)

	h.sessions.AddMessage(sessionID, llm.Message{Role: "user", Content: message})
	h.sessions.AddMessage(sessionID, llm.Message{Role: "assistant", Content: reply})

	// 持久化到数据库（仅在线对话）
	if h.db != nil {
		h.db.SaveChatMessage(sessionID, "user", message, meta)
		h.db.SaveChatMessage(sessionID, "assistant", reply, meta)
	}

	return reply, nil
}

// chatWithHistoryStream 带历史的 LLM 流式调用，直接写 SSE 到 ResponseWriter
func (h *Handler) chatWithHistoryStream(w http.ResponseWriter, sessionID, personaID, message, playerContext, knowledgeContext string, client *llm.Client, meta *store.ChatMeta) {
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

	contentChan, done := client.ChatStream(messages, 0.55, 512)

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

	finalReply := llm.SanitizeReply(personaID, fullReply.String())
	if finalReply != fullReply.String() {
		revision, _ := json.Marshal(map[string]string{
			"type":    "revision",
			"content": finalReply,
		})
		fmt.Fprintf(w, "data: %s\n\n", revision)
		flusher.Flush()
	}

	// 完成标记
	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()

	// 存入历史
	h.sessions.AddMessage(sessionID, llm.Message{Role: "user", Content: message})
	h.sessions.AddMessage(sessionID, llm.Message{Role: "assistant", Content: finalReply})

	// 持久化到数据库（仅在线对话）
	if h.db != nil {
		h.db.SaveChatMessage(sessionID, "user", message, meta)
		h.db.SaveChatMessage(sessionID, "assistant", finalReply, meta)
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