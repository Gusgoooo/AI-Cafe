import { Persona, Message } from '@/types'

function hasTopicOverlap(content: string, keywords: string[]): boolean {
  return keywords.some(kw => content.includes(kw))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function shouldRetrospect(
  persona: Persona,
  messages: Message[],
  currentTopicKeywords: string[]
): Message | null {
  const prob =
    (persona.traits.conscientiousness * persona.cognition.memoryModel.detailRetention) / 40000

  if (Math.random() > prob) return null
  if (messages.length < 15) return null

  const candidates = messages.slice(-25, -8).filter(m =>
    m.personaId !== persona.id && hasTopicOverlap(m.content, currentTopicKeywords)
  )

  return candidates.length > 0 ? pick(candidates) : null
}

const RETRO_TEMPLATES: ((name: string, content: string) => string)[] = [
  (n, c) => `你想起${n}之前说过"${c}"——这个和现在的讨论有关联，指出来。`,
  (n, c) => `${n}之前那句"${c}"你一直在琢磨，现在突然想通了，把你的新理解说出来。`,
  (n, c) => `你突然意识到${n}之前那个"${c}"的观点其实是错的，用新的证据反驳它。`,
  (n, c) => `你要翻旧账——${n}之前说"${c}"，但现在的讨论证明那个判断站不住脚。`,
  (n, c) => `联想到${n}说的"${c}"，你发现一个当时没人注意到的矛盾。`,
  (n, c) => `${n}那个"${c}"的观点被忽略了，但你觉得它才是关键，重新拎出来讨论。`,
  (n, c) => `你刚才在想${n}说的"${c}"，发现它和另一个人的观点能对上——串联一下。`,
  (n, c) => `${n}之前说"${c}"的时候你没在意，现在越想越觉得TA在暗示一个更大的问题。`,
  (n, c) => `你之前不同意${n}说的"${c}"，但现在的讨论让你开始动摇——坦率地说出来。`,
  (n, c) => `回想${n}说的"${c}"，你觉得那是今天讨论中最被低估的一个观点。`,
  (n, c) => `${n}之前那个"${c}"如果是对的，那现在大家在聊的整个前提就有问题——把这个逻辑说出来。`,
  (n, c) => `你忽然联想到${n}说的"${c}"和你的行业里一个很相似的案例——把它们放在一起看。`,
  (n, c) => `有意思——${n}说"${c}"的时候大家都跳过了，但它恰好能回答现在卡住的问题。`,
  (n, c) => `你发现自己当时误解了${n}说的"${c}"的意思，现在想通了，更正你之前的回应。`,
  (n, c) => `${n}提到的"${c}"让你想起一个你之前不好意思说的想法——现在说出来。`,
  (n, c) => `你把${n}的"${c}"和今天的讨论进展放在一起看，发现大家的观点在往一个方向收敛。`,
]

export function buildRetrospectiveDirective(refMessage: Message, speakerName: string): string {
  const tpl = pick(RETRO_TEMPLATES)
  return tpl(speakerName, refMessage.content.slice(0, 40))
}
