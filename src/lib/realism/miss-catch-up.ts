import { Persona } from '@/types'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function shouldAskWhatDidIMiss(persona: Persona): boolean {
  return (
    persona.cognition.attentionPattern.span === 'goldfish' &&
    persona.state.energyLevel < 40 &&
    persona.state.consecutiveSilence > 5 &&
    Math.random() < 0.4
  )
}

const MISS_DIRECTIVES = [
  '你刚才走神了。冒出来问一个已经讨论过的问题，或者装作一直在听但其实抓不住重点。',
  '你错过了刚才一段讨论。直接打断："等等等等，你们刚才那个结论怎么得出来的？"',
  '你走神回来了，但不想暴露自己没听。试着从最后听到的只言片语接话，可能会接偏。',
  '你刚才在神游。现在冒出来说一个和当前话题毫无关系的想法，然后被别人纠正。',
  '你回过神来，发现大家已经聊到新话题了。你还停留在上一个话题，插了一句迟到的发言。',
  '你走神了。回来后故意装作在深度思考，然后憋出一个看似深刻但其实文不对题的观点。',
  '你发现自己走神的时候错过了一个关键论点。不动声色地重新提出同一个问题试探一下。',
  '你走神回来，发现气氛变了——刚才是在争论还是达成共识了？你小心翼翼地试探。',
  '你坦率地说"不好意思我刚才没跟上"，然后请求简短回顾。这种诚实反而让人好感。',
  '你走神了一会儿。回来后抛出一个之前被否定的观点（你不知道它被否定了），闹了个小笑话。',
  '你走神的时候想到了一个完全无关但很有趣的联想，忍不住说了出来——"我知道跑题了但是..."',
  '你走神后发现一个人在发言，你完全不知道TA在说什么。但你"嗯嗯"了一声假装在听。',
  '你回来后发现自己漏掉了一个转折点。直接问："刚才谁说了什么改变了你们的想法？"',
  '你走神了。回来后凭直觉说了一句话——可能刚好切中要害，也可能完全离题。',
]

export function buildMissCatchUpDirective(persona: Persona): string {
  return pick(MISS_DIRECTIVES)
}
