package store

import (
	"database/sql"
	"time"
)

func migrateAnalyticsSQLite(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS analytics_sessions (
		session_id   TEXT PRIMARY KEY,
		visitor_id   TEXT NOT NULL,
		user_agent   TEXT,
		platform     TEXT,
		screen       TEXT,
		ip           TEXT,
		region       TEXT,
		started_at   DATETIME NOT NULL,
		last_seen_at DATETIME NOT NULL,
		ended_at     DATETIME,
		duration_sec INTEGER NOT NULL DEFAULT 0
	);
	CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor ON analytics_sessions(visitor_id);
	CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started ON analytics_sessions(started_at);
	`
	if _, err := db.Exec(schema); err != nil {
		return err
	}
	// 扩展 chat_history（忽略已存在列的错误）
	for _, stmt := range []string{
		`ALTER TABLE chat_history ADD COLUMN visitor_id TEXT`,
		`ALTER TABLE chat_history ADD COLUMN persona_id TEXT`,
		`ALTER TABLE chat_history ADD COLUMN ip TEXT`,
		`ALTER TABLE chat_history ADD COLUMN region TEXT`,
	} {
		_, _ = db.Exec(stmt)
	}
	return nil
}

func (s *SQLiteStore) StartAnalyticsSession(sess AnalyticsSession) error {
	_, err := s.db.Exec(
		`INSERT INTO analytics_sessions
		 (session_id, visitor_id, user_agent, platform, screen, ip, region, started_at, last_seen_at, duration_sec)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
		sess.SessionID, sess.VisitorID, sess.UserAgent, sess.Platform, sess.Screen,
		sess.IP, sess.Region, sess.StartedAt, sess.LastSeenAt,
	)
	return err
}

func (s *SQLiteStore) TouchAnalyticsSession(sessionID string, at time.Time) error {
	_, err := s.db.Exec(
		`UPDATE analytics_sessions SET
		   last_seen_at = ?,
		   duration_sec = CAST((julianday(?) - julianday(started_at)) * 86400 AS INTEGER)
		 WHERE session_id = ?`,
		at, at, sessionID,
	)
	return err
}

func (s *SQLiteStore) EndAnalyticsSession(sessionID string, at time.Time) error {
	_, err := s.db.Exec(
		`UPDATE analytics_sessions SET
		   ended_at = ?,
		   last_seen_at = ?,
		   duration_sec = CAST((julianday(?) - julianday(started_at)) * 86400 AS INTEGER)
		 WHERE session_id = ? AND ended_at IS NULL`,
		at, at, at, sessionID,
	)
	return err
}

