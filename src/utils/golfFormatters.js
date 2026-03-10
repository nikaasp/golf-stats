export function formatDistance(value) {
  return `${Number(value).toFixed(1)} m`
}

export function formatToPar(score, par) {
  if (score == null || par == null) return "-"
  const diff = score - par
  if (diff > 0) return `+${diff}`
  return `${diff}`
}

export function scoreLabel(score, par) {
  if (score == null || par == null) return "-"
  const diff = score - par
  if (diff <= -2) return "Eagle+"
  if (diff === -1) return "Birdie"
  if (diff === 0) return "Par"
  if (diff === 1) return "Bogey"
  return "Double+"
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}