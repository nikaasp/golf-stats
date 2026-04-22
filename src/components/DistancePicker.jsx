export default function DistancePicker({ value, onChange, styles }) {
  const safeValue = value === null || value === undefined ? "" : String(value)

  const handleNumber = (num) => {
    const next = `${safeValue}${num}`.replace(/^0+(\d)/, "$1")
    onChange(next)
  }

  const handleComma = () => {
    if (safeValue.includes(".")) return
    onChange(safeValue ? `${safeValue}.` : "0.")
  }

  const handleBack = () => {
    const next = safeValue.slice(0, -1)
    onChange(next === "0" ? "" : next)
  }

  return (
    <div style={styles.distanceWrapMini}>
      <div style={styles.distanceDisplayMini}>
        <span>{safeValue || "--"}</span>
        <span style={styles.distanceUnitMini}>m</span>
      </div>

      <div style={styles.keypadMini}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            style={styles.keypadButtonMini}
            onClick={() => handleNumber(n)}
          >
            {n}
          </button>
        ))}

        <button
          type="button"
          style={styles.keypadButtonMiniSecondary}
          onClick={handleComma}
        >
          ,
        </button>

        <button
          type="button"
          style={styles.keypadButtonMini}
          onClick={() => handleNumber(0)}
        >
          0
        </button>

        <button
          type="button"
          style={styles.keypadButtonMiniSecondary}
          onClick={handleBack}
        >
          Del
        </button>
      </div>
    </div>
  )
}
