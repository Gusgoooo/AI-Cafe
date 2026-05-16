import { Persona } from '@/types'

export function propagateEmotion(source: Persona, allPersonas: Persona[]) {
  if (source.state.moodIntensity < 50) return

  for (const target of allPersonas) {
    if (target.id === source.id) continue

    const susceptibility = target.traits.empathy / 100
    const relationship = target.state.relationshipMap[source.name]
    const relFactor = relationship ? (relationship.affinity + 50) / 100 : 0.5

    const contagionProb = susceptibility * relFactor * (source.state.moodIntensity / 100)

    if (Math.random() < contagionProb * 0.5) {
      target.state.currentMood = source.state.currentMood
      target.state.moodIntensity = Math.min(
        100,
        target.state.moodIntensity + source.state.moodIntensity * 0.3
      )
    }
  }
}
