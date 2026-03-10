export default function ToggleCard({ label, value, onClick, styles }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.toggleCard,
        ...(value ? styles.toggleCardActive : {}),
      }}
    >
      <div style={styles.toggleCardLabel}>{label}</div>
      <div style={styles.toggleCardValue}>{value ? "Yes" : "No"}</div>
    </button>
  )
}