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
  goHomeAndReset,
  goToNextHole,
  goToPrevHole,
  holeLength,
}) {
  const activeShot = shots?.[activeShotIndex] || null
  const isFirstShot = activeShotIndex <= 0
  const isLastShot = activeShotIndex >= (shots?.length || 1) - 1
  const teeToFlag = Number(holeLength) > 0 ? `${Number(holeLength)} m` : "-"

  return (
    <div style={styles.screenContainer}>
      <div style={styles.inRoundHeader}>
        <div style={styles.inRoundHeaderTop}>
          {course || "Course"} · {date}
        </div>

        <div style={styles.inRoundHeaderBottom}>
          Hole {hole} · Par {par || "-"} · Tee to flag {teeToFlag}
        </div>
      </div>

      <div style={styles.parSelectorWrapCompact}>
        <div style={styles.parButtonRowCompact}>
          {PAR_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              style={{
                ...styles.parButtonCompact,
                ...(String(par) === String(option) ? styles.parButtonCompactActive : {}),
              }}
              onClick={() => setPar(String(option))}
            >
              Par {option}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.inRoundMainCompact}>
        <div style={styles.inRoundCenterWrap}>
          <div style={styles.inRoundShotCardWrap}>
            {activeShot && (
              <ShotCard
                shot={activeShot}
                index={activeShotIndex}
                shotCount={shots?.length || 1}
                active
                setActive={() => {}}
                updateShot={updateShot}
                removeShotCard={removeShotCard}
                addShotCard={addShotCard}
                setActiveShotIndex={setActiveShotIndex}
                styles={styles}
                holeLength={activeShotIndex === 0 ? holeLength : null}
              />
            )}
          </div>
        </div>
      </div>

      <div style={styles.inRoundFooterCompact}>
        <div style={styles.inRoundShotNavRowCompact}>
          <button
            type="button"
            style={styles.lightBlueNavButton}
            onClick={() => setActiveShotIndex((prev) => Math.max(0, prev - 1))}
            disabled={isFirstShot}
          >
            Prev Shot
          </button>

          <button
            type="button"
            style={styles.lightBlueNavButton}
            onClick={() => {
              if (isLastShot) {
                addShotCard()
              } else {
                setActiveShotIndex((prev) => prev + 1)
              }
            }}
          >
            Add / Next Shot
          </button>
        </div>

        <div style={styles.inRoundHoleNavRowCompact}>
          <button type="button" style={styles.darkBlueNavButton} onClick={goToPrevHole}>
            Prev Hole
          </button>

          <button type="button" style={styles.darkBlueNavButton} onClick={goToNextHole}>
            Next Hole
          </button>
        </div>

        <button type="button" style={styles.endRoundButtonCompact} onClick={goHomeAndReset}>
          End Round
        </button>
      </div>
    </div>
  )
}