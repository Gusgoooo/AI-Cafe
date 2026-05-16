import { Persona, Message, ReportData } from '@/types'
import { chatCompletionJSON } from '@/lib/openrouter'

interface AnalysisInput {
  topic: string
  crowdDescription: string
  cafeName: string
  duration: number
  personas: Persona[]
  messages: Message[]
}

function sampleMessages(messages: Message[], maxCount: number = 60): Message[] {
  const filtered = messages.filter(m => m.personaId !== 'environment')
  if (filtered.length <= maxCount) return filtered

  const head = filtered.slice(0, 5)
  const tail = filtered.slice(-10)
  const middle = filtered.slice(5, -10)
  const step = Math.ceil(middle.length / (maxCount - 15))
  const sampled = middle.filter((_, i) => i % step === 0)

  return [...head, ...sampled, ...tail]
}

export async function analyzeConversation(input: AnalysisInput): Promise<ReportData> {
  const { topic, crowdDescription, personas, messages } = input

  const personaMap = new Map(personas.map(p => [p.id, p]))

  const sampled = sampleMessages(messages)
  const condensedMessages = sampled
    .map(m => {
      const name = m.personaId === 'user' ? '用户' : (personaMap.get(m.personaId)?.name ?? '未知')
      return `${name}：${m.content}`
    })
    .join('\n')

  const personaInfo = personas
    .map(p => `${p.name}（${p.identity.occupation}，${p.identity.age}岁）`)
    .join('、')

  const prompt = `你是一位对话分析专家。请分析以下关于「${topic}」的讨论，参与者是${crowdDescription}。

## 参与者
${personaInfo}

## 对话记录（${messages.filter(m => m.personaId !== 'environment').length}条中摘选${sampled.length}条）
${condensedMessages}

请生成结构化分析报告。返回 JSON：

\`\`\`json
{
  "title": "${topic}",
  "overview": "一段话总结整场讨论（80-150字）",
  "keyInsights": ["核心洞察1", "核心洞察2", "核心洞察3"],
  "consensusPoints": ["达成共识的点1", "达成共识的点2"],
  "controversialPoints": ["争议最大的点1", "争议最大的点2"],
  "personaSummaries": [
    {
      "personaId": "id",
      "name": "名字",
      "stance": "最终立场（15字内）",
      "stanceEvolution": "立场变化（30字内）",
      "keyQuotes": ["精彩发言1"],
      "messageCount": 0,
      "avgSentiment": 50,
      "notableActions": ["行为"]
    }
  ],
  "topicFlow": [
    { "topic": "子话题", "startMessageIndex": 0, "endMessageIndex": 10, "participants": ["名字1"] }
  ],
  "groupDynamics": {
    "alliances": [["名字1", "名字2"]],
    "rivalries": [["名字3", "名字4"]],
    "influencers": ["名字1"],
    "outliers": ["名字5"],
    "polarizationIndex": 50
  },
  "sentimentTimeline": [
    { "messageIndex": 0, "avgSentiment": 50 }
  ],
  "runningJokes": ["产生的梗"],
  "surprisingMoments": ["意外时刻"]
}
\`\`\`

要求：
- personaSummaries 包含每个参与者，文字精炼
- sentimentTimeline 3-5 个数据点即可
- topicFlow 反映话题流转
- 注意分析群体动力学

直接返回 JSON。`

  const messageCounts = new Map<string, number>()
  for (const m of messages) {
    if (m.personaId !== 'environment') {
      messageCounts.set(m.personaId, (messageCounts.get(m.personaId) ?? 0) + 1)
    }
  }

  const result = await chatCompletionJSON<ReportData>(
    [{ role: 'user', content: prompt }],
    { temperature: 0.5, maxTokens: 4096 }
  )

  for (const ps of result.personaSummaries) {
    const persona = personas.find(p => p.name === ps.name)
    if (persona) {
      ps.personaId = persona.id
      ps.messageCount = messageCounts.get(persona.id) ?? 0
    }
  }

  return result
}
