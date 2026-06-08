package llm

import (
	"sync"
	"time"
)

// Session 对话会话
type Session struct {
	PersonaID string
	Messages  []Message
	CreatedAt time.Time
	UpdatedAt time.Time
}

// SessionStore 内存对话历史存储
type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

// NewSessionStore 创建会话存储
func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string]*Session),
	}
}

// Get 获取或创建会话
func (s *SessionStore) Get(sessionID, personaID string) *Session {
	s.mu.Lock()
	defer s.mu.Unlock()

	if session, ok := s.sessions[sessionID]; ok {
		session.UpdatedAt = time.Now()
		return session
	}

	session := &Session{
		PersonaID: personaID,
		Messages:  []Message{},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	s.sessions[sessionID] = session
	return session
}

// AddMessage 追加消息，超过 20 条自动裁剪
func (s *SessionStore) AddMessage(sessionID string, msg Message) {
	s.mu.Lock()
	defer s.mu.Unlock()

	session := s.sessions[sessionID]
	if session == nil {
		return
	}
	session.Messages = append(session.Messages, msg)
	session.UpdatedAt = time.Now()

	// 保持最近 20 条
	if len(session.Messages) > 20 {
		session.Messages = session.Messages[len(session.Messages)-20:]
	}
}

// GetHistory 获取会话历史（不含 system prompt）
func (s *SessionStore) GetHistory(sessionID string) []Message {
	s.mu.RLock()
	defer s.mu.RUnlock()

	session := s.sessions[sessionID]
	if session == nil {
		return nil
	}
	return session.Messages
}

// Cleanup 清理超过 1 小时未活动的会话
func (s *SessionStore) Cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	cutoff := time.Now().Add(-1 * time.Hour)
	for id, session := range s.sessions {
		if session.UpdatedAt.Before(cutoff) {
			delete(s.sessions, id)
		}
	}
}