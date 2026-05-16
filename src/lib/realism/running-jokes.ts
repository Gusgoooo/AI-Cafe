import { Persona, RunningJoke } from '@/types'

export function buildJokeContext(persona: Persona): string {
  if (persona.state.runningJokes.length === 0) return ''
  if (persona.traits.humor < 30) return ''

  const freq = persona.traits.humor > 70 ? '很可能' : '偶尔会'

  return `\n## 对话中产生的梗\n你记得这些梗：\n${persona.state.runningJokes.map(j => `- "${j}"`).join('\n')}\n你${freq}在合适的时候引用这些梗来制造笑点。`
}

export function trackJoke(content: string, originPersonaId: string, messageIndex: number, jokes: RunningJoke[]): RunningJoke[] {
  const existing = jokes.find(j => j.content === content)
  if (existing) {
    existing.referenceCount++
    return jokes
  }

  return [...jokes, {
    content,
    origin: originPersonaId,
    messageIndex,
    referenceCount: 1,
  }]
}
