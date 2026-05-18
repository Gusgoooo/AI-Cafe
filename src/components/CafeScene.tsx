'use client'

import { Persona, SeatPosition } from '@/types'
import { cafeScene } from '@/lib/scenes/cafe'
import CharacterBadge from './CharacterBadge'
import FloatingBubble from './FloatingBubble'

interface ActiveBubble {
  personaId: string
  content: string
  action?: string
  isStreaming: boolean
}

interface CafeSceneProps {
  personas: Persona[]
  typingPersonaIds: Set<string>
  speakingPersonaId: string | null
  activeBubbles: ActiveBubble[]
  onBadgeClick: (personaId: string) => void
  onBubbleDismiss: (personaId: string) => void
}

export default function CafeScene({
  personas,
  typingPersonaIds,
  speakingPersonaId,
  activeBubbles,
  onBadgeClick,
  onBubbleDismiss,
}: CafeSceneProps) {
  const seats = cafeScene.ambiance.seatLayout

  function getSeatForPersona(index: number): SeatPosition {
    return seats[index] ?? seats[0]
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${cafeScene.backgroundImage})`,
          imageRendering: 'pixelated',
        }}
      />

      <div className="absolute inset-0 bg-foreground/5" />

      {personas.map((persona, i) => {
        const seat = getSeatForPersona(i)
        const isModerator = persona.meta.archetypeId === 'moderator'
        const isBottomSeat = seat.y >= 65
        const yOffset = (!isModerator && !isBottomSeat) ? -5 : 0
        return (
          <div
            key={persona.id}
            className="absolute"
            style={{
              left: `${seat.x}%`,
              top: `${seat.y + yOffset}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <CharacterBadge
              persona={persona}
              isTyping={typingPersonaIds.has(persona.id)}
              isSpeaking={speakingPersonaId === persona.id}
              onClick={() => onBadgeClick(persona.id)}
            />
          </div>
        )
      })}

      {activeBubbles.map(bubble => {
        const persona = personas.find(p => p.id === bubble.personaId)
        if (!persona) return null
        const idx = personas.indexOf(persona)
        const seat = getSeatForPersona(idx)
        const isMod = persona.meta.archetypeId === 'moderator'
        const isBottom = seat.y >= 65
        const bubbleYOffset = (!isMod && !isBottom) ? -5 : 0

        return (
          <FloatingBubble
            key={bubble.personaId}
            personaName={persona.name}
            badgeColor={persona.badgeColor}
            content={bubble.content}
            action={bubble.action}
            isStreaming={bubble.isStreaming}
            position={{ x: seat.x, y: seat.y + bubbleYOffset }}
            onDismiss={() => onBubbleDismiss(bubble.personaId)}
          />
        )
      })}
    </div>
  )
}
