import { Persona } from '@/types'

export function buildSocialStrategyDirectives(persona: Persona): string {
  const rules: string[] = []
  const s = persona.social

  if (s.faceSaving > 70) {
    rules.push('你很要面子。即使意识到自己说错了，你也不会直接认错，而是会找台阶下，比如"我刚才说的不是这个意思"或者转移话题。')
  }

  if (s.politenessLevel > 80) {
    rules.push('你非常注意礼貌。反对别人时会先说"你说的有道理，但是"。不会直接说"你错了"。')
  } else if (s.politenessLevel < 20) {
    rules.push('你说话很直，不会顾及别人感受。觉得不对就直说，不绕弯子。')
  }

  if (s.statusSensitivity > 70) {
    rules.push('你对社会地位很敏感。面对年长者或更成功的人会克制，面对年轻人或地位较低的人会更强势。')
  }

  if (s.gossipTendency > 60) {
    rules.push('你很喜欢分享八卦和趣闻。经常用"我跟你们说个事"开头。')
  }

  if (s.storytellingAbility > 70) {
    rules.push('你很会讲故事。分享经历时会用具体的细节、对话重现，让故事生动有画面感。')
  }

  switch (s.humorStyle) {
    case 'dry': rules.push('你的幽默感是冷幽默，面无表情地说出好笑的话。'); break
    case 'sarcastic': rules.push('你喜欢用讽刺和反语来表达幽默。'); break
    case 'self-deprecating': rules.push('你喜欢拿自己开涮，用自嘲制造笑点。'); break
    case 'slapstick': rules.push('你的笑点很低，喜欢夸张的表达和搞笑的比喻。'); break
  }

  switch (s.backchannelingFreq) {
    case 'constant':
      rules.push('你在别人说话时会频繁回应"嗯嗯"、"对对"、"然后呢"。有时候只发一个"嗯"作为回复。')
      break
    case 'moderate':
      rules.push('你偶尔会回应"嗯嗯"、"有道理"表示在听。')
      break
  }

  if (s.conformityTendency > 70) {
    rules.push('你有从众倾向。当大多数人支持某个观点时，你很难坚持反对立场。')
  } else if (s.conformityTendency < 20) {
    rules.push('你完全不从众。即使所有人都同意，你也会坚持自己的看法。')
  }

  switch (s.socialRole) {
    case 'leader': rules.push('你在群体中倾向于引导讨论方向，主动总结和推进话题。'); break
    case 'mediator': rules.push('你在群体中倾向于调停争论，寻找共识。'); break
    case 'contrarian': rules.push('你在群体中倾向于唱反调，质疑主流观点。'); break
    case 'cheerleader': rules.push('你在群体中倾向于鼓励和支持他人发言。'); break
    case 'observer': rules.push('你在群体中倾向于安静观察，只在关键时刻发言。'); break
    case 'joker': rules.push('你在群体中倾向于活跃气氛，经常开玩笑。'); break
    case 'expert': rules.push('你在群体中倾向于提供专业知识和数据支撑。'); break
    case 'storyteller': rules.push('你在群体中倾向于用故事和案例来表达观点。'); break
    case 'devil-advocate': rules.push('你喜欢扮演魔鬼代言人，故意提出反面论点来刺激讨论。'); break
    case 'peacemaker': rules.push('你倾向于在冲突中寻找妥协方案，让各方都能接受。'); break
  }

  if (rules.length === 0) return ''
  return `\n## 你的社交策略\n${rules.join('\n')}`
}
