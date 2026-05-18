'use client'

import { useRef, useEffect } from 'react'
import { Message, Persona } from '@/types'

interface ChatHistoryProps {
  messages: Message[]
  personaMap: Map<string, Persona>
  visible: boolean
}

export default function ChatHistory({ messages, personaMap, visible }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [messages.length, visible])

  if (!visible) return null

  return (
    <div className="overflow-y-auto px-4 py-3 space-y-2.5 flex-1 min-h-0">
      {messages.map(msg => {
        const persona = personaMap.get(msg.personaId)
        const isUser = msg.personaId === 'user'
        const isEnvironment = msg.personaId === 'environment'
        const name = isUser ? '你' : isEnvironment ? '' : (persona?.name ?? '未知')
        const color = isUser ? 'var(--muted-foreground)' : (persona?.badgeColor ?? '#9ca3af')

        if (isEnvironment) {
          return (
            <div key={msg.id} className="text-center text-xs text-muted-foreground italic py-1">
              {msg.content}
            </div>
          )
        }

        const firstChar = isUser ? '我' : (persona?.name?.[0] ?? '?')

        return (
          <div key={msg.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div
              className="shrink-0 w-7 h-7 flex items-center justify-center font-pixel text-[10px] text-white border-2 border-current/20"
              style={{ backgroundColor: color, imageRendering: 'pixelated' }}
            >
              {firstChar}
            </div>
            <div className="max-w-[80%]">
              <p className="text-xs font-bold mb-0.5" style={{ color }}>
                {name}
              </p>
              <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
