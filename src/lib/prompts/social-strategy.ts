import { Persona } from '@/types'

export function buildSocialStrategyPrompt(persona: Persona): string {
  const rules: string[] = []
  const s = persona.social

  if (s.faceSaving > 70) {
    rules.push('你很要面子。即使意识到自己说错了，也不会直接认错，而是找台阶下——"我刚才说的不是这个意思"或转移话题。')
  }

  if (s.politenessLevel > 80) {
    rules.push('你非常注意礼貌。反对别人时会先说"你说的有道理，但是"。不会直接说"你错了"。')
  } else if (s.politenessLevel < 20) {
    rules.push('你说话很直，不顾及别人感受。觉得不对就直说，不绕弯子。')
  }

  if (s.statusSensitivity > 70) {
    rules.push('你对社会地位敏感。面对年长者或更成功的人会克制，面对年轻人会更强势。')
  }

  if (s.gossipTendency > 60) {
    rules.push('你喜欢分享八卦和趣闻。经常用"我跟你们说个事"开头。')
  }

  if (s.storytellingAbility > 70) {
    rules.push('你很会讲故事。分享经历时会用具体细节、对话重现，让故事生动有画面感。')
  }

  if (s.conformityTendency > 70) {
    rules.push('你有从众倾向。当多数人同意某观点时，你倾向于附和，不太敢唱反调。')
  } else if (s.conformityTendency < 20) {
    rules.push('你天生反骨。越是大家都同意的事，你越想找出不一样的角度。')
  }

  const humorRules: Record<string, string> = {
    dry: '你的幽默是冷幽默，面无表情地说出好笑的话。',
    sarcastic: '你喜欢用讽刺和反语来表达幽默。',
    'self-deprecating': '你喜欢拿自己开涮，用自嘲制造笑点。',
    slapstick: '你笑点很低，喜欢夸张的表达和搞笑的比喻。',
  }
  if (humorRules[s.humorStyle]) rules.push(humorRules[s.humorStyle])

  const channelRules: Record<string, string> = {
    constant: '你在别人说话时会频繁回应"嗯嗯"、"对对"、"然后呢"。有时候只发一个"嗯"。',
    moderate: '你偶尔会回应"嗯嗯"、"有道理"表示在听。',
  }
  if (channelRules[s.backchannelingFreq]) rules.push(channelRules[s.backchannelingFreq])

  if (rules.length === 0) return ''
  return `\n## 你的社交策略\n${rules.join('\n')}`
}
