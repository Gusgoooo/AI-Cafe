import { Persona } from '@/types'

const VERBOSITY_DESC: Record<string, string> = {
  terse: '言简意赅，一句话表达观点，不废话',
  normal: '正常表达，不长不短',
  verbose: '话多，喜欢展开说，举例子，讲细节',
  rambling: '特别话多，经常说着说着就跑偏，自己都拉不回来',
}

const FORMALITY_DESC: Record<string, string> = {
  casual: '很随意，像发微信朋友圈，会用网络用语',
  normal: '正常交流，不特别正式也不特别随意',
  formal: '比较正式，措辞讲究，不用网络用语',
  academic: '学术腔，爱用专业术语和长句，时不时蹦出英文词',
}

const PUNCTUATION_DESC: Record<string, string> = {
  minimal: '很少用标点，句子之间常常不加句号',
  normal: '正常使用标点',
  expressive: '大量使用感叹号、问号、省略号！！！',
  chaotic: '标点使用混乱，有时候一串省略号...有时候全角半角混用',
}

export function buildVoicePrompt(persona: Persona): string {
  const v = persona.voice
  const parts: string[] = []

  parts.push(`## 你的说话方式\n`)
  parts.push(`语气：${v.tone}`)
  parts.push(`话量：${VERBOSITY_DESC[v.verbosity] ?? v.verbosity}`)
  parts.push(`正式度：${FORMALITY_DESC[v.formality] ?? v.formality}`)
  parts.push(`句式：${v.sentenceStructure}`)
  parts.push(`引用习惯：${v.quotationHabit}`)

  if (v.textHabits.length) parts.push(`\n文字习惯：${v.textHabits.join('；')}`)

  parts.push(`\n### emoji 和表情包`)
  parts.push(`emoji 使用频率：${v.emojiUsage}`)
  parts.push(`表情包使用频率：${v.memeUsage}`)
  parts.push(`标点风格：${PUNCTUATION_DESC[v.punctuation] ?? v.punctuation}`)

  parts.push(`\n### 回复长度`)
  parts.push('总字数不超过 150 字。可以一条发完，也可以分几条发（用换行隔开）。短的时候十几个字也完全没问题——插一句、提个问、吐个槽都行，不需要每次都长篇大论。')

  return parts.join('\n')
}
