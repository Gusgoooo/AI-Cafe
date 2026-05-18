'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { Room, Message, Persona } from '@/types'
import { saveRoom } from '@/lib/storage'
import CafeScene from './CafeScene'
import UserInput from './UserInput'
import StatusBar from './StatusBar'
import ChatHistory from './ChatHistory'
import SummaryModal from './SummaryModal'
import PersonaCard from './PersonaCard'
import { Dialog, DialogContent } from './ui/dialog'

interface ActiveBubble {
  personaId: string
  content: string
  action?: string
  isStreaming: boolean
}

interface ChatRoomProps {
  room: Room
}

export default function ChatRoom({ room: initialRoom }: ChatRoomProps) {
  const [room, setRoom] = useState(initialRoom)
  const [messages, setMessages] = useState<Message[]>(initialRoom.messages)
  const [personas, setPersonas] = useState<Persona[]>(initialRoom.personas)
  const [typingIds, setTypingIds] = useState<Set<string>>(new Set())
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [activeBubbles, setActiveBubbles] = useState<ActiveBubble[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [envEventCounter, setEnvEventCounter] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  const messagesRef = useRef(messages)
  const personasRef = useRef(personas)
  const isProcessingRef = useRef(false)
  messagesRef.current = messages
  personasRef.current = personas

  const personaMap = new Map(personas.map(p => [p.id, p]))

  const sessionProgress = useCallback(() => {
    const elapsed = (Date.now() - room.createdAt) / 1000
    const total = room.duration * 60
    return Math.min(1, elapsed / total)
  }, [room.createdAt, room.duration])

  const runConversationTurn = useCallback(async () => {
    if (isProcessingRef.current || messagesRef.current.length === 0) return
    isProcessingRef.current = true
    setIsProcessing(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personas: personasRef.current,
          messages: messagesRef.current,
          sessionProgress: sessionProgress(),
          environmentEventCounter: envEventCounter,
          topic: room.topic,
        }),
      })

      if (!res.ok || !res.body) {
        isProcessingRef.current = false
        setIsProcessing(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7)
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6))
              handleSSEEvent(eventType, data)
            } catch { /* skip malformed */ }
            eventType = ''
          }
        }
      }
    } catch (err) {
      console.error('Chat turn error:', err)
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionProgress, envEventCounter])

  function handleSSEEvent(type: string, data: Record<string, unknown>) {
    switch (type) {
      case 'typing-start':
        setTypingIds(prev => new Set([...prev, data.personaId as string]))
        break

      case 'action': {
        const pid = data.personaId as string
        if (pid === 'environment') {
          const envMsg: Message = {
            id: uuid(),
            personaId: 'environment',
            content: data.content as string,
            timestamp: Date.now(),
          }
          setMessages(prev => [...prev, envMsg])
          setEnvEventCounter(0)
        }
        break
      }

      case 'token': {
        const pid = data.personaId as string
        const token = data.token as string
        setTypingIds(prev => { const s = new Set(prev); s.delete(pid); return s })
        setSpeakingId(pid)
        setActiveBubbles(prev => {
          const existing = prev.find(b => b.personaId === pid && b.isStreaming)
          if (existing) {
            return prev.map(b =>
              b === existing ? { ...b, content: b.content + token } : b
            )
          }
          return [{
            personaId: pid,
            content: token,
            isStreaming: true,
          }]
        })
        break
      }

      case 'message-end': {
        const pid = data.personaId as string
        const msg = data.message as Message
        setSpeakingId(null)
        setActiveBubbles(prev =>
          prev.map(b => b.personaId === pid ? { ...b, isStreaming: false } : b)
        )
        setMessages(prev => [...prev, msg])
        setEnvEventCounter(prev => prev + 1)
        break
      }

      case 'mood-change':
        break

      case 'state-update': {
        const updatedPersonas = data.personas as { id: string; state: Persona['state'] }[]
        setPersonas(prev =>
          prev.map(p => {
            const update = updatedPersonas.find(u => u.id === p.id)
            return update ? { ...p, state: update.state } : p
          })
        )
        break
      }
    }
  }

  useEffect(() => {
    if (messages.length === 0) {
      const content = `今天聊「${room.topic}」，在座各位先报个到，说说你是谁、跟这个话题什么关系`
      const opener: Message = {
        id: uuid(),
        personaId: 'moderator',
        content,
        timestamp: Date.now(),
      }
      setSpeakingId('moderator')
      setActiveBubbles([{ personaId: 'moderator', content, isStreaming: false }])
      setMessages([opener])
      setTimeout(() => setSpeakingId(null), 3000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (messages.length > 0 && !isProcessing && !showSummary) {
      const delay = messages.length === 1 ? 2000 : 2500 + Math.random() * 3500
      const timer = setTimeout(runConversationTurn, delay)
      return () => clearTimeout(timer)
    }
  }, [messages, isProcessing, showSummary, runConversationTurn])

  useEffect(() => {
    const updated = { ...room, messages, personas }
    saveRoom(updated)
    setRoom(updated)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  useEffect(() => {
    const check = setInterval(() => {
      const elapsed = (Date.now() - room.createdAt) / 1000
      if (elapsed >= room.duration * 60 && !showSummary) {
        setShowSummary(true)
      }
    }, 5000)
    return () => clearInterval(check)
  }, [room.createdAt, room.duration, showSummary])

  const TIPS = [
    'AI人设不是真人，所以他们思考+发言往往很快',
    '你可以发言来打断他们，也可以全程不说话',
    '他们的人设来自于真实数据，但性格不是',
    '他们可能会吵架，也可能会冷场',
    '他们可能会聊偏题，你可以斧正一下',
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length)
    }, 15000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleUserSend(content: string, mentions?: string[]) {
    const msg: Message = {
      id: uuid(),
      personaId: 'user',
      content,
      mentions,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, msg])
  }

  function handleBubbleDismiss(personaId: string) {
    setActiveBubbles(prev => prev.filter(b => b.personaId !== personaId))
  }

  const selectedPersona = selectedPersonaId ? personaMap.get(selectedPersonaId) : null
  const msgCount = messages.filter(m => m.personaId !== 'environment').length

  return (
    <>
    <div className="h-screen relative overflow-hidden">
      {/* 话题标题胶囊 */}
      <div className="absolute top-4 left-4 z-30">
        <div className="px-3 py-1.5 bg-card/90 border-2 border-wood rounded-full shadow-sm">
          <span className="font-pixel text-xs text-foreground">{room.topic}</span>
        </div>
      </div>

      {/* 咖啡厅场景：铺满全屏 */}
      <div className="absolute inset-0">
        <CafeScene
          personas={personas}
          typingPersonaIds={typingIds}
          speakingPersonaId={speakingId}
          activeBubbles={activeBubbles}
          onBadgeClick={setSelectedPersonaId}
          onBubbleDismiss={handleBubbleDismiss}
        />

        {/* 人物卡片弹窗 */}
        <Dialog
          open={!!selectedPersona}
          onOpenChange={open => !open && setSelectedPersonaId(null)}
        >
          <DialogContent className="max-w-sm p-0 border-none bg-transparent shadow-none [&>button]:hidden">
            {selectedPersona && <PersonaCard persona={selectedPersona} onClose={() => setSelectedPersonaId(null)} />}
          </DialogContent>
        </Dialog>
      </div>

      {/* 背景模糊遮罩 */}
      {showHistory && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 transition-opacity duration-300"
          onClick={() => setShowHistory(false)}
        />
      )}

      {/* 底部浮动区域：720px 面板，两侧透明 */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none pb-2 z-20">
        <div className="w-full max-w-[720px] pointer-events-auto flex flex-col" style={{ maxHeight: 'calc(100vh - 20px)' }}>
          {/* 抽屉面板 */}
          <div
            className="transition-all duration-300 ease-out overflow-hidden"
            style={{ flex: showHistory ? '1 1 0%' : '0 0 0px', minHeight: 0 }}
          >
            <div className="bg-card/95 border-3 border-b-0 border-wood rounded-t-lg px-4 py-3 h-full flex flex-col">
              {/* 收起按钮在抽屉顶部 */}
              <div className="flex justify-center mb-2 shrink-0">
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span className="font-pixel text-[10px]">▼</span>
                  <span>收起对话</span>
                </button>
              </div>
              <ChatHistory
                messages={messages}
                personaMap={personaMap}
                visible={showHistory}
              />
            </div>
          </div>

          {/* 输入框 + 状态信息 */}
          <div className="shrink-0 bg-card/95 border-3 border-wood rounded-lg px-4 py-3" style={{ borderTopLeftRadius: showHistory ? 0 : undefined, borderTopRightRadius: showHistory ? 0 : undefined }}>
            {!showHistory && (
              <div className="flex justify-center mb-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span className="font-pixel text-[10px]">▲</span>
                  <span>展开对话 ({msgCount})</span>
                </button>
              </div>
            )}

            <UserInput
              personas={personas}
              onSend={handleUserSend}
              disabled={false}
            />

            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="text-[11px] text-muted-foreground truncate select-none">
                tips：{TIPS[tipIndex]}
              </span>
              <div className="flex-1" />
              <StatusBar
                room={room}
                messageCount={messages.length}
                onEnd={() => setShowSummary(true)}
              />
            </div>
          </div>
        </div>
      </div>

    </div>

    {/* 结束弹窗：渲染在最外层避免被 overflow-hidden 裁剪 */}
    <SummaryModal
      visible={showSummary}
      onClose={() => setShowSummary(false)}
      onGenerateReport={() => {
        window.location.href = `/room/${room.id}/report`
      }}
      onBackToHome={() => {
        window.location.href = '/'
      }}
      messageCount={messages.length}
    />
    </>
  )
}
