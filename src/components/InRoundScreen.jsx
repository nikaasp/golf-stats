import ShotCard from "./ShotCard"

const PAR_OPTIONS = [3, 4, 5]

export default function InRoundScreen({
  styles,
  course,
  date,
  hole,
  par,
  setPar,
  shots,
  activeShotIndex,
  setActiveShotIndex,
  updateShot,
  removeShotCard,
  addShotCard,
  shotTotals,
  goHomeAndReset,
  goToNextHole,
  goToPrevHole,
  holeLength,
}) {
  const activeShot = shots?.[activeShotIndex] || null
  const shotNumber = activeShotIndex + 1
    const teeToFlag =
    Number(holeLength) > 0 ? `${Number(holeLength)} m` : "-"

  return (
    <div style={styles.screenContainer}>
      <div style={styles.inRoundHeader}>
        <div style={styles.inRoundHeaderTop}>
          {course || "Course"} | {date}
        </div>

        <div style={styles.inRoundHeaderBottom}>
          Hole {hole} | Par {par || "-"} | Tee to flag {teeToFlag} | Shot {shotNumber}
        </div>
      </div>

      <div style={styles.parSelectorWrap}>
        <div style={styles.label}>Par</div>
        <div style={styles.parButtonRow}>
          {PAR_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              style={{
                ...styles.segmentedButton,
                ...(String(par) === String(option) ? styles.segmentedActive : {}),
              }}
              onClick={() => setPar(String(option))}
            >
              Par {option}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.inRoundCenterWrap}>
        {activeShot && (
          <ShotCard
            shot={activeShot}
            index={activeShotIndex}
            active
            setActive={() => {}}
            updateShot={updateShot}
            removeShotCard={removeShotCard}
            styles={styles}
            holeLength={activeShotIndex === 0 ? shots?.[0]?.distance_to_flag : null}
          />
        )}
      </div>

      <div style={styles.inRoundSideLeft}>
        <button
          type="button"
          style={styles.sideNavButton}
          onClick={() => setActiveShotIndex((prev) => Math.max(0, prev - 1))}
        >
          Prev Shot
        </button>
      </div>

      <div style={styles.inRoundSideRight}>
        <button
          type="button"
          style={styles.sideNavButton}
          onClick={() => {
            if (activeShotIndex === shots.length - 1) {
              addShotCard()
            } else {
              setActiveShotIndex((prev) => prev + 1)
            }
          }}
        >
          Next Shot
        </button>
      </div>

      <div style={styles.inRoundBottomLeft}>
        <button type="button" style={styles.cornerNavButton} onClick={goToPrevHole}>
          Prev Hole
        </button>
      </div>

      <div style={styles.inRoundBottomRight}>
        <button type="button" style={styles.cornerNavButton} onClick={goToNextHole}>
          Next Hole
        </button>
      </div>

      <div style={styles.inRoundFooterInfo}>
        Total strokes so far: {shotTotals?.totalScore ?? shots.length}
      </div>

      <div style={{ marginTop: 20 }}>
        <button type="button" style={styles.secondaryButton} onClick={goHomeAndReset}>
          End Round
        </button>
      </div>
    </div>
  )
}