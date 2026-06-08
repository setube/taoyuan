package llm

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// Client DeepSeek API 客户端（OpenAI 兼容）
type Client struct {
	apiKey  string
	baseURL string
	model   string
	http    *http.Client
}

// Message 对话消息
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest OpenAI-compatible chat completion request
type ChatRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature,omitempty"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Stream      bool      `json:"stream"`
}

// ChatResponse OpenAI-compatible chat completion response
type ChatResponse struct {
	ID      string   `json:"id"`
	Choices []Choice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// Choice 回复选项
type Choice struct {
	Message Message `json:"message"`
	Index   int     `json:"index"`
}

// streamChunk SSE 流式块（delta 模式）
type streamChunk struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		Index int `json:"index"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// New 创建 LLM 客户端
func New(apiKey, baseURL, model string) *Client {
	return &Client{
		apiKey:  apiKey,
		baseURL: baseURL,
		model:   model,
		http:    &http.Client{Timeout: 0}, // 流式无超时
	}
}

// Chat 发送对话请求（非流式）
func (c *Client) Chat(messages []Message, temperature float64, maxTokens int) (string, error) {
	reqBody := ChatRequest{
		Model:       c.model,
		Messages:    messages,
		Temperature: temperature,
		MaxTokens:   maxTokens,
		Stream:      false,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("序列化请求失败: %w", err)
	}

	req, err := http.NewRequest("POST", c.baseURL+"/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("API 请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("API 返回 %d: %s", resp.StatusCode, string(body))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		return "", fmt.Errorf("解析响应失败: %w", err)
	}

	if chatResp.Error != nil {
		return "", fmt.Errorf("API 错误: %s", chatResp.Error.Message)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("API 返回空回复")
	}

	return chatResp.Choices[0].Message.Content, nil
}

// ChatStream 流式对话，通过 channel 逐块返回内容
// 返回 contentChan（文本块）和 done（完成/错误信号）
// done 在完成时为 nil，出错时返回 error
func (c *Client) ChatStream(messages []Message, temperature float64, maxTokens int) (<-chan string, <-chan error) {
	contentChan := make(chan string, 10)
	done := make(chan error, 1)

	go func() {
		defer close(contentChan)
		defer close(done)

		reqBody := ChatRequest{
			Model:       c.model,
			Messages:    messages,
			Temperature: temperature,
			MaxTokens:   maxTokens,
			Stream:      true,
		}

		jsonBody, err := json.Marshal(reqBody)
		if err != nil {
			done <- fmt.Errorf("序列化请求失败: %w", err)
			return
		}

		req, err := http.NewRequest("POST", c.baseURL+"/chat/completions", bytes.NewReader(jsonBody))
		if err != nil {
			done <- fmt.Errorf("创建请求失败: %w", err)
			return
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+c.apiKey)

		resp, err := c.http.Do(req)
		if err != nil {
			done <- fmt.Errorf("API 请求失败: %w", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			body, _ := io.ReadAll(resp.Body)
			done <- fmt.Errorf("API 返回 %d: %s", resp.StatusCode, string(body))
			return
		}

		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Text()
			if line == "" || !strings.HasPrefix(line, "data: ") {
				continue
			}

			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				done <- nil
				return
			}

			var chunk streamChunk
			if err := json.Unmarshal([]byte(data), &chunk); err != nil {
				continue // 跳过无法解析的块
			}

			if chunk.Error != nil {
				done <- fmt.Errorf("流式错误: %s", chunk.Error.Message)
				return
			}

			for _, choice := range chunk.Choices {
				if choice.Delta.Content != "" {
					contentChan <- choice.Delta.Content
				}
			}
		}

		if err := scanner.Err(); err != nil {
			done <- fmt.Errorf("读取流失败: %w", err)
			return
		}
		done <- nil
	}()

	return contentChan, done
}