'use client'

import { useEffect, useState } from 'react'
import { Room } from '@/types'

interface StatusBarProps {
  room: Room
  messageCount: number
  onEnd: () => void
}

export default function StatusBar({ room, messageCount, onEnd }: StatusBarProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - room.createdAt) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [room.createdAt])

  const totalSeconds = room.duration * 60
  const remaining = Math.max(0, totalSeconds - elapsed)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const progress = Math.min(1, elapsed / totalSeconds)
  const filledBlocks = Math.round(progress * 10)

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
      <span>{room.weather.emoji} {room.weather.temp}°C</span>
      <div className="flex items-center gap-2 font-pixel text-[10px]">
        <span className="text-muted-foreground">
          {'█'.repeat(filledBlocks)}{'░'.repeat(10 - filledBlocks)}
        </span>
        <span className={remaining < 300 ? 'text-destructive font-bold' : ''}>
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>

      <button
        onClick={onEnd}
        className="px-2 py-0.5 text-xs sdv-input font-bold text-foreground cursor-pointer hover:bg-accent transition-colors"
      >
        结束
      </button>
    </div>
  )
}
