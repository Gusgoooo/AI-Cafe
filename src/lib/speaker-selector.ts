import { Persona, Message, ConversationContext } from '@/types'
import { computeUtility } from './vectors/utility-drives'

export function calculateImpulse(persona: Persona, ctx: ConversationContext): number {
  let impulse = 0

  const isIntroverted = persona.traits.extroversion < 40
  const isMentioned = ctx.lastMessage.mentions?.includes(persona.id)
  const isCalledByModerator = ctx.lastMessage.personaId === 'moderator' &&
    ctx.lastMessage.content.includes(`@${persona.name}`)

  impulse += persona.traits.extroversion * 0.5
  impulse += persona.behavior.initiativeLevel * 0.15

  if (isIntroverted && !isMentioned && !isCalledByModerator) {
    impulse -= 40
  }

  if (isMentioned || isCalledByModerator) impulse += 120

  const keywordHit = persona.consumerDna.triggerKeywords.some(kw =>
    ctx.lastMessage.content.includes(kw)
  )
  if (keywordHit) impulse += 50

  const frictionHit = persona.friction.hotTopics.some(t =>
    ctx.lastMessage.content.includes(t)
  )
  if (frictionHit) impulse += 40

  const allyHit = persona.friction.allyKeywords.some(kw =>
    ctx.lastMessage.content.includes(kw)
  )
  if (allyHit) impulse += 25

  const domainMatch = persona.cognition.knowledgeDomains.some(d =>
    ctx.currentTopicKeywords.includes(d)
  )
  if (domainMatch) impulse += 35

  const speakerName = ctx.lastMessage.personaId
  const rel = persona.state.relationshipMap[speakerName]
  if (rel) {
    impulse += rel.affinity * 0.15
    impulse += rel.annoyance * 0.2
  }

  if (persona.state.currentMood === '被激怒') impulse += 40
  if (persona.state.currentMood === '困了') impulse -= 60
  if (persona.state.currentMood === '兴奋') impulse += 20
  if (persona.state.currentMood === '无聊') impulse -= 20
  impulse *= persona.state.moodIntensity / 100

  impulse *= persona.state.energyLevel / 100

  const attentionPenalty: Record<string, number> = {
    goldfish: -40, short: -20, normal: 0, deep: 10,
  }
  if (ctx.messageCount > 15) {
    impulse += attentionPenalty[persona.cognition.attentionPattern.span] ?? 0
  }

  const progress = ctx.sessionProgress
  switch (persona.behavior.engagementCurve) {
    case 'fading': impulse *= Math.max(0.1, 1 - progress); break
    case 'warming': impulse *= Math.min(1.5, 0.2 + progress * 1.3); break
    case 'burst': impulse *= Math.abs(Math.sin(progress * Math.PI * 3)); break
    case 'erratic': impulse *= 0.3 + Math.random() * 1.4; break
  }

  if (ctx.lastSpeakers[0] === persona.id) impulse -= 20

  impulse += persona.state.consecutiveSilence * 8

  if (persona.social.conformityTendency > 70 && ctx.majorityAgree) impulse += 15
  if (persona.social.socialRole === 'contrarian' && ctx.majorityAgree) impulse += 30

  const fatigue = persona.state.topicFatigue[ctx.currentTopic] ?? 0
  impulse -= fatigue * 0.5

  impulse += (Math.random() - 0.5) * 80

  return Math.max(0, impulse)
}

export function selectSpeakers(
  personas: Persona[],
  ctx: ConversationContext,
  maxSpeakers: number = 2,
  forcedSpeakerId?: string
): { personaId: string; impulse: number; topDrives?: string[] }[] {
  const eligible = personas.filter(
    p => p.meta.archetypeId !== 'moderator'
  )

  if (forcedSpeakerId) {
    const forced = eligible.find(p => p.id === forcedSpeakerId)
    if (forced) {
      return [{ personaId: forced.id, impulse: 999 }]
    }
  }

  const recentMessages = ctx.messages.slice(-5)

  const impulses = eligible
    .map(p => {
      const baseImpulse = calculateImpulse(p, ctx)
      const utility = computeUtility(p, recentMessages, personas)
      // utility 贡献：归一化到 0~60 范围叠加
      const utilityBonus = Math.min(60, utility.totalUtility * 80)
      return {
        personaId: p.id,
        impulse: baseImpulse + utilityBonus,
        topDrives: utility.topDrives.slice(0, 3).map(d => d.label),
      }
    })
    .sort((a, b) => b.impulse - a.impulse)

  if (impulses.length === 0) return []

  // 日志输出
  console.log('\n🎯 Utility Drives:')
  console.table(impulses.slice(0, 4).map(i => ({
    name: personas.find(p => p.id === i.personaId)?.name,
    impulse: Math.round(i.impulse),
    drives: i.topDrives?.join(', '),
  })))

  const result = [impulses[0]]

  if (maxSpeakers > 1 && impulses.length > 1 && Math.random() > 0.35) {
    if (impulses[1].impulse > 30) {
      result.push(impulses[1])
    }
  }

  return result
}
