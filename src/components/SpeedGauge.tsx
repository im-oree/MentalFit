interface SpeedGaugeProps {
  speed: number
  maxSpeed?: number
  size?: number
}

export function SpeedGauge({ speed, maxSpeed = 20, size = 120 }: SpeedGaugeProps) {
  const r = (size - 12) / 2
  const cx = size / 2
  const cy = size / 2
  const startAngle = 135
  const endAngle = 405
  const totalArc = endAngle - startAngle

  const clampedSpeed = Math.min(speed, maxSpeed)
  const fraction = clampedSpeed / maxSpeed
  const activeAngle = startAngle + fraction * totalArc

  const toXY = (angle: number) => {
    const rad = (angle * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  }

  const arcPath = (from: number, to: number) => {
    const [sx, sy] = toXY(from)
    const [ex, ey] = toXY(to)
    const largeArc = to - from > 180 ? 1 : 0
    return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {fraction > 0.01 && (
          <path
            d={arcPath(startAngle, activeAngle)}
            fill="none"
            stroke="#d9c395"
            strokeWidth={6}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black tabular-nums tracking-[-0.04em] text-white">
          {speed.toFixed(1)}
        </span>
        <span className="text-[8px] font-black uppercase tracking-[.18em] text-white/40">km/h</span>
      </div>
    </div>
  )
}
