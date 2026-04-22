import { useMemo, useState } from "react"
import ShotCard from "./ShotCard"
import {
  calculateShotModeTotals,
  getDefaultLieForShot,
  makeShot,
} from "../utils/analytics"

const PAR_OPTIONS = [3, 4, 5]

function restoreShots(savedShots = []) {
  const restored = [...savedShots]
    .sort((a, b) => Number(a.shot_number) - Number(b.shot_number))
    .map((shot, index) => ({
      ...makeShot(index + 1),
      shot_number: index + 1,
      lie: shot.lie || getDefaultLieForShot(index + 1),
      distance_to_flag:
        shot.distance_to_flag === null || shot.distance_to_flag === undefined
          ? ""
          : String(shot.distance_to_flag),
      miss_pattern: shot.miss_pattern || null,
      strike_quality: shot.strike_quality || null,
      auto_penalty: Number(shot.auto_penalty || 0),
    }))

  return restored.length > 0 ? restored : [makeShot(1)]
}

export default function ReviewHoleEditor({
  hole,
  savedShots,
  styles,
  loading,
  onCancel,
  onSave,
  onDelete,
}) {
  const [par, setPar] = useState(hole?.par == null ? "" : String(hole.par))
  const [shots, setShots] = useState(() => restoreShots(savedShots))
  const [activeShotIndex, setActiveShotIndex] = useState(0)
  const [setupResetKey, setSetupResetKey] = useState(0)
  const activeShot = shots[activeShotIndex] || null
  const shotTotals = useMemo(() => calculateShotModeTotals(shots), [shots])

  const resetShotSetupTab = () => setSetupResetKey((prev) => prev + 1)

  const updateShot = (index, field, value) => {
    setShots((prev) =>
      prev.map((shot, i) => {
        if (i !== index) return shot

        let nextValue = value
        if (field === "auto_penalty") nextValue = Number(value || 0)
        if ((field === "miss_pattern" || field === "strike_quality") && !value) {
          nextValue = null
        }

        return { ...shot, [field]: nextValue }
      })
    )
    setActiveShotIndex(index)
  }

  const addShotCard = () => {
    setShots((prev) => {
      const next = [...prev, makeShot(prev.length + 1)]
      setActiveShotIndex(next.length - 1)
      return next
    })
    resetShotSetupTab()
  }

  const removeShotCard = (index) => {
    setShots((prev) => {
      if (prev.length === 1) return prev

      const updated = prev
        .filter((_, i) => i !== index)
        .map((shot, i) => ({
          ...shot,
          shot_number: i + 1,
          lie: i === 0 ? shot.lie || "Tee" : shot.lie || getDefaultLieForShot(i + 1),
        }))

      setActiveShotIndex(Math.max(0, Math.min(activeShotIndex, updated.length - 1)))
      return updated
    })
  }

  const goPrevShot = () => {
    setActiveShotIndex((prev) => Math.max(0, prev - 1))
    resetShotSetupTab()
  }

  const goNextShot = () => {
    const isLastShot = activeShotIndex >= shots.length - 1
    if (isLastShot) {
      addShotCard()
    } else {
      setActiveShotIndex((prev) => prev + 1)
      resetShotSetupTab()
    }
  }

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.inRoundHeader}>
          <div style={styles.inRoundHeaderTop}>Editing hole {hole?.hole_number}</div>
          <div style={styles.inRoundHeaderBottom}>
            Par {par || "-"} | Shot {activeShotIndex + 1} of {shots.length}
          </div>
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
              disabled={loading}
            >
              Par {option}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.inRoundMainCompact}>
        {activeShot && (
          <ShotCard
            key={`${hole?.id}-${activeShotIndex}-${setupResetKey}`}
            shot={activeShot}
            index={activeShotIndex}
            shotCount={shots.length}
            active
            setActive={() => {}}
            updateShot={updateShot}
            removeShotCard={removeShotCard}
            addShotCard={addShotCard}
            setActiveShotIndex={setActiveShotIndex}
            styles={styles}
            holeLength={activeShotIndex === 0 ? savedShots?.[0]?.distance_to_flag : null}
          />
        )}
      </div>

      <div style={styles.inRoundFooterCompact}>
        <div style={styles.inRoundSummaryBox}>
          <div style={styles.inRoundSummaryCell}>
            <span style={styles.inRoundSummaryLabel}>Shots</span>
            <strong style={styles.inRoundSummaryValue}>{shotTotals.shotCount}</strong>
          </div>
          <div style={styles.inRoundSummaryCell}>
            <span style={styles.inRoundSummaryLabel}>Penalty</span>
            <strong style={styles.inRoundSummaryValue}>{shotTotals.autoPenalty}</strong>
          </div>
          <div style={styles.inRoundSummaryCell}>
            <span style={styles.inRoundSummaryLabel}>Score</span>
            <strong style={styles.inRoundSummaryValue}>{shotTotals.totalScore}</strong>
          </div>
        </div>

        <div style={styles.inRoundShotNavRowCompact}>
          <button
            type="button"
            style={styles.lightBlueNavButton}
            onClick={goPrevShot}
            disabled={activeShotIndex === 0 || loading}
          >
            Prev Shot
          </button>
          <button
            type="button"
            style={styles.lightBlueNavButton}
            onClick={goNextShot}
            disabled={loading}
          >
            Next Shot
          </button>
        </div>

        <div style={styles.bottomNavRowThree}>
          <button type="button" style={styles.secondaryButton} onClick={onCancel}>
            Back
          </button>
          <button
            type="button"
            style={styles.deleteRoundButton}
            onClick={() => onDelete(hole)}
            disabled={loading}
          >
            Delete
          </button>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => onSave(hole, par, shots)}
            disabled={loading}
          >
            Save Edits
          </button>
        </div>
      </div>
    </div>
  )
}
