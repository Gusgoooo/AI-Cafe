import { Persona, Message, AIResponse } from '@/types'
import { runTurn } from '@/lib/engine'
import { updateAllStates } from '@/lib/state-updater'
import { CAFE_ENVIRONMENT_EVENTS } from '@/lib/scenes/cafe'
import { v4 as uuid } from 'uuid'

interface ChatInput {
  personas: Persona[]
  messages: Message[]
  sessionProgress: number
  environmentEventCounter: number
  topic?: string
}

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request) {
  try {
    const body: ChatInput = await request.json()
    const { personas, messages, sessionProgress, environmentEventCounter, topic } = body

    if (!personas || !messages) {
      return Response.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const results = await runTurn(
            personas,
            messages,
            sessionProgress,
            environmentEventCounter,
            CAFE_ENVIRONMENT_EVENTS,
            topic
          )

          for (const result of results) {
            const persona = personas.find(p => p.id === result.speakerPersonaId)
            if (!persona) continue

            if (result.environmentEvent) {
              controller.enqueue(
                encoder.encode(sseEncode('action', {
                  personaId: 'environment',
                  content: result.environmentEvent,
                }))
              )
            }

            if (!result.isContinuation) {
              controller.enqueue(
                encoder.encode(sseEncode('typing-start', {
                  personaId: result.speakerPersonaId,
                  name: persona.name,
                }))
              )
            }

            await new Promise(resolve => setTimeout(resolve, result.isContinuation ? 800 + Math.random() * 1200 : 1500 + Math.random() * 2500))

            const tokens = result.aiResponse.content.split('')
            for (let i = 0; i < tokens.length; i++) {
              controller.enqueue(
                encoder.encode(sseEncode('token', {
                  personaId: result.speakerPersonaId,
                  token: tokens[i],
                }))
              )
              await new Promise(resolve => setTimeout(resolve, 15 + Math.random() * 25))
            }

            const newMessage: Message = {
              id: uuid(),
              personaId: result.speakerPersonaId,
              content: result.aiResponse.content,
              action: result.aiResponse.action,
              meme: result.aiResponse.meme,
              timestamp: Date.now(),
              isJokeWorthy: result.aiResponse.isJokeWorthy,
              retrospectiveRef: result.aiResponse.retrospectiveRef,
            }

            if (result.aiResponse.moodChange) {
              controller.enqueue(
                encoder.encode(sseEncode('mood-change', {
                  personaId: result.speakerPersonaId,
                  ...result.aiResponse.moodChange,
                }))
              )
            }

            updateAllStates(
              personas,
              newMessage,
              messages.length > 0 ? 'current' : '',
              result.aiResponse
            )

            controller.enqueue(
              encoder.encode(sseEncode('message-end', {
                personaId: result.speakerPersonaId,
                message: newMessage,
              }))
            )

            controller.enqueue(
              encoder.encode(sseEncode('state-update', {
                personas: personas.map(p => ({
                  id: p.id,
                  state: p.state,
                })),
              }))
            )
          }

          controller.close()
        } catch (err) {
          console.error('SSE streaming error:', err)
          controller.enqueue(
            encoder.encode(sseEncode('error', {
              message: err instanceof Error ? err.message : '生成失败',
            }))
          )
          controller.close()
        }
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
