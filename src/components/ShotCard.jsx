import { useEffect, useMemo } from "react"
import DistancePicker from "./DistancePicker"

const LIE_OPTIONS = [
  { value: "Tee", color: "#d6eeca", border: "#656565", text: "#828282"},
  { value: "Fairway", color: "#d6eeca", border: "#656565", text: "#2d5722" },
  { value: "Rough", color: "#d6eeca", border: "#656565", text: "#11472d" },
  { value: "Sand", color: "#d6eeca", border: "#656565", text: "#c59454" },
  { value: "Recovery", color: "#d6eeca", border: "#656565", text: "#974a42" },
  { value: "Green", color: "#d6eeca", border: "#656565", text: "#3fa124" },
]

const MISS_BUTTONS = [
  { value: "long_left", label: "↖", area: "topLeft" },
  { value: "long", label: "↑", area: "topCenter" },
  { value: "long_right", label: "↗", area: "topRight" },
  { value: "left", label: "←", area: "midLeft" },
  { value: "right", label: "→", area: "midRight" },
  { value: "short_left", label: "↙", area: "bottomLeft" },
  { value: "short", label: "↓", area: "bottomCenter" },
  { value: "short_right", label: "↘", area: "bottomRight" },
]

const STRIKE_OPTIONS = [
  { value: "poor", label: "😕" },
  { value: "ok", label: "🙂" },
  { value: "pure", label: "😄" },
]

function hasEmptyDistance(value) {
  return value === null || value === undefined || value === ""
}

function getShotTypeLabel(index, lie) {
  if (index === 0) return "Tee Shot"
  if (lie === "Green") return "Putt"
  if (lie === "Sand") return "Bunker Shot"
  if (lie === "Recovery") return "Recovery Shot"
  return "Shot"
}

function getPenaltySelection(penaltyType) {
  if (penaltyType === "Hazard") return "+1"
  if (penaltyType === "OB") return "+2"
  return null
}

function penaltyValueToType(value) {
  if (value === "+1") return "Hazard"
  if (value === "+2") return "OB"
  return "None"
}

export default function ShotCard({
  shot,
  index,
  shotCount,
  active,
  setActive,
  updateShot,
  removeShotCard,
  addShotCard,
  setActiveShotIndex,
  styles,
  holeLength,
}) {
  useEffect(() => {
    const isFirstShot = index === 0
    const holeLengthNumber = Number(holeLength)

    if (isFirstShot && !shot.lie) {
      updateShot(index, "lie", "Tee")
    }

    if (
      isFirstShot &&
      hasEmptyDistance(shot.distance_to_flag) &&
      Number.isFinite(holeLengthNumber) &&
      holeLengthNumber > 0
    ) {
      updateShot(index, "distance_to_flag", holeLengthNumber)
    }
  }, [index, holeLength, shot.distance_to_flag, shot.lie, updateShot])

  const shotTypeLabel = useMemo(
    () => getShotTypeLabel(index, shot.lie),
    [index, shot.lie]
  )

  const showHoleLengthHint =
    index === 0 && Number.isFinite(Number(holeLength)) && Number(holeLength) > 0

  const handleFieldChange = (field, value) => {
    updateShot(index, field, value)
  }

  const goToNextShot = () => {
    const isLastShot = index >= shotCount - 1
    if (isLastShot) {
      addShotCard()
    } else {
      setActiveShotIndex(index + 1)
    }
  }

  const selectedPenalty = getPenaltySelection(shot.penalty_type)

  return (
    <div
      style={{
        ...styles.shotCardCompact,
        ...(active ? styles.shotCardActiveCompact : {}),
      }}
      onClick={setActive}
    >
      <div style={styles.shotCardHeaderCompact}>
        <div style={styles.shotHeaderLineCompact}>
          {shotTypeLabel.toUpperCase()} #{index + 1}
        </div>

        <button
          type="button"
          style={styles.removeGhostButtonCompact}
          onClick={(e) => {
            e.stopPropagation()
            removeShotCard(index)
          }}
        >
          Remove
        </button>
      </div>

      <div>
        <div style={styles.lieButtonGridCompact}>
          {LIE_OPTIONS.map((option) => {
            const selected = shot.lie === option.value

            return (
              <button
                key={option.value}
                type="button"
                style={{
                  ...styles.lieButtonCompact,
                  background: selected ? option.text : option.color,
                  border: `1px solid ${option.border}`,
                  color: selected ? "#ffffff" : option.text,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFieldChange("lie", option.value)
                }}
              >
                {option.value}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label style={styles.labelCompact}>
          TARGET DISTANCE
          {showHoleLengthHint && (
            <span style={styles.inlineHintCompact}> (auto-filled)</span>
          )} / MISS DIRECTION
        </label>

        <div style={styles.resultCockpit}>
          {MISS_BUTTONS.map((btn) => {
            const selected = shot.miss_pattern === btn.value
            return (
              <button
                key={btn.value}
                type="button"
                style={{
                  ...styles.resultArrowButton,
                  gridArea: btn.area,
                  ...(selected ? styles.resultArrowButtonActive : {}),
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFieldChange("miss_pattern", selected ? null : btn.value)
                }}
              >
                {btn.label}
              </button>
            )
          })}

          <div style={{ gridArea: "center", alignSelf: "center", justifySelf: "center" }}>
            <DistancePicker
              value={shot.distance_to_flag}
              onChange={(value) => handleFieldChange("distance_to_flag", value)}
              styles={styles}
            />
          </div>
        </div>
      </div>

      <div style={styles.shotBottomRowCompact}>
        <div>
          <label style={styles.labelCompact}>BALL-STRIKING</label>
          <div style={styles.strikeRowCompact}>
            {STRIKE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                style={{
                  ...styles.strikeButtonCompact,
                  ...(shot.strike_quality === option.value
                    ? styles.strikeButtonCompactActive
                    : {}),
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFieldChange("strike_quality", option.value)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={styles.labelCompact}>PENALTIES</label>
          <div style={styles.penaltyCheckboxRow}>
            {["+1", "+2"].map((value) => {
              const checked = selectedPenalty === value
              return (
                <label key={value} style={styles.penaltyCheckboxWrap}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      e.stopPropagation()
                      const nextType = e.target.checked
                        ? penaltyValueToType(value)
                        : "None"

                      handleFieldChange("penalty_type", nextType)

                      if (e.target.checked) {
                        setTimeout(() => {
                          goToNextShot()
                        }, 120)
                      }
                    }}
                    style={styles.penaltyCheckbox}
                  />
                  <span style={styles.penaltyCheckboxLabel}>{value}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}