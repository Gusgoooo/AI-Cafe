'use client'

import { Persona, Message } from '@/types'
import { ALL_DRIVES, deriveDriveWeights } from '@/lib/vectors/utility-drives'

interface DataPanelProps {
  personas: Persona[]
  messages: Message[]
  messageCount: number
  params: EngineParams
  onParamsChange: (params: EngineParams) => void
}

export interface EngineParams {
  influenceMultiplier: number
  confidenceBoundOffset: number
  delayMultiplier: number
  typingSpeedMultiplier: number
}

export const DEFAULT_ENGINE_PARAMS: EngineParams = {
  influenceMultiplier: 1.0,
  confidenceBoundOffset: 0,
  delayMultiplier: 1.0,
  typingSpeedMultiplier: 1.0,
}

export default function DataPanel({ personas, messages, messageCount, params, onParamsChange }: DataPanelProps) {
  const nonMod = personas.filter(p => p.meta.archetypeId !== 'moderator')

  return (
    <div className="h-full overflow-y-auto px-4 py-2 space-y-6 text-sm">
      {/* Opinion Dynamics */}
      <section>
        <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-3">Opinion Dynamics</h3>
        <div className="space-y-2">
          {nonMod.map(p => (
            <OpinionBar key={p.id} persona={p} />
          ))}
        </div>
      </section>

      {/* Utility Drives */}
      <section>
        <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-3">Utility Drives</h3>
        <div className="space-y-2">
          {nonMod.map(p => (
            <DriveCard key={p.id} persona={p} />
          ))}
        </div>
      </section>

      {/* Persona States */}
      <section>
        <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-3">
          Persona States <span className="text-muted-foreground/60">({messageCount} msgs)</span>
        </h3>
        <div className="space-y-3">
          {nonMod.map(p => (
            <PersonaStateCard key={p.id} persona={p} />
          ))}
        </div>
      </section>

      {/* Params */}
      <section>
        <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wide mb-3">Parameters</h3>
        <div className="space-y-3">
          <ParamSlider
            label="影响力系数"
            value={params.influenceMultiplier}
            min={0} max={3} step={0.1}
            onChange={v => onParamsChange({ ...params, influenceMultiplier: v })}
          />
          <ParamSlider
            label="容忍边界偏移"
            value={params.confidenceBoundOffset}
            min={-0.3} max={0.3} step={0.05}
            onChange={v => onParamsChange({ ...params, confidenceBoundOffset: v })}
          />
          <ParamSlider
            label="消息间隔倍率"
            value={params.delayMultiplier}
            min={0.2} max={3} step={0.1}
            onChange={v => onParamsChange({ ...params, delayMultiplier: v })}
          />
          <ParamSlider
            label="打字速度倍率"
            value={params.typingSpeedMultiplier}
            min={0.3} max={3} step={0.1}
            onChange={v => onParamsChange({ ...params, typingSpeedMultiplier: v })}
          />
        </div>
      </section>
    </div>
  )
}

function DriveCard({ persona }: { persona: Persona }) {
  const weights = deriveDriveWeights(persona)
  const sorted = ALL_DRIVES
    .map(d => ({ ...d, weight: weights[d.id] ?? 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)

  const categoryColors: Record<string, string> = {
    cognitive: '#3b82f6',
    social: '#22c55e',
    expressive: '#f59e0b',
    strategic: '#8b5cf6',
    emotional: '#ef4444',
    identity: '#06b6d4',
  }

  return (
    <div className="flex items-start gap-2">
      <span className="w-14 text-xs font-medium truncate shrink-0" style={{ color: persona.badgeColor }}>
        {persona.name}
      </span>
      <div className="flex flex-wrap gap-1">
        {sorted.map(d => (
          <span
            key={d.id}
            className="text-[9px] px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: categoryColors[d.category] ?? '#666', opacity: 0.6 + d.weight * 0.4 }}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function OpinionBar({ persona }: { persona: Persona }) {
  const value = persona.state.opinionValue ?? 0
  const pct = ((value + 1) / 2) * 100
  const color = value > 0.1 ? '#22c55e' : value < -0.1 ? '#ef4444' : '#a3a3a3'

  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-xs font-medium truncate" style={{ color: persona.badgeColor }}>
        {persona.name}
      </span>
      <div className="flex-1 h-4 bg-muted rounded-sm relative overflow-hidden">
        {/* 中线 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border z-10" />
        {/* 值 */}
        <div
          className="absolute top-0.5 bottom-0.5 rounded-sm transition-all duration-500"
          style={{
            left: value >= 0 ? '50%' : `${pct}%`,
            width: `${Math.abs(value) * 50}%`,
            backgroundColor: color,
            opacity: 0.8,
          }}
        />
      </div>
      <span className="w-10 text-[10px] text-muted-foreground text-right tabular-nums">
        {value.toFixed(2)}
      </span>
    </div>
  )
}

function PersonaStateCard({ persona }: { persona: Persona }) {
  const s = persona.state
  return (
    <div className="p-2 rounded border border-border bg-card/50">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-bold" style={{ color: persona.badgeColor }}>{persona.name}</span>
        <span className="text-[10px] text-muted-foreground">{s.currentMood} ({s.moodIntensity}%)</span>
        <span className="text-[10px] text-muted-foreground ml-auto">静默 {s.consecutiveSilence}</span>
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1">
        <MiniBar label="能量" value={s.energyLevel} />
        <MiniBar label="兴趣" value={s.interestLevel} />
        <MiniBar label="立场" value={s.stanceConfidence} color={persona.badgeColor} />
      </div>
    </div>
  )
}

function MiniBar({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-muted-foreground w-5">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color ?? '#a3a3a3' }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground w-5 text-right">{value}</span>
    </div>
  )
}

function ParamSlider({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-wood"
      />
    </div>
  )
}
