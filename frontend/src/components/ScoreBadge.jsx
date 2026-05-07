/* ScoreBadge — circular SVG score ring */
export default function ScoreBadge({ score, size = 80, label }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score))
  const offset = circ - (pct / 100) * circ

  const color = score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="score-ring-wrap">
      <div className="score-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8}/>
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <span className="score-ring-value" style={{ color, fontSize: size < 60 ? 14 : 20 }}>
          {Math.round(pct)}
        </span>
      </div>
      {label && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>}
    </div>
  )
}
