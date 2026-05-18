import { Message, Persona } from '@/types'
import { getCurrentPhase } from './realism/session-arc'

export interface ModeratorAction {
  type: 'open' | 'funnel' | 'probe' | 'reframe' | 'activate' | 'interim-summary' | 'converge' | 'final-summary'
  targetPersonaId?: string
  directive: string
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
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
  // 从 messages 推断：上次主持人在哪、说了几次、说了什么类型
  let lastModeratorIndex = -1
  const moderatorMessages: { index: number; content: string }[] = []
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].personaId === 'moderator') {
      lastModeratorIndex = i
      moderatorMessages.push({ index: i, content: messages[i].content })
    }
  }

  const messagesSinceLastMod = messages.length - lastModeratorIndex

  // 最少间隔 8 条消息（分段消息多，防止太频繁）
  if (messagesSinceLastMod < 8 && lastModeratorIndex > 0) return null

  const phase = getCurrentPhase(sessionProgress)

  // 检查主持人是否已在当前阶段发过言（防重复）
  const phaseStartMsgIndex = Math.floor(
    phase.start * messages.length / Math.max(sessionProgress, 0.01)
  )
  const alreadySpokeInPhase = moderatorMessages.some(m => m.index >= phaseStartMsgIndex)

  // 阶段转换触发（每个阶段最多触发一次）
  if (!alreadySpokeInPhase) {
    if (phase.name === 'closing') {
      return {
        type: 'final-summary',
        directive: pick([
          '快结束了。用你的话把今天最有意思的碰撞点提炼出来，别列清单，像跟朋友复盘一样。',
          '收尾了。说说你觉得今天聊到最后到底有没有结论——如果没有，卡在哪。',
          '时间差不多了。不用面面俱到，就说你观察到的最大分歧和最意外的共识。',
        ]),
      }
    }

    if (phase.name === 'windingDown') {
      return {
        type: 'converge',
        directive: pick([
          '讨论后半段了。抛一个收束性的问题逼大家表态，别让他们继续散着聊。',
          '该往回收了。找到目前最大的一个分歧点，直接追问"所以到底是A还是B"。',
          '时间不多了。挑一个被反复提到但没人说清楚的点，要求有人给个明确结论。',
        ]),
      }
    }

    if (phase.name === 'peakEngagement') {
      return {
        type: 'reframe',
        directive: pick([
          '讨论热起来了。你觉得大家其实在吵一个更底层的问题但没人说破——你来说破。',
          '有火花了。找到两个最对立的观点，故意放大矛盾，让他们正面刚。',
          '挺热闹的。但你觉得大家都在绕圈——用一个尖锐的问题把讨论切到核心。',
        ]),
      }
    }
  }

  // 以下条件触发：需要 messagesSinceLastMod >= 10
  if (messagesSinceLastMod < 10) return null

  // 讨论打转
  if (detectCircularDiscussion(messages)) {
    return {
      type: 'funnel',
      directive: pick([
        '你们在绕圈了。用一个更具体的问题把讨论钉死——不要让他们继续泛泛地表态。',
        '翻来覆去都是那几句话。换个角度切入，或者直接问"具体到你自己的情况呢"。',
        '打转了。故意曲解某人的话来逼他们说得更精确。',
      ]),
    }
  }

  // 讨论太浅
  if (detectSurfaceLevel(messages)) {
    const target = findProbeTarget(messages, personas)
    return {
      type: 'probe',
      targetPersonaId: target?.personaId,
      directive: pick([
        `${target ? `@${target.name} 刚才那个点太浅了。` : ''}逼他们给具体的：数字、案例、亲身经历。"你说的'很多人'到底是多少人？"`,
        `大家都在说正确的废话。${target ? `追问 @${target.name}：` : ''}为什么？怎么知道的？有什么证据？`,
        `表面观点太多了。${target ? `挑 @${target.name} 的话往下追：` : ''}这个判断背后的逻辑是什么？`,
      ]),
    }
  }

  // 沉默者激活
  const silent = findSilentPersona(messages, personas)
  if (silent) {
    return {
      type: 'activate',
      targetPersonaId: silent.personaId,
      directive: pick([
        `@${silent.name} 潜水很久了。用一个跟ta专业相关的具体问题把ta钓出来。`,
        `@${silent.name} 安静太久了。不要客气地"请分享"，直接问ta一个尖锐但友好的问题。`,
        `注意到 @${silent.name} 一直没说话。猜测ta可能在想什么，然后问对不对。`,
      ]),
    }
  }

  // 观点不够多元
  if (countDistinctViewpoints(messages) <= 2) {
    return {
      type: 'reframe',
      directive: pick([
        '只有两三个人在说。提一个让其他人不得不回应的问题——跟他们的领域直接相关的。',
        '视角太单一了。故意提一个反面观点或者极端假设，炸出沉默的人。',
        '讨论成了两个人的对话。问一个需要不同专业背景才能回答的问题。',
      ]),
    }
  }

  // 深挖有价值的观点
  const probeTarget = findProbeTarget(messages, personas)
  if (probeTarget && Math.random() < 0.35) {
    return {
      type: 'probe',
      targetPersonaId: probeTarget.personaId,
      directive: pick([
        `@${probeTarget.name} 刚才那句有意思但一笔带过了。追着问：为什么这么确定？有反例吗？`,
        `@${probeTarget.name} 说了个有料的点。故意质疑一下看ta能不能站住脚。`,
        `@${probeTarget.name} 那个判断很大胆。问ta：如果错了呢？代价是什么？`,
      ]),
    }
  }

  return null
}

export function markModeratorSpoke(_messageIndex: number) {
  // no-op: state is now derived from messages
}

export function resetModeratorState() {
  // no-op: state is now derived from messages
}
