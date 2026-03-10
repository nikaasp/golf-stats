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

export default function Scorecard({ holes, styles }) {
  const front = holes.filter((h) => h.hole_number <= 9)
  const back = holes.filter((h) => h.hole_number >= 10)

  const renderNine = (label, list) => {
    const score = list.reduce((s, h) => s + (h.score || 0), 0)
    const par = list.reduce((s, h) => s + (h.par || 0), 0)

    return (
      <div style={styles.scorecardSection}>
        <div style={styles.scorecardHeaderRow}>
          <div style={styles.scorecardTitle}>{label}</div>
          <div style={styles.scorecardSubtotal}>
            {score} ({formatToPar(score, par)})
          </div>
        </div>

        <div style={styles.scorecardGrid}>
          {list.map((h) => (
            <div key={h.id} style={styles.scoreCell}>
              <div style={styles.scoreHoleNo}>{h.hole_number}</div>
              <div style={{ ...styles.scoreBadge, ...scoreStyle(h.score, h.par, styles) }}>
                {h.score}
              </div>
              <div style={styles.scoreSymbol}>{scoreLabel(h.score, h.par)}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {renderNine("Front 9", front)}
      {renderNine("Back 9", back)}
      <div style={styles.scoreLegend}>
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreEagle }}>E</span> Eagle+
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreBirdie }}>B</span> Birdie
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scorePar }}>P</span> Par
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreBogey }}>Bo</span> Bogey
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreDouble }}>D</span> Double+
      </div>
    </>
  )
}