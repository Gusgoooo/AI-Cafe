'use client'

import { PersonaRadar } from '@/types'

interface RadarChartProps {
  data: PersonaRadar
  size?: number
  color?: string
}

const LABELS = ['理性', '感性', '技术', '消费', '社交']
const KEYS: (keyof PersonaRadar)[] = [
  'rationality', 'sensibility', 'techAcceptance', 'spendingImpulse', 'socialActivity'
]

export default function RadarChart({ data, size = 120, color = '#f59e0b' }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38
  const angleStep = (Math.PI * 2) / 5

  function getPoint(index: number, value: number): [number, number] {
    const angle = angleStep * index - Math.PI / 2
    const r = (value / 100) * radius
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }

  const gridLevels = [25, 50, 75, 100]
  const dataPoints = KEYS.map((key, i) => getPoint(i, data[key]))
  const dataPath = dataPoints.map((p, i) => (i === 0 ? 'M' : 'L') + p.join(',')).join(' ') + 'Z'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLevels.map(level => {
        const points = KEYS.map((_, i) => getPoint(i, level))
        const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.join(',')).join(' ') + 'Z'
        return <path key={level} d={path} fill="none" stroke="#e5e7eb" strokeWidth={0.5} />
      })}

      {KEYS.map((_, i) => {
        const [ex, ey] = getPoint(i, 100)
        return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e5e7eb" strokeWidth={0.5} />
      })}

      <path d={dataPath} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5} />

      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={color} />
      ))}

      {KEYS.map((_, i) => {
        const [lx, ly] = getPoint(i, 118)
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground/60"
            style={{ fontSize: size * 0.075 }}
          >
            {LABELS[i]}
          </text>
        )
      })}
    </svg>
  )
}
