import { useMemo, useState } from "react"

function formatDateLabel(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })
}

function formatSlope(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return "0.000"
  return numericValue.toFixed(3)
}

const SERIES = [
  { key: "total", label: "Total", color: "#111827", locked: true },
  { key: "tee", label: "Off the tee", color: "#2563eb" },
  { key: "approachFairway", label: "App (FW)", color: "#16a34a" },
  { key: "approachRough", label: "App (RGH)", color: "#22c55e" },
  { key: "approachSand", label: "App (SND)", color: "#84cc16" },
  { key: "shortGameFairway", label: "SG (FW)", color: "#f59e0b" },
  { key: "shortGameRough", label: "SG (RGH)", color: "#f97316" },
  { key: "shortGameSand", label: "SG (SND)", color: "#ea580c" },
  { key: "recovery", label: "Recovery", color: "#ef4444" },
  { key: "green", label: "On green", color: "#7c3aed" },
]

export default function SgLineChart({ data, slopes, styles }) {
  const width = 360
  const height = 240
  const padding = { top: 20, right: 16, bottom: 32, left: 42 }

  const [visibleKeys, setVisibleKeys] = useState(() =>
    new Set(SERIES.map((s) => s.key))
  )

  const visibleSeries = useMemo(
    () => SERIES.filter((s) => visibleKeys.has(s.key)),
    [visibleKeys]
  )

  const nonLockedVisibleCount = SERIES.filter(
    (s) => !s.locked && visibleKeys.has(s.key)
  ).length

  const toggleSeries = (key, locked = false) => {
    if (locked) return

    setVisibleKeys((prev) => {
      const next = new Set(prev)

      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }

      next.add("total")
      return next
    })
  }

  const showAll = () => {
    setVisibleKeys(new Set(SERIES.map((s) => s.key)))
  }

  const showOnlyTotal = () => {
    setVisibleKeys(new Set(["total"]))
  }

  if (!data || data.length === 0) {
    return (
      <div style={styles.sectionCard}>
        <h2 style={styles.sectionTitle}>Strokes Gained Over Time</h2>
        <p style={styles.mutedText}>No rounds found for this filter.</p>
      </div>
    )
  }

  const allValues = data.flatMap((row) =>
    visibleSeries.map((s) => Number(row[s.key] ?? 0))
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          type="button"
          style={styles.secondaryAction || styles.primaryButton}
          onClick={showAll}
        >
          Show all
        </button>

        <button
          type="button"
          style={styles.secondaryAction || styles.primaryButton}
          onClick={showOnlyTotal}
          disabled={nonLockedVisibleCount === 0}
        >
          Only total
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {SERIES.map((s) => {
          const active = visibleKeys.has(s.key)

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key, s.locked)}
              disabled={s.locked}
              title={s.locked ? "Total is always shown" : `Toggle ${s.label}`}
              style={{
                border: `1px solid ${s.color}`,
                background: active ? s.color : "#fff",
                color: active ? "#fff" : s.color,
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: s.locked ? "default" : "pointer",
                opacity: s.locked ? 0.95 : 1,
              }}
            >
              {s.label} ({formatSlope(slopes?.[s.key])})
            </button>
          )
        })}
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

        {visibleSeries.map((s) => {
          const points = data
            .map((row, i) => `${xForIndex(i)},${yForValue(Number(row[s.key] ?? 0))}`)
            .join(" ")

          return (
            <g key={s.key}>
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth={s.key === "total" ? "2.8" : "2.2"}
                points={points}
              />
              {data.map((row, i) => (
                <circle
                  key={`${s.key}-${row.round_id || row.date || i}`}
                  cx={xForIndex(i)}
                  cy={yForValue(Number(row[s.key] ?? 0))}
                  r={s.key === "total" ? "2.8" : "2.3"}
                  fill={s.color}
                />
              ))}
            </g>
          )
        })}

        {data.map((row, i) => (
          <text
            key={row.round_id || `${row.date}-${i}`}
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