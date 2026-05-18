import { v4 as uuid } from 'uuid'
import { Persona, PersonaState, RelationshipState, PersonaSocial } from '@/types'
import { chatCompletion, chatCompletionJSON } from '@/lib/openrouter'
import { deriveVoice, deriveBehavior, deriveSocial } from './derive-fields'

interface SlimPersona {
  name: string
  avatar: string
  badgeColor: string
  identity: Persona['identity']
  hook: Persona['hook']
  radar: Persona['radar']
  traits: Persona['traits']
  cognition: Persona['cognition']
  consumerDna: Persona['consumerDna']
  friction: Persona['friction']
  socialRole: PersonaSocial['socialRole']
  voiceCore: {
    catchphrases: string[]
    tone: string
    exampleSentences: string[]
  }
  meta: Persona['meta']
}

interface PersonaSkeleton {
  name: string
  avatar: string
  badgeColor: string
  socialRole: PersonaSocial['socialRole']
  gender: string
  age: number
  occupation: string
  stance: string
  personalityKeywords: string[]
}

const ROLE_SLOTS = [
  '极端支持者，社交角色为 contrarian，性格强势直接',
  '极端反对者，社交角色为 peacemaker/mediator，性格温和但有原则',
  '理性中立派，社交角色为 expert，擅长用数据和逻辑说话',
  '感性支持者，社交角色为 storyteller，喜欢讲故事和个人经历',
  '搅局者/段子手，社交角色为 joker，经常跑题和活跃气氛',
  '沉默观察者，社交角色为 observer，话少但一针见血',
  '意见领袖，社交角色为 leader，喜欢总结和引导方向',
  '魔鬼代言人，社交角色为 devil-advocate，故意唱反调刺激讨论',
]

function initializeState(name: string, topic: string, allNames: string[]): PersonaState {
  const relationshipMap: Record<string, RelationshipState> = {}
  for (const n of allNames) {
    if (n !== name) {
      relationshipMap[n] = { affinity: 0, respect: 50, trust: 50, annoyance: 0 }
    }
  }

  return {
    currentMood: '平静',
    moodIntensity: 30,
    energyLevel: 80 + Math.floor(Math.random() * 20),
    interestLevel: 50 + Math.floor(Math.random() * 30),
    stance: `对"${topic}"持初始观点`,
    stanceConfidence: 30 + Math.floor(Math.random() * 40),
    relationshipMap,
    notableMemories: [],
    runningJokes: [],
    topicFatigue: {},
    consecutiveSilence: 0,
    lastSpokenIndex: -1,
  }
}

export function expandPersona(slim: SlimPersona, topic: string, allNames: string[]): Persona {
  const social = deriveSocial(slim.traits, { socialRole: slim.socialRole })
  const voice = deriveVoice(slim.traits, slim.socialRole, slim.voiceCore)
  const behavior = deriveBehavior(slim.traits)

  return {
    id: uuid(),
    name: slim.name,
    avatar: slim.avatar,
    badgeColor: slim.badgeColor,
    identity: slim.identity,
    hook: slim.hook,
    radar: slim.radar,
    traits: slim.traits,
    cognition: slim.cognition,
    consumerDna: slim.consumerDna,
    friction: slim.friction,
    social,
    voice,
    behavior,
    meta: slim.meta,
    state: initializeState(slim.name, topic, allNames),
    aiConfig: {
      temperature: 0.3 + (slim.traits.openness / 100) * 0.7,
      contextWindow: slim.cognition.attentionPattern.span === 'deep' ? 'all' as const
        : slim.cognition.attentionPattern.span === 'goldfish' ? 'last' as const
        : 'recent' as const,
      systemPromptVersion: 'v1',
    },
  }
}

function buildSkeletonPrompt(crowdDescription: string, topic: string, count: number, userData?: string): string {
  const slots = ROLE_SLOTS.slice(0, count)
  const roleHints = slots.map((r, i) => `角色${i + 1}：${r}`).join('\n')
  const userDataSection = userData ? `\n参考数据：${userData.slice(0, 500)}\n` : ''

  return `为一场关于"${topic}"的讨论生成${count}个虚拟角色的基本骨架。
人群：${crowdDescription}${userDataSection}

角色定位：
${roleHints}

约束：每人名字不同（2字中文名如小周、阿杰、老陈），badgeColor不同（高饱和度互相区分），性别年龄职业有分布。

返回JSON数组：
\`\`\`json
[{"name":"名字","avatar":"emoji","badgeColor":"#hex","socialRole":"leader|mediator|contrarian|cheerleader|observer|joker|expert|storyteller|devil-advocate|peacemaker","gender":"男/女","age":数字,"occupation":"职业","stance":"对话题的立场（10字）","personalityKeywords":["关键词1","关键词2","关键词3"]}]
\`\`\`
直接返回JSON。`
}

