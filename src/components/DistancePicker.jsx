export default function DistancePicker({ value, onChange, styles }) {
  const handleNumber = (num) => {
    const next = `${value || ""}${num}`
    onChange(next)
  }

  const handleClear = () => onChange("")
  const handleBack = () => onChange(String(value || "").slice(0, -1))

  return (
    <div style={styles.distanceWrap}>
      <div style={styles.distanceDisplay}>
        {value || "--"} <span style={{ fontSize: 12 }}>m</span>
      </div>

      <div style={styles.keypad}>
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button
            key={n}
            style={styles.keypadButton}
            onClick={() => handleNumber(n)}
          >
            {n}
          </button>
        ))}

        <button style={styles.keypadButton} onClick={handleClear}>C</button>
        <button style={styles.keypadButton} onClick={() => handleNumber(0)}>0</button>
        <button style={styles.keypadButton} onClick={handleBack}>⌫</button>
      </div>
    </div>
  )
}