import { v4 as uuid } from 'uuid'
import { Persona, PersonaState, RelationshipState, PersonaSocial } from '@/types'
import { chatCompletionJSON } from '@/lib/openrouter'
import { buildPersonaGenerationPrompt } from '@/lib/prompts/persona-generator'
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

function expandPersona(slim: SlimPersona, topic: string, allNames: string[]): Persona {
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

async function generateOne(
  crowdDescription: string,
  topic: string,
  roleHint: string,
  userData?: string
): Promise<SlimPersona> {
  const prompt = buildPersonaGenerationPrompt(crowdDescription, topic, 1, userData)
    + `\n\n本次只生成 1 个角色，角色定位为：${roleHint}。返回只包含 1 个元素的 JSON 数组。`

  const result = await chatCompletionJSON<SlimPersona[]>(
    [{ role: 'user', content: prompt }],
    { temperature: 0.95, maxTokens: 2048 }
  )

  return Array.isArray(result) ? result[0] : result as unknown as SlimPersona
}

export async function generatePersonas(
  crowdDescription: string,
  topic: string,
  count: number = 8,
  userData?: string
): Promise<Persona[]> {
  const slots = ROLE_SLOTS.slice(0, count)

  const slimPersonas = await Promise.all(
    slots.map(role => generateOne(crowdDescription, topic, role, userData))
  )

  const allNames = slimPersonas.map(p => p.name)

  return slimPersonas.map(slim => expandPersona(slim, topic, allNames))
}
