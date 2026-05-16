'use client'

import { useState, useRef, useEffect } from 'react'
import { Persona } from '@/types'

interface UserInputProps {
  personas: Persona[]
  onSend: (content: string, mentions?: string[]) => void
  disabled?: boolean
}

export default function UserInput({ personas, onSend, disabled = false }: UserInputProps) {
  const [text, setText] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const atIdx = text.lastIndexOf('@')
    setShowMentions(atIdx >= 0 && atIdx === text.length - 1)
  }, [text])

  function handleSubmit() {
    if (!text.trim() || disabled) return

    const mentionPattern = /@(\S+)/g
    const mentions: string[] = []
    let match: RegExpExecArray | null
    while ((match = mentionPattern.exec(text)) !== null) {
      const name = match[1]
      const p = personas.find(p => p.name === name)
      if (p) mentions.push(p.id)
    }

    onSend(text.trim(), mentions.length > 0 ? mentions : undefined)
    setText('')
    inputRef.current?.focus()
  }

  function handleMention(persona: Persona) {
    const atIdx = text.lastIndexOf('@')
    setText(text.slice(0, atIdx) + `@${persona.name} `)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      {showMentions && (
        <div className="absolute bottom-full mb-1 left-0 right-0 sdv-panel p-0 z-20">
          <div className="sdv-panel-inner !p-2 max-h-48 overflow-y-auto space-y-0.5">
            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => handleMention(p)}
                className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm cursor-pointer transition-colors"
              >
                <span
                  className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold sdv-badge"
                  style={{ backgroundColor: p.badgeColor }}
                >
                  {p.name[0]}
                </span>
                <span className="text-foreground">{p.name}</span>
                <span className="text-muted-foreground text-xs">{p.identity.occupation}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder="说点什么… 输入 @ 可以点名某人"
          disabled={disabled}
          className="flex-1 h-10 sdv-input px-3 text-sm text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="shrink-0 h-10 px-5 sdv-button text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>
    </div>
  )
}
