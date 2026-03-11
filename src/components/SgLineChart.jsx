function formatDateLabel(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })
}

export default function SgLineChart({ data, slopes, styles }) {
  const width = 360
  const height = 220
  const padding = { top: 20, right: 16, bottom: 32, left: 42 }

  const series = [
    { key: "total", label: "Total", color: "#111827" },
    { key: "tee", label: "Tee", color: "#2563eb" },
    { key: "approach", label: "Approach", color: "#16a34a" },
    { key: "shortGame", label: "Short game", color: "#f59e0b" },
    { key: "putting", label: "Putting", color: "#7c3aed" },
  ]

  if (!data || data.length === 0) {
    return (
      <div style={styles.sectionCard}>
        <h2 style={styles.sectionTitle}>Strokes Gained Over Time</h2>
        <p style={styles.mutedText}>No rounds found for this filter.</p>
      </div>
    )
  }

  const allValues = data.flatMap((row) =>
    series.map((s) => Number(row[s.key] ?? 0))
  )

  const rawMin = Math.min(...allValues, 0)
  const rawMax = Math.max(...allValues, 0)

  const minY = Math.floor((rawMin - 0.2) * 2) / 2
  const maxY = Math.ceil((rawMax + 0.2) * 2) / 2
  const yRange = maxY - minY || 1

  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const xForIndex = (i) =>
    padding.left + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth)

  const yForValue = (v) =>
    padding.top + ((maxY - v) / yRange) * plotHeight

  const ticks = [minY, (minY + maxY) / 2, maxY]

  return (
    <div style={styles.sectionCard}>
      <h2 style={styles.sectionTitle}>Strokes Gained Over Time</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        {series.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: s.color,
                display: "inline-block",
              }}
            />
            <span>{s.label} ({slopes ? slopes[s.key].toFixed(3) : "0.000"})</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {ticks.map((tick) => {
          const y = yForValue(tick)
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text x={8} y={y + 4} fontSize="11" fill="#6b7280">
                {tick.toFixed(1)}
              </text>
            </g>
          )
        })}

        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#9ca3af"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#9ca3af"
        />

        {series.map((s) => {
          const points = data
            .map((row, i) => `${xForIndex(i)},${yForValue(Number(row[s.key] ?? 0))}`)
            .join(" ")

          return (
            <g key={s.key}>
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                points={points}
              />
              {data.map((row, i) => (
                <circle
                  key={`${s.key}-${row.round_id}`}
                  cx={xForIndex(i)}
                  cy={yForValue(Number(row[s.key] ?? 0))}
                  r="2.7"
                  fill={s.color}
                />
              ))}
            </g>
          )
        })}

        {data.map((row, i) => (
          <text
            key={row.round_id}
            x={xForIndex(i)}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {formatDateLabel(row.date)}
          </text>
        ))}
      </svg>
    </div>
  )
}