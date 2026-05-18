'use client'

import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { Persona, Room } from '@/types'
import { CAFE_NAMES } from '@/lib/scenes/cafe'
import { saveRoom } from '@/lib/storage'
import DataImport from './DataImport'
import PersonaPreview from './PersonaPreview'
import { applySlackerTraits } from '@/lib/slacker-persona'
import { createModeratorPersona } from '@/lib/moderator-persona'

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const WEATHER_OPTIONS = [
  { emoji: '☀️', temp: 28 },
  { emoji: '⛅', temp: 24 },
  { emoji: '🌧️', temp: 18 },
  { emoji: '🌤️', temp: 26 },
  { emoji: '❄️', temp: 2 },
]

type Step = 'form' | 'preview'

export default function CreateRoomForm() {
  const [crowd, setCrowd] = useState('')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(60)
  const [userData, setUserData] = useState<{
    type: 'json' | 'csv' | 'text'
    content: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [randomLoading, setRandomLoading] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [step, setStep] = useState<Step>('form')
  const [progressText, setProgressText] = useState('')

  async function handleRandomTopic() {
    setRandomLoading(true)
    try {
      const res = await fetch('/api/random-topic')
      const data = await res.json()
      if (data.crowdDescription) setCrowd(data.crowdDescription)
      if (data.topic) setTopic(data.topic)
    } catch {
      // 静默失败
    } finally {
      setRandomLoading(false)
    }
  }

  async function handleGenerate() {
    if (!crowd.trim() || !topic.trim()) return
    setLoading(true)
    setError(null)
    setProgressText('正在准备…')
    try {
      const res = await fetch('/api/generate-personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crowdDescription: crowd.trim(),
          topic: topic.trim(),
          userData: userData ?? undefined,
          count: 7,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        setError(errData.error || '请求失败')
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6))
              if (currentEvent === 'progress') {
                setProgressText(data.detail)
              } else if (currentEvent === 'done') {
                const generated = data.personas as Persona[]
                const slackerIdx = Math.floor(Math.random() * generated.length)
                generated[slackerIdx] = applySlackerTraits(generated[slackerIdx])
                setPersonas([createModeratorPersona(), ...generated])
                setStep('preview')
              } else if (currentEvent === 'error') {
                setError(data.message)
              }
            } catch { /* skip unparseable */ }
            currentEvent = ''
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败')
    } finally {
      setLoading(false)
      setProgressText('')
    }
  }

  function handleStartChat() {
    const room: Room = {
      id: uuid(),
      crowdDescription: crowd.trim(),
      topic: topic.trim(),
      duration,
      personas,
      messages: [],
      createdAt: Date.now(),
      cafeName: pickRandom(CAFE_NAMES),
      weather: pickRandom(WEATHER_OPTIONS),
      sceneId: 'cafe',
      stateHistory: [],
    }
    saveRoom(room)
    window.location.href = `/room/${room.id}`
  }

  async function handleRegenerate() {
    await handleGenerate()
  }

  if (step === 'preview' && personas.length > 0) {
    return (
      <PersonaPreview
        personas={personas}
        topic={topic}
        onStart={handleStartChat}
        onRegenerate={handleRegenerate}
        loading={loading}
      />
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* 像素底图 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/emptycafe.png)',
          imageRendering: 'pixelated',
        }}
      />
      <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-t from-black/20 via-transparent to-black/5" />

      {/* 页面顶部导航 */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <span className="font-pixel text-[10px] text-card select-none">娱乐版：</span>
        <span className="font-pixel text-xs px-3 py-1.5 rounded-md bg-wood text-primary-foreground border-2 border-wood-dark cursor-default select-none">
          AI咖啡厅
        </span>
        <span className="text-xs text-foreground/80 select-none">|</span>
        <span className="font-pixel text-[10px] text-card select-none">专业版：</span>
        {['A/B测试', '用户调研', '人群研究'].map(name => (
          <span
            key={name}
            className="group font-pixel text-xs px-3 py-1.5 rounded-md bg-card/60 border-2 border-wood/40 text-foreground/40 cursor-default select-none relative"
          >
            <span className="group-hover:invisible">{name}</span>
            <span className="invisible group-hover:visible absolute inset-0 flex items-center justify-center text-foreground/60">
              敬请期待
            </span>
          </span>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* 像素块 3D 标题 */}
        <div className="text-center mb-6">
          <h1 className="sdv-game-title text-6xl mb-3">
            {'AI Café'.split('').map((ch, i) => (
              <span
                key={i}
                className="sdv-game-title-letter"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
          </h1>
        </div>

        {/* 游戏窗口面板 */}
        <div className="sdv-panel">
          {/* 标题栏 */}
          <div className="sdv-titlebar !py-3.5">
            <div className="sdv-titlebar-dots">
              <div className="sdv-titlebar-dot" style={{ background: '#e45649' }} />
              <div className="sdv-titlebar-dot" style={{ background: '#e5a73d' }} />
              <div className="sdv-titlebar-dot" style={{ background: '#50a14f' }} />
            </div>
            <span className="font-pixel text-sm text-primary-foreground/90 drop-shadow-sm">
              创建话题让AI们进行讨论
            </span>
            <span className="ml-auto">
              <button
                onClick={handleRandomTopic}
                disabled={randomLoading}
                className="font-pixel text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
              >
                {randomLoading ? '...' : '🎲 随意一个'}
              </button>
            </span>
          </div>

          {/* 内容区 */}
          <div className="sdv-panel-inner space-y-4">
            {/* 人群 */}
            <div>
              <label className="block text-base font-bold text-foreground mb-1.5">
                人群描述
              </label>
              <textarea
                value={crowd}
                onChange={e => setCrowd(e.target.value)}
                placeholder="一群互联网大厂 996 程序员"
                rows={3}
                className="w-full sdv-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none"
              />
            </div>

            {/* 话题 */}
            <div>
              <label className="block text-base font-bold text-foreground mb-1.5">
                讨论话题
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="35岁以后还能干什么"
                rows={2}
                className="w-full sdv-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none"
              />
            </div>

            {/* 数据导入 */}
            <DataImport onData={setUserData} />

            {/* 时长 */}
            <div className="flex items-center gap-3">
              <label className="text-base font-bold text-foreground shrink-0">
                时长
              </label>
              <select
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="sdv-input px-3 py-2 pr-8 text-sm text-foreground cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23786046%22%20stroke-width%3D%223%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]"
              >
                <option value={30}>30 分钟</option>
                <option value={60}>60 分钟</option>
                <option value={90}>90 分钟</option>
                <option value={120}>120 分钟</option>
              </select>
            </div>

            {error && (
              <div className="border-3 border-destructive/40 bg-destructive/10 rounded-md px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* 开始按钮 */}
            <button
              onClick={handleGenerate}
              disabled={loading || !crowd.trim() || !topic.trim()}
              className="w-full py-3.5 sdv-button text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              )}
              {loading ? '生成中…' : '☕ 开始畅聊'}
            </button>

            {loading && progressText && (
              <p className="text-center text-xs text-muted-foreground animate-pulse">
                {progressText}
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-white mt-4 select-none">
          AI人物基于小🍠/抖🎵/人群实验室的数据蒸馏而来
        </p>
      </div>
    </div>
  )
}
