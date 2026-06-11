package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"

	"taoyuan-backend/internal/store"

	"github.com/go-chi/chi/v5"
)

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func resolveRegion(ip string) string {
	if ip == "" || ip == "127.0.0.1" || ip == "::1" {
		return "本地"
	}
	if strings.HasPrefix(ip, "10.") || strings.HasPrefix(ip, "192.168.") || strings.HasPrefix(ip, "172.") {
		return "内网"
	}
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get("http://ip-api.com/json/" + ip + "?lang=zh-CN&fields=status,country,regionName,city")
	if err != nil {
		return "未知"
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var data struct {
		Status     string `json:"status"`
		Country    string `json:"country"`
		RegionName string `json:"regionName"`
		City       string `json:"city"`
	}
	if json.Unmarshal(body, &data) != nil || data.Status != "success" {
		return "未知"
	}
	parts := []string{}
	if data.Country != "" {
		parts = append(parts, data.Country)
	}
	if data.RegionName != "" {
		parts = append(parts, data.RegionName)
	}
	if data.City != "" && data.City != data.RegionName {
		parts = append(parts, data.City)
	}
	if len(parts) == 0 {
		return "未知"
	}
	return strings.Join(parts, " ")
}

func (h *Handler) buildChatMeta(r *http.Request, visitorID, personaID string) *store.ChatMeta {
	if visitorID == "" && personaID == "" {
		ip := clientIP(r)
		return &store.ChatMeta{IP: ip, Region: resolveRegion(ip)}
	}
	ip := clientIP(r)
	return &store.ChatMeta{
		VisitorID: visitorID,
		PersonaID: personaID,
		IP:        ip,
		Region:    resolveRegion(ip),
	}
}

// AnalyticsSessionStart POST /api/v1/analytics/session/start
func (h *Handler) AnalyticsSessionStart(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		jsonError(w, "存储未就绪", http.StatusServiceUnavailable)
		return
	}
	var req struct {
		SessionID string `json:"sessionId"`
		VisitorID string `json:"visitorId"`
		Platform  string `json:"platform"`
		Screen    string `json:"screen"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "请求格式错误", http.StatusBadRequest)
		return
	}
	if req.SessionID == "" || req.VisitorID == "" {
		jsonError(w, "缺少 sessionId 或 visitorId", http.StatusBadRequest)
		return
	}
	now := time.Now()
	ip := clientIP(r)
	sess := store.AnalyticsSession{
		SessionID:  req.SessionID,
		VisitorID:  req.VisitorID,
		UserAgent:  r.UserAgent(),
		Platform:   req.Platform,
		Screen:     req.Screen,
		IP:         ip,
		Region:     resolveRegion(ip),
		StartedAt:  now,
		LastSeenAt: now,
	}
	if err := h.db.StartAnalyticsSession(sess); err != nil {
		jsonError(w, "记录会话失败", http.StatusInternalServerError)
		return
	}
	jsonOK(w, map[string]string{"status": "ok"})
}

// AnalyticsSessionHeartbeat POST /api/v1/analytics/session/heartbeat
func (h *Handler) AnalyticsSessionHeartbeat(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		jsonOK(w, map[string]string{"status": "skip"})
		return
	}
	var req struct {
		SessionID string `json:"sessionId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.SessionID == "" {
		jsonError(w, "缺少 sessionId", http.StatusBadRequest)
		return
	}
	_ = h.db.TouchAnalyticsSession(req.SessionID, time.Now())
	jsonOK(w, map[string]string{"status": "ok"})
}

