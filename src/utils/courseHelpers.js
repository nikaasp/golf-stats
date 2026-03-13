export function buildCourseHoleLengthMap(course) {
  const entries = Array.isArray(course?.hole_pars) ? course.hole_pars : []
  const map = {}

  for (const item of entries) {
    const hole = Number(item?.hole)
    const length = Number(item?.length_m)

    if (Number.isInteger(hole) && hole >= 1 && hole <= 18) {
      map[hole] = Number.isFinite(length) ? length : null
    }
  }

  return map
}

export function mergeHoleLengthsIntoCourse(courseHolePars = [], playedHoles = []) {
  const existing = Array.isArray(courseHolePars) ? [...courseHolePars] : []
  const byHole = new Map()

  for (const item of existing) {
    const hole = Number(item?.hole)
    if (Number.isInteger(hole)) {
      byHole.set(hole, {
        hole,
        par: item?.par ?? null,
        length_m: Number.isFinite(Number(item?.length_m))
          ? Number(item.length_m)
          : null,
      })
    }
  }

  for (const holeData of playedHoles) {
    const hole = Number(holeData?.hole)
    const par = Number(holeData?.par)
    const length = Number(holeData?.length_m)

    if (!Number.isInteger(hole) || hole < 1 || hole > 18) continue

    const current = byHole.get(hole) || {
      hole,
      par: Number.isFinite(par) ? par : null,
      length_m: null,
    }

    if (current.par == null && Number.isFinite(par)) {
      current.par = par
    }

    if (current.length_m == null && Number.isFinite(length)) {
      current.length_m = length
    }

    byHole.set(hole, current)
  }

  return Array.from(byHole.values()).sort((a, b) => a.hole - b.hole)
}