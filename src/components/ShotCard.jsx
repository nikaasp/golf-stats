import { useEffect, useMemo } from "react"
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
    { value: "spot_on", label: "Spot On", icon: "◎" },
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
  { value: "Hazard", label: "Hazard +1" },
  { value: "OB", label: "OB +2" },
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

  const handleFieldChange = (field, value) => {
    updateShot(index, field, value)
  }

  const shotTypeLabel = useMemo(
    () => getShotTypeLabel(index, shot.lie),
    [index, shot.lie]
  )

  const showHoleLengthHint =
    index === 0 && Number.isFinite(Number(holeLength)) && Number(holeLength) > 0

  return (
    <div
      style={{
        ...styles.shotCard,
        ...(active ? styles.shotCardActive : {}),
        padding: "12px",
        borderRadius: "12px",
        cursor: "pointer",
      }}
      onClick={setActive}
    >
      <div
        style={{
          ...styles.shotCardHeader,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "10px",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#6b7280",
              marginBottom: "4px",
            }}
          >
            {shotTypeLabel}
          </div>

          <div
            style={{
              ...styles.shotNumber,
              fontSize: "20px",
              fontWeight: 800,
            }}
          >
            Shot {index + 1}
          </div>
        </div>

        <button
          type="button"
          style={{
            ...styles.removeGhostButton,
            whiteSpace: "nowrap",
          }}
          onClick={(e) => {
            e.stopPropagation()
            removeShotCard(index)
          }}
        >
          Remove
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={styles.label}>Lie</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          {LIE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              style={{
                ...styles.segmentedButton,
                minHeight: "44px",
                fontWeight: 600,
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
      </div>

      <div style={{ marginBottom: "10px" }}>
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
        </label>

        <div
          style={{
            background: "#f8fafc",
            padding: "10px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <DistancePicker
            value={shot.distance_to_flag}
            onChange={(value) => handleFieldChange("distance_to_flag", value)}
            styles={styles}
          />
        </div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={styles.label}>Miss pattern</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          {MISS_PATTERN_GRID.flat().map((option) => {
            const selected = shot.miss_pattern === option.value
            const isSpotOn = option.value === "spot_on"

            return (
              <button
                key={option.value}
                type="button"
                style={{
                  ...styles.segmentedButton,
                  minHeight: "56px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  fontWeight: selected ? 700 : 500,
                  borderWidth: isSpotOn ? "2px" : "1px",
                  ...(selected ? styles.segmentedActive : {}),
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFieldChange("miss_pattern", option.value)
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>
                  {option.icon}
                </span>
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
            )
          })}
        </div>
      </div>

      <div
        style={{
          background: "#fff7ed",
          padding: "10px",
          borderRadius: "12px",
          border: "1px solid #fed7aa",
          marginBottom: "10px",
        }}
      >
        <label style={styles.label}>Ball striking</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          {STRIKE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              style={{
                ...styles.segmentedButton,
                minHeight: "48px",
                fontSize: "24px",
                ...(shot.strike_quality === option.value ? styles.segmentedActive : {}),
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

      <div style={{ marginBottom: "8px" }}>
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
                minHeight: "44px",
                fontWeight: 600,
                ...(shot.penalty_type === option.value
                  ? styles.segmentedActive
                  : {}),
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
      </div>

      <div
        style={{
          ...styles.shotPenaltyInfo,
          marginTop: "10px",
          padding: "10px 12px",
          borderRadius: "12px",
          background: "#f8fafc",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        Auto penalty: {getPenaltyFromType(shot.penalty_type)}
      </div>
    </div>
  )
}