import { Persona, Message, ConversationContext, AIResponse } from '@/types'
import { selectSpeakers } from './speaker-selector'
import { buildContext } from './context-builder'
import { updateAllStates } from './state-updater'
import {
  getCurrentPhase,
  getPhaseDirectives,
  shouldTriggerEnvironmentEvent,
  shouldRetrospect,
  buildRetrospectiveDirective,
  detectSubgroupDynamics,
  buildSubgroupDirective,
  shouldShiftTopic,
  shouldAskWhatDidIMiss,
  buildMissCatchUpDirective,
} from './realism'
import { buildPersonaSystemPrompt, buildResponsePrompt, buildModeratorResponsePrompt } from './prompts/response-format'
import { chatCompletionStream } from './openrouter'
import { shouldModeratorSpeak, markModeratorSpoke } from './moderator-engine'

export interface StreamCallbacks {
  onTypingStart: (personaId: string, name: string) => void
  onToken: (personaId: string, token: string) => void
  onMessageEnd: (personaId: string, message: Message) => void
  onMoodChange: (personaId: string, mood: { newMood: string; intensity: number }) => void
  onStateUpdate: (personas: { id: string; state: Persona['state'] }[]) => void
  onEnvironmentEvent: (content: string) => void
}

function buildConversationContext(
  messages: Message[],
  personas: Persona[],
  sessionProgress: number,
  environmentEventCounter: number
): ConversationContext {
  const lastMessage = messages[messages.length - 1]
  const lastSpeakers = messages.slice(-5).map(m => m.personaId).reverse()

  const contentWindow = messages.slice(-10).map(m => m.content).join(' ')
  const keywords = extractKeywords(contentWindow)

  return {
    messages,
    lastMessage,
    lastSpeakers,
    messageCount: messages.length,
    estimatedTotalMessages: 100,
    currentTopic: keywords[0] ?? '',
    currentTopicKeywords: keywords,
    majorityAgree: false,
    isHeatedDebate: messages.slice(-5).some(m =>
      m.content.includes('不同意') || m.content.includes('反对') || m.content.includes('瞎说')
    ),
    lastMessageWasDeep: (lastMessage?.content.length ?? 0) > 100,
    messagesSinceLastEnvironmentEvent: environmentEventCounter,
    sessionProgress,
  }
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['的', '了', '是', '在', '我', '你', '他', '她', '们', '这', '那', '就', '都', '也', '和', '有', '不', '吗', '吧', '啊', '呢', '嗯'])
  const chars = text.replace(/[^一-龥a-zA-Z]/g, ' ').split(/\s+/).filter(w => w.length >= 2 && !stopWords.has(w))
  const freq = new Map<string, number>()
  for (const w of chars) freq.set(w, (freq.get(w) ?? 0) + 1)
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w)
}

