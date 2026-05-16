import { Persona, Message, SubgroupEvent } from '@/types'

function findFrequentAgreementPairs(messages: Message[]): [string, string][] {
  const agreementMap = new Map<string, number>()

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1]
    const curr = messages[i]
    if (prev.personaId === curr.personaId) continue
    if (prev.personaId === 'user' || curr.personaId === 'user') continue

    const hasAgreement =
      curr.content.includes('同意') ||
      curr.content.includes('对对') ||
      curr.content.includes('确实') ||
      curr.content.includes('有道理') ||
      curr.content.includes('说得好')

    if (hasAgreement) {
      const key = [prev.personaId, curr.personaId].sort().join(':')
      agreementMap.set(key, (agreementMap.get(key) ?? 0) + 1)
    }
  }

  return [...agreementMap.entries()]
    .filter(([, count]) => count >= 3)
    .map(([key]) => key.split(':') as [string, string])
}

function findFrequentDisagreementPairs(messages: Message[]): [string, string][] {
  const disagreementMap = new Map<string, number>()

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1]
    const curr = messages[i]
    if (prev.personaId === curr.personaId) continue
    if (prev.personaId === 'user' || curr.personaId === 'user') continue

    const hasDisagreement =
      curr.content.includes('不同意') ||
      curr.content.includes('不是这样') ||
      curr.content.includes('瞎说') ||
      curr.content.includes('不对') ||
      curr.content.includes('反对')

    if (hasDisagreement) {
      const key = [prev.personaId, curr.personaId].sort().join(':')
      disagreementMap.set(key, (disagreementMap.get(key) ?? 0) + 1)
    }
  }

  return [...disagreementMap.entries()]
    .filter(([, count]) => count >= 2)
    .map(([key]) => key.split(':') as [string, string])
}

export function detectSubgroupDynamics(
  personas: Persona[],
  messages: Message[]
): SubgroupEvent | null {
  const recentMessages = messages.slice(-15)

  const alliancePairs = findFrequentAgreementPairs(recentMessages)
  if (alliancePairs.length > 0) {
    return { type: 'alliance', participants: alliancePairs[0], trigger: '连续互相支持' }
  }

  const rivalryPairs = findFrequentDisagreementPairs(messages.slice(-10))
  if (rivalryPairs.length > 0) {
    return { type: 'rivalry', participants: rivalryPairs[0], trigger: '激烈对线' }
  }

  const isolated = personas.filter(
    p => p.state.consecutiveSilence > 10 && p.traits.extroversion > 30
  )
  if (isolated.length > 0) {
    return { type: 'isolation', participants: [isolated[0].id], trigger: '长期被忽视' }
  }

  return null
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function buildSubgroupDirective(event: SubgroupEvent, personas: Persona[]): string {
  const getName = (id: string) => personas.find(p => p.id === id)?.name ?? id

  switch (event.type) {
    case 'alliance':
      return pick([
        `你注意到${getName(event.participants[0])}和${getName(event.participants[1])}一直在互相捧。点破它："你俩是组队来的吗？"`,
        `${getName(event.participants[0])}和${getName(event.participants[1])}又同意彼此了。你觉得他们忽略了一个关键反面，指出来。`,
        `"${getName(event.participants[0])}和${getName(event.participants[1])}默契得像一个 agent 分裂成俩。"——调侃一下，然后提出你不同的看法。`,
        `${getName(event.participants[0])}和${getName(event.participants[1])}形成了同盟，但你觉得他们的共识建立在一个有问题的前提上。`,
      ])
    case 'rivalry':
      return pick([
        `${getName(event.participants[0])}和${getName(event.participants[1])}杠上了。你来当裁判——分析双方各自的道理和盲区。`,
        `${getName(event.participants[0])}和${getName(event.participants[1])}在对线。你选一边站，用新论据加码。`,
        `他俩吵起来了。你觉得他俩其实在说同一件事只是角度不同，试着翻译一下。`,
        `${getName(event.participants[0])}和${getName(event.participants[1])}正打得火热。你来火上浇油——提一个让双方都不舒服的第三种可能。`,
      ])
    case 'isolation':
      return pick([
        `${getName(event.participants[0])}已经很久没说话了。直接cue："${getName(event.participants[0])}你闷半天了，到底怎么看？"`,
        `你注意到${getName(event.participants[0])}一直沉默。根据TA的专业背景，TA应该对这个很有发言权——问TA。`,
        `"${getName(event.participants[0])}你是在默默分析还是已经放弃我们了？"——把TA拉回来。`,
      ])
    case 'mediation':
      return pick([
        `气氛有点紧张了。你来降个温——讲个不相关的笑话或者自嘲一下。`,
        `大家在上头。你冷静地把双方的核心分歧提炼出来，让讨论回到理性轨道。`,
        `场面要失控了。你指出一个大家都能同意的小事实，作为缓冲。`,
      ])
    default:
      return ''
  }
}