func (s *SQLiteStore) CountOnlineChats() (int, error) {
	var n int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM chat_history WHERE role = 'user'`).Scan(&n)
	return n, err
}

func (s *SQLiteStore) ListRecentChats(limit int) ([]ChatMessage, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := s.db.Query(
		`SELECT id, session_id, COALESCE(visitor_id,''), COALESCE(persona_id,''), role, content,
		        COALESCE(ip,''), COALESCE(region,''), created_at
		 FROM chat_history ORDER BY id DESC LIMIT ?`, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanChatRows(rows)
}

func (s *SQLiteStore) GetAnalyticsStats(days int) (*AnalyticsStats, error) {
	if days <= 0 {
		days = 30
	}
	stats := &AnalyticsStats{Daily: []DailyAnalyticsStat{}}

	now := time.Now()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := dayStart.AddDate(0, 0, -6)
	monthStart := dayStart.AddDate(0, 0, -(days - 1))

	_ = s.db.QueryRow(
		`SELECT COUNT(DISTINCT visitor_id) FROM analytics_sessions
		 WHERE datetime(last_seen_at) >= datetime(?)`,
		dayStart.Format(time.RFC3339),
	).Scan(&stats.DAU)

	_ = s.db.QueryRow(
		`SELECT COUNT(DISTINCT visitor_id) FROM analytics_sessions
		 WHERE datetime(last_seen_at) >= datetime(?)`,
		weekStart.Format(time.RFC3339),
	).Scan(&stats.WAU)

	_ = s.db.QueryRow(
		`SELECT COUNT(DISTINCT visitor_id) FROM analytics_sessions
		 WHERE datetime(last_seen_at) >= datetime(?)`,
		monthStart.Format(time.RFC3339),
	).Scan(&stats.MAU)

	_ = s.db.QueryRow(`SELECT COUNT(*) FROM analytics_sessions`).Scan(&stats.TotalSessions)

	_ = s.db.QueryRow(
		`SELECT AVG(CASE WHEN duration_sec > 0 THEN duration_sec
		 ELSE CAST((julianday(last_seen_at) - julianday(started_at)) * 86400 AS INTEGER) END)
		 FROM analytics_sessions`,
	).Scan(&stats.AvgSessionDurationSec)

	var dayCount int
	_ = s.db.QueryRow(
		`SELECT COUNT(DISTINCT date(started_at)) FROM analytics_sessions
		 WHERE datetime(started_at) >= datetime(?)`,
		monthStart.Format(time.RFC3339),
	).Scan(&dayCount)
	if dayCount < 1 {
		dayCount = 1
	}
	var opensInRange int
	_ = s.db.QueryRow(
		`SELECT COUNT(*) FROM analytics_sessions WHERE datetime(started_at) >= datetime(?)`,
		monthStart.Format(time.RFC3339),
	).Scan(&opensInRange)
	stats.AvgDailyOpens = float64(opensInRange) / float64(dayCount)

	stats.TotalOnlineChats, _ = s.CountOnlineChats()

	rows, err := s.db.Query(
		`SELECT date(started_at) AS d,
		        COUNT(DISTINCT visitor_id) AS dau,
		        COUNT(*) AS opens,
		        AVG(CASE WHEN duration_sec > 0 THEN duration_sec
		             ELSE CAST((julianday(last_seen_at) - julianday(started_at)) * 86400 AS INTEGER) END)
		 FROM analytics_sessions
		 WHERE datetime(started_at) >= datetime(?)
		 GROUP BY date(started_at)
		 ORDER BY d DESC`,
		monthStart.Format(time.RFC3339),
	)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d DailyAnalyticsStat
			if err := rows.Scan(&d.Date, &d.DAU, &d.Opens, &d.AvgSessionDuration); err == nil {
				stats.Daily = append(stats.Daily, d)
			}
		}
	}

	sessRows, err := s.db.Query(
		`SELECT session_id, visitor_id, COALESCE(user_agent,''), COALESCE(platform,''), COALESCE(screen,''),
		        COALESCE(ip,''), COALESCE(region,''), started_at, last_seen_at, ended_at, duration_sec
		 FROM analytics_sessions ORDER BY started_at DESC LIMIT 30`,
	)
	if err == nil {
		defer sessRows.Close()
		for sessRows.Next() {
			var sess AnalyticsSession
			var ended sql.NullTime
			if err := sessRows.Scan(
				&sess.SessionID, &sess.VisitorID, &sess.UserAgent, &sess.Platform, &sess.Screen,
				&sess.IP, &sess.Region, &sess.StartedAt, &sess.LastSeenAt, &ended, &sess.DurationSec,
			); err == nil {
				if ended.Valid {
					t := ended.Time
					sess.EndedAt = &t
				}
				stats.RecentSessions = append(stats.RecentSessions, sess)
			}
		}
	}

	stats.RecentChats, _ = s.ListRecentChats(30)
	return stats, nil
}

func scanChatRows(rows *sql.Rows) ([]ChatMessage, error) {
	var msgs []ChatMessage
	for rows.Next() {
		var m ChatMessage
		if err := rows.Scan(
			&m.ID, &m.SessionID, &m.VisitorID, &m.PersonaID, &m.Role, &m.Content,
			&m.IP, &m.Region, &m.CreatedAt,
		); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, rows.Err()
}
