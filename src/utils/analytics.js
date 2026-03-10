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
    is_putt: false,
    lie: getDefaultLieForShot(shotNumber),
    distance_to_flag: 100,
    club: "",
    shot_result: "Pured",
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

export function inferHoleValuesFromShots(selectedPar, validShots) {
  const firstPutt = validShots.find((s) => s.is_putt)
  const secondShot = validShots[1]

  const fairway =
    selectedPar > 3 && secondShot ? !secondShot.is_putt && secondShot.lie === "Fairway" : null

  const gir = firstPutt ? firstPutt.shot_number <= selectedPar - 1 : false
  const putts = validShots.filter((s) => s.is_putt).length

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
  const firstPutt = shots.find((s) => s.is_putt)
  const firstPuttIndex = shots.findIndex((s) => s.is_putt)

  let fairway = null
  if (par && par > 3 && shots.length >= 2) {
    const secondShot = shots[1]
    fairway = !secondShot.is_putt && secondShot.lie === "Fairway"
  }

  let gir = null
  if (par && firstPutt) {
    gir = firstPutt.shot_number <= par - 1
  } else if (par) {
    gir = false
  }

  const putts = shots.filter((s) => s.is_putt).length

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

  const contactCounts = {
    Pured: 0,
    Draw: 0,
    Fade: 0,
    Hook: 0,
    Slice: 0,
    Duff: 0,
    Top: 0,
  }

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
      if (!shot.is_putt && shot.shot_result && contactCounts[shot.shot_result] !== undefined) {
        contactCounts[shot.shot_result] += 1
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
    contactCounts,
    contactTotal: Object.values(contactCounts).reduce((a, b) => a + b, 0),
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