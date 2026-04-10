import { useMemo, useState } from "react"

export default function RoundsListScreen({
  reviewRounds,
  loadRoundDetailsForReview,
  deleteRound,
  loading,
  goHome,
  styles,
}) {
  const [index, setIndex] = useState(0)

  const safeIndex = useMemo(() => {
    if (!reviewRounds.length) return 0
    return Math.max(0, Math.min(index, reviewRounds.length - 1))
  }, [index, reviewRounds.length])

  const round = reviewRounds[safeIndex] || null

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Rounds Played</h1>
          <p style={styles.mutedText}>Newest rounds first</p>
        </div>
      </div>

      <div style={styles.fixedMainSectionCentered}>
        {!round ? (
          <div style={styles.sectionCardCompact}>
            <p style={styles.mutedText}>No saved rounds yet.</p>
          </div>
        ) : (
          <div style={styles.sectionCardCompact}>
            <div style={styles.roundPagerMeta}>
              Round {safeIndex + 1} / {reviewRounds.length}
            </div>

            <div style={styles.roundListItemCompact}>
              <div style={styles.roundCourse}>{round.course || "Untitled round"}</div>
              <div style={styles.roundDate}>{round.date || "-"}</div>

              <div style={styles.buttonRow}>
                <button
                  style={styles.primaryButton}
                  onClick={() => loadRoundDetailsForReview(round)}
                >
                  Open Round
                </button>

                <button
                  style={styles.deleteRoundButton}
                  onClick={() => deleteRound(round)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.fixedBottomSection}>
        <div style={styles.bottomNavRowThree}>
          <button
            style={styles.secondaryButton}
            onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
            disabled={!reviewRounds.length || safeIndex === 0}
          >
            Prev
          </button>

          <button style={styles.secondaryButton} onClick={goHome}>
            Home
          </button>

          <button
            style={styles.primaryButton}
            onClick={() =>
              setIndex((prev) =>
                Math.min(reviewRounds.length - 1, prev + 1)
              )
            }
            disabled={!reviewRounds.length || safeIndex === reviewRounds.length - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}