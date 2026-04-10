import { clamp } from "./golfFormatters"

export function getPenaltyFromType(type) {
  if (type === "Hazard") return 1
  if (type === "OB") return 2
  return 0
}

export function getDefaultLieForShot(shotNumber) {
  return shotNumber === 1 ? "Tee" : "Fairway"
}

export function makeShot(shotNumber) {
  return {
    shot_number: shotNumber,
    lie: getDefaultLieForShot(shotNumber),
    distance_to_flag: "",
    miss_pattern: "",
    strike_quality: "",
    penalty_type: "None",
  }
}

export function getValidShots(shots) {
  return shots.filter(
    (s) =>
      s.distance_to_flag !== null &&
      s.distance_to_flag !== "" &&
      Number.isFinite(Number(s.distance_to_flag))
  )
}

export function calculateShotModeTotals(shots) {
  const validShots = getValidShots(shots)
  const shotCount = validShots.length
  const autoPenalty = validShots.reduce(
    (sum, shot) => sum + getPenaltyFromType(shot.penalty_type),
    0
  )

  return {
    shotCount,
    autoPenalty,
    totalScore: shotCount + autoPenalty,
  }
}

export function getShotSgCategory({ shot, shotIndex }) {
  const startDistance = Number(shot.distance_to_flag)
  const lie = shot.lie || ""
  const APPROACH_THRESHOLD = 90

  if (lie === "Green") return "Putting"
  if (shotIndex === 0 && lie === "Tee") return "Tee"
  if (lie === "Recovery") return "Recovery"

  if (!Number.isFinite(startDistance)) return null

  if (startDistance > APPROACH_THRESHOLD) {
    if (lie === "Fairway") return "Approach + Fairway"
    if (lie === "Rough") return "Approach + Rough"
    if (lie === "Sand") return "Approach + Sand"
    if (lie === "Tee") return "Tee"
  }

  if (startDistance <= APPROACH_THRESHOLD) {
    if (lie === "Fairway") return "Short Game + Fairway"
    if (lie === "Rough") return "Short Game + Rough"
    if (lie === "Sand") return "Short Game + Sand"
    if (lie === "Tee") return "Tee"
  }

  return null
}

export function getSgLookupKeyFromCategory(sgCategory) {
  switch (sgCategory) {
    case "Tee":
      return "tee"
    case "Approach + Fairway":
    case "Short Game + Fairway":
      return "fairway"
    case "Approach + Rough":
    case "Short Game + Rough":
      return "rough"
    case "Approach + Sand":
    case "Short Game + Sand":
      return "sand"
    case "Recovery":
      return "recovery"
    case "Putting":
      return "green"
    default:
      return null
  }
}

export function inferHoleValuesFromShots(selectedPar, validShots) {
  const firstPutt = validShots.find((s) => s.lie === "Green")
  const secondShot = validShots[1]

  const fairway =
    selectedPar > 3 && secondShot ? secondShot.lie === "Fairway" : null

  const gir = firstPutt ? firstPutt.shot_number <= selectedPar - 1 : false
  const putts = validShots.filter((s) => s.lie === "Green").length

  return {
    fairway,
    gir,
    putts,
  }
}

export function groupShotsByHole(shots) {
  const grouped = {}
  for (const shot of shots) {
    const key = shot.hole_number
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(shot)
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.shot_number - b.shot_number)
  }
  return grouped
}

