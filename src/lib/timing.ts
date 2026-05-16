import { Persona, AIResponse } from '@/types'

export function getResponseDelay(persona: Persona, response: AIResponse): number {
  const baseDelay: Record<string, number> = {
    slow: 5000, normal: 2500, fast: 1000, instant: 300,
  }

  const base = baseDelay[persona.voice.typingSpeed] ?? 2500
  const lengthFactor = Math.sqrt(response.content.length / 30)
  const energyFactor = persona.state.energyLevel < 30 ? 2.5 : 1
  const moodFactor = persona.state.currentMood === '兴奋' ? 0.5 : 1
  const jitter = 0.6 + Math.random() * 0.8

  let delay = base * lengthFactor * energyFactor * moodFactor * jitter

  if (response.retrospectiveRef) delay += 2000

  return Math.max(500, Math.min(delay, 15000))
}
