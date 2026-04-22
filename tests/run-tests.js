import assert from "node:assert/strict"
import process from "node:process"

import {
  buildRoundAnalytics,
  calculateShotModeTotals,
  inferHoleMetrics,
} from "../src/utils/analytics.js"
import {
  evaluateHoleStrokesGained,
  getShotSgCategory,
  summarizeHoleStrokesGained,
} from "../src/utils/strokesGained.js"

function runTest(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

runTest("categorizes shots by lie and distance bands", () => {
  assert.equal(
    getShotSgCategory({
      shot: { lie: "Tee", distance_to_flag: 380 },
      shotIndex: 0,
    }),
    "Tee"
  )

  assert.equal(
    getShotSgCategory({
      shot: { lie: "Fairway", distance_to_flag: 140 },
      shotIndex: 1,
    }),
    "Approach + Fairway"
  )

  assert.equal(
    getShotSgCategory({
      shot: { lie: "Rough", distance_to_flag: 35 },
      shotIndex: 2,
    }),
    "Short Game + Rough"
  )

  assert.equal(
    getShotSgCategory({
      shot: { lie: "Green", distance_to_flag: 8 },
      shotIndex: 3,
    }),
    "Putting"
  )
})

runTest("evaluates strokes gained across a complete hole", () => {
  const shots = [
    { lie: "Tee", distance_to_flag: 380 },
    { lie: "Fairway", distance_to_flag: 145 },
    { lie: "Green", distance_to_flag: 7 },
    { lie: "Green", distance_to_flag: 1 },
  ]

  const evaluated = evaluateHoleStrokesGained(shots)

  assert.equal(evaluated.length, 4)
  assert.equal(evaluated[0].sg_category, "Tee")
  assert.equal(evaluated[1].sg_category, "Approach + Fairway")
  assert.equal(evaluated[2].sg_category, "Putting")
  assert.equal(evaluated[3].expected_after, 0)
  assert.ok(Number.isFinite(evaluated[0].strokes_gained))
  assert.ok(Number.isFinite(evaluated[3].strokes_gained))

  const summary = summarizeHoleStrokesGained(evaluated)
  assert.ok(Number.isFinite(summary.total))
  assert.ok(Number.isFinite(summary.tee))
  assert.ok(Number.isFinite(summary.approachFairway))
  assert.ok(Number.isFinite(summary.green))
})

runTest("calculateShotModeTotals counts valid shots and penalties", () => {
  const totals = calculateShotModeTotals([
    { distance_to_flag: 410, auto_penalty: 0 },
    { distance_to_flag: 160, auto_penalty: 1 },
    { distance_to_flag: "", auto_penalty: 2 },
    { distance_to_flag: 12, auto_penalty: 0 },
  ])

  assert.deepEqual(totals, {
    shotCount: 3,
    autoPenalty: 1,
    totalScore: 4,
  })
})

runTest("inferHoleMetrics derives fairway, GIR, putts, drive, and approach distances", () => {
  const inferred = inferHoleMetrics(
    { par: 4, entry_mode: "shot_by_shot" },
    [
      { shot_number: 1, lie: "Tee", distance_to_flag: 390 },
      { shot_number: 2, lie: "Fairway", distance_to_flag: 145 },
      { shot_number: 3, lie: "Green", distance_to_flag: 8 },
      { shot_number: 4, lie: "Green", distance_to_flag: 1 },
    ]
  )

  assert.deepEqual(inferred, {
    fairway: true,
    gir: true,
    putts: 2,
    drivingDistance: 245,
    approachAccuracy: 137,
    firstPuttDistance: 8,
  })
})

runTest("buildRoundAnalytics includes spot-on misses in rollups", () => {
  const summary = buildRoundAnalytics(
    [
      {
        hole_number: 1,
        par: 4,
        score: 4,
        entry_mode: "shot_by_shot",
        skipped: false,
      },
    ],
    [
      {
        hole_number: 1,
        shot_number: 1,
        lie: "Tee",
        distance_to_flag: 390,
        miss_pattern: "spot_on",
        sg_category: "Tee",
      },
      {
        hole_number: 1,
        shot_number: 2,
        lie: "Fairway",
        distance_to_flag: 145,
        miss_pattern: "spot_on",
        sg_category: "Approach + Fairway",
      },
      {
        hole_number: 1,
        shot_number: 3,
        lie: "Green",
        distance_to_flag: 8,
        miss_pattern: null,
        sg_category: "Putting",
      },
    ]
  )

  assert.equal(summary.totalScore, 4)
  assert.equal(summary.totalPar, 4)
  assert.equal(summary.missPatternCounts.spot_on, 2)
  assert.equal(summary.missPatternByCategory.Tee.spot_on, 1)
  assert.equal(summary.missPatternByCategory["Approach + Fairway"].spot_on, 1)
})

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log("All utility tests passed.")
