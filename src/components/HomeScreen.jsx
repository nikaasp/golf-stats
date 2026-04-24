import HomeTrendSparkline from "./HomeTrendSparkline"

export default function HomeScreen({
  goToPlayRound,
  goToRounds,
  goToTrends,
  goToAnalytics,
  goToPlayingStyle,
  goToCourses,
  phoneSize,
  setPhoneSize,
  homeTrendData,
  styles,
}) {
  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.headerSparklineCard}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div style={{ ...styles.headerSparklineLabel, marginBottom: 0 }}>SG total trend</div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                style={{
                  ...styles.screenStepPill,
                  ...(phoneSize === "large" ? styles.screenStepPillActive : {}),
                }}
                onClick={() => setPhoneSize("large")}
              >
                Large
              </button>
              <button
                type="button"
                style={{
                  ...styles.screenStepPill,
                  ...(phoneSize === "small" ? styles.screenStepPillActive : {}),
                }}
                onClick={() => setPhoneSize("small")}
              >
                Small
              </button>
            </div>
          </div>
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

          <div style={styles.homeAdvancedSection}>
            <div style={styles.homeAdvancedLabel}>Advanced Shot Review</div>
            <p style={styles.homeAdvancedHint}>
              Use this if you log miss direction or strike quality.
            </p>

            <button style={styles.homeAdvancedButton} onClick={goToPlayingStyle}>
              Playing Style
            </button>
          </div>

          <button style={styles.secondaryButton} onClick={goToCourses}>
            My Courses
          </button>
        </div>
      </div>
    </div>
  )
}
