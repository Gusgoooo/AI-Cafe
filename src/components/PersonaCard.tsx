'use client'

import { Persona } from '@/types'
import { XIcon } from 'lucide-react'
import RadarChart from './RadarChart'

interface PersonaCardProps {
  persona: Persona
  compact?: boolean
  onClose?: () => void
}

export default function PersonaCard({ persona, compact = false, onClose }: PersonaCardProps) {
  const { identity, hook, radar, consumerDna, friction } = persona

  if (compact) {
    return (
      <div className="sdv-panel w-full h-full flex flex-col">
        {/* 头部 */}
        <div className="sdv-titlebar justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 flex items-center justify-center text-xl border-2 border-wood-dark rounded-md shrink-0"
              style={{ backgroundColor: persona.badgeColor + '30' }}
            >
              {persona.avatar}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-primary-foreground text-sm leading-tight drop-shadow-sm">
                {persona.name}
              </h3>
              <span className="inline-block mt-0.5 px-1.5 py-px text-[9px] font-bold bg-wood-dark text-primary-foreground rounded-sm">
                {identity.occupation}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-primary-foreground/70 shrink-0">{identity.age}岁</span>
        </div>

        {/* 紧凑内容 */}
        <div className="sdv-panel-inner !py-3 !px-4 flex-1 flex flex-col gap-2.5">
          {/* 口头禅 */}
          <p className="text-xs text-foreground italic leading-snug">「{hook.quote}」</p>

          {/* 标签 + 雷达图横排 */}
          <div className="flex items-start gap-3">
            <div className="flex-1 flex flex-wrap gap-1 min-w-0">
              {hook.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-px font-bold rounded-sm border"
                  style={{
                    backgroundColor: persona.badgeColor + '10',
                    color: persona.badgeColor,
                    borderColor: persona.badgeColor + '30',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="shrink-0">
              <RadarChart data={radar} size={72} color={persona.badgeColor} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sdv-panel w-full">
      {/* 头部 */}
      <div className="sdv-titlebar justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 flex items-center justify-center text-2xl border-3 border-wood-dark rounded-md"
            style={{ backgroundColor: persona.badgeColor + '30' }}
          >
            {persona.avatar}
          </div>
          <div>
            <h3 className="font-bold text-primary-foreground text-base leading-tight drop-shadow-sm">
              {persona.name}
              <span className="ml-2 text-xs font-normal text-primary-foreground/70">{identity.age}岁</span>
            </h3>
            <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold bg-wood-dark text-primary-foreground rounded-sm border border-wood-dark">
              {identity.occupation}
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-wood-dark/50 text-primary-foreground/70 hover:text-primary-foreground transition-colors cursor-pointer">
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 展开内容 */}
      <div className="sdv-panel-inner space-y-3 !py-4">
        {/* 雷达图 */}
        <div className="flex justify-center py-1">
          <RadarChart data={radar} size={150} color={persona.badgeColor} />
        </div>

        {/* 口头禅 */}
        <div className="sdv-input px-3 py-2.5">
          <p className="text-sm text-foreground italic">「{hook.quote}」</p>
        </div>

        {/* 背景 */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground mb-1">关于 ta</h4>
          <p className="text-sm text-foreground leading-relaxed">{identity.background}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {identity.education} · {identity.region} · {identity.familyStatus} · {identity.incomeLevel}
          </p>
        </div>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5">
          {hook.tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 font-bold rounded-sm border-2"
              style={{
                backgroundColor: persona.badgeColor + '15',
                color: persona.badgeColor,
                borderColor: persona.badgeColor + '40',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 立场 */}
        <div className="sdv-input px-3 py-2">
          <h4 className="text-xs font-bold text-muted-foreground mb-0.5">态度</h4>
          <p className="text-sm text-foreground font-bold">{persona.state.stance || '待定'}</p>
        </div>

        {/* 消费观 */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground mb-1">花钱这事</h4>
          <p className="text-sm text-foreground">{consumerDna.buyingLogic}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {consumerDna.representativeItems.map(item => (
              <span key={item.name} className="text-xs text-muted-foreground">
                {item.emoji} {item.name}
              </span>
            ))}
          </div>
        </div>

        {/* 雷区 */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground mb-1">别踩的坑</h4>
          <div className="text-sm text-foreground space-y-0.5">
            {friction.howToAnger.slice(0, 3).map(item => (
              <p key={item}>· {item}</p>
            ))}
          </div>
        </div>

        {/* 说话风格 */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground mb-1">怎么说话</h4>
          <p className="text-sm text-foreground">{persona.voice.tone}</p>
        </div>
      </div>
    </div>
  )
}
