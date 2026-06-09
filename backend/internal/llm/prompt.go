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
// playerContext: 玩家当前游戏状态文本（可为空）
// knowledgeContext: 知识库搜索结果文本（可为空）
func BuildSystemPrompt(personaID string, playerContext string, knowledgeContext string) string {
	prompt, ok := personaCache[personaID]
	if !ok {
		prompt = personaCache["qingluan"]
	}

	var sb strings.Builder
	sb.WriteString(prompt)

	// 玩家状态上下文
	if playerContext != "" {
		sb.WriteString("\n\n【玩家当前状态】\n")
		sb.WriteString("以下信息反映玩家在游戏中的真实进度。你的回答必须基于这些数据，不能假设玩家拥有未列出的物品或能力。\n")
		sb.WriteString(playerContext)
	}

	// 知识库参考
	if knowledgeContext != "" {
		sb.WriteString("\n\n【知识库参考】\n")
		sb.WriteString("以下是与玩家问题相关的游戏知识，仅可引用这些知识库中存在的物品、NPC、地点、配方。禁止编造知识库中不存在的内容：\n")
		sb.WriteString(knowledgeContext)
	}

	// 系统规则（所有 persona 共享）
	sb.WriteString("\n\n【系统规则】\n")
	sb.WriteString("- 严禁编造游戏中不存在的物品、怪物、NPC、配方、地点、机制或数值。如果知识库和玩家状态中都没有相关信息，应诚实告知「这我还不清楚」或「游戏里没有这个东西」，而不是凭空杜撰。\n")
	sb.WriteString("- 回答必须贴合桃源乡的游戏机制。参考知识库中的数据给出具体指引（物品名、地点、数量、季节、技能要求等）。\n")
	sb.WriteString("- 保持角色性格，但不得以角色性格为借口胡编乱造。\n")

	return sb.String()
}