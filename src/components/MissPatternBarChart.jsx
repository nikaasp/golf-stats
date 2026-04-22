import {
  MISS_PATTERN_COLORS,
  MISS_PATTERN_LABELS,
  MISS_PATTERN_ORDER,
} from "../utils/missPatternConfig"

export default function MissPatternBarChart({ title, counts = {}, styles }) {
  const rows = MISS_PATTERN_ORDER.map((key) => ({
    key,
    label: MISS_PATTERN_LABELS[key],
    value: Number(counts[key] || 0),
    color: MISS_PATTERN_COLORS[key],
  })).filter((row) => row.value > 0)

  const total = rows.reduce((sum, row) => sum + row.value, 0)
  const maxValue = Math.max(...rows.map((row) => row.value), 1)

  return (
    <div style={styles.sectionCardCompact}>
      <h2 style={styles.sectionTitle}>{title}</h2>

      {total === 0 ? (
        <p style={styles.mutedText}>No miss pattern data available.</p>
      ) : (
        <div style={styles.barChartRows}>
          {rows.map((row) => {
            const pct = total > 0 ? Math.round((row.value / total) * 100) : 0
            const width = `${Math.max(8, (row.value / maxValue) * 100)}%`

            return (
              <div key={row.key} style={styles.barChartRow}>
                <div style={styles.barChartLabel}>
                  <span>{row.label}</span>
                  <strong>
                    {row.value} | {pct}%
                  </strong>
                </div>
                <div style={styles.barChartTrack}>
                  <div
                    style={{
                      ...styles.barChartFill,
                      width,
                      background: row.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
