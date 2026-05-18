import { Persona, Message } from '@/types'

// 效用驱动标签：每个 persona 在每个时刻对这些目标有不同权重
// 权重从性格特征自动派生 + 随对话上下文动态调整

export interface DriveWeights {
  [driveId: string]: number
}

export interface DriveScore {
  driveId: string
  label: string
  weight: number
  satisfaction: number
  contribution: number // weight * satisfaction
}

export interface UtilityResult {
  personaId: string
  totalUtility: number
  topDrives: DriveScore[]
}

// ============ 驱动标签定义 ============

export interface Drive {
  id: string
  label: string
  category: 'cognitive' | 'social' | 'expressive' | 'strategic' | 'emotional' | 'identity'
}

export const ALL_DRIVES: Drive[] = [
  // ---- 认知驱动 (cognitive) ----
  { id: 'seek_clarity', label: '想搞清楚', category: 'cognitive' },
  { id: 'correct_error', label: '想纠正错误', category: 'cognitive' },
  { id: 'share_knowledge', label: '想分享知识', category: 'cognitive' },
  { id: 'think_aloud', label: '想边说边想', category: 'cognitive' },
  { id: 'ask_deeper', label: '想追问细节', category: 'cognitive' },
  { id: 'synthesize', label: '想总结归纳', category: 'cognitive' },
  { id: 'challenge_assumption', label: '想质疑前提', category: 'cognitive' },
  { id: 'provide_evidence', label: '想举证', category: 'cognitive' },
  { id: 'analogize', label: '想打比方', category: 'cognitive' },
  { id: 'categorize', label: '想分类讨论', category: 'cognitive' },

  // ---- 社交驱动 (social) ----
  { id: 'seek_approval', label: '想被认同', category: 'social' },
  { id: 'build_rapport', label: '想拉近关系', category: 'social' },
  { id: 'save_face', label: '想维护面子', category: 'social' },
  { id: 'maintain_harmony', label: '想保持和谐', category: 'social' },
  { id: 'show_support', label: '想表达支持', category: 'social' },
  { id: 'reciprocate', label: '想回应善意', category: 'social' },
  { id: 'include_others', label: '想拉人入局', category: 'social' },
  { id: 'signal_status', label: '想展示地位', category: 'social' },
  { id: 'seek_attention', label: '想获得关注', category: 'social' },
  { id: 'avoid_exclusion', label: '不想被冷落', category: 'social' },

  // ---- 表达驱动 (expressive) ----
  { id: 'vent', label: '想宣泄情绪', category: 'expressive' },
  { id: 'tell_story', label: '想讲故事', category: 'expressive' },
  { id: 'be_funny', label: '想逗乐大家', category: 'expressive' },
  { id: 'complain', label: '想吐槽', category: 'expressive' },
  { id: 'share_experience', label: '想分享经历', category: 'expressive' },
  { id: 'express_doubt', label: '想表达疑虑', category: 'expressive' },
  { id: 'show_enthusiasm', label: '想表达热情', category: 'expressive' },
  { id: 'confess', label: '想坦白/承认', category: 'expressive' },

  // ---- 策略驱动 (strategic) ----
  { id: 'persuade', label: '想说服别人', category: 'strategic' },
  { id: 'push_conclusion', label: '想推进结论', category: 'strategic' },
  { id: 'shift_topic', label: '想换话题', category: 'strategic' },
  { id: 'derail', label: '想带偏话题', category: 'strategic' },
  { id: 'test_waters', label: '想试探反应', category: 'strategic' },
  { id: 'set_boundary', label: '想划界限', category: 'strategic' },
  { id: 'gain_ally', label: '想拉同盟', category: 'strategic' },
  { id: 'undermine', label: '想削弱对方', category: 'strategic' },
  { id: 'deflect', label: '想转移焦点', category: 'strategic' },

  // ---- 情绪驱动 (emotional) ----
  { id: 'seek_comfort', label: '想被安慰', category: 'emotional' },
  { id: 'release_tension', label: '想缓解紧张', category: 'emotional' },
  { id: 'express_anger', label: '想表达愤怒', category: 'emotional' },
  { id: 'show_empathy', label: '想共情', category: 'emotional' },
  { id: 'celebrate', label: '想庆祝/赞美', category: 'emotional' },
  { id: 'express_worry', label: '想表达担忧', category: 'emotional' },
  { id: 'seek_validation', label: '想确认感受', category: 'emotional' },

  // ---- 身份驱动 (identity) ----
  { id: 'assert_expertise', label: '想展示专业', category: 'identity' },
  { id: 'defend_values', label: '想捍卫价值观', category: 'identity' },
  { id: 'self_differentiate', label: '想彰显独特', category: 'identity' },
  { id: 'represent_group', label: '想代表群体', category: 'identity' },
  { id: 'maintain_consistency', label: '想保持人设', category: 'identity' },
  { id: 'humble_brag', label: '想低调炫耀', category: 'identity' },
  { id: 'play_devil_advocate', label: '想唱反调', category: 'identity' },
]

