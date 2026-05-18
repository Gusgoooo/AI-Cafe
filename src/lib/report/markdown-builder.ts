import { ReportData, Persona } from '@/types'

export function buildReportMarkdown(
  data: ReportData,
  personas: Persona[],
  meta: { cafeName: string; date: string; duration: number }
): string {
  const lines: string[] = []

  lines.push(`# ${data.title}`)
  lines.push('')
  lines.push(`> ${meta.cafeName} · ${meta.date} · ${meta.duration}分钟`)
  lines.push('')

  lines.push(`## 概述`)
  lines.push('')
  lines.push(data.overview)
  lines.push('')

  lines.push(`## 核心洞察`)
  lines.push('')
  for (const insight of data.keyInsights) {
    lines.push(`- ${insight}`)
  }
  lines.push('')

  if (data.consensusPoints.length > 0) {
    lines.push(`## 达成共识`)
    lines.push('')
    for (const point of data.consensusPoints) {
      lines.push(`- ${point}`)
    }
    lines.push('')
  }

  if (data.controversialPoints.length > 0) {
    lines.push(`## 核心争议`)
    lines.push('')
    for (const point of data.controversialPoints) {
      lines.push(`- ${point}`)
    }
    lines.push('')
  }

  lines.push(`## 话题流转`)
  lines.push('')
  for (const flow of data.topicFlow) {
    lines.push(`**${flow.topic}** — ${flow.participants.join('、')}`)
  }
  lines.push('')

  lines.push(`## 参与者分析`)
  lines.push('')
  for (const ps of data.personaSummaries) {
    const persona = personas.find(p => p.id === ps.personaId || p.name === ps.name)
    const occupation = persona?.identity.occupation ?? ''
    lines.push(`### ${ps.name}${occupation ? `（${occupation}）` : ''}`)
    lines.push('')
    lines.push(`**立场：** ${ps.stance}`)
    if (ps.stanceEvolution) {
      lines.push(`**变化：** ${ps.stanceEvolution}`)
    }
    lines.push(`**发言数：** ${ps.messageCount}`)
    lines.push('')
    if (ps.keyQuotes.length > 0) {
      for (const quote of ps.keyQuotes) {
        lines.push(`> "${quote}"`)
      }
      lines.push('')
    }
  }

  lines.push(`## 群体动力学`)
  lines.push('')
  const gd = data.groupDynamics
  if (gd.alliances.length > 0) {
    lines.push(`**同盟：** ${gd.alliances.map(a => a.join(' & ')).join('，')}`)
  }
  if (gd.rivalries.length > 0) {
    lines.push(`**对立：** ${gd.rivalries.map(r => r.join(' vs ')).join('，')}`)
  }
  if (gd.influencers.length > 0) {
    lines.push(`**主导者：** ${gd.influencers.join('、')}`)
  }
  if (gd.outliers.length > 0) {
    lines.push(`**边缘人：** ${gd.outliers.join('、')}`)
  }
  lines.push(`**极化指数：** ${gd.polarizationIndex}/100`)
  lines.push('')

  if (data.surprisingMoments.length > 0) {
    lines.push(`## 意外时刻`)
    lines.push('')
    for (const moment of data.surprisingMoments) {
      lines.push(`- ${moment}`)
    }
    lines.push('')
  }

  if (data.runningJokes.length > 0) {
    lines.push(`## 产生的梗`)
    lines.push('')
    for (const joke of data.runningJokes) {
      lines.push(`- ${joke}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
