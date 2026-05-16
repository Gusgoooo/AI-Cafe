import { Persona, ConversationTempo, ConversationContext } from '@/types'

export function determineRhythm(
  personas: Persona[],
  ctx: ConversationContext
): ConversationTempo {
  const avgEnergy =
    personas.reduce((s, p) => s + p.state.energyLevel, 0) / personas.length

  if (ctx.isHeatedDebate) return 'rapid-fire'
  if (avgEnergy < 25) return 'dead-air'
  if (ctx.lastMessageWasDeep) return 'slow'
  return 'normal'
}

export function getTempoDelay(tempo: ConversationTempo): { min: number; max: number } {
  switch (tempo) {
    case 'rapid-fire': return { min: 500, max: 1500 }
    case 'normal': return { min: 2000, max: 5000 }
    case 'slow': return { min: 5000, max: 10000 }
    case 'dead-air': return { min: 10000, max: 20000 }
  }
}