// ============ 权重派生 ============

export function deriveDriveWeights(persona: Persona): DriveWeights {
  const t = persona.traits
  const s = persona.social
  const c = persona.cognition
  const b = persona.behavior
  const w: DriveWeights = {}

  for (const drive of ALL_DRIVES) w[drive.id] = 0

  // cognitive
  w.seek_clarity = norm(t.curiosity) * 0.8 + norm(c.thinkingStyle === 'analytical' ? 80 : 40) * 0.2
  w.correct_error = norm(t.assertiveness) * 0.5 + norm(t.stubbornness) * 0.3 + (c.argumentStyle === 'logical' ? 0.2 : 0)
  w.share_knowledge = norm(t.extroversion) * 0.4 + (s.socialRole === 'expert' ? 0.4 : 0) + norm(t.openness) * 0.2
  w.think_aloud = norm(t.openness) * 0.5 + (c.thinkingStyle === 'creative' ? 0.3 : 0) + norm(100 - t.conscientiousness) * 0.2
  w.ask_deeper = norm(t.curiosity) * 0.6 + (c.thinkingStyle === 'analytical' ? 0.3 : 0) + norm(t.openness) * 0.1
  w.synthesize = norm(t.conscientiousness) * 0.5 + (c.thinkingStyle === 'pragmatic' ? 0.3 : 0) + (s.socialRole === 'leader' ? 0.2 : 0)
  w.challenge_assumption = norm(t.assertiveness) * 0.4 + (s.socialRole === 'devil-advocate' ? 0.4 : 0) + norm(t.openness) * 0.2
  w.provide_evidence = (c.argumentStyle === 'logical' ? 0.4 : c.argumentStyle === 'authoritative' ? 0.3 : 0.1) + norm(t.conscientiousness) * 0.3
  w.analogize = (c.thinkingStyle === 'creative' ? 0.4 : 0.1) + (c.argumentStyle === 'anecdotal' ? 0.3 : 0) + norm(t.openness) * 0.2
  w.categorize = (c.thinkingStyle === 'analytical' ? 0.5 : 0.1) + norm(t.conscientiousness) * 0.3

  // social
  w.seek_approval = norm(100 - t.assertiveness) * 0.4 + norm(s.conformityTendency) * 0.4 + norm(s.faceSaving) * 0.2
  w.build_rapport = norm(t.agreeableness) * 0.4 + norm(t.extroversion) * 0.3 + norm(t.empathy) * 0.3
  w.save_face = norm(s.faceSaving) * 0.6 + norm(s.statusSensitivity) * 0.3 + norm(t.neuroticism) * 0.1
  w.maintain_harmony = norm(t.agreeableness) * 0.4 + (s.socialRole === 'peacemaker' ? 0.4 : s.socialRole === 'mediator' ? 0.3 : 0) + norm(s.politenessLevel) * 0.2
  w.show_support = norm(t.empathy) * 0.5 + norm(t.agreeableness) * 0.3 + (s.complimentStyle === 'direct' ? 0.2 : 0)
  w.reciprocate = norm(t.agreeableness) * 0.4 + norm(t.empathy) * 0.3 + norm(s.politenessLevel) * 0.3
  w.include_others = (s.socialRole === 'mediator' ? 0.4 : s.socialRole === 'leader' ? 0.3 : 0.1) + norm(t.empathy) * 0.3
  w.signal_status = norm(s.statusSensitivity) * 0.5 + norm(t.assertiveness) * 0.3 + (s.socialRole === 'expert' ? 0.2 : 0)
  w.seek_attention = norm(t.extroversion) * 0.5 + norm(100 - t.agreeableness) * 0.2 + (s.socialRole === 'joker' ? 0.3 : 0)
  w.avoid_exclusion = norm(t.neuroticism) * 0.4 + norm(s.conformityTendency) * 0.3 + norm(100 - t.extroversion) * 0.2

  // expressive
  w.vent = norm(t.neuroticism) * 0.4 + norm(100 - t.patience) * 0.3 + norm(t.assertiveness) * 0.2
  w.tell_story = norm(s.storytellingAbility) * 0.5 + (c.argumentStyle === 'anecdotal' ? 0.3 : 0) + norm(t.extroversion) * 0.2
  w.be_funny = norm(t.humor) * 0.6 + (s.socialRole === 'joker' ? 0.3 : 0) + norm(t.extroversion) * 0.1
  w.complain = norm(t.neuroticism) * 0.4 + norm(100 - t.agreeableness) * 0.3 + norm(100 - t.patience) * 0.2
  w.share_experience = (c.argumentStyle === 'anecdotal' ? 0.4 : 0.2) + norm(t.extroversion) * 0.3 + norm(t.openness) * 0.2
  w.express_doubt = norm(t.neuroticism) * 0.3 + norm(t.curiosity) * 0.3 + norm(100 - t.assertiveness) * 0.2
  w.show_enthusiasm = norm(t.extroversion) * 0.4 + norm(t.openness) * 0.3 + norm(100 - t.neuroticism) * 0.2
  w.confess = norm(t.selfAwareness) * 0.5 + norm(t.openness) * 0.3 + norm(100 - s.faceSaving) * 0.2

  // strategic
  w.persuade = norm(t.assertiveness) * 0.5 + (c.argumentStyle === 'logical' ? 0.2 : c.argumentStyle === 'emotional' ? 0.2 : 0.1) + norm(t.stubbornness) * 0.2
  w.push_conclusion = (s.socialRole === 'leader' ? 0.4 : 0.1) + norm(t.conscientiousness) * 0.3 + (c.thinkingStyle === 'pragmatic' ? 0.3 : 0.1)
  w.shift_topic = norm(b.tangentProbability * 100) * 0.5 + norm(100 - t.patience) * 0.2 + norm(t.curiosity) * 0.2
  w.derail = norm(b.tangentProbability * 100) * 0.4 + (s.socialRole === 'joker' ? 0.3 : 0) + norm(100 - t.conscientiousness) * 0.2
  w.test_waters = norm(t.curiosity) * 0.3 + norm(100 - t.assertiveness) * 0.3 + norm(s.faceSaving) * 0.2
  w.set_boundary = norm(t.assertiveness) * 0.5 + (b.reactionToDisagreement === 'defend' ? 0.3 : 0.1) + norm(s.faceSaving) * 0.2
  w.gain_ally = norm(s.conformityTendency) * 0.3 + norm(t.extroversion) * 0.3 + (s.socialRole === 'leader' ? 0.2 : 0)
  w.undermine = (s.criticismStyle === 'brutal' ? 0.4 : s.criticismStyle === 'direct' ? 0.2 : 0) + norm(100 - t.agreeableness) * 0.3 + (s.socialRole === 'contrarian' ? 0.2 : 0)
  w.deflect = norm(s.faceSaving) * 0.4 + (b.reactionToDisagreement === 'redirect' ? 0.4 : 0.1) + norm(100 - t.assertiveness) * 0.2

  // emotional
  w.seek_comfort = norm(t.neuroticism) * 0.5 + norm(100 - t.assertiveness) * 0.3 + norm(t.empathy) * 0.1
  w.release_tension = norm(t.humor) * 0.3 + norm(t.neuroticism) * 0.3 + norm(100 - t.patience) * 0.2
  w.express_anger = norm(100 - t.patience) * 0.4 + norm(t.assertiveness) * 0.3 + (b.reactionToDisagreement === 'attack' ? 0.3 : 0)
  w.show_empathy = norm(t.empathy) * 0.6 + norm(t.agreeableness) * 0.3 + (s.socialRole === 'peacemaker' ? 0.2 : 0)
  w.celebrate = norm(t.extroversion) * 0.4 + norm(t.agreeableness) * 0.3 + norm(t.humor) * 0.2
  w.express_worry = norm(t.neuroticism) * 0.5 + norm(t.empathy) * 0.3 + norm(t.conscientiousness) * 0.2
  w.seek_validation = norm(t.neuroticism) * 0.4 + norm(s.conformityTendency) * 0.3 + norm(100 - t.selfAwareness) * 0.2

  // identity
  w.assert_expertise = (s.socialRole === 'expert' ? 0.5 : 0.1) + norm(t.assertiveness) * 0.3 + norm(s.statusSensitivity) * 0.2
  w.defend_values = norm(t.stubbornness) * 0.5 + norm(t.assertiveness) * 0.3 + norm(100 - t.agreeableness) * 0.2
  w.self_differentiate = norm(100 - s.conformityTendency) * 0.4 + (s.socialRole === 'contrarian' ? 0.3 : 0) + norm(t.openness) * 0.2
  w.represent_group = norm(s.conformityTendency) * 0.4 + norm(t.assertiveness) * 0.3 + (s.socialRole === 'leader' ? 0.3 : 0)
  w.maintain_consistency = norm(t.stubbornness) * 0.4 + norm(t.conscientiousness) * 0.3 + norm(s.faceSaving) * 0.2
  w.humble_brag = norm(s.statusSensitivity) * 0.4 + norm(100 - t.assertiveness) * 0.2 + (s.complimentStyle === 'subtle' ? 0.2 : 0)
  w.play_devil_advocate = (s.socialRole === 'devil-advocate' ? 0.5 : 0.1) + norm(t.openness) * 0.2 + norm(t.assertiveness) * 0.2

  return w
}

