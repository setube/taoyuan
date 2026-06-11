package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

type SQLiteStore struct {
	db *sql.DB
}

// NewSQLite 创建 SQLite 存储，自动建表
func NewSQLite(dbPath string) (*SQLiteStore, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("创建数据库目录失败: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("打开数据库失败: %w", err)
	}

	db.SetMaxOpenConns(1) // SQLite 单写者

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("数据库连接失败: %w", err)
	}

	s := &SQLiteStore{db: db}
	if err := s.migrate(); err != nil {
		return nil, fmt.Errorf("数据库迁移失败: %w", err)
	}

	return s, nil
}

func (s *SQLiteStore) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS cloud_saves (
		device_id  TEXT NOT NULL,
		slot       INTEGER NOT NULL,
		save_data  TEXT,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (device_id, slot)
	);

	CREATE TABLE IF NOT EXISTS devices (
		device_id  TEXT PRIMARY KEY,
		token      TEXT NOT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS chat_history (
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		session_id TEXT NOT NULL,
		role       TEXT NOT NULL,
		content    TEXT NOT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id, id);
	`
	if _, err := s.db.Exec(schema); err != nil {
		return err
	}
	return migrateAnalyticsSQLite(s.db)
}

func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

// ── 存档 ──────────────────────────────────────────

func (s *SQLiteStore) UpsertSave(d SaveData) error {
	_, err := s.db.Exec(
		`INSERT INTO cloud_saves (device_id, slot, save_data, updated_at)
		 VALUES (?, ?, ?, CURRENT_TIMESTAMP)
		 ON CONFLICT(device_id, slot) DO UPDATE SET
		   save_data = excluded.save_data,
		   updated_at = CURRENT_TIMESTAMP`,
		d.DeviceID, d.Slot, d.Data,
	)
	return err
}

func (s *SQLiteStore) GetSaves(deviceID string) ([]SaveData, error) {
	rows, err := s.db.Query(
		`SELECT device_id, slot, save_data, updated_at
		 FROM cloud_saves WHERE device_id = ? ORDER BY slot`,
		deviceID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var saves []SaveData
	for rows.Next() {
		var v SaveData
		if err := rows.Scan(&v.DeviceID, &v.Slot, &v.Data, &v.UpdatedAt); err != nil {
			return nil, err
		}
		saves = append(saves, v)
	}
	return saves, rows.Err()
}

func (s *SQLiteStore) DeleteSave(deviceID string, slot int) error {
	_, err := s.db.Exec(
		`DELETE FROM cloud_saves WHERE device_id = ? AND slot = ?`,
		deviceID, slot,
	)
	return err
}

// ── 设备 ──────────────────────────────────────────

func (s *SQLiteStore) RegisterDevice(deviceID string) (string, error) {
	var token string
	err := s.db.QueryRow(`SELECT token FROM devices WHERE device_id = ?`, deviceID).Scan(&token)
	if err == nil {
		return token, nil
	}
	if err != sql.ErrNoRows {
		return "", err
	}

	token = generateToken()
	_, err = s.db.Exec(
		`INSERT INTO devices (device_id, token, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
		deviceID, token,
	)
	if err != nil {
		return "", err
	}
	return token, nil
}

func (s *SQLiteStore) ValidateToken(deviceID, token string) bool {
	var count int
	s.db.QueryRow(
		`SELECT COUNT(*) FROM devices WHERE device_id = ? AND token = ?`,
		deviceID, token,
	).Scan(&count)
	return count > 0
}

// ── 聊天历史 ──────────────────────────────────────

func (s *SQLiteStore) SaveChatMessage(sessionID, role, content string, meta *ChatMeta) error {
	if meta != nil {
		_, err := s.db.Exec(
			`INSERT INTO chat_history (session_id, role, content, visitor_id, persona_id, ip, region, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			sessionID, role, content, meta.VisitorID, meta.PersonaID, meta.IP, meta.Region,
		)
		return err
	}
	_, err := s.db.Exec(
		`INSERT INTO chat_history (session_id, role, content, created_at)
		 VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
		sessionID, role, content,
	)
	return err
}

func (s *SQLiteStore) GetChatHistory(sessionID string, limit int) ([]ChatMessage, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := s.db.Query(
		`SELECT id, session_id, role, content, created_at
		 FROM chat_history
		 WHERE session_id = ?
		 ORDER BY id DESC
		 LIMIT ?`,
		sessionID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []ChatMessage
	for rows.Next() {
		var m ChatMessage
		if err := rows.Scan(&m.ID, &m.SessionID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	// 反转回时间顺序
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, rows.Err()
}