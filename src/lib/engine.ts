import { Persona, Message, ConversationContext, AIResponse } from '@/types'
import { selectSpeakers } from './speaker-selector'
import { buildContext } from './context-builder'
import { updateAllStates } from './state-updater'
import { getResponseDelay } from './timing'
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
import { chatCompletion } from './openrouter'
import { shouldModeratorSpeak, markModeratorSpoke } from './moderator-engine'

export interface TurnResult {
  speakerPersonaId: string
  aiResponse: AIResponse
  delay: number
  environmentEvent?: string
  isContinuation?: boolean
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

function splitLongMessage(content: string): string[] {
  if (content.length < 60) return [content]
  if (content.length < 100 && Math.random() > 0.3) return [content]

  const splitPoints = ['\n', '。', '！', '？', '…', '，']
  const segments: string[] = []
  let remaining = content

  const targetParts = content.length > 150 ? 3 : 2

  for (let i = 0; i < targetParts - 1 && remaining.length > 20; i++) {
    const midRange = Math.floor(remaining.length * (0.3 + Math.random() * 0.25))
    let bestSplit = -1

    for (const sp of splitPoints) {
      const idx = remaining.indexOf(sp, Math.floor(midRange * 0.7))
      if (idx > 0 && idx < midRange * 1.5 && idx < remaining.length - 10) {
        bestSplit = idx + sp.length
        break
      }
    }

    if (bestSplit > 0) {
      segments.push(remaining.slice(0, bestSplit).trim())
      remaining = remaining.slice(bestSplit).trim()
    } else {
      break
    }
  }

  if (remaining.trim()) segments.push(remaining.trim())
  return segments.length > 0 ? segments : [content]
}

export async function runTurn(
  personas: Persona[],
  messages: Message[],
  sessionProgress: number,
  environmentEventCounter: number,
  environmentEvents: string[],
  topic?: string
): Promise<TurnResult[]> {
  if (messages.length === 0) return []

  const ctx = buildConversationContext(messages, personas, sessionProgress, environmentEventCounter)
  const originalTopic = topic ?? ctx.currentTopic
  const personaMap = new Map(personas.map(p => [p.id, p]))
  const personaNames = personas
    .filter(p => p.meta.archetypeId !== 'moderator')
    .map(p => p.name)

  const envEvent = shouldTriggerEnvironmentEvent(ctx, environmentEvents)

  const results: TurnResult[] = []

  const moderator = personas.find(p => p.meta.archetypeId === 'moderator')
  const modAction = moderator ? shouldModeratorSpeak(messages, personas, sessionProgress) : null
  let forcedSpeakerId: string | undefined

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

    const rawText = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: moderator.aiConfig.temperature,
        maxTokens: 200,
      }
    )

    const content = cleanResponse(rawText)
    const segments = splitLongMessage(content)

    for (let si = 0; si < segments.length; si++) {
      const segResponse: AIResponse = { content: segments[si] }
      const delay = si === 0
        ? getResponseDelay(moderator, segResponse)
        : 300 + Math.random() * 600

      results.push({
        speakerPersonaId: moderator.id,
        aiResponse: segResponse,
        delay,
        environmentEvent: si === 0 ? envEvent ?? undefined : undefined,
        isContinuation: si > 0,
      })
    }

    markModeratorSpoke(messages.length)

    if (modAction.targetPersonaId) {
      forcedSpeakerId = modAction.targetPersonaId
    }
  }

  const speakers = selectSpeakers(personas, ctx, forcedSpeakerId ? 1 : 3, forcedSpeakerId)
  if (speakers.length === 0 && results.length === 0) return []

  for (const speaker of speakers) {
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

    const rawText = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: persona.aiConfig.temperature,
        maxTokens: 400,
      }
    )

    const content = cleanResponse(rawText)
    const segments = splitLongMessage(content)

    for (let si = 0; si < segments.length; si++) {
      const segResponse: AIResponse = { content: segments[si] }
      const delay = si === 0
        ? getResponseDelay(persona, segResponse)
        : 300 + Math.random() * 800

      results.push({
        speakerPersonaId: persona.id,
        aiResponse: segResponse,
        delay,
        environmentEvent: si === 0 && results.length === 1 && !modAction ? envEvent ?? undefined : undefined,
        isContinuation: si > 0,
      })
    }
  }

  return results
}
