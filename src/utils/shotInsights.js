export const LIE_OPTIONS = ["all", "Tee", "Fairway", "Rough", "Sand", "Recovery", "Green"]
export const STRIKE_OPTIONS = ["all", "poor", "ok", "pure"]

export function finiteNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function average(values = []) {
  const finite = values.filter((value) => Number.isFinite(value))
  if (finite.length === 0) return null
  return finite.reduce((sum, value) => sum + value, 0) / finite.length
}

export function median(values = []) {
  const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
  if (finite.length === 0) return null
  const middle = Math.floor(finite.length / 2)
  return finite.length % 2 === 0
    ? (finite[middle - 1] + finite[middle]) / 2
    : finite[middle]
}

export function formatNumber(value, decimals = 2, suffix = "") {
  if (!Number.isFinite(value)) return "-"
  return `${value.toFixed(decimals)}${suffix}`
}

export function buildShotRows(shots = []) {
  const grouped = {}

  for (const shot of shots) {
    const roundKey = String(shot.round_id)
    const holeKey = String(shot.hole_number)
    if (!grouped[roundKey]) grouped[roundKey] = {}
    if (!grouped[roundKey][holeKey]) grouped[roundKey][holeKey] = []
    grouped[roundKey][holeKey].push(shot)
  }

  const rows = []

  for (const holeGroups of Object.values(grouped)) {
    for (const holeShots of Object.values(holeGroups)) {
      const sorted = [...holeShots].sort((a, b) => Number(a.shot_number) - Number(b.shot_number))
      sorted.forEach((shot, index) => {
        const nextShot = sorted[index + 1] || null
        rows.push({
          ...shot,
          startDistance: finiteNumber(shot.distance_to_flag),
          endDistance: finiteNumber(nextShot?.distance_to_flag),
        })
      })
    }
  }

  return rows
}

export function summarizeShots(shots = []) {
  const sgValues = shots.map((shot) => finiteNumber(shot.strokes_gained)).filter((v) => v !== null)
  const startDistances = shots
    .map((shot) => finiteNumber(shot.startDistance ?? shot.distance_to_flag))
    .filter((v) => v !== null)
  const endDistances = shots
    .map((shot) => finiteNumber(shot.endDistance))
    .filter((v) => v !== null)
  const misses = shots.filter((shot) => shot.miss_pattern).length
  const positiveSg = sgValues.filter((value) => value > 0).length
  const strikeShots = shots.filter((shot) => shot.strike_quality)
  const pureShots = strikeShots.filter((shot) => shot.strike_quality === "pure").length

  return {
    count: shots.length,
    avgSg: average(sgValues),
    medianSg: median(sgValues),
    positivePct: sgValues.length > 0 ? (positiveSg / sgValues.length) * 100 : null,
    avgStartDistance: average(startDistances),
    avgEndDistance: average(endDistances),
    missRate: shots.length > 0 ? (misses / shots.length) * 100 : null,
    strikeRate: shots.length > 0 ? (strikeShots.length / shots.length) * 100 : null,
    pureRate: strikeShots.length > 0 ? (pureShots / strikeShots.length) * 100 : null,
    strikeCount: strikeShots.length,
    missCount: misses,
  }
}

export function countMissPatterns(shots = []) {
  return shots.reduce((acc, shot) => {
    if (shot.miss_pattern) {
      acc[shot.miss_pattern] = Number(acc[shot.miss_pattern] || 0) + 1
    }
    return acc
  }, {})
}

export function getCourseLabel(courses, courseId) {
  if (!courseId || courseId === "all") return "All courses"
  return courses.find((course) => String(course.id) === String(courseId))?.name || "Course"
}

export function getDistanceLabel(filters) {
  const min = filters.minDistance || "0"
  const max = filters.maxDistance || "any"
  return `${min}-${max} m`
}

export function getTopKey(counts = {}) {
  const entries = Object.entries(counts)
  if (entries.length === 0) return null

  return entries.reduce(
    (best, entry) => (entry[1] > best[1] ? entry : best),
    entries[0]
  )[0]
}
