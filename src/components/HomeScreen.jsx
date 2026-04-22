import HomeTrendSparkline from "./HomeTrendSparkline"

export default function HomeScreen({
  goToPlayRound,
  goToRounds,
  goToTrends,
  goToAnalytics,
  goToCourses,
  homeTrendData,
  styles,
}) {
  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.headerSparklineCard}>
          <div style={styles.headerSparklineLabel}>SG total trend</div>
          <HomeTrendSparkline data={homeTrendData} styles={styles} />
        </div>
      </div>

      <div style={styles.fixedMainSectionCentered}>
        <div style={styles.homeButtonStack}>
          <button style={styles.primaryButton} onClick={goToPlayRound}>
            Play Round
          </button>

          <button style={styles.secondaryButton} onClick={goToRounds}>
            Review Rounds
          </button>

          <button style={styles.secondaryButton} onClick={goToTrends}>
            Trends
          </button>

          <button style={styles.secondaryButton} onClick={goToAnalytics}>
            Analytics
          </button>

          <button style={styles.secondaryButton} onClick={goToCourses}>
            My Courses
          </button>
        </div>
      </div>
    </div>
  )
}
