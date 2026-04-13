function getPoints(data = [], width, height, padding) {
  if (!Array.isArray(data) || data.length === 0) return ""

  const values = data
    .map((item) => Number(item.total))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) return ""

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  return data
    .map((item, index) => {
      const value = Number(item.total)
      if (!Number.isFinite(value)) return null

      const x =
        data.length === 1
          ? width / 2
          : padding + (index / (data.length - 1)) * innerWidth
      const y = padding + ((max - value) / range) * innerHeight
      return `${x},${y}`
    })
    .filter(Boolean)
    .join(" ")
}

export default function HomeTrendSparkline({ data = [], styles }) {
  const width = 340
  const height = 76
  const padding = 6
  const points = getPoints(data, width, height, padding)

  if (!points) {
    return (
      <div style={styles.headerSparklinePlaceholder}>
        Play a few rounds to build your SG line.
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-label="Total strokes gained trend"
    >
      <polyline
        fill="none"
        stroke="#111827"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
