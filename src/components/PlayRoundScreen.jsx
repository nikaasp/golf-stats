import ToggleCard from "./ToggleCard"
import ShotCard from "./ShotCard"

export default function PlayRoundScreen({
  course,
  date,
  hole,
  par,
  setPar,
  entryMode,
  setEntryMode,
  score,
  setScore,
  putts,
  setPutts,
  fairway,
  setFairway,
  gir,
  setGir,
  penalty,
  setPenalty,
  shots,
  activeShotIndex,
  setActiveShotIndex,
  updateShot,
  removeShotCard,
  addShotCard,
  shotTotals,
  saveHole,
  skipHole,
  endRoundNow,
  goHomeAndReset,
  loading,
  styles,
}) {
  const asNumber = (value, fallback) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const scoreValue = score === "" ? asNumber(par, 0) : asNumber(score, asNumber(par, 0))
  const puttsValue = putts === "" ? 2 : asNumber(putts, 2)
  const penaltyValue = penalty === "" ? 0 : asNumber(penalty, 0)

  const bumpValue = (setter, currentValue, delta, min = 0) => {
    setter(String(Math.max(min, currentValue + delta)))
  }

  const renderStepper = (label, value, onDecrement, onIncrement) => (
    <div>
      <label style={styles.label}>{label}</label>
      <div
        style={{
          ...styles.input,
          minHeight: "56px",
          display: "grid",
          gridTemplateColumns: "52px 1fr 52px",
          alignItems: "center",
          gap: "8px",
          padding: "6px",
        }}
      >
        <button type="button" style={styles.parButton} onClick={onDecrement}>
          -
        </button>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          {value}
        </div>
        <button type="button" style={styles.parButton} onClick={onIncrement}>
          +
        </button>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.mobileShell}>
        <div style={styles.sectionCard}>
          <div style={styles.playHeader}>
            <div>
              <div style={styles.playCourse}>{course}</div>
              <div style={styles.playDate}>{date}</div>
            </div>
            <div style={styles.holeCounter}>Hole {hole}/18</div>
          </div>

          <label style={styles.label}>Par</label>
          <div style={styles.parRow}>
            {[3, 4, 5].map((parOption) => (
              <button
                key={parOption}
                type="button"
                style={{
                  ...styles.parButton,
                  ...(String(par) === String(parOption) ? styles.parButtonActive : {}),
                }}
                onClick={() => setPar(String(parOption))}
              >
                {parOption}
              </button>
            ))}
          </div>

          <label style={styles.label}>How do you want to log this hole?</label>
          <div style={styles.segmentedWrap}>
            <button
              type="button"
              style={{
                ...styles.segmentedButton,
                ...(entryMode === "shot_by_shot" ? styles.segmentedActive : {}),
              }}
              onClick={() => setEntryMode("shot_by_shot")}
            >
              Shot by shot
            </button>

            <button
              type="button"
              style={{
                ...styles.segmentedButton,
                ...(entryMode === "score" ? styles.segmentedActive : {}),
              }}
              onClick={() => setEntryMode("score")}
            >
              Score
            </button>
          </div>
        </div>

        {entryMode === "score" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Score Mode</h2>

            {renderStepper(
              "Score",
              scoreValue,
              () => bumpValue(setScore, scoreValue, -1, 0),
              () => bumpValue(setScore, scoreValue, 1, 0)
            )}

            {renderStepper(
              "Putts",
              puttsValue,
              () => bumpValue(setPutts, puttsValue, -1, 0),
              () => bumpValue(setPutts, puttsValue, 1, 0)
            )}

            <div style={styles.twoColGrid}>
              <ToggleCard
                label="Fairway hit"
                value={fairway}
                onClick={() => setFairway((v) => !v)}
                styles={styles}
              />
              <ToggleCard
                label="GIR"
                value={gir}
                onClick={() => setGir((v) => !v)}
                styles={styles}
              />
            </div>

            {renderStepper(
              "Penalties",
              penaltyValue,
              () => bumpValue(setPenalty, penaltyValue, -1, 0),
              () => bumpValue(setPenalty, penaltyValue, 1, 0)
            )}
          </div>
        )}

        {entryMode === "shot_by_shot" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Shot-by-Shot</h2>

            <div style={styles.shotCardList}>
              {shots.map((shot, index) => (
                <ShotCard
                  key={index}
                  shot={shot}
                  index={index}
                  active={activeShotIndex === index}
                  setActive={() => setActiveShotIndex(index)}
                  updateShot={updateShot}
                  removeShotCard={removeShotCard}
                  styles={styles}
                />
              ))}
            </div>

            <button type="button" style={styles.primaryButton} onClick={addShotCard}>
              + Add Shot
            </button>

            <div style={styles.summaryBox}>
              <div style={styles.summaryInline}>
                <span>Shots entered</span>
                <strong>{shotTotals.shotCount}</strong>
              </div>
              <div style={styles.summaryInline}>
                <span>Auto penalties</span>
                <strong>{shotTotals.autoPenalty}</strong>
              </div>
              <div style={styles.summaryInline}>
                <span>Calculated score</span>
                <strong>{shotTotals.totalScore}</strong>
              </div>
            </div>
          </div>
        )}

        <div style={styles.stickyActionBar}>
          <button style={styles.primaryAction} onClick={saveHole} disabled={loading}>
            {hole === 18 ? "Save & Finish" : "Save Hole"}
          </button>

          <div style={styles.secondaryActionsRow}>
            <button style={styles.secondaryAction} onClick={skipHole} disabled={loading}>
              Skip Hole
            </button>
            <button style={styles.dangerAction} onClick={endRoundNow} disabled={loading}>
              End Round
            </button>
          </div>

          <button style={styles.ghostAction} onClick={goHomeAndReset} disabled={loading}>
            Cancel Round
          </button>
        </div>
      </div>
    </div>
  )
}