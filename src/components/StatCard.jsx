export default function StatCard({ label, value, styles }) {
  return (
    <div style={styles.statCardCompact}>
      <div style={styles.statValueCompact}>{value}</div>
      <div style={styles.statLabelCompact}>{label}</div>
    </div>
  )
}