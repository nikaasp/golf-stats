import { SG_TABLE } from "./strokesGainedTable.js"

function normalizeLie(lie) {
  const value = String(lie || "").trim()

  if (value === "Green" || value === "On green" || value === "Putting") {
    return "Green"
  }

  return value
}

function getNearestExpected(table, distance) {
  if (!Number.isFinite(distance)) return null
  if (!table || table.length === 0) return null

  let nearest = table[0]
  let minDiff = Math.abs(distance - table[0].distance)

  for (const row of table) {
    const diff = Math.abs(distance - row.distance)
    if (diff < minDiff) {
      minDiff = diff
      nearest = row
    }
  }

  return nearest.expectedShots
}

export function getShotSgCategory({ shot, shotIndex }) {
  const startDistance = Number(shot.distance_to_flag)
  const lie = normalizeLie(shot.lie)
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

export function getExpectedStrokesForShot({ shot, shotIndex }) {
  const category = getShotSgCategory({ shot, shotIndex })
  const lookupKey = getSgLookupKeyFromCategory(category)
  const distance = Number(shot.distance_to_flag)

  if (!lookupKey) return null
  return getNearestExpected(SG_TABLE[lookupKey], distance)
}

export function evaluateHoleStrokesGained(validShots) {
  return validShots.map((shot, index) => {
    const expectedBefore = getExpectedStrokesForShot({
      shot,
      shotIndex: index,
    })

    let expectedAfter = 0

    if (index < validShots.length - 1) {
      expectedAfter = getExpectedStrokesForShot({
        shot: validShots[index + 1],
        shotIndex: index + 1,
      })
    }

    const strokesGained =
      expectedBefore == null || expectedAfter == null
        ? null
        : Number((expectedBefore - 1 - expectedAfter).toFixed(3))

    return {
      ...shot,
      sg_category: getShotSgCategory({
        shot,
        shotIndex: index,
      }),
      expected_before: expectedBefore,
      expected_after: expectedAfter,
      strokes_gained: strokesGained,
    }
  })
}

function createDetailedSgSummary() {
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

function addShotToSummary(acc, shot) {
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

export function summarizeHoleStrokesGained(evaluatedShots) {
  return evaluatedShots.reduce(addShotToSummary, createDetailedSgSummary())
}

export function summarizeRoundStrokesGained(shots) {
  return shots.reduce(addShotToSummary, createDetailedSgSummary())
}
