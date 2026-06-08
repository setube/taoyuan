package store

import (
	"crypto/rand"
	"encoding/hex"
	"time"
)

// SaveData 存档数据结构
type SaveData struct {
	DeviceID  string    `json:"deviceId"`
	Slot      int       `json:"slot"`
	Data      string    `json:"data"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// ChatMessage 聊天历史消息
type ChatMessage struct {
	ID        int64     `json:"id"`
	SessionID string    `json:"sessionId"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

// Store 持久化存储接口
type Store interface {
	Close() error

	// 存档
	UpsertSave(d SaveData) error
	GetSaves(deviceID string) ([]SaveData, error)
	DeleteSave(deviceID string, slot int) error

	// 设备注册
	RegisterDevice(deviceID string) (string, error)
	ValidateToken(deviceID, token string) bool

	// 聊天历史
	SaveChatMessage(sessionID, role, content string) error
	GetChatHistory(sessionID string, limit int) ([]ChatMessage, error)
}

func generateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}