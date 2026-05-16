import { Message, Persona } from '@/types'
import { getCurrentPhase } from './realism/session-arc'

export interface ModeratorAction {
  type: 'open' | 'funnel' | 'probe' | 'reframe' | 'activate' | 'interim-summary' | 'converge' | 'final-summary'
  targetPersonaId?: string
  directive: string
}

interface ModeratorState {
  lastPhase: string
  lastModeratorIndex: number
  interimSummaryCount: number
  probeCount: number
}

const state: ModeratorState = {
  lastPhase: '',
  lastModeratorIndex: -1,
  interimSummaryCount: 0,
  probeCount: 0,
}

function getRecentNonModMessages(messages: Message[], n: number): Message[] {
  return messages
    .filter(m => m.personaId !== 'moderator' && m.personaId !== 'environment')
    .slice(-n)
}

function detectCircularDiscussion(messages: Message[]): boolean {
  const recent = getRecentNonModMessages(messages, 6)
  if (recent.length < 4) return false

  const contents = recent.map(m => m.content)
  const words = contents.flatMap(c => c.split(/\s+/))
  const freq = new Map<string, number>()
  for (const w of words) {
    if (w.length < 2) continue
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  const repeatedWords = [...freq.values()].filter(v => v >= 4).length
  return repeatedWords >= 3
}

function detectSurfaceLevel(messages: Message[]): boolean {
  const recent = getRecentNonModMessages(messages, 4)
  if (recent.length < 3) return false
  const avgLen = recent.reduce((s, m) => s + m.content.length, 0) / recent.length
  return avgLen < 30
}

function findProbeTarget(messages: Message[], personas: Persona[]): { personaId: string; name: string; content: string } | null {
  const recent = getRecentNonModMessages(messages, 4)
  for (let i = recent.length - 1; i >= 0; i--) {
    const msg = recent[i]
    if (msg.content.length > 40 && msg.personaId !== 'user') {
      const p = personas.find(p => p.id === msg.personaId)
      if (p) return { personaId: p.id, name: p.name, content: msg.content.slice(0, 50) }
    }
  }
  return null
}

function findSilentPersona(messages: Message[], personas: Persona[]): { personaId: string; name: string } | null {
  const recentSpeakers = new Set(
    messages.slice(-12).map(m => m.personaId)
  )
  const silent = personas.find(
    p => p.meta.archetypeId !== 'moderator' &&
      p.meta.archetypeId !== 'slacker' &&
      !recentSpeakers.has(p.id)
  )
  if (silent) return { personaId: silent.id, name: silent.name }
  return null
}

function countDistinctViewpoints(messages: Message[]): number {
  const recent = getRecentNonModMessages(messages, 8)
  const speakers = new Set(recent.map(m => m.personaId))
  return speakers.size
}

export function shouldModeratorSpeak(
  messages: Message[],
  personas: Persona[],
  sessionProgress: number
): ModeratorAction | null {
  const messagesSinceLastMod = messages.length - state.lastModeratorIndex

  if (messagesSinceLastMod < 5 && state.lastModeratorIndex > 0) return null

  const phase = getCurrentPhase(sessionProgress)

  if (phase.name !== state.lastPhase && state.lastPhase !== '') {
    state.lastPhase = phase.name

    if (phase.name === 'closing') {
      return {
        type: 'final-summary',
        directive: '讨论进入尾声。做一个完整的最终总结：1)今天讨论的核心问题是什么 2)形成了哪些共识 3)核心分歧在哪 4)还有什么没聊透的。如果有明确结论就给出结论，如果没有就诚实地说"这个问题没有简单答案，但我们至少搞清楚了……"。可以@一两个人让他们补充一句收尾。',
      }
    }

    if (phase.name === 'windingDown') {
      return {
        type: 'converge',
        directive: '讨论已经进入后半段了。做一个阶段性总结，把目前的核心分歧和初步共识梳理清楚，然后引导大家往结论方向走。问大家："如果只能带走一个结论，你们觉得是什么？"',
      }
    }

    if (phase.name === 'peakEngagement') {
      return {
        type: 'reframe',
        directive: '讨论热起来了。把目前的讨论框架梳理一下——大家其实在争什么？用一两句话把核心矛盾提炼出来，然后引导大家围绕这个核心矛盾正面交锋，不要泛泛地聊。',
      }
    }

    return null
  }

  if (state.lastPhase === '') {
    state.lastPhase = phase.name
  }

  // 阶段性总结：每 25% 进度做一次
  const progressMilestones = [0.25, 0.5, 0.75]
  const nextMilestone = progressMilestones[state.interimSummaryCount]
  if (nextMilestone && sessionProgress >= nextMilestone && messagesSinceLastMod >= 6) {
    state.interimSummaryCount++
    return {
      type: 'interim-summary',
      directive: '做一个阶段性总结。不是复述每个人说了什么，而是提炼：1)目前的核心分歧是什么 2)有没有初步共识 3)还有什么角度没覆盖到。然后提出下一步该聊什么方向，给讨论一个推进的结构。',
    }
  }

  // 讨论打转：用漏斗式提问聚焦
  if (detectCircularDiscussion(messages)) {
    return {
      type: 'funnel',
      directive: '讨论在打转，大家在重复类似的观点。用漏斗式提问把话题聚焦：先概括"刚才大家反复在说的其实是……"，然后把问题缩小到一个更具体的点，要求大家围绕这个具体点给出明确的判断。',
    }
  }

  // 讨论太浅：梯形追问
  if (detectSurfaceLevel(messages)) {
    const target = findProbeTarget(messages, personas)
    return {
      type: 'probe',
      targetPersonaId: target?.personaId,
      directive: `讨论还停留在表面。${target ? `@${target.name} 刚才提到了一个点但没深入——` : ''}用梯形追问（Laddering）往下挖：为什么这么想？背后的真实原因是什么？有没有亲身经历或具体案例？不要让大家停留在"我觉得"的层面。`,
    }
  }

  // 沉默者激活
  const silent = findSilentPersona(messages, personas)
  if (silent && messagesSinceLastMod >= 7) {
    return {
      type: 'activate',
      targetPersonaId: silent.personaId,
      directive: `@${silent.name} 一直没怎么说话。用温和但直接的方式邀请ta参与：先概括一下目前的讨论焦点，然后问ta从ta的角度怎么看，或者有没有不同的经历。不要让ta觉得被审问，而是真的对ta的视角好奇。`,
    }
  }

  // 观点不够多元：邀请不同角度
  if (countDistinctViewpoints(messages) <= 2 && messagesSinceLastMod >= 6) {
    return {
      type: 'reframe',
      directive: '目前只有少数几个人在说话，视角不够多元。引入一个新的分析维度或提出一个反面论点，邀请其他人从不同角度参与。可以用投射技术："如果你是XX（消费者/老板/竞争对手），你会怎么看这件事？"',
    }
  }

  // 深挖有价值的观点
  const probeTarget = findProbeTarget(messages, personas)
  if (probeTarget && messagesSinceLastMod >= 6 && Math.random() < 0.35) {
    state.probeCount++
    return {
      type: 'probe',
      targetPersonaId: probeTarget.personaId,
      directive: `@${probeTarget.name} 刚才说了一个有意思的点："${probeTarget.content}"。追问ta：能具体展开说说吗？有没有真实案例或数据支撑？为什么你会这么想——是个人经历还是行业观察？`,
    }
  }

  return null
}

export function markModeratorSpoke(messageIndex: number) {
  state.lastModeratorIndex = messageIndex
}

export function resetModeratorState() {
  state.lastPhase = ''
  state.lastModeratorIndex = -1
  state.interimSummaryCount = 0
  state.probeCount = 0
}
