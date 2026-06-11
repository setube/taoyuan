package store

import "time"

// ChatMeta 在线对话附加信息（仅服务端 Chat API）
type ChatMeta struct {
	VisitorID string
	PersonaID string
	IP        string
	Region    string
}

// AnalyticsSession 单次打开/游玩会话
type AnalyticsSession struct {
	SessionID   string     `json:"sessionId"`
	VisitorID   string     `json:"visitorId"`
	UserAgent   string     `json:"userAgent"`
	Platform    string     `json:"platform"`
	Screen      string     `json:"screen"`
	IP          string     `json:"ip"`
	Region      string     `json:"region"`
	StartedAt   time.Time  `json:"startedAt"`
	LastSeenAt  time.Time  `json:"lastSeenAt"`
	EndedAt     *time.Time `json:"endedAt,omitempty"`
	DurationSec int        `json:"durationSec"`
}

// DailyAnalyticsStat 按天聚合
type DailyAnalyticsStat struct {
	Date                string  `json:"date"`
	DAU                 int     `json:"dau"`
	Opens               int     `json:"opens"`
	AvgSessionDuration  float64 `json:"avgSessionDurationSec"`
}

// AnalyticsStats 汇总看板
type AnalyticsStats struct {
	DAU                   int                  `json:"dau"`
	WAU                   int                  `json:"wau"`
	MAU                   int                  `json:"mau"`
	AvgSessionDurationSec float64              `json:"avgSessionDurationSec"`
	AvgDailyOpens         float64              `json:"avgDailyOpens"`
	TotalSessions         int                  `json:"totalSessions"`
	TotalOnlineChats      int                  `json:"totalOnlineChats"`
	Daily                 []DailyAnalyticsStat `json:"daily"`
	RecentSessions        []AnalyticsSession   `json:"recentSessions"`
	RecentChats           []ChatMessage        `json:"recentChats"`
}
