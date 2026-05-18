import { analyzeConversation } from '@/lib/report/analyzer'
import { buildSlideHTML } from '@/lib/report/slide-builder'
import { buildReportMarkdown } from '@/lib/report/markdown-builder'
import { Persona, Message } from '@/types'

interface ReportInput {
  topic: string
  crowdDescription: string
  cafeName: string
  duration: number
  personas: Persona[]
  messages: Message[]
  date: string
}

export async function POST(request: Request) {
  try {
    const body: ReportInput = await request.json()
    const { topic, crowdDescription, cafeName, duration, personas, messages, date } = body

    if (!messages || messages.length === 0) {
      return Response.json({ error: '没有对话记录' }, { status: 400 })
    }

    const reportData = await analyzeConversation({
      topic,
      crowdDescription,
      cafeName,
      duration,
      personas,
      messages,
    })

    const meta = { cafeName, date, duration }
    const slidesHTML = buildSlideHTML(reportData, personas, meta)
    const markdown = buildReportMarkdown(reportData, personas, meta)

    return Response.json({ reportData, slidesHTML, markdown })
  } catch (err) {
    console.error('报告生成失败:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : '生成失败' },
      { status: 500 }
    )
  }
}
