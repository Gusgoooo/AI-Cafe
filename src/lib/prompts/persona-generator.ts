export function buildPersonaGenerationPrompt(
  crowdDescription: string,
  topic: string,
  count: number = 1,
  userData?: string
): string {
  const userDataSection = userData
    ? `\n## 用户提供的数据\n以下是用户上传的参考数据，请基于这些数据来丰富和校准人设：\n${userData}\n`
    : ''

  return `你是一个用户画像设计师。根据以下描述生成 ${count} 个真实可信的普通人。

## 人群描述
${crowdDescription}

## 讨论话题
${topic}
${userDataSection}
## 要求

1. 人物要像真实生活中会遇到的普通人，不要夸张、不要脸谱化
2. 年龄、性别、职业、教育背景自然分布
3. 性格差异要自然——现实中人和人本来就不一样，不需要刻意制造极端对比
4. traits 数值大多在 30-70 之间，只有少数突出特征可以到 80+或 20 以下
5. 背景描述要克制，像朋友间简单介绍，不要写小说
6. 口头禅要真实自然，不要刻意搞笑或文艺

## 输出格式

返回 JSON 数组，每个元素：

\`\`\`json
[
  {
    "name": "2字中文姓名（简单易记，如：小周、阿杰、老陈、大伟）",
    "avatar": "代表性emoji",
    "badgeColor": "#hex色值",
    "identity": {
      "age": 数字, "gender": "男/女", "occupation": "职业",
      "education": "学历", "incomeLevel": "收入描述", "region": "地区",
      "familyStatus": "家庭状态", "background": "50字人生背景",
      "coreValues": ["价值观1", "价值观2"], "lifeStage": "人生阶段"
    },
    "hook": {
      "quote": "15-25字个性语录",
      "tags": ["标签1", "标签2", "标签3", "标签4"]
    },
    "radar": {
      "rationality": 0-100, "sensibility": 0-100, "techAcceptance": 0-100,
      "spendingImpulse": 0-100, "socialActivity": 0-100
    },
    "traits": {
      "extroversion": 0-100, "agreeableness": 0-100, "openness": 0-100,
      "neuroticism": 0-100, "conscientiousness": 0-100, "humor": 0-100,
      "assertiveness": 0-100, "empathy": 0-100, "patience": 0-100,
      "curiosity": 0-100, "stubbornness": 0-100, "selfAwareness": 0-100
    },
    "cognition": {
      "thinkingStyle": "analytical|intuitive|pragmatic|creative",
      "argumentStyle": "logical|emotional|anecdotal|authoritative",
      "biases": ["认知偏误1", "认知偏误2"],
      "knowledgeDomains": ["擅长领域1", "擅长领域2"],
      "knowledgeGaps": ["盲区1"],
      "attentionPattern": {
        "span": "goldfish|short|normal|deep",
        "selectiveFocus": ["关注点"], "distractors": ["分心因素"]
      },
      "memoryModel": { "shortTerm": 0-100, "emotionalMemory": 0-100, "detailRetention": 0-100 }
    },
    "consumerDna": {
      "buyingLogic": "一句话购买逻辑", "priceRange": "消费区间",
      "brandAttitude": "品牌态度", "triggerKeywords": ["关键词1", "关键词2"],
      "representativeItems": [{"name":"物品","emoji":"emoji"},{"name":"物品","emoji":"emoji"},{"name":"物品","emoji":"emoji"}]
    },
    "friction": {
      "howToAnger": ["激怒方式1", "激怒方式2"],
      "hotTopics": ["敏感话题"], "allyKeywords": ["共鸣词"],
      "avoidTopics": ["回避话题"], "defenseMechanism": "防御方式"
    },
    "socialRole": "leader|mediator|contrarian|cheerleader|observer|joker|expert|storyteller|devil-advocate|peacemaker",
    "voiceCore": {
      "catchphrases": ["口头禅1", "口头禅2"],
      "tone": "语气描述（10字）",
      "exampleSentences": ["典型句式1", "典型句式2"]
    },
    "meta": { "roleTags": ["标签1", "标签2"], "archetypeId": "原型ID" }
  }
]
\`\`\`

直接返回 JSON，不要多余解释。`
}
