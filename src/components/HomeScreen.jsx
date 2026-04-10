export default function HomeScreen({
  goToPlayRound,
  goToRounds,
  goToAnalytics,
  styles,
}) {
  return (
    <div style={styles.screenContainer}>
      <div style={styles.headerSparklineCard}>
        <div style={styles.headerSparklineLabel}>SG total trend</div>
        <div style={styles.headerSparklinePlaceholder}>
          thin black SG line chart here
        </div>
      </div>

      <div style={styles.homeButtonStack}>
        <button style={styles.primaryButton} onClick={goToPlayRound}>
          Play Round
        </button>

        <button style={styles.secondaryButton} onClick={goToRounds}>
          Review Rounds
        </button>

        <button style={styles.secondaryButton} onClick={goToAnalytics}>
          Analytics
        </button>
      </div>
    </div>
  )
}