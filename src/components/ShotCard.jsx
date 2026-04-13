import { useEffect, useMemo } from "react"
import DistancePicker from "./DistancePicker"

const LIE_OPTIONS = [
  { value: "Tee", color: "#d6eeca", border: "#656565", text: "#828282" },
  { value: "Fairway", color: "#d6eeca", border: "#656565", text: "#2d5722" },
  { value: "Rough", color: "#d6eeca", border: "#656565", text: "#11472d" },
  { value: "Sand", color: "#d6eeca", border: "#656565", text: "#c59454" },
  { value: "Recovery", color: "#d6eeca", border: "#656565", text: "#974a42" },
  { value: "Green", color: "#d6eeca", border: "#656565", text: "#3fa124" },
]

const MISS_BUTTONS = [
  { value: "long_left", label: "Long Left", area: "topLeft" },
  { value: "long", label: "Long", area: "topCenter" },
  { value: "long_right", label: "Long Right", area: "topRight" },
  { value: "left", label: "Left", area: "midLeft" },
  { value: "spot_on", label: "On Line", area: "center" },
  { value: "right", label: "Right", area: "midRight" },
  { value: "short_left", label: "Short Left", area: "bottomLeft" },
  { value: "short", label: "Short", area: "bottomCenter" },
  { value: "short_right", label: "Short Right", area: "bottomRight" },
]

const STRIKE_OPTIONS = [
  { value: "poor", label: "Poor" },
  { value: "ok", label: "OK" },
  { value: "pure", label: "Pure" },
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

  const selectedPenalty = Number(shot.auto_penalty || 0)

  return (
    <div
      style={{
        ...styles.shotCardCompact,
        ...(active ? styles.shotCardActiveCompact : {}),
      }}
      onClick={setActive}
    >
      <div style={styles.shotCardHeaderCompact}>
        <div>
          <div style={styles.shotHeaderMetaCompact}>
            Shot {index + 1} of {shotCount}
          </div>
          <div style={styles.shotHeaderLineCompact}>{shotTypeLabel}</div>
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

      <div style={styles.shotInfoPillRowCompact}>
        <div style={styles.shotInfoPillCompact}>
          Lie: <strong>{shot.lie || "Select"}</strong>
        </div>
        <div style={styles.shotInfoPillCompact}>
          Distance: <strong>{shot.distance_to_flag || "--"} m</strong>
        </div>
      </div>

      <div style={styles.shotSectionCompact}>
        <label style={styles.labelCompact}>Lie</label>
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

      <div style={styles.shotSectionCompact}>
        <div style={styles.shotSectionHeaderCompact}>
          <label style={styles.labelCompact}>Distance to Flag</label>
          {showHoleLengthHint && (
            <span style={styles.inlineHintBadgeCompact}>Auto from hole length</span>
          )}
        </div>

        <div style={styles.distanceBlockCompact}>
          <DistancePicker
            value={shot.distance_to_flag}
            onChange={(value) => handleFieldChange("distance_to_flag", value)}
            styles={styles}
          />
        </div>
      </div>

      <div style={styles.shotSectionCompact}>
        <label style={styles.labelCompact}>Miss Direction</label>
        <div style={styles.resultCockpit}>
          {MISS_BUTTONS.map((btn) => {
            const selected = shot.miss_pattern === btn.value
            const words = btn.label.split(" ")

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
                {words.map((word) => (
                  <span key={word} style={styles.resultArrowButtonText}>
                    {word}
                  </span>
                ))}
              </button>
            )
          })}
        </div>
      </div>

      <div style={styles.shotBottomRowCompact}>
        <div style={styles.shotSectionCompact}>
          <label style={styles.labelCompact}>Ball-Striking</label>
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

        <div style={styles.shotSectionCompact}>
          <label style={styles.labelCompact}>Penalty</label>
          <div style={styles.penaltyCheckboxRow}>
            {["+1", "+2"].map((value) => {
              const penaltyNumber = value === "+1" ? 1 : 2
              const checked = selectedPenalty === penaltyNumber

              return (
                <label key={value} style={styles.penaltyCheckboxWrap}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      e.stopPropagation()

                      const nextPenalty = e.target.checked ? penaltyNumber : 0
                      handleFieldChange("auto_penalty", nextPenalty)

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
