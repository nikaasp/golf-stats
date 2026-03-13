import { useEffect } from "react"
import DistancePicker from "./DistancePicker"
import { getPenaltyFromType } from "../utils/analytics"

const LIE_OPTIONS = ["Tee", "Fairway", "Rough", "Sand", "Recovery", "Green"]

const MISS_PATTERN_GRID = [
  [
    { value: "long_left", label: "Long Left", icon: "↖" },
    { value: "long", label: "Long", icon: "↑" },
    { value: "long_right", label: "Long Right", icon: "↗" },
  ],
  [
    { value: "left", label: "Left", icon: "←" },
    { value: "spot_on", label: "Spot On!", icon: "🎯" },
    { value: "right", label: "Right", icon: "→" },
  ],
  [
    { value: "short_left", label: "Short Left", icon: "↙" },
    { value: "short", label: "Short", icon: "↓" },
    { value: "short_right", label: "Short Right", icon: "↘" },
  ],
]

const PENALTY_OPTIONS = [
  { value: "None", label: "None" },
  { value: "Hazard", label: "Hazard (+1)" },
  { value: "OB", label: "OB (+2)" },
]

function hasEmptyDistance(value) {
  return value === null || value === undefined || value === ""
}

export default function ShotCard({
  shot,
  index,
  active,
  setActive,
  updateShot,
  removeShotCard,
  styles,
  holeLength,
}) {
  useEffect(() => {
    const isFirstShot = index === 0
    const holeLengthNumber = Number(holeLength)

    if (
      isFirstShot &&
      hasEmptyDistance(shot.distance_to_flag) &&
      Number.isFinite(holeLengthNumber) &&
      holeLengthNumber > 0
    ) {
      updateShot(index, "distance_to_flag", holeLengthNumber)
    }
  }, [index, holeLength, shot.distance_to_flag, updateShot])

  const handleFieldChange = (field, value) => {
    updateShot(index, field, value)
  }

  const showHoleLengthHint =
    index === 0 && Number.isFinite(Number(holeLength)) && Number(holeLength) > 0

  return (
    <div
      style={{
        ...styles.shotCard,
        ...(active ? styles.shotCardActive : {}),
      }}
      onClick={setActive}
    >
      <div style={styles.shotCardHeader}>
        <div style={styles.shotNumber}>Shot {index + 1}</div>

        <button
          type="button"
          style={styles.removeGhostButton}
          onClick={(e) => {
            e.stopPropagation()
            removeShotCard(index)
          }}
        >
          Remove
        </button>
      </div>

      <label style={styles.label}>Lie</label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {LIE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            style={{
              ...styles.segmentedButton,
              ...(shot.lie === option ? styles.segmentedActive : {}),
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleFieldChange("lie", option)
            }}
          >
            {option}
          </button>
        ))}
      </div>

      <label style={styles.label}>
        Distance to target
        {showHoleLengthHint && (
          <span
            style={{
              fontSize: "11px",
              color: "#6b7280",
              marginLeft: "6px",
              fontWeight: 400,
            }}
          >
            (auto-filled from hole length)
          </span>
        )}
        {console.log("ShotCard holeLength:", holeLength, "index:", index)}
      </label>

      <DistancePicker
        value={shot.distance_to_flag}
        onChange={(value) => handleFieldChange("distance_to_flag", value)}
        styles={styles}
      />

      <label style={styles.label}>Miss Pattern</label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {MISS_PATTERN_GRID.flat().map((option) => (
          <button
            key={option.value}
            type="button"
            style={{
              ...styles.segmentedButton,
              minHeight: "64px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              ...(shot.miss_pattern === option.value ? styles.segmentedActive : {}),
              ...(option.value === "spot_on"
                ? {
                    borderWidth: "2px",
                    fontWeight: 700,
                  }
                : {}),
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleFieldChange("miss_pattern", option.value)
            }}
          >
            <span style={{ fontSize: "16px", lineHeight: 1 }}>{option.icon}</span>
            <span
              style={{
                fontSize: "12px",
                lineHeight: 1.15,
                textAlign: "center",
              }}
            >
              {option.label}
            </span>
          </button>
        ))}
      </div>

      <label style={styles.label}>Penalty outcome</label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        {PENALTY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            style={{
              ...styles.segmentedButton,
              ...(shot.penalty_type === option.value ? styles.segmentedActive : {}),
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleFieldChange("penalty_type", option.value)
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div style={styles.shotPenaltyInfo}>
        Auto penalty: {getPenaltyFromType(shot.penalty_type)}
      </div>
    </div>
  )
}