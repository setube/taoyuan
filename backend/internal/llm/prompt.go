package llm

import (
	"embed"
	"fmt"
	"strings"
)

//go:embed personas/*.md
var personaFiles embed.FS

// personaCache 启动时加载的人格 prompt 缓存
var personaCache = make(map[string]string)

func init() {
	ids := []string{"qingluan", "chaofeng", "taosu", "moyan"}
	for _, id := range ids {
		data, err := personaFiles.ReadFile("personas/" + id + ".md")
		if err != nil {
			panic(fmt.Sprintf("加载 persona %s 失败: %v", id, err))
		}
		personaCache[id] = string(data)
	}
}

// BuildSystemPrompt 构建 LLM system prompt（从嵌入式 .md 文件加载）
func BuildSystemPrompt(personaID string, knowledgeContext string) string {
	prompt, ok := personaCache[personaID]
	if !ok {
		prompt = personaCache["qingluan"]
	}

	var sb strings.Builder
	sb.WriteString(prompt)

	if knowledgeContext != "" {
		sb.WriteString("\n\n【知识库参考】\n")
		sb.WriteString("以下是与玩家问题相关的游戏知识，基于这些信息回答：\n")
		sb.WriteString(knowledgeContext)
	}

	return sb.String()
}