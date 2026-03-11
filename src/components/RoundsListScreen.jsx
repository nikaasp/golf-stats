export default function RoundsListScreen({
  reviewRounds,
  loadRoundDetailsForReview,
  deleteRound,
  loading,
  goHome,
  styles,
}) {
  return (
    <div style={styles.page}>
      <div style={styles.mobileShell}>
        <div style={styles.sectionCard}>
          <h1 style={styles.heroTitle}>Rounds Played</h1>
          <p style={styles.mutedText}>Newest rounds first</p>
        </div>

        <div style={styles.sectionCard}>
          {reviewRounds.length === 0 ? (
            <p style={styles.mutedText}>No saved rounds yet.</p>
          ) : (
            <div style={styles.roundList}>
              {reviewRounds.map((r) => (
                <div key={r.id} style={styles.roundListItem}>
                  <button
                    style={styles.roundMainButton}
                    onClick={() => loadRoundDetailsForReview(r)}
                  >
                    <div>
                      <div style={styles.roundCourse}>{r.course || "Untitled round"}</div>
                      <div style={styles.roundDate}>{r.date || "-"}</div>
                    </div>
                    <div style={styles.roundChevron}>›</div>
                  </button>

                  <button
                    style={styles.deleteRoundButton}
                    onClick={() => deleteRound(r)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button style={styles.primaryButton} onClick={goHome}>
          Back to Home
        </button>
      </div>
    </div>
  )
}