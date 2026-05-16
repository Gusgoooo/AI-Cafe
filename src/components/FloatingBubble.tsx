'use client'

import { useEffect, useState } from 'react'

interface FloatingBubbleProps {
  personaName: string
  badgeColor: string
  content: string
  action?: string
  isStreaming: boolean
  position: { x: number; y: number }
  onDismiss?: () => void
}

export default function FloatingBubble({
  personaName,
  badgeColor,
  content,
  isStreaming,
  position,
  onDismiss,
}: FloatingBubbleProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!isStreaming && content) {
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [isStreaming, content, onDismiss])

  if (!visible) return null

  const onLeft = position.x < 50

  return (
    <div
      className="absolute z-[5] transition-all duration-200 ease-out"
      style={{
        left: onLeft ? `${position.x + 2}%` : undefined,
        right: onLeft ? undefined : `${100 - position.x + 2}%`,
        top: `${position.y}%`,
        transform: 'translateY(-50%)',
      }}
    >
      <div className="max-w-[240px] sdv-bubble px-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <p
          className="text-xs font-bold mb-1"
          style={{ color: badgeColor }}
        >
          {personaName}
        </p>

        <p className="text-sm text-foreground leading-relaxed">
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-3.5 bg-wood ml-0.5 animate-pulse" />
          )}
        </p>
      </div>
    </div>
  )
}
