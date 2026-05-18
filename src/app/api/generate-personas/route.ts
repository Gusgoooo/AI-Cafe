import { generatePersonasStreaming } from '@/lib/persona-factories/ai-generated'
import { GeneratePersonasInput } from '@/types'

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request) {
  try {
    const body: GeneratePersonasInput = await request.json()
    const { crowdDescription, topic, userData, count } = body

    if (!crowdDescription || !topic) {
      return Response.json(
        { error: '请提供人群描述和讨论话题' },
        { status: 400 }
      )
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEncode(event, data)))
        }

        try {
          const personas = await generatePersonasStreaming(
            crowdDescription,
            topic,
            count ?? 8,
            (phase, detail) => enqueue('progress', { phase, detail }),
            userData?.content
          )
          enqueue('done', { personas })
        } catch (err) {
          console.error('生成人设失败:', err)
          enqueue('error', { message: err instanceof Error ? err.message : '生成失败' })
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
    console.error('生成人设失败:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : '请求失败' },
      { status: 500 }
    )
  }
}
