function createEmptySgSummary() {
  return {
    total: 0,
    tee: 0,
    approachFairway: 0,
    approachRough: 0,
    approachSand: 0,
    shortGameFairway: 0,
    shortGameRough: 0,
    shortGameSand: 0,
    recovery: 0,
    green: 0,
  }
}

function addShotToDetailedSummary(acc, shot) {
  const sg = Number(shot.strokes_gained)
  if (!Number.isFinite(sg)) return acc

  acc.total += sg

  if (shot.sg_category === "Tee") acc.tee += sg
  if (shot.sg_category === "Approach + Fairway") acc.approachFairway += sg
  if (shot.sg_category === "Approach + Rough") acc.approachRough += sg
  if (shot.sg_category === "Approach + Sand") acc.approachSand += sg
  if (shot.sg_category === "Short Game + Fairway") acc.shortGameFairway += sg
  if (shot.sg_category === "Short Game + Rough") acc.shortGameRough += sg
  if (shot.sg_category === "Short Game + Sand") acc.shortGameSand += sg
  if (shot.sg_category === "Recovery") acc.recovery += sg
  if (shot.sg_category === "Putting") acc.green += sg

  return acc
}

function summarizeShotsForRound(shots) {
  return shots.reduce(addShotToDetailedSummary, createEmptySgSummary())
}

function calculateSlope(values) {
  const points = values
    .map((y, x) => ({ x, y }))
    .filter((p) => Number.isFinite(p.y))

  if (points.length < 2) return null

  const n = points.length
  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0)

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return null

  return (n * sumXY - sumX * sumY) / denominator
}

function calculateSlopes(data, keys) {
  const result = {}
  for (const key of keys) {
    result[key] = calculateSlope(data.map((row) => row[key]))
  }
  return result
}

export function buildSgTimeline(rounds = [], shots = []) {
  const shotsByRound = {}

  for (const shot of shots) {
    if (!shotsByRound[shot.round_id]) shotsByRound[shot.round_id] = []
    shotsByRound[shot.round_id].push(shot)
  }

  const timeline = rounds
    .map((round) => {
      const roundShots = (shotsByRound[round.id] || []).filter((shot) =>
        Number.isFinite(Number(shot.strokes_gained))
      )

      if (roundShots.length === 0) return null

      const summary = summarizeShotsForRound(roundShots)

      return {
        round_id: round.id,
        date: round.date,
        course: round.course,
        tee: summary.tee,
        approachFairway: summary.approachFairway,
        approachRough: summary.approachRough,
        approachSand: summary.approachSand,
        shortGameFairway: summary.shortGameFairway,
        shortGameRough: summary.shortGameRough,
        shortGameSand: summary.shortGameSand,
        recovery: summary.recovery,
        green: summary.green,
        total: summary.total,
      }
    })
    .filter(Boolean)

  const slopes = calculateSlopes(timeline, [
    "tee",
    "approachFairway",
    "approachRough",
    "approachSand",
    "shortGameFairway",
    "shortGameRough",
    "shortGameSand",
    "recovery",
    "green",
    "total",
  ])

  return { timeline, slopes }
}

export function buildAccuracyTimeline(rounds = [], holes = []) {
  const holesByRound = {}

  for (const hole of holes) {
    if (!holesByRound[hole.round_id]) holesByRound[hole.round_id] = []
    holesByRound[hole.round_id].push(hole)
  }

  return rounds.map((round) => {
    const roundHoles = (holesByRound[round.id] || []).filter((h) => !h.skipped)

    const fairwayEligible = roundHoles.filter((h) => Number(h.par) > 3)
    const fairwayHits = fairwayEligible.filter((h) => h.fairway === true).length
    const fairwayPct =
      fairwayEligible.length > 0 ? (fairwayHits / fairwayEligible.length) * 100 : null

    const girEligible = roundHoles.filter((h) => Number.isFinite(Number(h.par)))
    const girHits = girEligible.filter((h) => h.gir === true).length
    const girPct =
      girEligible.length > 0 ? (girHits / girEligible.length) * 100 : null

    return {
      round_id: round.id,
      date: round.date,
      course: round.course,
      fairwayPct,
      girPct,
    }
  })
}

export function buildPuttsTimeline(rounds = [], holes = []) {
  const holesByRound = {}

  for (const hole of holes) {
    if (!holesByRound[hole.round_id]) holesByRound[hole.round_id] = []
    holesByRound[hole.round_id].push(hole)
  }

  return rounds.map((round) => {
    const roundHoles = (holesByRound[round.id] || []).filter((h) => !h.skipped)
    const puttValues = roundHoles
      .map((h) => Number(h.putts))
      .filter((v) => Number.isFinite(v))

    const avgPutts =
      puttValues.length > 0
        ? puttValues.reduce((sum, v) => sum + v, 0) / puttValues.length
        : null

    return {
      round_id: round.id,
      date: round.date,
      course: round.course,
      avgPutts,
    }
  })
}

function createEmptyMissPatternCounts() {
  return {
    long_left: 0,
    long: 0,
    long_right: 0,
    left: 0,
    spot_on: 0,
    right: 0,
    short_left: 0,
    short: 0,
    short_right: 0,
  }
}

export function buildMissPatternByCategoryFromShots(shots) {
  const grouped = {
    "Tee": createEmptyMissPatternCounts(),
    "Approach + Fairway": createEmptyMissPatternCounts(),
    "Approach + Rough": createEmptyMissPatternCounts(),
    "Approach + Sand": createEmptyMissPatternCounts(),
    "Short Game + Fairway": createEmptyMissPatternCounts(),
    "Short Game + Rough": createEmptyMissPatternCounts(),
    "Short Game + Sand": createEmptyMissPatternCounts(),
    "Recovery": createEmptyMissPatternCounts(),
    "Putting": createEmptyMissPatternCounts(),
  }

  for (const shot of shots) {
    if (
      shot.sg_category &&
      grouped[shot.sg_category] &&
      shot.miss_pattern &&
      grouped[shot.sg_category][shot.miss_pattern] !== undefined
    ) {
      grouped[shot.sg_category][shot.miss_pattern] += 1
    }
  }

  return grouped
}

