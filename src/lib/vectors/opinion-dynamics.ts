import { Persona, Message } from '@/types'

// Bounded Confidence Model (Hegselmann-Krause)
// 只有观点距离在"容忍范围"内的人才能互相影响
// 超出范围的反而会加剧极化

export interface OpinionParams {
  influenceMultiplier: number
  confidenceBoundOffset: number
}

let currentParams: OpinionParams = { influenceMultiplier: 1, confidenceBoundOffset: 0 }

export function setOpinionParams(params: Partial<OpinionParams>) {
  currentParams = { ...currentParams, ...params }
}

interface OpinionShift {
  personaId: string
  name: string
  before: number
  after: number
  influencedBy: string[]
}

export function updateOpinions(
  personas: Persona[],
  newMessage: Message,
  allMessages: Message[]
): OpinionShift[] {
  const needsInit = personas.some(p => p.state.opinionValue === undefined && p.meta.archetypeId !== 'moderator')
  if (needsInit) {
    initializeOpinionValues(personas)
    for (const p of personas) {
      if (p.state.opinionValue === undefined) p.state.opinionValue = 0
    }
  }

  const speaker = personas.find(p => p.id === newMessage.personaId)
  if (!speaker || newMessage.personaId === 'user' || newMessage.personaId === 'environment') {
    return []
  }

  const shifts: OpinionShift[] = []

  for (const listener of personas) {
    if (listener.id === speaker.id) continue
    if (listener.meta.archetypeId === 'moderator') continue

    const distance = Math.abs(listener.state.opinionValue - speaker.state.opinionValue)
    const bound = confidenceBound(listener) + currentParams.confidenceBoundOffset

    if (distance > bound) {
      // 超出容忍范围 → 反弹（极化效应）
      const repulsion = 0.02 * (listener.traits.stubbornness / 100)
      const before = listener.state.opinionValue
      const direction = listener.state.opinionValue > speaker.state.opinionValue ? 1 : -1
      listener.state.opinionValue = clamp(before + direction * repulsion)

      if (before !== listener.state.opinionValue) {
        shifts.push({
          personaId: listener.id,
          name: listener.name,
          before,
          after: listener.state.opinionValue,
          influencedBy: [`${speaker.name}(排斥)`],
        })
      }
      continue
    }

    // 在容忍范围内 → 靠近
    const mu = influenceRate(listener, speaker) * currentParams.influenceMultiplier
    const delta = speaker.state.opinionValue - listener.state.opinionValue
    const before = listener.state.opinionValue
    listener.state.opinionValue = clamp(before + mu * delta)

    // 更新 stanceConfidence：越靠近极端值越自信
    listener.state.stanceConfidence = Math.round(Math.abs(listener.state.opinionValue) * 100)

    if (Math.abs(listener.state.opinionValue - before) > 0.001) {
      shifts.push({
        personaId: listener.id,
        name: listener.name,
        before,
        after: listener.state.opinionValue,
        influencedBy: [speaker.name],
      })
    }
  }

  // 发言者自身：发言会强化自己的观点（承诺一致性）
  const commitmentBoost = 0.01 * (speaker.traits.stubbornness / 100)
  const direction = speaker.state.opinionValue >= 0 ? 1 : -1
  speaker.state.opinionValue = clamp(speaker.state.opinionValue + direction * commitmentBoost)

  deriveStanceLabels(personas)

  if (shifts.length > 0) {
    logOpinionTable(personas, shifts)
  }

  return shifts
}

// 容忍边界：openness 高 + stubbornness 低 → 更能接受远距离观点
function confidenceBound(persona: Persona): number {
  const openness = persona.traits.openness / 100
  const stubbornness = persona.traits.stubbornness / 100
  // 范围 0.2 ~ 0.8
  return 0.2 + openness * 0.4 + (1 - stubbornness) * 0.2
}

// 影响率：agreeableness 高 → 更容易被影响；stubbornness 高 → 更难被影响
function influenceRate(listener: Persona, speaker: Persona): number {
  const agreeableness = listener.traits.agreeableness / 100
  const stubbornness = listener.traits.stubbornness / 100
  const speakerAuthority = speaker.traits.assertiveness / 100

  // 基础影响率 0.03 ~ 0.15
  return 0.03 + agreeableness * 0.08 + speakerAuthority * 0.04 - stubbornness * 0.06
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value))
}

// 从数值反推定性标签
function deriveStanceLabels(personas: Persona[]) {
  for (const p of personas) {
    if (p.meta.archetypeId === 'moderator') continue
    const v = p.state.opinionValue
    if (v > 0.3) p.state.stance = '支持'
    else if (v < -0.3) p.state.stance = '反对'
    else if (v > 0.1) p.state.stance = '偏向支持'
    else if (v < -0.1) p.state.stance = '偏向反对'
    else p.state.stance = '中立'
  }
}

function logOpinionTable(personas: Persona[], shifts: OpinionShift[]) {
  const table = personas
    .filter(p => p.meta.archetypeId !== 'moderator')
    .map(p => {
      const shift = shifts.find(s => s.personaId === p.id)
      return {
        name: p.name,
        opinion: p.state.opinionValue.toFixed(3),
        stance: p.state.stance,
        shift: shift ? `${shift.before.toFixed(3)} → ${shift.after.toFixed(3)}` : '—',
        by: shift?.influencedBy.join(', ') ?? '',
      }
    })
  console.log('\n📊 Opinion Dynamics:')
  console.table(table)
}

// 初始化：从现有 stance/stanceConfidence 推算初始 opinionValue
export function initializeOpinionValue(persona: Persona): number {
  const confidence = (persona.state.stanceConfidence ?? 50) / 100
  const stance = persona.state.stance?.toLowerCase() ?? ''

  if (stance.includes('支持') || stance.includes('赞成') || stance.includes('同意')) {
    return confidence * 0.8 + 0.1
  }
  if (stance.includes('反对') || stance.includes('不同意') || stance.includes('质疑')) {
    return -(confidence * 0.8 + 0.1)
  }
  // 未定义明确立场：均匀分布在 -0.7 ~ +0.7，确保多样性
  return (Math.random() * 2 - 1) * 0.7
}

// 批量初始化：确保群体中正反都有，避免全偏一侧
export function initializeOpinionValues(personas: Persona[]) {
  const toInit = personas.filter(
    p => p.state.opinionValue === undefined && p.meta.archetypeId !== 'moderator'
  )
  if (toInit.length === 0) return

  // 均匀分布：从 -0.6 到 +0.6
  const step = 1.2 / Math.max(1, toInit.length - 1)
  const shuffled = [...toInit].sort(() => Math.random() - 0.5)
  shuffled.forEach((p, i) => {
    p.state.opinionValue = -0.6 + step * i + (Math.random() - 0.5) * 0.15
  })
}
