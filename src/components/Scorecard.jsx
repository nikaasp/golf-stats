import { useMemo, useState } from "react"
import { formatToPar, scoreLabel } from "../utils/golfFormatters"

function scoreStyle(score, par, styles) {
  if (score == null || par == null) return styles.scorePar
  const diff = score - par
  if (diff <= -2) return styles.scoreEagle
  if (diff === -1) return styles.scoreBirdie
  if (diff === 0) return styles.scorePar
  if (diff === 1) return styles.scoreBogey
  return styles.scoreDouble
}

export default function Scorecard({ holes = [], styles }) {
  const [nine, setNine] = useState("front")

  const front = useMemo(
    () => holes.filter((h) => h.hole_number <= 9),
    [holes]
  )

  const back = useMemo(
    () => holes.filter((h) => h.hole_number >= 10),
    [holes]
  )

  const list = nine === "front" ? front : back
  const label = nine === "front" ? "Front 9" : "Back 9"

  const totalScore = list.reduce((s, h) => s + (h.score || 0), 0)
  const totalPar = list.reduce((s, h) => s + (h.par || 0), 0)

  return (
    <div style={styles.scorecardCompactWrap}>
      <div style={styles.scorecardHeaderRow}>
        <div style={styles.scorecardTitle}>{label}</div>
        <div style={styles.scorecardSubtotal}>
          {totalScore} ({formatToPar(totalScore, totalPar)})
        </div>
      </div>

      <div style={styles.scorecardToggleRow}>
        <button
          type="button"
          style={{
            ...styles.segmentedButton,
            ...(nine === "front" ? styles.segmentedActive : {}),
          }}
          onClick={() => setNine("front")}
        >
          Front 9
        </button>

        <button
          type="button"
          style={{
            ...styles.segmentedButton,
            ...(nine === "back" ? styles.segmentedActive : {}),
          }}
          onClick={() => setNine("back")}
        >
          Back 9
        </button>
      </div>

      <div style={styles.scorecardCompactGrid}>
        {list.map((h) => (
          <div key={h.id} style={styles.scoreCellCompact}>
            <div style={styles.scoreHoleNoCompact}>H{h.hole_number}</div>

            <div style={{ ...styles.scoreBadgeCompact, ...scoreStyle(h.score, h.par, styles) }}>
              {h.score ?? "-"}
            </div>

            <div style={styles.scoreParCompact}>P{h.par ?? "-"}</div>
            <div style={styles.scoreSymbolCompact}>{scoreLabel(h.score, h.par)}</div>
          </div>
        ))}
      </div>

      <div style={styles.scoreLegendCompact}>
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreEagle }}>E</span>
        <span>Eagle+</span>

        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreBirdie }}>B</span>
        <span>Birdie</span>

        <span style={{ ...styles.scoreBadgeSmall, ...styles.scorePar }}>P</span>
        <span>Par</span>

        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreBogey }}>Bo</span>
        <span>Bogey</span>

        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreDouble }}>D</span>
        <span>Double+</span>
      </div>
    </div>
  )
}