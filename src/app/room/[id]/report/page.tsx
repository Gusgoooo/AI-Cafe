'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getRoom } from '@/lib/storage'
import ReportViewer from '@/components/ReportViewer'
import { Button } from '@/components/ui/button'

const LOADING_STAGES = [
  '正在整理对话记录…',
  '正在分析观点碰撞…',
  '正在绘制群体关系…',
  '正在生成报告…',
]

export default function ReportPage() {
  const params = useParams()
  const id = params.id as string
  const [slidesHTML, setSlidesHTML] = useState<string | null>(null)
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState(0)
  const [viewMode, setViewMode] = useState<'markdown' | 'slides'>('markdown')

  useEffect(() => {
    if (!loading) return
    const timer = setInterval(() => {
      setStage(prev => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev))
    }, 3000)
    return () => clearInterval(timer)
  }, [loading])

  useEffect(() => {
    const room = getRoom(id)
    if (!room) {
      setError('房间不存在')
      setLoading(false)
      return
    }

    if (room.messages.length === 0) {
      setError('没有对话记录')
      setLoading(false)
      return
    }

    fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: room.topic,
        crowdDescription: room.crowdDescription,
        cafeName: room.cafeName,
        duration: room.duration,
        personas: room.personas,
        messages: room.messages,
        date: new Date(room.createdAt).toLocaleDateString('zh-CN'),
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setSlidesHTML(data.slidesHTML)
          setMarkdown(data.markdown)
        }
      })
      .catch(() => setError('报告生成失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-8 h-8 border-2 border-wood border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground font-bold mb-1">{LOADING_STAGES[stage]}</p>
          <div className="flex justify-center gap-1 mt-3 mb-6">
            {LOADING_STAGES.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: i <= stage ? 24 : 8,
                  backgroundColor: i <= stage ? 'var(--wood)' : 'var(--muted)',
                }}
              />
            ))}
          </div>
          <button
            onClick={() => { window.location.href = `/room/${id}` }}
            className="px-4 py-2 text-sm sdv-input font-bold text-foreground cursor-pointer hover:bg-accent transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <a href="/" className="text-wood hover:underline text-sm">返回首页</a>
        </div>
      </div>
    )
  }

  if (viewMode === 'slides' && slidesHTML) {
    return (
      <ReportViewer
        slidesHTML={slidesHTML}
        onClose={() => setViewMode('markdown')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { window.location.href = `/room/${id}` }}
          className="text-muted-foreground hover:text-foreground cursor-pointer"
        >
          &larr; 返回
        </Button>
        <Button
          size="sm"
          onClick={() => setViewMode('slides')}
          className="cursor-pointer"
        >
          幻灯片模式
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-blockquote:border-wood prose-blockquote:text-muted-foreground">
          <MarkdownRenderer content={markdown ?? ''} />
        </article>
      </div>
    </div>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  const html = markdownToHtml(content)
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')

  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
  html = html.replace(/\n{2,}/g, '</p><p>')
  html = html.replace(/^(?!<[hublp])/gm, (match) => match ? `<p>${match}` : '')

  html = html
    .replace(/<p><h/g, '<h')
    .replace(/<\/h(\d)><\/p>/g, '</h$1>')
    .replace(/<p><blockquote>/g, '<blockquote>')
    .replace(/<\/blockquote><\/p>/g, '</blockquote>')
    .replace(/<p><ul>/g, '<ul>')
    .replace(/<\/ul><\/p>/g, '</ul>')
    .replace(/<p><\/p>/g, '')

  return html
}
