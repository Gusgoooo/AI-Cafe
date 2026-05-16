'use client'

import { useState } from 'react'
import { Persona } from '@/types'
import PersonaCard from './PersonaCard'
import { Dialog, DialogContent } from './ui/dialog'

interface PersonaPreviewProps {
  personas: Persona[]
  topic: string
  onStart: () => void
  onRegenerate: () => void
  loading?: boolean
}

export default function PersonaPreview({
  personas,
  topic,
  onStart,
  onRegenerate,
  loading = false,
}: PersonaPreviewProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground tracking-wide">
            今日座上客
          </h2>
          <p className="text-muted-foreground text-sm" style={{ marginTop: '12px' }}>
            即将围绕「{topic}」展开讨论
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {personas.map(persona => (
            <div
              key={persona.id}
              className="cursor-pointer transition-transform hover:-translate-y-1 flex"
              onClick={() => setSelectedPersona(persona)}
            >
              <PersonaCard persona={persona} compact />
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="px-6 py-2.5 sdv-input text-sm font-bold text-foreground cursor-pointer disabled:opacity-50 hover:bg-accent transition-colors"
          >
            {loading ? '生成中…' : '换一批'}
          </button>
          <button
            onClick={onStart}
            disabled={loading}
            className="px-8 py-2.5 sdv-button font-bold text-sm cursor-pointer disabled:opacity-50"
          >
            开始畅聊
          </button>
        </div>
      </div>

      <Dialog
        open={!!selectedPersona}
        onOpenChange={open => !open && setSelectedPersona(null)}
      >
        <DialogContent className="max-w-sm p-0 border-none bg-transparent shadow-none [&>button]:hidden">
          {selectedPersona && <PersonaCard persona={selectedPersona} onClose={() => setSelectedPersona(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
