function createEmptySgSummary() {
  return {
    total: { value: 0, count: 0 },
    tee: { value: 0, count: 0 },
    approachFairway: { value: 0, count: 0 },
    approachRough: { value: 0, count: 0 },
    approachSand: { value: 0, count: 0 },
    shortGameFairway: { value: 0, count: 0 },
    shortGameRough: { value: 0, count: 0 },
    shortGameSand: { value: 0, count: 0 },
    recovery: { value: 0, count: 0 },
    green: { value: 0, count: 0 },
  }
}

function addValue(bucket, sg) {
  bucket.value += sg
  bucket.count += 1
}

function addShotToDetailedSummary(acc, shot) {
  const sg = Number(shot.strokes_gained)
  if (!Number.isFinite(sg)) return acc

  addValue(acc.total, sg)

  if (shot.sg_category === "Tee") addValue(acc.tee, sg)
  if (shot.sg_category === "Approach + Fairway") addValue(acc.approachFairway, sg)
  if (shot.sg_category === "Approach + Rough") addValue(acc.approachRough, sg)
  if (shot.sg_category === "Approach + Sand") addValue(acc.approachSand, sg)
  if (shot.sg_category === "Short Game + Fairway") addValue(acc.shortGameFairway, sg)
  if (shot.sg_category === "Short Game + Rough") addValue(acc.shortGameRough, sg)
  if (shot.sg_category === "Short Game + Sand") addValue(acc.shortGameSand, sg)
  if (shot.sg_category === "Recovery") addValue(acc.recovery, sg)
  if (shot.sg_category === "On green" || shot.sg_category === "Putting") {
    addValue(acc.green, sg)
  }

  return acc
}

function summarizeShotsForRound(shots) {
  return shots.reduce(addShotToDetailedSummary, createEmptySgSummary())
}

function finalizeBucket(bucket, alwaysKeep = false) {
  if (!bucket || typeof bucket !== "object") return alwaysKeep ? 0 : null
  if (bucket.count === 0) return alwaysKeep ? 0 : null
  return Number(bucket.value.toFixed(3))
}

