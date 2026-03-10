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

            <div style={styles.twoColGrid}>
              <div>
                <label style={styles.label}>Score</label>
                <input
                  style={styles.input}
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Putts</label>
                <input
                  style={styles.input}
                  type="number"
                  value={putts}
                  onChange={(e) => setPutts(e.target.value)}
                />
              </div>
            </div>

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

            <label style={styles.label}>Penalties</label>
            <input
              style={styles.input}
              type="number"
              value={penalty}
              onChange={(e) => setPenalty(e.target.value)}
            />
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