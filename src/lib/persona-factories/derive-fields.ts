import { PersonaVoice, PersonaBehavior, PersonaSocial, PersonaTraits } from '@/types'

export function deriveVoice(
  traits: PersonaTraits,
  socialRole: string,
  partial: Partial<PersonaVoice> & { catchphrases: string[]; tone: string; exampleSentences: string[] }
): PersonaVoice {
  const ext = traits.extroversion
  const agr = traits.agreeableness
  const opn = traits.openness
  const hum = traits.humor

  return {
    verbosity: ext > 75 ? 'verbose' : ext > 50 ? 'normal' : ext > 25 ? 'normal' : 'terse',
    formality: opn > 70 ? 'casual' : opn > 40 ? 'normal' : 'formal',
    emojiUsage: ext > 60 && hum > 40 ? 'moderate' : ext > 40 ? 'rare' : 'none',
    memeUsage: hum > 60 ? 'moderate' : hum > 30 ? 'rare' : 'none',
    punctuation: traits.neuroticism > 70 ? 'expressive' : traits.neuroticism > 40 ? 'normal' : 'minimal',
    responseLength: ext > 60 ? [60, 180] : ext > 30 ? [30, 120] : [15, 80],
    typingSpeed: ext > 60 ? 'fast' : ext > 30 ? 'normal' : 'slow',
    languages: ['中文'],
    catchphrases: partial.catchphrases,
    textHabits: partial.textHabits ?? [],
    tone: partial.tone,
    exampleSentences: partial.exampleSentences,
    fillerWords: agr > 60 ? ['嗯', '就是说', '对'] : ['反正', '就是'],
    hedgingPhrases: agr > 60 ? ['可能', '也许', '我不确定但'] : ['我不绝对化地说'],
    intensifiers: traits.assertiveness > 60 ? ['真的', '绝对', '核心是'] : ['还行', '大概'],
    agreementPhrases: agr > 60 ? ['对对对', '确实', '有道理'] : ['这点我认'],
    disagreementPhrases: agr > 60 ? ['但我觉得不太对', '这个可以再想想'] : ['不是这样的', '你这前提不成立'],
    sentenceStructure: partial.sentenceStructure ?? (traits.conscientiousness > 60 ? '逻辑链条清晰，分点陈述' : '随意跳跃，想到哪说到哪'),
    quotationHabit: partial.quotationHabit ?? (socialRole === 'expert' ? '爱用数据和案例' : '无'),
  }
}

export function deriveBehavior(traits: PersonaTraits, partial: Partial<PersonaBehavior> = {}): PersonaBehavior {
  return {
    initiativeLevel: partial.initiativeLevel ?? Math.round(traits.extroversion * 0.7 + traits.assertiveness * 0.3),
    interruptTendency: partial.interruptTendency ?? Math.round(traits.assertiveness * 0.6 + (100 - traits.agreeableness) * 0.3),
    tangentProbability: partial.tangentProbability ?? Math.round(traits.openness * 0.4 + (100 - traits.conscientiousness) * 0.3),
    reactionToDisagreement: traits.agreeableness > 70 ? 'concede' : traits.assertiveness > 70 ? 'defend' : traits.neuroticism > 70 ? 'attack' : 'redirect',
    engagementCurve: partial.engagementCurve ?? (traits.patience > 70 ? 'steady' : traits.curiosity > 70 ? 'warming' : traits.extroversion > 70 ? 'burst' : 'fading'),
    phoneCheckFrequency: partial.phoneCheckFrequency ?? Math.round((100 - traits.conscientiousness) * 0.6),
    foodDrinkMentionFreq: partial.foodDrinkMentionFreq ?? Math.round(Math.random() * 50),
    physicalActionFreq: partial.physicalActionFreq ?? Math.round(traits.extroversion * 0.5),
    latecomerBehavior: partial.latecomerBehavior ?? (traits.agreeableness > 60 ? '先道歉再融入话题' : '直接坐下插入讨论'),
    exitBehavior: partial.exitBehavior ?? (traits.agreeableness > 60 ? '正式告别' : '默默消失'),
  }
}

export function deriveSocial(traits: PersonaTraits, partial: Partial<PersonaSocial> & { socialRole: PersonaSocial['socialRole'] }): PersonaSocial {
  const agr = traits.agreeableness
  const ext = traits.extroversion
  const hum = traits.humor

  return {
    statusSensitivity: partial.statusSensitivity ?? Math.round((100 - traits.openness) * 0.5 + traits.neuroticism * 0.3),
    conformityTendency: partial.conformityTendency ?? Math.round(agr * 0.5 + (100 - traits.assertiveness) * 0.3),
    faceSaving: partial.faceSaving ?? Math.round(traits.neuroticism * 0.4 + (100 - agr) * 0.3),
    politenessLevel: partial.politenessLevel ?? Math.round(agr * 0.7 + traits.conscientiousness * 0.2),
    gossipTendency: partial.gossipTendency ?? Math.round(ext * 0.4 + traits.curiosity * 0.2),
    backchannelingFreq: agr > 70 ? 'constant' : agr > 40 ? 'moderate' : 'rare',
    complimentStyle: agr > 70 ? 'direct' : agr > 40 ? 'subtle' : 'never',
    criticismStyle: agr > 70 ? 'indirect' : traits.assertiveness > 70 ? 'brutal' : 'direct',
    humorStyle: hum > 70 ? (traits.selfAwareness > 60 ? 'self-deprecating' : 'sarcastic') : hum > 40 ? 'dry' : 'none',
    storytellingAbility: partial.storytellingAbility ?? Math.round(ext * 0.4 + traits.openness * 0.3 + hum * 0.2),
    socialRole: partial.socialRole,
  }
}