// AnalyticsSessionEnd POST /api/v1/analytics/session/end
func (h *Handler) AnalyticsSessionEnd(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		jsonOK(w, map[string]string{"status": "skip"})
		return
	}
	var req struct {
		SessionID string `json:"sessionId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.SessionID == "" {
		jsonError(w, "缺少 sessionId", http.StatusBadRequest)
		return
	}
	_ = h.db.EndAnalyticsSession(req.SessionID, time.Now())
	jsonOK(w, map[string]string{"status": "ok"})
}

// AnalyticsStats GET /api/v1/analytics/stats?days=30
func (h *Handler) AnalyticsStats(w http.ResponseWriter, r *http.Request) {
	if h.db == nil {
		jsonError(w, "存储未就绪", http.StatusServiceUnavailable)
		return
	}
	days := 30
	if d := r.URL.Query().Get("days"); d != "" {
		fmt.Sscanf(d, "%d", &days)
	}
	stats, err := h.db.GetAnalyticsStats(days)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	jsonOK(w, stats)
}

// AnalyticsAdminPage GET /admin/stats
func (h *Handler) AnalyticsAdminPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, analyticsAdminHTML)
}

const analyticsAdminHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>桃源乡 · 数据看板</title>
<style>
body{font-family:system-ui,sans-serif;background:#1a1a1a;color:#e8e4d9;margin:0;padding:16px}
h1{color:#c8a45c;font-size:1.25rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin:16px 0}
.card{background:#2b2d3c;border:1px solid rgba(200,164,92,.25);border-radius:4px;padding:12px}
.card .label{font-size:12px;color:#888}
.card .value{font-size:22px;color:#c8a45c;margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}
th,td{border:1px solid #444;padding:6px 8px;text-align:left}
th{background:#2b2d3c;color:#c8a45c}
tr:nth-child(even){background:rgba(255,255,255,.03)}
.muted{color:#888;font-size:12px}
.section{margin-top:24px}
pre{white-space:pre-wrap;word-break:break-word;max-width:480px}
</style>
</head>
<body>
<h1>桃源乡 · 数据看板</h1>
<p class="muted">自动刷新 · 仅统计在线对话与会话埋点</p>
<div class="grid" id="summary"></div>
<div class="section"><h2>近30日趋势</h2><div id="daily"></div></div>
<div class="section"><h2>最近会话</h2><div id="sessions"></div></div>
<div class="section"><h2>最近在线对话</h2><div id="chats"></div></div>
<script>
async function load(){
  const r=await fetch('/api/v1/analytics/stats?days=30');
  const d=await r.json();
  const fmtSec=s=>s<60?Math.round(s)+'秒':Math.round(s/60)+'分';
  document.getElementById('summary').innerHTML=[
    ['DAU',d.dau],['WAU',d.wau],['MAU',d.mau],
    ['平均会话时长',fmtSec(d.avgSessionDurationSec||0)],
    ['日均打开',(d.avgDailyOpens||0).toFixed(1)],
    ['累计打开',d.totalSessions],
    ['在线对话条数',d.totalOnlineChats]
  ].map(([l,v])=>'<div class="card"><div class="label">'+l+'</div><div class="value">'+v+'</div></div>').join('');
  const daily=(d.daily||[]).map(x=>'<tr><td>'+x.date+'</td><td>'+x.dau+'</td><td>'+x.opens+'</td><td>'+fmtSec(x.avgSessionDurationSec||0)+'</td></tr>').join('');
  document.getElementById('daily').innerHTML='<table><tr><th>日期</th><th>DAU</th><th>打开次数</th><th>均时长</th></tr>'+daily+'</table>';
  const sess=(d.recentSessions||[]).map(x=>'<tr><td>'+x.visitorId+'</td><td>'+x.platform+'</td><td>'+x.region+'</td><td>'+x.ip+'</td><td>'+fmtSec(x.durationSec||0)+'</td><td>'+x.startedAt+'</td></tr>').join('');
  document.getElementById('sessions').innerHTML='<table><tr><th>访客</th><th>设备</th><th>地区</th><th>IP</th><th>时长</th><th>开始</th></tr>'+sess+'</table>';
  const chats=(d.recentChats||[]).map(x=>'<tr><td>'+x.role+'</td><td>'+x.visitorId+'</td><td>'+x.region+'</td><td><pre>'+x.content.replace(/</g,'&lt;')+'</pre></td><td>'+x.createdAt+'</td></tr>').join('');
  document.getElementById('chats').innerHTML='<table><tr><th>角色</th><th>访客</th><th>地区</th><th>内容</th><th>时间</th></tr>'+chats+'</table>';
}
load();setInterval(load,30000);
</script>
</body>
</html>`

// RegisterAnalyticsRoutes 注册统计相关路由
func RegisterAnalyticsRoutes(r chi.Router, h *Handler) {
	r.Post("/analytics/session/start", h.AnalyticsSessionStart)
	r.Post("/analytics/session/heartbeat", h.AnalyticsSessionHeartbeat)
	r.Post("/analytics/session/end", h.AnalyticsSessionEnd)
	r.Get("/analytics/stats", h.AnalyticsStats)
}
