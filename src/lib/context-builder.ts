import { Persona, Message } from '@/types'

export interface VisibleContext {
  messages: { name: string; content: string }[]
  fuzzyMemories: string[]
  ownPrevious: string[]
}

export function buildContext(
  persona: Persona,
  allMessages: Message[],
  personaMap: Map<string, Persona>
): VisibleContext {
  const { contextWindow, contextFocus } = persona.aiConfig
  const { shortTerm, detailRetention, emotionalMemory } = persona.cognition.memoryModel
  const { span, selectiveFocus } = persona.cognition.attentionPattern

  let visible: Message[]
  switch (contextWindow) {
    case 'last':
      visible = allMessages.slice(-1)
      break
    case 'recent':
      visible = allMessages.slice(-(3 + Math.floor(shortTerm / 25)))
      break
    case 'all':
      visible = [...allMessages]
      break
    case 'selective':
      visible = allMessages.filter(
        m =>
          contextFocus?.includes(m.personaId) ||
          m.mentions?.includes(persona.id) ||
          selectiveFocus.some(kw => m.content.includes(kw))
      )
      break
    default:
      visible = allMessages.slice(-5)
  }

  if (emotionalMemory > 60) {
    const emotionalMessages = allMessages.filter(
      m => m.emotionalImpact?.[persona.id] && m.emotionalImpact[persona.id] > 50
    )
    const existing = new Set(visible.map(m => m.id))
    for (const em of emotionalMessages) {
      if (!existing.has(em.id)) visible.push(em)
    }
    visible.sort((a, b) => a.timestamp - b.timestamp)
  }

  if (span === 'goldfish' && Math.random() > 0.6 && visible.length > 2) {
    visible = visible.filter((_, i) => i % 2 === 0 || i === visible.length - 1)
  }

  const fuzzyMemories: string[] = []
  if (detailRetention < 40 && allMessages.length > 10) {
    const forgotten = allMessages.slice(0, -5)
    if (forgotten.length > 0) {
      const sample = forgotten[Math.floor(Math.random() * forgotten.length)]
      const speakerName = personaMap.get(sample.personaId)?.name ?? '有人'
      fuzzyMemories.push(`(你大概记得${speakerName}说过类似的话，但记不清具体内容)`)
    }
  }

  const formatted = visible.map(m => {
    const name = m.personaId === 'user' ? '用户' : (personaMap.get(m.personaId)?.name ?? '未知')
    return { name, content: m.content }
  })

  const ownPrevious = allMessages
    .filter(m => m.personaId === persona.id)
    .slice(-6)
    .map(m => m.content.slice(0, 40))

  return { messages: formatted, fuzzyMemories, ownPrevious }
}
