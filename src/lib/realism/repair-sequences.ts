import { Persona, Message } from '@/types'

export function shouldTriggerRepair(persona: Persona, lastMessage: Message): boolean {
  if (lastMessage.personaId === persona.id) return false

  const mentionsMe = lastMessage.content.includes(persona.name)
  const hasMisunderstanding =
    lastMessage.content.includes('意思') ||
    lastMessage.content.includes('是说') ||
    lastMessage.content.includes('你的观点是')

  if (mentionsMe && hasMisunderstanding && persona.traits.assertiveness > 40) {
    return Math.random() < 0.5
  }

  return false
}

export function getRepairType(persona: Persona): string {
  const types = [
    '自我修正：可以说"不对，我刚才说错了，我想说的是…"',
    '澄清误解：可以说"你误会我了，我的意思是…"',
    '补充说明：可以说"对了我刚才忘说了一点…"',
  ]

  if (persona.cognition.attentionPattern.span === 'goldfish' || persona.cognition.attentionPattern.span === 'short') {
    types.push('请求重复：可以说"你刚才说啥？我没听清"')
  }

  return types[Math.floor(Math.random() * types.length)]
}
