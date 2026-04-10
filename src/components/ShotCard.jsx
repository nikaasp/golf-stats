import { useEffect, useMemo, useRef, useState } from "react"
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

const STEP_LABELS = ["Setup", "Result", "Penalty"]

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
  const [step, setStep] = useState(0)
  const previousDistanceRef = useRef(shot?.distance_to_flag ?? "")
  const previousPenaltyRef = useRef(shot?.penalty_type ?? "None")

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

  useEffect(() => {
    previousDistanceRef.current = shot?.distance_to_flag ?? ""
  }, [index])

  useEffect(() => {
    previousPenaltyRef.current = shot?.penalty_type ?? "None"
  }, [index])

  const goToNextShot = () => {
    const isLastShot = index >= shotCount - 1

    if (isLastShot) {
      addShotCard()
    } else {
      setActiveShotIndex(index + 1)
    }
  }

  const handleFieldChange = (field, value) => {
    updateShot(index, field, value)

    if (field === "distance_to_flag") {
      const previous = String(previousDistanceRef.current ?? "")
      const next = String(value ?? "")
      previousDistanceRef.current = next

      const wasEmpty = previous.trim() === ""
      const isNowFilled = next.trim() !== ""

      if (step === 0 && wasEmpty && isNowFilled) {
        setTimeout(() => setStep(1), 120)
      }
    }

    if (field === "penalty_type") {
      const previous = String(previousPenaltyRef.current ?? "None")
      previousPenaltyRef.current = value

      if (step === 2 && previous !== value) {
        setTimeout(() => {
          goToNextShot()
        }, 120)
      }
    }
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
        cursor: "pointer",
        height: "100%",
        display: "grid",
        gridTemplateRows: "auto auto 1fr auto",
        gap: "8px",
        overflow: "hidden",
      }}
      onClick={setActive}
    >
      <div
        style={{
          ...styles.shotCardHeader,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
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
              fontSize: "18px",
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

      <div style={styles.shotStepPills}>
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            style={{
              ...styles.shotStepPill,
              ...(step === i ? styles.shotStepPillActive : {}),
            }}
            onClick={(e) => {
              e.stopPropagation()
              setStep(i)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={styles.shotStepContent}>
        {step === 0 && (
          <div style={styles.shotStepInner}>
            <div>
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
                      minHeight: "42px",
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

            <div>
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
                    (auto-filled)
                  </span>
                )}
              </label>

              <div
                style={{
                  background: "#f8fafc",
                  padding: "6px",
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
          </div>
        )}

        {step === 1 && (
          <div style={styles.shotStepInner}>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <label style={styles.label}>Miss pattern</label>

                {shot.miss_pattern && (
                  <button
                    type="button"
                    style={styles.removeGhostButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFieldChange("miss_pattern", null)
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "8px",
                }}
              >
                {MISS_PATTERN_GRID.flat().map((option) => {
                  const selected = shot.miss_pattern === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      style={{
                        ...styles.segmentedButton,
                        minHeight: "54px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "3px",
                        fontWeight: selected ? 700 : 500,
                        ...(selected ? styles.segmentedActive : {}),
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFieldChange("miss_pattern", option.value)
                      }}
                    >
                      <span style={{ fontSize: "16px", lineHeight: 1 }}>
                        {option.icon}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          lineHeight: 1.1,
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
                padding: "8px",
                borderRadius: "12px",
                border: "1px solid #fed7aa",
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
                      minHeight: "46px",
                      fontSize: "22px",
                      ...(shot.strike_quality === option.value
                        ? styles.segmentedActive
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
          </div>
        )}

        {step === 2 && (
          <div style={styles.shotStepInner}>
            <div>
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
                marginTop: "4px",
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
        )}
      </div>

      <div style={styles.shotStepNavRow}>
        <button
          type="button"
          style={styles.secondaryButtonCompact}
          disabled={step === 0}
          onClick={(e) => {
            e.stopPropagation()
            setStep((prev) => Math.max(0, prev - 1))
          }}
        >
          Back
        </button>

        <button
          type="button"
          style={styles.secondaryButtonCompact}
          onClick={(e) => {
            e.stopPropagation()

            if (step < STEP_LABELS.length - 1) {
              setStep((prev) => Math.min(STEP_LABELS.length - 1, prev + 1))
            } else {
              goToNextShot()
            }
          }}
        >
          {step < STEP_LABELS.length - 1 ? "Next" : "Next Shot"}
        </button>
      </div>
    </div>
  )
}