import { generatePersonas } from '@/lib/persona-factories/ai-generated'
import { GeneratePersonasInput } from '@/types'

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

    const personas = await generatePersonas(
      crowdDescription,
      topic,
      count ?? 8,
      userData?.content
    )

    return Response.json({ personas })
  } catch (err) {
    console.error('生成人设失败:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : '生成失败' },
      { status: 500 }
    )
  }
}
