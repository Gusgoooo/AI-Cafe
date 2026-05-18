import { Persona, Message } from '@/types'
import { runTurnStreaming, StreamCallbacks } from '@/lib/engine'
import { CAFE_ENVIRONMENT_EVENTS } from '@/lib/scenes/cafe'

interface EngineParams {
  influenceMultiplier?: number
  confidenceBoundOffset?: number
  delayMultiplier?: number
  typingSpeedMultiplier?: number
}

interface ChatInput {
  personas: Persona[]
  messages: Message[]
  sessionProgress: number
  environmentEventCounter: number
  topic?: string
  engineParams?: EngineParams
}

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request) {
  try {
    const body: ChatInput = await request.json()
    const { personas, messages, sessionProgress, environmentEventCounter, topic, engineParams } = body

    if (!personas || !messages) {
      return Response.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEncode(event, data)))
        }

        const callbacks: StreamCallbacks = {
          onTypingStart: (personaId, name) => {
            enqueue('typing-start', { personaId, name })
          },
          onToken: (personaId, token) => {
            enqueue('token', { personaId, token })
          },
          onMessageEnd: (personaId, message) => {
            enqueue('message-end', { personaId, message })
          },
          onMoodChange: (personaId, mood) => {
            enqueue('mood-change', { personaId, ...mood })
          },
          onStateUpdate: (personaStates) => {
            enqueue('state-update', { personas: personaStates })
          },
          onEnvironmentEvent: (content) => {
            enqueue('action', { personaId: 'environment', content })
          },
        }

        try {
          await runTurnStreaming(
            personas,
            messages,
            sessionProgress,
            environmentEventCounter,
            CAFE_ENVIRONMENT_EVENTS,
            callbacks,
            topic,
            engineParams
          )
        } catch (err) {
          console.error('SSE streaming error:', err)
          enqueue('error', {
            message: err instanceof Error ? err.message : '生成失败',
          })
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : '请求失败' },
      { status: 500 }
    )
  }
}
