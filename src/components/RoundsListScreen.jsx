import { useMemo, useState } from "react"
import { roundMatchesTagFilter } from "../utils/roundTags"

export default function RoundsListScreen({
  reviewRounds,
  courses,
  loadRoundDetailsForReview,
  deleteRound,
  loading,
  goHome,
  styles,
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [index, setIndex] = useState(0)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState(today)
  const [courseId, setCourseId] = useState("all")
  const [tagFilter, setTagFilter] = useState("")

  const filteredRounds = useMemo(() => {
    return reviewRounds.filter((round) => {
      if (startDate && round.date < startDate) return false
      if (endDate && round.date > endDate) return false
      if (courseId !== "all" && String(round.course_id || "") !== courseId) return false
      if (!roundMatchesTagFilter(round, tagFilter)) return false
      return true
    })
  }, [courseId, endDate, reviewRounds, startDate, tagFilter])

  const safeIndex = useMemo(() => {
    if (!filteredRounds.length) return 0
    return Math.max(0, Math.min(index, filteredRounds.length - 1))
  }, [filteredRounds.length, index])

  const round = filteredRounds[safeIndex] || null

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Rounds Played</h1>
          <p style={styles.mutedText}>Filter by time period, course, or tags.</p>

          <div style={styles.analyticsFilterCard}>
            <div style={styles.analyticsFilterGrid}>
              <div>
                <label style={styles.label}>Start date</label>
                <input
                  style={styles.inputCompact}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>End date</label>
                <input
                  style={styles.inputCompact}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <label style={styles.label}>Course</label>
            <select
              style={styles.inputCompact}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="all">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <label style={styles.label}>Tag</label>
            <input
              style={styles.inputCompact}
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="rain, windy, tournament"
            />
          </div>
        </div>
      </div>

      <div style={styles.fixedMainSectionCentered}>
        {!round ? (
          <div style={styles.sectionCardCompact}>
            <p style={styles.mutedText}>No saved rounds match this filter.</p>
          </div>
        ) : (
          <div style={styles.sectionCardCompact}>
            <div style={styles.roundPagerMeta}>
              Round {safeIndex + 1} / {filteredRounds.length}
            </div>

            <div style={styles.roundListItemCompact}>
              <div style={styles.roundCourse}>{round.course || "Untitled round"}</div>
              <div style={styles.roundDate}>{round.date || "-"}</div>

              {Array.isArray(round.tags) && round.tags.length > 0 && (
                <div style={styles.tagRowCompact}>
                  {round.tags.map((tag) => (
                    <span key={tag} style={styles.tagChip}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

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
            disabled={!filteredRounds.length || safeIndex === 0}
          >
            Prev
          </button>

          <button style={styles.secondaryButton} onClick={goHome}>
            Home
          </button>

          <button
            style={styles.primaryButton}
            onClick={() =>
              setIndex((prev) => Math.min(filteredRounds.length - 1, prev + 1))
            }
            disabled={!filteredRounds.length || safeIndex === filteredRounds.length - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
