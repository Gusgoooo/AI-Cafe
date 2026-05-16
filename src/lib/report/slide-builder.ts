import { ReportData, Persona } from '@/types'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildSlideHTML(
  report: ReportData,
  personas: Persona[],
  meta: { cafeName: string; date: string; duration: number }
): string {
  const personaMap = new Map(personas.map(p => [p.id, p]))

  const coverSlide = `
    <section>
      <h1 style="color: #78350f;">AI Cafe 讨论报告</h1>
      <h3 style="color: #b45309;">&ldquo;${escapeHtml(report.title)}&rdquo;</h3>
      <p style="color: #92400e; font-size: 0.8em;">
        ${personas.length}人 &middot; ${meta.duration}分钟 &middot; ${report.personaSummaries.reduce((s, p) => s + p.messageCount, 0)}条消息<br>
        ${escapeHtml(meta.cafeName)} &middot; ${meta.date}
      </p>
    </section>`

  const participantsSlide = `
    <section>
      <h2 style="color: #78350f;">参与者</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 0.7em;">
        ${report.personaSummaries.map(ps => {
          const p = personaMap.get(ps.personaId)
          return `<div style="background: rgba(255,255,255,0.8); border-radius: 12px; padding: 12px; text-align: left;">
            <strong style="color: ${p?.badgeColor ?? '#333'};">${escapeHtml(ps.name)}</strong>
            <br><span style="color: #666;">${escapeHtml(ps.stance)}</span>
            <br><span style="color: #999; font-size: 0.85em;">${ps.messageCount} 条发言</span>
          </div>`
        }).join('')}
      </div>
    </section>`

  const insightsSlide = `
    <section>
      <h2 style="color: #78350f;">核心洞察</h2>
      <ul style="text-align: left; color: #444; font-size: 0.85em;">
        ${report.keyInsights.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
      </ul>
    </section>`

  const consensusSlide = `
    <section>
      <h2 style="color: #78350f;">共识与分歧</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; text-align: left; font-size: 0.8em;">
        <div>
          <h4 style="color: #16a34a;">共识</h4>
          <ul>${report.consensusPoints.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
        </div>
        <div>
          <h4 style="color: #dc2626;">争议</h4>
          <ul>${report.controversialPoints.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
        </div>
      </div>
    </section>`

  const dynamicsSlide = `
    <section>
      <h2 style="color: #78350f;">群体动力学</h2>
      <div style="text-align: left; font-size: 0.8em; color: #444;">
        <p><strong>联盟：</strong>${report.groupDynamics.alliances.map(([a, b]) => `${escapeHtml(a)} &amp; ${escapeHtml(b)}`).join('、') || '无明显联盟'}</p>
        <p><strong>对抗：</strong>${report.groupDynamics.rivalries.map(([a, b]) => `${escapeHtml(a)} vs ${escapeHtml(b)}`).join('、') || '无明显对抗'}</p>
        <p><strong>意见领袖：</strong>${report.groupDynamics.influencers.map(escapeHtml).join('、') || '无'}</p>
        <p><strong>边缘人：</strong>${report.groupDynamics.outliers.map(escapeHtml).join('、') || '无'}</p>
        <p><strong>群体极化指数：</strong>${report.groupDynamics.polarizationIndex}/100</p>
      </div>
    </section>`

  const personaSlides = report.personaSummaries.map(ps => {
    const p = personaMap.get(ps.personaId)
    return `
    <section>
      <h2 style="color: ${p?.badgeColor ?? '#333'};">${escapeHtml(ps.name)}</h2>
      <div style="text-align: left; font-size: 0.8em; color: #444;">
        <p><strong>立场演变：</strong>${escapeHtml(ps.stanceEvolution)}</p>
        <p><strong>精彩发言：</strong></p>
        <ul>
          ${ps.keyQuotes.map(q => `<li>&ldquo;${escapeHtml(q)}&rdquo;</li>`).join('')}
        </ul>
        ${ps.notableActions.length > 0 ? `<p><strong>行为亮点：</strong>${ps.notableActions.map(escapeHtml).join('、')}</p>` : ''}
      </div>
    </section>`
  })

  const quotesSlide = `
    <section>
      <h2 style="color: #78350f;">精彩语录</h2>
      <div style="text-align: left; font-size: 0.8em;">
        ${report.personaSummaries
          .filter(ps => ps.keyQuotes.length > 0)
          .map(ps => {
            const p = personaMap.get(ps.personaId)
            return `<p style="margin-bottom: 12px;">
              <span style="color: #666;">&ldquo;${escapeHtml(ps.keyQuotes[0])}&rdquo;</span>
              <br><strong style="color: ${p?.badgeColor ?? '#333'};">— ${escapeHtml(ps.name)}</strong>
            </p>`
          }).join('')}
      </div>
    </section>`

  const surprisesSlide = report.surprisingMoments.length > 0 ? `
    <section>
      <h2 style="color: #78350f;">意外发现</h2>
      <ul style="text-align: left; color: #444; font-size: 0.85em;">
        ${report.surprisingMoments.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
      ${report.runningJokes.length > 0 ? `
        <h4 style="color: #78350f; margin-top: 24px;">对话中的梗</h4>
        <ul style="text-align: left; color: #666; font-size: 0.8em;">
          ${report.runningJokes.map(j => `<li>${escapeHtml(j)}</li>`).join('')}
        </ul>
      ` : ''}
    </section>` : ''

  const closingSlide = `
    <section>
      <h2 style="color: #78350f;">Overview</h2>
      <p style="color: #666; font-size: 0.85em; max-width: 600px; margin: 0 auto; line-height: 1.8;">
        ${escapeHtml(report.overview)}
      </p>
      <br>
      <p style="color: #999; font-size: 0.7em;">Generated by AI Cafe</p>
    </section>`

  const slides = [
    coverSlide,
    participantsSlide,
    insightsSlide,
    consensusSlide,
    dynamicsSlide,
    ...personaSlides,
    quotesSlide,
    surprisesSlide,
    closingSlide,
  ].filter(Boolean)

  return slides.join('\n')
}
