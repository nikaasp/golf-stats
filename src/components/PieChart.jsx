export default function PieChart({ title, data, styles }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>{title}</div>
        <div style={styles.noData}>No data</div>
      </div>
    )
  }

  let current = 0
  const gradientStops = data
    .map((d) => {
      const start = current
      const end = current + (d.value / total) * 100
      current = end
      return `${d.color} ${start}% ${end}%`
    })
    .join(", ")

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartTitle}>{title}</div>
      <div style={styles.chartWrap}>
        <div
          style={{
            ...styles.pie,
            background: `conic-gradient(${gradientStops})`,
          }}
        />
        <div style={styles.legend}>
          {data.map((d) => {
            const pct = ((d.value / total) * 100).toFixed(1)
            return (
              <div key={d.label} style={styles.legendRow}>
                <span style={{ ...styles.legendSwatch, background: d.color }} />
                <span style={styles.legendText}>
                  {d.label}: {pct}% ({d.value})
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}