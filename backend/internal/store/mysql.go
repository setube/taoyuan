package store

import (
	"database/sql"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type MySQL struct {
	db *sql.DB
}

func NewMySQL(dsn string) (*MySQL, error) {
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, err
	}

	// 确保表存在
	if err := migrateMySQL(db); err != nil {
		return nil, err
	}

	return &MySQL{db: db}, nil
}

func migrateMySQL(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS cloud_saves (
		device_id  VARCHAR(64) NOT NULL,
		slot       INT NOT NULL,
		save_data  MEDIUMTEXT,
		updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (device_id, slot)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

	CREATE TABLE IF NOT EXISTS devices (
		device_id  VARCHAR(64) PRIMARY KEY,
		token      VARCHAR(64) NOT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

	CREATE TABLE IF NOT EXISTS chat_history (
		id         BIGINT AUTO_INCREMENT PRIMARY KEY,
		session_id VARCHAR(64) NOT NULL,
		role       VARCHAR(16) NOT NULL,
		content    TEXT NOT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		INDEX idx_chat_history_session (session_id, id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`
	if _, err := db.Exec(schema); err != nil {
		return err
	}
	return migrateAnalyticsMySQL(db)
}

func (m *MySQL) Close() error {
	return m.db.Close()
}

func (m *MySQL) UpsertSave(d SaveData) error {
	_, err := m.db.Exec(
		`INSERT INTO cloud_saves (device_id, slot, save_data, updated_at)
		 VALUES (?, ?, ?, NOW())
		 ON DUPLICATE KEY UPDATE save_data = VALUES(save_data), updated_at = NOW()`,
		d.DeviceID, d.Slot, d.Data,
	)
	return err
}

func (m *MySQL) GetSaves(deviceID string) ([]SaveData, error) {
	rows, err := m.db.Query(
		`SELECT device_id, slot, save_data, updated_at FROM cloud_saves WHERE device_id = ? ORDER BY slot`,
		deviceID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var saves []SaveData
	for rows.Next() {
		var s SaveData
		if err := rows.Scan(&s.DeviceID, &s.Slot, &s.Data, &s.UpdatedAt); err != nil {
			return nil, err
		}
		saves = append(saves, s)
	}
	return saves, nil
}

func (m *MySQL) DeleteSave(deviceID string, slot int) error {
	_, err := m.db.Exec(`DELETE FROM cloud_saves WHERE device_id = ? AND slot = ?`, deviceID, slot)
	return err
}

// RegisterDevice 注册或查找设备
func (m *MySQL) RegisterDevice(deviceID string) (string, error) {
	var token string
	err := m.db.QueryRow(
		`SELECT token FROM devices WHERE device_id = ?`, deviceID,
	).Scan(&token)
	if err == sql.ErrNoRows {
		token = generateToken()
		_, err = m.db.Exec(
			`INSERT INTO devices (device_id, token, created_at) VALUES (?, ?, NOW())`,
			deviceID, token,
		)
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	}
	return token, nil
}

func (m *MySQL) ValidateToken(deviceID, token string) bool {
	var count int
	m.db.QueryRow(
		`SELECT COUNT(*) FROM devices WHERE device_id = ? AND token = ?`,
		deviceID, token,
	).Scan(&count)
	return count > 0
}

// ── 聊天历史 ──────────────────────────────────────

func (m *MySQL) SaveChatMessage(sessionID, role, content string, meta *ChatMeta) error {
	if meta != nil {
		_, err := m.db.Exec(
			`INSERT INTO chat_history (session_id, role, content, visitor_id, persona_id, ip, region, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
			sessionID, role, content, meta.VisitorID, meta.PersonaID, meta.IP, meta.Region,
		)
		return err
	}
	_, err := m.db.Exec(
		`INSERT INTO chat_history (session_id, role, content, created_at)
		 VALUES (?, ?, ?, NOW())`,
		sessionID, role, content,
	)
	return err
}

func (m *MySQL) GetChatHistory(sessionID string, limit int) ([]ChatMessage, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := m.db.Query(
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
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, rows.Err()
}