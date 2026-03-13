import { useMemo, useState, useEffect } from "react"

function formatDateLabel(dateStr, includeYear = false) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    ...(includeYear ? { year: "2-digit" } : {}),
  })
}

function getXAxisLabelIndices(data) {
  const n = data.length
  if (n <= 1) return [0]
  if (n <= 6) return Array.from({ length: n }, (_, i) => i)

  // target roughly 5 labels
  const targetLabels = 5
  const step = Math.ceil((n - 1) / (targetLabels - 1))

  const indices = new Set([0, n - 1])

  for (let i = 0; i < n; i += step) {
    indices.add(i)
  }

  return Array.from(indices).sort((a, b) => a - b)
}

function buildXAxisLabels(data) {
  const labelIndices = new Set(getXAxisLabelIndices(data))
  const seenDates = new Set()

  return data.map((row, i) => {
    if (!labelIndices.has(i)) return ""

    const raw = row?.date || ""
    const basicLabel = formatDateLabel(raw)
    const fullLabel = formatDateLabel(raw, true)

    // If same formatted date appears multiple times among shown ticks,
    // only show it once unless year is needed for distinction.
    if (seenDates.has(basicLabel)) {
      return ""
    }

    seenDates.add(basicLabel)
    return data.length > 12 ? fullLabel : basicLabel
  })
}

function formatSlope(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return "No data"
  return numericValue.toFixed(3)
}

function getFiniteNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function buildPolylineSegments(data, key, xForIndex, yForValue) {
  const segments = []
  let currentSegment = []

  data.forEach((row, i) => {
    const value = getFiniteNumber(row[key])

    if (value === null) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment)
        currentSegment = []
      }
      return
    }

    currentSegment.push(`${xForIndex(i)},${yForValue(value)}`)
  })

  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }

  return segments
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

function seriesHasAnyData(data, key) {
  return data.some((row) => getFiniteNumber(row[key]) !== null)
}

function buildYAxisTicks(minY, maxY) {
  const mid = (minY + maxY) / 2
  const tickSet = new Set([minY, mid, maxY, 0])
  return Array.from(tickSet).sort((a, b) => a - b)
}

export default function SgLineChart({ data, slopes, styles }) {
  const width = 360
  const height = 240
  const padding = { top: 20, right: 16, bottom: 32, left: 42 }

  const availableSeries = useMemo(() => {
    return SERIES.filter((s) => {
      if (s.key === "total") return true
      return seriesHasAnyData(data || [], s.key)
    })
  }, [data])

  const [visibleKeys, setVisibleKeys] = useState(() => new Set(["total"]))

  useEffect(() => {
    setVisibleKeys((prev) => {
      const next = new Set(["total"])
      availableSeries.forEach((s) => {
        if (prev.has(s.key) || s.key === "total") {
          next.add(s.key)
        }
      })
      return next
    })
  }, [availableSeries])

  if (!data || data.length === 0) {
    return (
      <div style={styles.sectionCard}>
        <h2 style={styles.sectionTitle}>Strokes Gained Over Time</h2>
        <p style={styles.mutedText}>No rounds found for this filter.</p>
      </div>
    )
  }

  const visibleSeries = availableSeries.filter((s) => visibleKeys.has(s.key))

  const nonLockedAvailableCount = availableSeries.filter((s) => !s.locked).length
  const nonLockedVisibleCount = visibleSeries.filter((s) => !s.locked).length

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
    setVisibleKeys(new Set(availableSeries.map((s) => s.key)))
  }

  const showOnlyTotal = () => {
    setVisibleKeys(new Set(["total"]))
  }

  const allValues = data.flatMap((row) =>
    visibleSeries
      .map((s) => getFiniteNumber(row[s.key]))
      .filter((v) => v !== null)
  )

  if (allValues.length === 0) {
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

        <p style={styles.mutedText}>
          No strokes gained data available for the visible categories.
        </p>
      </div>
    )
  }

  const rawMin = Math.min(...allValues, 0)
  const rawMax = Math.max(...allValues, 0)

  const range = rawMax - rawMin
  const paddingAmount = range === 0 ? 0.5 : Math.max(0.2, range * 0.15)

  const minY = Math.floor((rawMin - paddingAmount) * 2) / 2
  const maxY = Math.ceil((rawMax + paddingAmount) * 2) / 2
  const yRange = maxY - minY || 1

  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const xForIndex = (i) =>
    padding.left + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth)

  const yForValue = (v) => padding.top + ((maxY - v) / yRange) * plotHeight

  const ticks = buildYAxisTicks(minY, maxY)
  const zeroY = yForValue(0)
  const xAxisLabels = buildXAxisLabels(data)

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
          disabled={nonLockedAvailableCount === 0}
        >
          Only total
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {availableSeries.map((s) => {
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
          const isZero = Math.abs(tick) < 1e-9

          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={isZero ? "#ff3b30" : "#e5e7eb"}
                strokeWidth={isZero ? "1.8" : "1"}
                strokeDasharray={isZero ? "6 6" : undefined}
              />
              <text
                x={8}
                y={y + 4}
                fontSize="11"
                fill={isZero ? "#ff3b30" : "#6b7280"}
                fontWeight={isZero ? 700 : 400}
              >
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

        <line
          x1={padding.left}
          y1={zeroY}
          x2={width - padding.right}
          y2={zeroY}
          stroke="#ff3b30"
          strokeWidth="2"
          strokeDasharray="6 6"
        />

        {visibleSeries.map((s) => {
          const segments = buildPolylineSegments(data, s.key, xForIndex, yForValue)

          if (segments.length === 0) return null

          return (
            <g key={s.key}>
              {segments.map((segment, segmentIndex) => (
                <polyline
                  key={`${s.key}-segment-${segmentIndex}`}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.key === "total" ? "2.8" : "2.2"}
                  points={segment.join(" ")}
                />
              ))}
              {data.map((row, i) => {
                const label = xAxisLabels[i]
                if (!label) return null

                return (
                  <text
                    key={row.round_id || `${row.date}-${i}`}
                    x={xForIndex(i)}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {label}
                  </text>
                )
              })}
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