'use client'

import { Persona } from '@/types'
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip'

interface CharacterBadgeProps {
  persona: Persona
  isTyping: boolean
  isSpeaking: boolean
  onClick: () => void
}

export default function CharacterBadge({
  persona,
  isTyping,
  isSpeaking,
  onClick,
}: CharacterBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className="relative group cursor-pointer"
      >
        <div
          className="px-2 py-1 flex items-center justify-center text-white text-sm font-bold sdv-badge transition-transform group-hover:scale-110"
          style={{ backgroundColor: persona.badgeColor }}
        >
          {persona.name}
        </div>

        {isTyping && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-leaf animate-pulse border border-white" />
        )}

        {isSpeaking && (
          <div
            className="absolute inset-0 animate-ping opacity-30 rounded-sm"
            style={{ backgroundColor: persona.badgeColor }}
          />
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-medium">{persona.name}</p>
        <p className="opacity-70">{persona.identity.occupation}</p>
      </TooltipContent>
    </Tooltip>
  )
}