function finalizeRoundSummary(summary) {
  return {
    total: finalizeBucket(summary.total, true),
    tee: finalizeBucket(summary.tee),
    approachFairway: finalizeBucket(summary.approachFairway),
    approachRough: finalizeBucket(summary.approachRough),
    approachSand: finalizeBucket(summary.approachSand),
    shortGameFairway: finalizeBucket(summary.shortGameFairway),
    shortGameRough: finalizeBucket(summary.shortGameRough),
    shortGameSand: finalizeBucket(summary.shortGameSand),
    recovery: finalizeBucket(summary.recovery),
    green: finalizeBucket(summary.green),
  }
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

function sortRoundsChronologically(rounds = []) {
  return [...rounds].sort((a, b) => {
    const dateA = String(a?.date || "")
    const dateB = String(b?.date || "")

    if (dateA !== dateB) return dateA.localeCompare(dateB)

    return String(a?.id || "").localeCompare(String(b?.id || ""))
  })
}

export function buildSgTimeline(rounds = [], shots = []) {
  const shotsByRound = {}

  for (const shot of shots) {
    if (!shotsByRound[shot.round_id]) shotsByRound[shot.round_id] = []
    shotsByRound[shot.round_id].push(shot)
  }

  const timeline = sortRoundsChronologically(rounds)
    .map((round) => {
      const roundShots = (shotsByRound[round.id] || []).filter((shot) =>
        Number.isFinite(Number(shot.strokes_gained))
      )

      if (roundShots.length === 0) return null

      const rawSummary = summarizeShotsForRound(roundShots)
      const summary = finalizeRoundSummary(rawSummary)

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

  return sortRoundsChronologically(rounds).map((round) => {
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

  return sortRoundsChronologically(rounds).map((round) => {
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

export function buildMissPatternByCategoryFromShots(shots = []) {
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
    "On green": createEmptyMissPatternCounts(),
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

export function buildScoringTimeline(rounds = [], holes = []) {
  const holesByRound = {}

  for (const hole of holes) {
    if (!holesByRound[hole.round_id]) holesByRound[hole.round_id] = []
    holesByRound[hole.round_id].push(hole)
  }

  return sortRoundsChronologically(rounds).map((round) => {
    const roundHoles = (holesByRound[round.id] || []).filter((h) => !h.skipped)
    let penaltyStrokes = 0
    let penaltyHoles = 0
    let onePuttHoles = 0
    let threePuttHoles = 0
    let scrambleOpp = 0
    let scrambleSuccess = 0
    let upDownOpp = 0
    let upDownSuccess = 0

    for (const hole of roundHoles) {
      const penalty = Number(hole.penalty || 0)
      const putts = Number(hole.putts)
      const par = Number(hole.par)
      const score = Number(hole.score)
      penaltyStrokes += penalty
      if (penalty > 0) penaltyHoles += 1
      if (putts === 1) onePuttHoles += 1
      if (putts >= 3) threePuttHoles += 1

      if (Number.isFinite(par) && hole.gir === false) {
        scrambleOpp += 1
        upDownOpp += 1
        if (Number.isFinite(score) && score <= par) scrambleSuccess += 1
        if (Number.isFinite(putts) && putts <= 1) upDownSuccess += 1
      }
    }

    const pct = (hits, opps) => (opps > 0 ? (hits / opps) * 100 : null)

    return {
      round_id: round.id,
      date: round.date,
      course: round.course,
      penaltyStrokes,
      penaltyHoles,
      onePuttPct: pct(onePuttHoles, roundHoles.length),
      threePuttPct: pct(threePuttHoles, roundHoles.length),
      scramblePct: pct(scrambleSuccess, scrambleOpp),
      upDownPct: pct(upDownSuccess, upDownOpp),
    }
  })
}

export function buildApproachProximityBandSummary(shots = []) {
  const shotsByRoundAndHole = {}
  const bands = {
    "50-100": [],
    "100-150": [],
    "150-200": [],
    "200+": [],
  }

  for (const shot of shots) {
    if (!shotsByRoundAndHole[shot.round_id]) shotsByRoundAndHole[shot.round_id] = {}
    if (!shotsByRoundAndHole[shot.round_id][shot.hole_number]) {
      shotsByRoundAndHole[shot.round_id][shot.hole_number] = []
    }
    shotsByRoundAndHole[shot.round_id][shot.hole_number].push(shot)
  }

  for (const holeGroups of Object.values(shotsByRoundAndHole)) {
    for (const holeShots of Object.values(holeGroups)) {
      const sorted = [...holeShots].sort((a, b) => Number(a.shot_number) - Number(b.shot_number))
      const firstPuttIndex = sorted.findIndex((shot) => shot.lie === "Green")
      if (firstPuttIndex <= 0) continue

      const approachShot = sorted[firstPuttIndex - 1]
      const firstPutt = sorted[firstPuttIndex]
      const startDistance = Number(approachShot?.distance_to_flag)
      const endDistance = Number(firstPutt?.distance_to_flag)

      if (!Number.isFinite(startDistance) || !Number.isFinite(endDistance)) continue
      if (startDistance >= 50 && startDistance < 100) bands["50-100"].push(endDistance)
      if (startDistance >= 100 && startDistance < 150) bands["100-150"].push(endDistance)
      if (startDistance >= 150 && startDistance < 200) bands["150-200"].push(endDistance)
      if (startDistance >= 200) bands["200+"].push(endDistance)
    }
  }

  return Object.entries(bands).map(([band, values]) => ({
    band,
    count: values.length,
    avgProximity:
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
  }))
}

export function buildFirstPuttDistanceTimeline(rounds = [], shots = []) {
  const shotsByRoundAndHole = {}

  for (const shot of shots) {
    if (!shotsByRoundAndHole[shot.round_id]) shotsByRoundAndHole[shot.round_id] = {}
    if (!shotsByRoundAndHole[shot.round_id][shot.hole_number]) {
      shotsByRoundAndHole[shot.round_id][shot.hole_number] = []
    }
    shotsByRoundAndHole[shot.round_id][shot.hole_number].push(shot)
  }

  return sortRoundsChronologically(rounds).map((round) => {
    const holeGroups = shotsByRoundAndHole[round.id] || {}
    const firstPuttDistances = Object.values(holeGroups)
      .map((holeShots) => {
        const firstPutt = [...holeShots]
          .sort((a, b) => Number(a.shot_number) - Number(b.shot_number))
          .find((shot) => shot.lie === "Green")

        const distance = Number(firstPutt?.distance_to_flag)
        return Number.isFinite(distance) ? distance : null
      })
      .filter((distance) => distance !== null)

    const avgFirstPuttDistance =
      firstPuttDistances.length > 0
        ? firstPuttDistances.reduce((sum, value) => sum + value, 0) /
          firstPuttDistances.length
        : null

    return {
      round_id: round.id,
      date: round.date,
      course: round.course,
      avgFirstPuttDistance,
      firstPuttHoleCount: firstPuttDistances.length,
    }
  })
}

export function buildRoundHoleStats(holes = [], shots = []) {
  const shotsByHole = {}

  for (const shot of shots) {
    if (!shotsByHole[shot.hole_number]) shotsByHole[shot.hole_number] = []
    shotsByHole[shot.hole_number].push(shot)
  }

  return [...holes]
    .filter((hole) => !hole.skipped)
    .sort((a, b) => Number(a.hole_number) - Number(b.hole_number))
    .map((hole) => {
      const holeShots = (shotsByHole[hole.hole_number] || []).sort(
        (a, b) => Number(a.shot_number) - Number(b.shot_number)
      )

      const totalSg = holeShots.reduce((sum, shot) => {
        const value = Number(shot.strokes_gained)
        return Number.isFinite(value) ? sum + value : sum
      }, 0)

      const firstPutt = holeShots.find((shot) => shot.lie === "Green")
      const firstPuttDistance = Number(firstPutt?.distance_to_flag)
      const missCount = holeShots.filter((shot) => shot.miss_pattern).length
      const penalty = Number(hole.penalty || 0)
      const putts = Number(hole.putts)
      const par = Number(hole.par)
      const score = Number(hole.score)
      const gir = hole.gir === true ? 1 : hole.gir === false ? 0 : null
      const scrambleOpportunity = gir === 0 && Number.isFinite(par)
      const scramble = scrambleOpportunity && Number.isFinite(score) && score <= par ? 1 : null
      const upDown =
        scrambleOpportunity && Number.isFinite(putts) && putts <= 1 ? 1 : null

      return {
        hole: Number(hole.hole_number),
        score: Number.isFinite(Number(hole.score)) ? Number(hole.score) : null,
        par: Number.isFinite(Number(hole.par)) ? Number(hole.par) : null,
        toPar:
          Number.isFinite(Number(hole.score)) && Number.isFinite(Number(hole.par))
            ? Number(hole.score) - Number(hole.par)
            : null,
        totalSg: Number(totalSg.toFixed(3)),
        putts: Number.isFinite(Number(hole.putts)) ? Number(hole.putts) : null,
        firstPuttDistance: Number.isFinite(firstPuttDistance)
          ? firstPuttDistance
          : null,
        firstPuttOnGir:
          gir === 1 && Number.isFinite(firstPuttDistance) ? firstPuttDistance : null,
        penalty,
        penaltyHole: penalty > 0 ? 1 : 0,
        onePutt: Number.isFinite(putts) && putts === 1 ? 1 : 0,
        threePutt: Number.isFinite(putts) && putts >= 3 ? 1 : 0,
        scramble,
        upDown,
        fairway:
          Number(hole.par) > 3 && hole.fairway !== null
            ? hole.fairway === true
              ? 1
              : 0
            : null,
        gir,
        missCount,
      }
    })
}
