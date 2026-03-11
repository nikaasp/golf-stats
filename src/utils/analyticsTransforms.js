import { calculateSlope } from "./linearRegression"

export function buildSgTimeline(rounds, shots) {
  const shotsByRound = new Map()

  for (const shot of shots || []) {
    if (!shotsByRound.has(shot.round_id)) {
      shotsByRound.set(shot.round_id, [])
    }
    shotsByRound.get(shot.round_id).push(shot)
  }

  const timeline = (rounds || []).map((round) => {
    const roundShots = shotsByRound.get(round.id) || []

    const totals = {
      total: 0,
      tee: 0,
      approach: 0,
      shortGame: 0,
      putting: 0,
    }

    for (const shot of roundShots) {
      const sg = Number(shot.strokes_gained)
      if (!Number.isFinite(sg)) continue

      totals.total += sg

      if (shot.sg_category === "tee") totals.tee += sg
      if (shot.sg_category === "approach") totals.approach += sg
      if (shot.sg_category === "shortGame") totals.shortGame += sg
      if (shot.sg_category === "putting") totals.putting += sg
    }

    return {
      round_id: round.id,
      date: round.date,
      course: round.course,
      total: Number(totals.total.toFixed(2)),
      tee: Number(totals.tee.toFixed(2)),
      approach: Number(totals.approach.toFixed(2)),
      shortGame: Number(totals.shortGame.toFixed(2)),
      putting: Number(totals.putting.toFixed(2)),
    }
  })

  const slopes = {
    total: calculateSlope(timeline.map((r) => r.total)),
    tee: calculateSlope(timeline.map((r) => r.tee)),
    approach: calculateSlope(timeline.map((r) => r.approach)),
    shortGame: calculateSlope(timeline.map((r) => r.shortGame)),
    putting: calculateSlope(timeline.map((r) => r.putting)),
  }

  return { timeline, slopes }
}