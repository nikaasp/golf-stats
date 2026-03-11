import { SG_TABLE } from "./strokesGainedTable"

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

  return nearest.expected
}

export function getShotSgCategory({ shot, shotIndex, holePar }) {
  const startDistance = Number(shot.distance_to_flag)

  if (shot.is_putt || shot.lie === "Green") {
    return "putting"
  }

  if (shotIndex === 0 && (holePar === 4 || holePar === 5)) {
    return "tee"
  }

  if (startDistance > 90) {
    return "approach"
  }

  return "shortGame"
}

export function getExpectedStrokesForShot({ shot, shotIndex, holePar }) {
  const category = getShotSgCategory({ shot, shotIndex, holePar })
  const distance = Number(shot.distance_to_flag)

  if (category === "tee") {
    return getNearestExpected(SG_TABLE.tee, distance)
  }

  if (category === "approach") {
    return getNearestExpected(SG_TABLE.approach, distance)
  }

  if (category === "shortGame") {
    return getNearestExpected(SG_TABLE.shortGame, distance)
  }

  if (category === "putting") {
    return getNearestExpected(SG_TABLE.putting, distance)
  }

  return null
}

export function evaluateHoleStrokesGained(validShots, holePar) {
  return validShots.map((shot, index) => {
    const expectedBefore = getExpectedStrokesForShot({
      shot,
      shotIndex: index,
      holePar,
    })

    let expectedAfter = 0

    if (index < validShots.length - 1) {
      expectedAfter = getExpectedStrokesForShot({
        shot: validShots[index + 1],
        shotIndex: index + 1,
        holePar,
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
        holePar,
      }),
      expected_before: expectedBefore,
      expected_after: expectedAfter,
      strokes_gained: strokesGained,
    }
  })
}

export function summarizeHoleStrokesGained(evaluatedShots) {
  return evaluatedShots.reduce(
    (acc, shot) => {
      const sg = Number(shot.strokes_gained)
      if (!Number.isFinite(sg)) return acc

      acc.total += sg

      if (shot.sg_category === "tee") acc.tee += sg
      if (shot.sg_category === "approach") acc.approach += sg
      if (shot.sg_category === "shortGame") acc.shortGame += sg
      if (shot.sg_category === "putting") acc.putting += sg

      return acc
    },
    {
      total: 0,
      tee: 0,
      approach: 0,
      shortGame: 0,
      putting: 0,
    }
  )
}


export function summarizeRoundStrokesGained(shots) {
  return shots.reduce(
    (acc, shot) => {
      const sg = Number(shot.strokes_gained)
      if (!Number.isFinite(sg)) return acc

      acc.total += sg

      if (shot.sg_category === "tee") acc.tee += sg
      if (shot.sg_category === "approach") acc.approach += sg
      if (shot.sg_category === "shortGame") acc.shortGame += sg
      if (shot.sg_category === "putting") acc.putting += sg

      return acc
    },
    {
      total: 0,
      tee: 0,
      approach: 0,
      shortGame: 0,
      putting: 0,
    }
  )
}