function buildDetailPrompt(skeleton: PersonaSkeleton, topic: string): string {
  return `基于以下角色骨架，生成完整人设细节。

骨架：
- 名字：${skeleton.name}，${skeleton.gender}，${skeleton.age}岁，${skeleton.occupation}
- 社交角色：${skeleton.socialRole}
- 对"${topic}"的立场：${skeleton.stance}
- 性格关键词：${skeleton.personalityKeywords.join('、')}

返回JSON对象：
\`\`\`json
{
  "identity": {"age":${skeleton.age},"gender":"${skeleton.gender}","occupation":"${skeleton.occupation}","education":"学历","incomeLevel":"收入","region":"地区","familyStatus":"家庭状态","background":"50字背景","coreValues":["值1","值2"],"lifeStage":"阶段"},
  "hook": {"quote":"15-25字语录","tags":["标签1","标签2","标签3","标签4"]},
  "radar": {"rationality":0-100,"sensibility":0-100,"techAcceptance":0-100,"spendingImpulse":0-100,"socialActivity":0-100},
  "traits": {"extroversion":0-100,"agreeableness":0-100,"openness":0-100,"neuroticism":0-100,"conscientiousness":0-100,"humor":0-100,"assertiveness":0-100,"empathy":0-100,"patience":0-100,"curiosity":0-100,"stubbornness":0-100,"selfAwareness":0-100},
  "cognition": {"thinkingStyle":"analytical|intuitive|pragmatic|creative","argumentStyle":"logical|emotional|anecdotal|authoritative","biases":["偏误1","偏误2"],"knowledgeDomains":["领域1","领域2"],"knowledgeGaps":["盲区"],"attentionPattern":{"span":"goldfish|short|normal|deep","selectiveFocus":["焦点"],"distractors":["分心"]},"memoryModel":{"shortTerm":0-100,"emotionalMemory":0-100,"detailRetention":0-100}},
  "consumerDna": {"buyingLogic":"一句话","priceRange":"区间","brandAttitude":"态度","triggerKeywords":["词1","词2"],"representativeItems":[{"name":"物品","emoji":"emoji"},{"name":"物品","emoji":"emoji"},{"name":"物品","emoji":"emoji"}]},
  "friction": {"howToAnger":["方式1","方式2"],"hotTopics":["话题"],"allyKeywords":["共鸣词"],"avoidTopics":["回避"],"defenseMechanism":"方式"},
  "voiceCore": {"catchphrases":["口头禅1","口头禅2"],"tone":"语气10字","exampleSentences":["句式1","句式2"]},
  "meta": {"roleTags":["标签1","标签2"],"archetypeId":"原型ID"}
}
\`\`\`
性格数值要和关键词匹配。直接返回JSON。`
}

type ProgressCallback = (phase: string, detail: string) => void

export async function generatePersonasStreaming(
  crowdDescription: string,
  topic: string,
  count: number = 8,
  onProgress?: ProgressCallback,
  userData?: string
): Promise<Persona[]> {
  // Phase 1: 快速生成骨架
  onProgress?.('skeleton', '正在分配角色阵容…')
  const skeletonPrompt = buildSkeletonPrompt(crowdDescription, topic, count, userData)
  const skeletons = await chatCompletionJSON<PersonaSkeleton[]>(
    [{ role: 'user', content: skeletonPrompt }],
    { temperature: 0.9, maxTokens: 1500 }
  )

  const validSkeletons = Array.isArray(skeletons) ? skeletons.slice(0, count) : []
  if (validSkeletons.length === 0) throw new Error('骨架生成失败')

  onProgress?.('skeleton-done', `${validSkeletons.length} 位角色就位：${validSkeletons.map(s => s.name).join('、')}`)

  // Phase 2: 并行生成细节
  let completed = 0
  const detailResults = await Promise.all(
    validSkeletons.map(async (skeleton) => {
      onProgress?.('detail', `正在塑造「${skeleton.name}」的性格…`)
      const prompt = buildDetailPrompt(skeleton, topic)
      const raw = await chatCompletion(
        [{ role: 'user', content: prompt }],
        { temperature: 0.85, maxTokens: 1500 }
      )
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : raw
      completed++
      onProgress?.('detail-progress', `已完成 ${completed}/${validSkeletons.length}：${skeleton.name} 就绪`)
      return { skeleton, detail: JSON.parse(jsonStr) }
    })
  )

  onProgress?.('assemble', '正在组装完整人设…')

  const allNames = validSkeletons.map(s => s.name)
  return detailResults.map(({ skeleton, detail }) => {
    const slim: SlimPersona = {
      name: skeleton.name,
      avatar: skeleton.avatar,
      badgeColor: skeleton.badgeColor,
      socialRole: skeleton.socialRole,
      identity: detail.identity,
      hook: detail.hook,
      radar: detail.radar,
      traits: detail.traits,
      cognition: detail.cognition,
      consumerDna: detail.consumerDna,
      friction: detail.friction,
      voiceCore: detail.voiceCore,
      meta: detail.meta,
    }
    return expandPersona(slim, topic, allNames)
  })
}

export async function generatePersonas(
  crowdDescription: string,
  topic: string,
  count: number = 8,
  userData?: string
): Promise<Persona[]> {
  return generatePersonasStreaming(crowdDescription, topic, count, undefined, userData)
}
