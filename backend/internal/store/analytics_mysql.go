package store

import (
	"database/sql"
	"time"
)

func migrateAnalyticsMySQL(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS analytics_sessions (
		session_id   VARCHAR(64) PRIMARY KEY,
		visitor_id   VARCHAR(64) NOT NULL,
		user_agent   TEXT,
		platform     VARCHAR(32),
		screen       VARCHAR(32),
		ip           VARCHAR(64),
		region       VARCHAR(128),
		started_at   DATETIME NOT NULL,
		last_seen_at DATETIME NOT NULL,
		ended_at     DATETIME NULL,
		duration_sec INT NOT NULL DEFAULT 0,
		INDEX idx_analytics_sessions_visitor (visitor_id),
		INDEX idx_analytics_sessions_started (started_at)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`
	if _, err := db.Exec(schema); err != nil {
		return err
	}
	for _, stmt := range []string{
		`ALTER TABLE chat_history ADD COLUMN visitor_id VARCHAR(64)`,
		`ALTER TABLE chat_history ADD COLUMN persona_id VARCHAR(32)`,
		`ALTER TABLE chat_history ADD COLUMN ip VARCHAR(64)`,
		`ALTER TABLE chat_history ADD COLUMN region VARCHAR(128)`,
	} {
		_, _ = db.Exec(stmt)
	}
	return nil
}

func (m *MySQL) StartAnalyticsSession(sess AnalyticsSession) error {
	_, err := m.db.Exec(
		`INSERT INTO analytics_sessions
		 (session_id, visitor_id, user_agent, platform, screen, ip, region, started_at, last_seen_at, duration_sec)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
		sess.SessionID, sess.VisitorID, sess.UserAgent, sess.Platform, sess.Screen,
		sess.IP, sess.Region, sess.StartedAt, sess.LastSeenAt,
	)
	return err
}

func (m *MySQL) TouchAnalyticsSession(sessionID string, at time.Time) error {
	_, err := m.db.Exec(
		`UPDATE analytics_sessions SET
		   last_seen_at = ?,
		   duration_sec = TIMESTAMPDIFF(SECOND, started_at, ?)
		 WHERE session_id = ?`,
		at, at, sessionID,
	)
	return err
}

func (m *MySQL) EndAnalyticsSession(sessionID string, at time.Time) error {
	_, err := m.db.Exec(
		`UPDATE analytics_sessions SET
		   ended_at = ?,
		   last_seen_at = ?,
		   duration_sec = TIMESTAMPDIFF(SECOND, started_at, ?)
		 WHERE session_id = ? AND ended_at IS NULL`,
		at, at, at, sessionID,
	)
	return err
}

func (m *MySQL) CountOnlineChats() (int, error) {
	var n int
	err := m.db.QueryRow(`SELECT COUNT(*) FROM chat_history WHERE role = 'user'`).Scan(&n)
	return n, err
}

func (m *MySQL) ListRecentChats(limit int) ([]ChatMessage, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := m.db.Query(
		`SELECT id, session_id, IFNULL(visitor_id,''), IFNULL(persona_id,''), role, content,
		        IFNULL(ip,''), IFNULL(region,''), created_at
		 FROM chat_history ORDER BY id DESC LIMIT ?`, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanChatRows(rows)
}

func (m *MySQL) GetAnalyticsStats(days int) (*AnalyticsStats, error) {
	if days <= 0 {
		days = 30
	}
	stats := &AnalyticsStats{Daily: []DailyAnalyticsStat{}}

	now := time.Now()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := dayStart.AddDate(0, 0, -6)
	monthStart := dayStart.AddDate(0, 0, -(days - 1))

	_ = m.db.QueryRow(
		`SELECT COUNT(DISTINCT visitor_id) FROM analytics_sessions WHERE last_seen_at >= ?`,
		dayStart,
	).Scan(&stats.DAU)

	_ = m.db.QueryRow(
		`SELECT COUNT(DISTINCT visitor_id) FROM analytics_sessions WHERE last_seen_at >= ?`,
		weekStart,
	).Scan(&stats.WAU)

	_ = m.db.QueryRow(
		`SELECT COUNT(DISTINCT visitor_id) FROM analytics_sessions WHERE last_seen_at >= ?`,
		monthStart,
	).Scan(&stats.MAU)

	_ = m.db.QueryRow(`SELECT COUNT(*) FROM analytics_sessions`).Scan(&stats.TotalSessions)

	_ = m.db.QueryRow(
		`SELECT AVG(CASE WHEN duration_sec > 0 THEN duration_sec
		 ELSE TIMESTAMPDIFF(SECOND, started_at, last_seen_at) END)
		 FROM analytics_sessions`,
	).Scan(&stats.AvgSessionDurationSec)

	var dayCount int
	_ = m.db.QueryRow(
		`SELECT COUNT(DISTINCT DATE(started_at)) FROM analytics_sessions WHERE started_at >= ?`,
		monthStart,
	).Scan(&dayCount)
	if dayCount < 1 {
		dayCount = 1
	}
	var opensInRange int
	_ = m.db.QueryRow(
		`SELECT COUNT(*) FROM analytics_sessions WHERE started_at >= ?`,
		monthStart,
	).Scan(&opensInRange)
	stats.AvgDailyOpens = float64(opensInRange) / float64(dayCount)

	stats.TotalOnlineChats, _ = m.CountOnlineChats()

	rows, err := m.db.Query(
		`SELECT DATE(started_at) AS d,
		        COUNT(DISTINCT visitor_id) AS dau,
		        COUNT(*) AS opens,
		        AVG(CASE WHEN duration_sec > 0 THEN duration_sec
		             ELSE TIMESTAMPDIFF(SECOND, started_at, last_seen_at) END)
		 FROM analytics_sessions
		 WHERE started_at >= ?
		 GROUP BY DATE(started_at)
		 ORDER BY d DESC`,
		monthStart,
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

	sessRows, err := m.db.Query(
		`SELECT session_id, visitor_id, IFNULL(user_agent,''), IFNULL(platform,''), IFNULL(screen,''),
		        IFNULL(ip,''), IFNULL(region,''), started_at, last_seen_at, ended_at, duration_sec
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

	stats.RecentChats, _ = m.ListRecentChats(30)
	return stats, nil
}
