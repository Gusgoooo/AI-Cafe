import { Persona } from '@/types'

export function trackGroupPolarization(personas: Persona[]) {
  const stanceScores = new Map<string, number>()

  for (const p of personas) {
    const stance = p.state.stance
    stanceScores.set(stance, (stanceScores.get(stance) ?? 0) + 1)
  }

  let majorityStance = ''
  let maxCount = 0
  for (const [stance, count] of stanceScores) {
    if (count > maxCount) {
      majorityStance = stance
      maxCount = count
    }
  }

  for (const p of personas) {
    if (p.social.conformityTendency > 60 && p.state.stanceConfidence < 50) {
      p.state.stance = `更倾向于${majorityStance}`
      p.state.stanceConfidence = Math.min(100, p.state.stanceConfidence + 5)
    }
    if (p.social.socialRole === 'contrarian') {
      p.state.stanceConfidence = Math.min(100, p.state.stanceConfidence + 3)
    }
  }
}
