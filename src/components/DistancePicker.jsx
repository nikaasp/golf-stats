const MIN_DISTANCE = 0
const MAX_DISTANCE = 650
const STEP = 0.5

function clampDistance(value) {
  return Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, value))
}

// Match the one-decimal string format the picker has always emitted so saved
// data stays consistent (distances are ultimately Number(...)ed downstream).
function formatDistance(value) {
  return clampDistance(value).toFixed(1)
}

export default function DistancePicker({ value, onChange, styles }) {
  const safeValue = value === null || value === undefined ? "" : String(value)
  const numericValue = Number.parseFloat(safeValue)
  const current = Number.isFinite(numericValue) ? numericValue : 0

  const step = (delta) => {
    onChange(formatDistance(current + delta))
  }

  const handleInput = (event) => {
    const raw = event.target.value
    onChange(raw === "" ? "" : raw)
  }

  const decDisabled = current <= MIN_DISTANCE
  const incDisabled = current >= MAX_DISTANCE

  return (
    <div style={styles.distanceWrapMini}>
      <div style={styles.distanceStepperRow}>
        <button
          type="button"
          style={{ ...styles.distanceStepperButton, opacity: decDisabled ? 0.4 : 1 }}
          onClick={() => step(-STEP)}
          disabled={decDisabled}
          aria-label="Decrease distance"
        >
          &minus;
        </button>

        <div style={styles.distanceDisplayMini}>
          <input
            type="number"
            inputMode="decimal"
            min={MIN_DISTANCE}
            max={MAX_DISTANCE}
            step={STEP}
            value={safeValue}
            onChange={handleInput}
            placeholder="--"
            style={styles.distanceStepperInput}
          />
          <span style={styles.distanceUnitMini}>m</span>
        </div>

        <button
          type="button"
          style={{ ...styles.distanceStepperButton, opacity: incDisabled ? 0.4 : 1 }}
          onClick={() => step(STEP)}
          disabled={incDisabled}
          aria-label="Increase distance"
        >
          +
        </button>
      </div>
    </div>
  )
}