export function inferHoleMetrics(hole, holeShots) {
  const par = hole.par ?? null

  if (hole.entry_mode === "score") {
    return {
      fairway: par === 3 ? null : hole.fairway,
      gir: hole.gir,
      putts: hole.putts,
      drivingDistance: null,
      approachAccuracy: null,
    }
  }

  if (hole.entry_mode !== "shot_by_shot") {
    return {
      fairway: null,
      gir: null,
      putts: null,
      drivingDistance: null,
      approachAccuracy: null,
    }
  }

  const shots = [...holeShots].sort((a, b) => a.shot_number - b.shot_number)
  const firstPutt = shots.find((s) => s.lie === "Green")
  const firstPuttIndex = shots.findIndex((s) => s.lie === "Green")

  let fairway = null
  if (par && par > 3 && shots.length >= 2) {
    const secondShot = shots[1]
    fairway = secondShot.lie === "Fairway"
  }

  let gir = null
  if (par && firstPutt) {
    gir = firstPutt.shot_number <= par - 1
  } else if (par) {
    gir = false
  }

  const putts = shots.filter((s) => s.lie === "Green").length

  let drivingDistance = null
  if (
    par &&
    par > 3 &&
    shots.length >= 2 &&
    shots[0].distance_to_flag != null &&
    shots[1].distance_to_flag != null
  ) {
    drivingDistance = clamp(
      Number(shots[0].distance_to_flag) - Number(shots[1].distance_to_flag),
      0,
      650
    )
  }

  let approachAccuracy = null
  if (firstPuttIndex > 0) {
    const approachShot = shots[firstPuttIndex - 1]
    const firstPuttShot = shots[firstPuttIndex]
    if (
      approachShot?.distance_to_flag != null &&
      firstPuttShot?.distance_to_flag != null
    ) {
      approachAccuracy = clamp(
        Number(approachShot.distance_to_flag) - Number(firstPuttShot.distance_to_flag),
        0,
        650
      )
    }
  }

  return {
    fairway,
    gir,
    putts,
    drivingDistance,
    approachAccuracy,
  }
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

function createMissPatternByCategory() {
  return {
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
}

export function buildRoundAnalytics(holes, shots) {
  const playedHoles = holes.filter((h) => !h.skipped)
  const shotsByHole = groupShotsByHole(shots)

  let totalScore = 0
  let totalPar = 0
  let totalPutts = 0

  let girHits = 0
  let girOpp = 0
  let fwHits = 0
  let fwOpp = 0

  let driveValues = []
  let approachValues = []

  let par3Scores = []
  let par4Scores = []
  let par5Scores = []

  const missPatternCounts = createEmptyMissPatternCounts()
  const missPatternByCategory = createMissPatternByCategory()

  const perHole = playedHoles.map((hole) => {
    const holeShots = shotsByHole[hole.hole_number] || []
    const inferred = inferHoleMetrics(hole, holeShots)

    totalScore += hole.score || 0
    totalPar += hole.par || 0
    totalPutts += inferred.putts || 0

    if (hole.par === 3) par3Scores.push(hole.score || 0)
    if (hole.par === 4) par4Scores.push(hole.score || 0)
    if (hole.par === 5) par5Scores.push(hole.score || 0)

    if (inferred.fairway !== null) {
      fwOpp += 1
      if (inferred.fairway) fwHits += 1
    }

    if (inferred.gir !== null) {
      girOpp += 1
      if (inferred.gir) girHits += 1
    }

    if (inferred.drivingDistance !== null) driveValues.push(inferred.drivingDistance)
    if (inferred.approachAccuracy !== null) approachValues.push(inferred.approachAccuracy)

    for (const shot of holeShots) {
      if (shot.miss_pattern && missPatternCounts[shot.miss_pattern] !== undefined) {
        missPatternCounts[shot.miss_pattern] += 1
      }

      if (
        shot.sg_category &&
        missPatternByCategory[shot.sg_category] &&
        shot.miss_pattern &&
        missPatternByCategory[shot.sg_category][shot.miss_pattern] !== undefined
      ) {
        missPatternByCategory[shot.sg_category][shot.miss_pattern] += 1
      }
    }

    return { ...hole, inferred }
  })

  const frontNine = perHole.filter((h) => h.hole_number <= 9)
  const backNine = perHole.filter((h) => h.hole_number >= 10)

  const avg = (arr) =>
    arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : "-"

  return {
    playedCount: perHole.length,
    totalScore,
    totalPar,
    totalPutts,
    fwHits,
    fwMisses: Math.max(0, fwOpp - fwHits),
    fwOpp,
    fwPct: fwOpp > 0 ? ((fwHits / fwOpp) * 100).toFixed(1) : "0.0",
    girHits,
    girMisses: Math.max(0, girOpp - girHits),
    girOpp,
    girPct: girOpp > 0 ? ((girHits / girOpp) * 100).toFixed(1) : "0.0",
    missPatternCounts,
    missPatternByCategory,
    missPatternTotal: Object.values(missPatternCounts).reduce((a, b) => a + b, 0),
    avgDrive: avg(driveValues),
    avgApproach: avg(approachValues),
    avgPar3: avg(par3Scores),
    avgPar4: avg(par4Scores),
    avgPar5: avg(par5Scores),
    frontScore: frontNine.reduce((s, h) => s + (h.score || 0), 0),
    frontPar: frontNine.reduce((s, h) => s + (h.par || 0), 0),
    backScore: backNine.reduce((s, h) => s + (h.score || 0), 0),
    backPar: backNine.reduce((s, h) => s + (h.par || 0), 0),
    holes: perHole,
  }
}