function cleanResponse(raw: string): string {
  let text = raw.trim()
  text = text.replace(/^["「『]/, '').replace(/["」』]$/, '')
  text = text.replace(/^[^\s：:]{1,5}[：:]\s*/, '')
  text = text.replace(/\*\*/g, '')
  text = text.replace(/^#+\s+/gm, '')
  text = text.replace(/^[-*]\s+/gm, '')
  text = text.replace(/^\d+\.\s+/gm, '')
  text = text.replace(/`([^`]+)`/g, '$1')
  return text
}

export async function runTurnStreaming(
  personas: Persona[],
  messages: Message[],
  sessionProgress: number,
  environmentEventCounter: number,
  environmentEvents: string[],
  callbacks: StreamCallbacks,
  topic?: string
): Promise<void> {
  if (messages.length === 0) return

  const ctx = buildConversationContext(messages, personas, sessionProgress, environmentEventCounter)
  const originalTopic = topic ?? ctx.currentTopic
  const personaMap = new Map(personas.map(p => [p.id, p]))
  const personaNames = personas
    .filter(p => p.meta.archetypeId !== 'moderator')
    .map(p => p.name)

  const envEvent = shouldTriggerEnvironmentEvent(ctx, environmentEvents)

  const moderator = personas.find(p => p.meta.archetypeId === 'moderator')
  const modAction = moderator ? shouldModeratorSpeak(messages, personas, sessionProgress) : null
  let forcedSpeakerId: string | undefined
  let envEventSent = false

  if (modAction && moderator) {
    const visibleCtx = buildContext(moderator, messages, personaMap)
    const systemPrompt = buildPersonaSystemPrompt(moderator, originalTopic, personaNames)
    const userPrompt = buildModeratorResponsePrompt(
      moderator,
      visibleCtx.messages,
      modAction.directive,
      personaNames,
      originalTopic
    )

    if (envEvent) {
      callbacks.onEnvironmentEvent(envEvent)
      envEventSent = true
    }

    try {
      const modTokens: string[] = []
      const rawText = await chatCompletionStream(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: moderator.aiConfig.temperature, maxTokens: 200 },
        (token) => { modTokens.push(token) }
      )

      const content = cleanResponse(rawText)

      // 主持人也用 pacing 输出
      callbacks.onTypingStart(moderator.id, moderator.name)
      const chars = content.split('')
      for (const ch of chars) {
        callbacks.onToken(moderator.id, ch)
        await new Promise(r => setTimeout(r, 35 + Math.random() * 30))
      }

      const newMessage: Message = {
        id: crypto.randomUUID(),
        personaId: moderator.id,
        content,
        timestamp: Date.now(),
      }

      updateAllStates(personas, newMessage, originalTopic)
      callbacks.onMessageEnd(moderator.id, newMessage)
      callbacks.onStateUpdate(personas.map(p => ({ id: p.id, state: p.state })))

      markModeratorSpoke(messages.length)

      if (modAction.targetPersonaId) {
        forcedSpeakerId = modAction.targetPersonaId
      } else {
        for (const p of personas) {
          if (p.meta.archetypeId === 'moderator') continue
          if (content.includes(`@${p.name}`) || content.includes(`＠${p.name}`)) {
            forcedSpeakerId = p.id
            break
          }
        }
      }
    } catch (err) {
      console.error('Moderator LLM error:', err)
    }
  }

  const speakers = selectSpeakers(personas, ctx, forcedSpeakerId ? 1 : 3, forcedSpeakerId)
  if (speakers.length === 0) return

  // 预构建所有发言者的 prompt（同步，很快）
  const speakerJobs = speakers.map(speaker => {
    const persona = personaMap.get(speaker.personaId)!
    const directives: string[] = []

    const phase = getCurrentPhase(sessionProgress)
    const phaseDir = getPhaseDirectives(phase)
    if (phaseDir) directives.push(phaseDir)

    const retro = shouldRetrospect(persona, messages, ctx.currentTopicKeywords)
    if (retro) {
      const speakerName = personaMap.get(retro.personaId)?.name ?? '有人'
      directives.push(buildRetrospectiveDirective(retro, speakerName))
    }

    const subgroup = detectSubgroupDynamics(personas, messages)
    if (subgroup && (subgroup.participants.includes(persona.id) ||
      persona.social.socialRole === 'mediator' || persona.social.socialRole === 'peacemaker')) {
      directives.push(buildSubgroupDirective(subgroup, personas))
    }

    const topicShift = shouldShiftTopic(personas, ctx.currentTopic)
    if (topicShift && topicShift.personaId === persona.id) {
      directives.push(`想换话题："${topicShift.transitionPhrase}"`)
    }

    if (shouldAskWhatDidIMiss(persona)) {
      directives.push(buildMissCatchUpDirective(persona))
    }

    if (forcedSpeakerId === persona.id && modAction) {
      directives.push('主持人刚才点了你的名，你必须正面回应，展开说清楚你的观点。不要敷衍。')
    }

    const visibleCtx = buildContext(persona, messages, personaMap)
    const systemPrompt = buildPersonaSystemPrompt(persona, originalTopic)
    const userPrompt = buildResponsePrompt(persona, visibleCtx.messages, directives, visibleCtx.ownPrevious)

    return { persona, systemPrompt, userPrompt }
  })

  // 并行启动所有 LLM 调用（thinking 时间互相重叠），全部缓冲 token
  interface SpeakerResult {
    persona: Persona
    tokens: string[]
    rawText: string
  }

  const results: SpeakerResult[] = speakerJobs.map(({ persona }) => ({
    persona,
    tokens: [],
    rawText: '',
  }))

  const completionPromises = speakerJobs.map(({ persona, systemPrompt, userPrompt }, idx) =>
    chatCompletionStream(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: persona.aiConfig.temperature, maxTokens: 400 },
      (token) => { results[idx].tokens.push(token) }
    ).then(rawText => { results[idx].rawText = rawText })
  )

  if (!envEventSent && envEvent) {
    callbacks.onEnvironmentEvent(envEvent)
    envEventSent = true
  }

  // 所有发言者统一逻辑：等 LLM 完成 → 按换行拆成多条 → 逐条 pacing 输出
  for (let i = 0; i < results.length; i++) {
    await completionPromises[i]
    const { persona, rawText } = results[i]

    const cleaned = cleanResponse(rawText)
    let segments = cleaned.split(/\n+/).map(s => s.trim()).filter(s => s.length > 0)

    // 硬截断：总字数不超过 150
    const truncated: string[] = []
    let total = 0
    for (const seg of segments) {
      if (total + seg.length > 150) {
        const remaining = 150 - total
        if (remaining > 10) truncated.push(seg.slice(0, remaining))
        break
      }
      truncated.push(seg)
      total += seg.length
    }
    segments = truncated

    const baseDelay = persona.voice.typingSpeed === 'slow' ? 80
      : persona.voice.typingSpeed === 'fast' ? 40
      : persona.voice.typingSpeed === 'instant' ? 25
      : 55

    for (let s = 0; s < segments.length; s++) {
      const segment = segments[s]
      callbacks.onTypingStart(persona.id, persona.name)

      const segTokens = segment.split('')
      for (const ch of segTokens) {
        callbacks.onToken(persona.id, ch)
        const jitter = baseDelay * (0.5 + Math.random())
        await new Promise(r => setTimeout(r, jitter))
      }

      const newMessage: Message = {
        id: crypto.randomUUID(),
        personaId: persona.id,
        content: segment,
        timestamp: Date.now(),
      }

      updateAllStates(personas, newMessage, originalTopic)
      callbacks.onMessageEnd(persona.id, newMessage)
      callbacks.onStateUpdate(personas.map(p => ({ id: p.id, state: p.state })))

      if (s < segments.length - 1) {
        await new Promise(r => setTimeout(r, 600 + Math.random() * 800))
      }
    }
  }
}
