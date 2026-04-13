export default function DistancePicker({ value, onChange, styles }) {
  const safeValue = value === null || value === undefined ? "" : String(value)

  const handleNumber = (num) => {
    const next = `${safeValue}${num}`.replace(/^0+(\d)/, "$1")
    onChange(next)
  }

  const handleClear = () => onChange("")
  const handleBack = () => onChange(safeValue.slice(0, -1))

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
          onClick={handleClear}
        >
          C
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