// ============ 上下文满足度计算 ============

export function computeUtility(
  persona: Persona,
  recentMessages: Message[],
  allPersonas: Persona[]
): UtilityResult {
  const weights = deriveDriveWeights(persona)
  const contextBoosts = computeContextBoosts(persona, recentMessages, allPersonas)

  const scores: DriveScore[] = ALL_DRIVES.map(drive => {
    const weight = weights[drive.id] ?? 0
    const satisfaction = contextBoosts[drive.id] ?? 0
    return {
      driveId: drive.id,
      label: drive.label,
      weight,
      satisfaction,
      contribution: weight * satisfaction,
    }
  })

  scores.sort((a, b) => b.contribution - a.contribution)

  return {
    personaId: persona.id,
    totalUtility: scores.reduce((sum, s) => sum + s.contribution, 0),
    topDrives: scores.slice(0, 5),
  }
}

// 根据对话上下文，判断当前"发言"能多大程度满足各个驱动
function computeContextBoosts(
  persona: Persona,
  recentMessages: Message[],
  allPersonas: Persona[]
): Record<string, number> {
  const boosts: Record<string, number> = {}
  if (recentMessages.length === 0) return boosts

  const lastMsg = recentMessages[recentMessages.length - 1]
  const lastSpeaker = allPersonas.find(p => p.id === lastMsg.personaId)
  const content = recentMessages.slice(-3).map(m => m.content).join(' ')

  const isMentioned = lastMsg.mentions?.includes(persona.id) ||
    lastMsg.content.includes(persona.name) ||
    lastMsg.content.includes(`@${persona.name}`)
  const isQuestion = lastMsg.content.includes('？') || lastMsg.content.includes('?')
  const hasDisagreement = content.includes('不同意') || content.includes('不对') || content.includes('错了')
  const hasKeywordHit = persona.consumerDna.triggerKeywords.some(kw => content.includes(kw))
  const hasFrictionHit = persona.friction.hotTopics.some(t => content.includes(t))
  const silentTurns = persona.state.consecutiveSilence

  // cognitive boosts
  boosts.seek_clarity = isQuestion && isMentioned ? 0.9 : isQuestion ? 0.4 : 0.1
  boosts.correct_error = hasDisagreement ? 0.7 : 0.1
  boosts.share_knowledge = hasKeywordHit ? 0.8 : 0.2
  boosts.think_aloud = isQuestion ? 0.5 : 0.2
  boosts.ask_deeper = isQuestion ? 0.3 : lastMsg.content.length > 80 ? 0.5 : 0.1
  boosts.synthesize = recentMessages.length >= 3 ? 0.6 : 0.1
  boosts.challenge_assumption = hasDisagreement || hasFrictionHit ? 0.7 : 0.2
  boosts.provide_evidence = hasDisagreement ? 0.6 : 0.2
  boosts.analogize = lastMsg.content.length > 60 ? 0.4 : 0.1
  boosts.categorize = recentMessages.length >= 3 ? 0.4 : 0.1

  // social boosts
  boosts.seek_approval = silentTurns > 3 ? 0.6 : 0.2
  boosts.build_rapport = isMentioned ? 0.7 : 0.2
  boosts.save_face = hasDisagreement && isMentioned ? 0.9 : 0.1
  boosts.maintain_harmony = hasDisagreement ? 0.6 : 0.1
  boosts.show_support = lastSpeaker && persona.state.relationshipMap[lastSpeaker.name]?.affinity > 50 ? 0.7 : 0.2
  boosts.reciprocate = isMentioned ? 0.8 : 0.1
  boosts.include_others = silentTurns === 0 && recentMessages.slice(-3).filter(m => m.personaId === persona.id).length > 1 ? 0.5 : 0.1
  boosts.signal_status = hasKeywordHit ? 0.5 : 0.2
  boosts.seek_attention = silentTurns > 4 ? 0.7 : 0.2
  boosts.avoid_exclusion = silentTurns > 5 ? 0.8 : silentTurns > 3 ? 0.4 : 0.1

  // expressive boosts
  boosts.vent = hasFrictionHit ? 0.8 : 0.1
  boosts.tell_story = hasKeywordHit ? 0.5 : 0.2
  boosts.be_funny = recentMessages.length > 2 && !hasDisagreement ? 0.5 : 0.2
  boosts.complain = hasFrictionHit ? 0.6 : 0.1
  boosts.share_experience = hasKeywordHit ? 0.6 : 0.2
  boosts.express_doubt = isQuestion ? 0.5 : 0.2
  boosts.show_enthusiasm = hasKeywordHit && !hasDisagreement ? 0.7 : 0.2
  boosts.confess = hasDisagreement && isMentioned ? 0.4 : 0.1

  // strategic boosts
  const opinionDiff = lastSpeaker ? Math.abs((persona.state.opinionValue ?? 0) - (lastSpeaker.state.opinionValue ?? 0)) : 0
  boosts.persuade = opinionDiff > 0.4 ? 0.8 : opinionDiff > 0.2 ? 0.4 : 0.1
  boosts.push_conclusion = recentMessages.length >= 4 ? 0.5 : 0.1
  boosts.shift_topic = (persona.state.topicFatigue[Object.keys(persona.state.topicFatigue)[0] ?? ''] ?? 0) > 5 ? 0.7 : 0.2
  boosts.derail = persona.state.interestLevel < 30 ? 0.6 : 0.1
  boosts.test_waters = silentTurns > 2 ? 0.4 : 0.1
  boosts.set_boundary = hasFrictionHit && isMentioned ? 0.8 : 0.1
  boosts.gain_ally = hasDisagreement ? 0.5 : 0.1
  boosts.undermine = opinionDiff > 0.6 ? 0.6 : 0.1
  boosts.deflect = isMentioned && hasDisagreement ? 0.6 : 0.1

  // emotional boosts
  boosts.seek_comfort = persona.state.moodIntensity > 70 && persona.state.currentMood.includes('焦') ? 0.7 : 0.1
  boosts.release_tension = hasDisagreement ? 0.5 : 0.2
  boosts.express_anger = hasFrictionHit && persona.state.currentMood === '被激怒' ? 0.9 : 0.1
  boosts.show_empathy = lastSpeaker && lastSpeaker.state.moodIntensity > 60 ? 0.6 : 0.2
  boosts.celebrate = !hasDisagreement && persona.state.interestLevel > 70 ? 0.5 : 0.1
  boosts.express_worry = persona.state.currentMood.includes('担') || persona.state.currentMood.includes('忧') ? 0.6 : 0.1
  boosts.seek_validation = silentTurns > 3 && persona.state.moodIntensity > 50 ? 0.5 : 0.1

  // identity boosts
  boosts.assert_expertise = hasKeywordHit ? 0.7 : 0.2
  boosts.defend_values = hasFrictionHit ? 0.8 : 0.1
  boosts.self_differentiate = recentMessages.slice(-3).every(m => m.personaId !== persona.id) ? 0.4 : 0.2
  boosts.represent_group = hasDisagreement ? 0.4 : 0.1
  boosts.maintain_consistency = opinionDiff > 0.3 ? 0.5 : 0.3
  boosts.humble_brag = hasKeywordHit && !hasDisagreement ? 0.4 : 0.1
  boosts.play_devil_advocate = !hasDisagreement && recentMessages.length > 2 ? 0.5 : 0.1

  return boosts
}

function norm(value: number): number {
  return Math.max(0, Math.min(1, value / 100))
}
