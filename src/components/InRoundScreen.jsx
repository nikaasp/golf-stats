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
  const totalShots = shots?.length || 0
  const teeToFlag = Number(holeLength) > 0 ? `${Number(holeLength)} m` : "-"

  const isFirstShot = activeShotIndex <= 0
  const isLastShot = activeShotIndex >= totalShots - 1

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

      <div style={styles.inRoundMain}>
        <div style={styles.inRoundMetaRow}>
          <div style={styles.inRoundMetaCard}>
            <div style={styles.inRoundMetaLabel}>Active shot</div>
            <div style={styles.inRoundMetaValue}>
              {shotNumber} / {Math.max(totalShots, 1)}
            </div>
          </div>

          <div style={styles.inRoundMetaCard}>
            <div style={styles.inRoundMetaLabel}>Strokes so far</div>
            <div style={styles.inRoundMetaValue}>
              {shotTotals?.totalScore ?? totalShots}
            </div>
          </div>
        </div>

        <div style={styles.inRoundCenterWrap}>
          <div style={styles.inRoundShotCardWrap}>
            {activeShot && (
              <ShotCard
                shot={activeShot}
                index={activeShotIndex}
                shotCount={totalShots}
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

      <div style={styles.inRoundFooter}>
        <div style={styles.inRoundShotNavRow}>
          <button
            type="button"
            style={styles.sideNavButton}
            onClick={() => setActiveShotIndex((prev) => Math.max(0, prev - 1))}
            disabled={isFirstShot}
          >
            Prev Shot
          </button>

          <button
            type="button"
            style={styles.sideNavButton}
            onClick={() => {
              if (isLastShot) {
                addShotCard()
              } else {
                setActiveShotIndex((prev) => prev + 1)
              }
            }}
          >
            {isLastShot ? "Add / Next Shot" : "Next Shot"}
          </button>
        </div>

        <div style={styles.inRoundHoleNavRow}>
          <button type="button" style={styles.cornerNavButton} onClick={goToPrevHole}>
            Prev Hole
          </button>

          <button type="button" style={styles.cornerNavButton} onClick={goToNextHole}>
            Next Hole
          </button>
        </div>

        <button type="button" style={styles.secondaryButton} onClick={goHomeAndReset}>
          End Round
        </button>
      </div>
    </div>
  )
}