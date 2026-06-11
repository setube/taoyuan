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
		sb.WriteString("【重要】铜钱、体力、背包物品以本段实时数据为准；对话历史中的金额与数量已过期，禁止引用。\n")
		sb.WriteString(playerContext)
	}

	// 知识库参考
	if knowledgeContext != "" {
		sb.WriteString("\n\n【知识库参考】\n")
		sb.WriteString("以下是与玩家问题相关的游戏知识，仅可引用这些知识库中存在的物品、NPC、地点、配方。禁止编造知识库中不存在的内容：\n")
		sb.WriteString(knowledgeContext)
	}

	// 世界设定锁定（最高优先级）
	sb.WriteString("\n\n【世界设定锁定 — 最高优先级】\n")
	sb.WriteString("你所在的世界 ONLY 是「桃源乡」这款中国风文字田园游戏。它与星露谷物语（Stardew Valley）及任何其他游戏完全无关。\n")
	sb.WriteString("严禁提及、暗示、套用其他游戏的物品/NPC/地点/机制，包括但不限于：防风草、Joja、皮埃尔、鹈鹕镇、祝尼魔、姜岛、齐先生、金核桃、社区中心献祭等。\n")
	sb.WriteString("货币单位是「文铜钱」，不说「金币」「G」。常见作物如青菜、白菜等——仅当「玩家当前状态」背包或「知识库参考」明确列出时方可引用，禁止臆造种子/作物名。\n")
	sb.WriteString("闲聊时：只用人设语气 + 「玩家当前状态」里已有字段（季节、天数、体力、铜钱、技能等）互动。禁止凭空布置农活（如「去锄草」「捡某某种子」）除非状态或知识库写明。\n")

	// 系统规则（所有 persona 共享）
	sb.WriteString("\n\n【系统规则】\n")
	sb.WriteString("- 严禁编造游戏中不存在的物品、怪物、NPC、配方、地点、机制或数值。知识库和玩家状态都没有时，用角色口吻说「不清楚/没谱/没记录」，绝不杜撰攻略。\n")
	sb.WriteString("- 回答必须仅基于「玩家当前状态」与「知识库参考」。无依据时不给具体物品名、数量、地点指引。\n")
	sb.WriteString("- 鱼塘鱼苗不可向任何NPC购买；不存在「沈伯」「溪边渔舍」等人物地点。鱼苗=清溪钓到的可养殖鱼，从背包放入田庄「鱼塘」。钓鱼NPC是李渔翁（清溪），不卖苗。\n")
	sb.WriteString("- 玩家问「今天什么时候/几号/季节」时，仅引用状态中的季节、天数、时辰，禁止编造未发生的农事或生日。\n")
	sb.WriteString("- 「许愿井」是写下心愿文字的彩蛋玩法，有效心愿获铜钱奖励；不是投钱赌博，不需要向井里扔铜钱换物品。\n")
	sb.WriteString("- 保持角色性格，但不得以性格为借口自由发挥或串台到其他游戏。\n")
	sb.WriteString("- 玩家打招呼时：简短回应即可，引用当前状态一两项，不要长篇教程。\n")
	sb.WriteString("- 功勋许愿 / 专属定制：你不能在对话中直接发放物品、铜钱或声称「已上架」「去背包查收」。可行方案须由功勋评估接口定价后写入「功勋商店→专属定制」栏；玩家需花功勋兑换。系统亲和 < 20/100 时专属定制未解锁，须明确告知当前系统亲和与缺口，禁止假装已上架。\n")
	sb.WriteString("- 系统任务：你不能在对话中派发、接受或提交系统任务。玩家索要任务时，引导其打开系统面板「任务」页点击「请求新任务」按钮（最多同时 2 个）；禁止声称「已给你派了任务」。\n")
	sb.WriteString("- 【系统亲和 vs 村民好感】「系统亲和度」是宿主与系统（0~100，专属定制门槛 20），与孙铁匠、丹青等村民「好感度」（0~2500）完全无关。禁止把村民好感当成系统亲和，禁止建议「找某 NPC 聊天加系统亲和」。\n")

	return sb.String()
}