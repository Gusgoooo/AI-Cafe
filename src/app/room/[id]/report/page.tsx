'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getRoom } from '@/lib/storage'
import ReportViewer from '@/components/ReportViewer'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState(0)

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

  if (!slidesHTML) return null

  return (
    <ReportViewer
      slidesHTML={slidesHTML}
      onClose={() => { window.location.href = `/room/${id}` }}
    />
  )
}
