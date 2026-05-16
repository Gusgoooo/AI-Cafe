import { Persona, Message, AIResponse } from '@/types'
import { propagateEmotion } from './realism/emotional-contagion'
import { updateTopicFatigue } from './realism/topic-fatigue'
import { trackGroupPolarization } from './realism/polarization'

export function updateAllStates(
  personas: Persona[],
  newMessage: Message,
  currentTopic: string,
  aiResponse?: AIResponse
) {
  const speaker = personas.find(p => p.id === newMessage.personaId)

  for (const p of personas) {
    p.state.energyLevel = Math.max(
      0,
      p.state.energyLevel - (p.id === newMessage.personaId ? 3 : 1)
    )

    if (p.id === newMessage.personaId) {
      p.state.consecutiveSilence = 0
      p.state.lastSpokenIndex = -1
    } else {
      p.state.consecutiveSilence++
    }

    if (p.id !== newMessage.personaId && newMessage.personaId !== 'user' && speaker) {
      if (speaker.state.moodIntensity > 70 && p.traits.empathy > 50) {
        propagateEmotion(speaker, [p])
      }
    }

    if (newMessage.personaId !== p.id && newMessage.personaId !== 'user') {
      const rel = p.state.relationshipMap[
        personas.find(x => x.id === newMessage.personaId)?.name ?? ''
      ]
      if (rel) {
        if (newMessage.mentions?.includes(p.id)) rel.trust = Math.min(100, rel.trust + 3)
        if (newMessage.content.includes(`不同意${p.name}`))
          rel.annoyance = Math.min(100, rel.annoyance + 10)
        if (newMessage.content.includes(`同意${p.name}`))
          rel.affinity = Math.min(100, rel.affinity + 5)
      }
    }
  }

  if (aiResponse?.moodChange && speaker) {
    speaker.state.currentMood = aiResponse.moodChange.newMood
    speaker.state.moodIntensity = aiResponse.moodChange.intensity
  }

  if (aiResponse?.isJokeWorthy && newMessage.content.length > 5) {
    const jokeContent = newMessage.content.slice(0, 50)
    for (const p of personas) {
      if (p.traits.humor > 30 && !p.state.runningJokes.includes(jokeContent)) {
        p.state.runningJokes.push(jokeContent)
        if (p.state.runningJokes.length > 5) p.state.runningJokes.shift()
      }
    }
  }

  updateTopicFatigue(personas, currentTopic)

  if (personas.length > 3) {
    trackGroupPolarization(personas)
  }
}
