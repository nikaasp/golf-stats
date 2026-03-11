export function calculateSlope(values) {
  if (!values || values.length < 2) return 0

  const n = values.length
  const xs = values.map((_, i) => i)
  const ys = values

  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0)
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = n * sumX2 - sumX * sumX

  if (denominator === 0) return 0

  return numerator / denominator
}