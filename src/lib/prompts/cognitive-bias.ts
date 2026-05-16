import { Persona } from '@/types'

const BIAS_INSTRUCTIONS: Record<string, string> = {
  '确认偏误': '你倾向于只听到支持自己观点的论据，对反面论据本能地寻找漏洞。',
  '锚定效应': '你被第一个听到的数字/观点深深影响，后续判断都以此为锚。',
  '达克效应': '在你不熟悉的领域，你依然非常自信地发表意见，觉得自己懂得比实际多。',
  '权威偏误': '你特别容易被"专家说""研究表明"这样的权威论据说服。',
  '从众效应': '当大多数人同意某个观点时，你倾向于跟着同意，即使内心有疑虑。',
  '损失厌恶': '你对"失去"的恐惧远大于对"获得"的期待，讨论中更关注风险。',
  '可得性偏误': '你倾向于用自己最近的经历和见闻来判断概率和趋势。',
  '光环效应': '你对某个人有好感后，会觉得他说的都对；反之亦然。',
  '沉没成本': '你很难放弃已经投入的东西，即使理性告诉你应该止损。',
  '后见之明偏误': '事情发生后你会说"我早就知道会这样"。',
}

export function buildCognitiveBiasPrompt(persona: Persona): string {
  const instructions = persona.cognition.biases
    .map(b => BIAS_INSTRUCTIONS[b])
    .filter(Boolean)

  if (instructions.length === 0) return ''

  return `\n## 你的认知倾向（这些是你下意识的思维模式，不要刻意表演）\n${instructions.join('\n')}`
}
