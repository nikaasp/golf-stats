export default function PieChart({ title, data = [], styles }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <div style={styles.chartCardCompact}>
        <div style={styles.chartTitleCompact}>{title}</div>
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
    <div style={styles.chartCardCompact}>
      <div style={styles.chartTitleCompact}>{title}</div>

      <div style={styles.chartWrapCompact}>
        <div
          style={{
            ...styles.pieCompact,
            background: `conic-gradient(${gradientStops})`,
          }}
        />

        <div style={styles.legendCompact}>
          {data.map((d) => {
            const pct = ((d.value / total) * 100).toFixed(0)

            return (
              <div key={d.label} style={styles.legendRowCompact}>
                <span style={{ ...styles.legendSwatch, background: d.color }} />
                <span style={styles.legendTextCompact}>
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