import { useMemo, useState } from "react"
import RoundFilters from "./RoundFilters"

function getRoundDateOnly(round) {
  return String(round?.date || "").slice(0, 10)
}

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

  const [draftStartDate, setDraftStartDate] = useState("")
  const [draftEndDate, setDraftEndDate] = useState(today)
  const [draftCourseId, setDraftCourseId] = useState("all")
  const [draftTagFilter, setDraftTagFilter] = useState("")

  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: today,
    courseId: "all",
    tagFilter: "",
  })
  const [filterStatus, setFilterStatus] = useState("")

  const applyFilters = () => {
    setAppliedFilters({
      startDate: draftStartDate,
      endDate: draftEndDate,
      courseId: draftCourseId,
      tagFilter: "",
    })
    setFilterStatus("Filters applied")
    setIndex(0)
  }

  const filteredRounds = useMemo(() => {
    return reviewRounds.filter((round) => {
      const roundDate = getRoundDateOnly(round)

      if (appliedFilters.startDate && roundDate < appliedFilters.startDate) return false
      if (appliedFilters.endDate && roundDate > appliedFilters.endDate) return false
      if (
        appliedFilters.courseId !== "all" &&
        String(round.course_id || "") !== appliedFilters.courseId
      ) {
        return false
      }
      return true
    })
  }, [appliedFilters, reviewRounds])

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

          <RoundFilters
            styles={styles}
            courses={courses}
            startDate={draftStartDate}
            setStartDate={setDraftStartDate}
            endDate={draftEndDate}
            setEndDate={setDraftEndDate}
            courseId={draftCourseId}
            setCourseId={setDraftCourseId}
            tagFilter={draftTagFilter}
            setTagFilter={setDraftTagFilter}
            showTagFilter={false}
            onApply={applyFilters}
            loading={loading}
          />

          <p style={styles.filterStatusText}>
            {filterStatus
              ? `${filterStatus}. Showing ${filteredRounds.length} of ${reviewRounds.length} rounds.`
              : `Showing ${filteredRounds.length} of ${reviewRounds.length} rounds.`}
          </p>
        </div>
      </div>

      <div style={styles.fixedMainSectionCentered}>
        {!round ? (
          <div style={styles.sectionCardCompact}>
            <p style={styles.mutedText}>
              {loading
                ? "Loading saved rounds..."
                : reviewRounds.length
                ? "No saved rounds match this filter."
                : "No saved rounds have been loaded yet."}
            </p>
          </div>
        ) : (
          <div style={styles.sectionCardCompact}>
            <div style={styles.roundPagerMeta}>
              Round {safeIndex + 1} / {filteredRounds.length}
            </div>

            <div style={styles.roundListItemCompact}>
              <div style={styles.roundCourse}>{round.course || "Untitled round"}</div>
              <div style={styles.roundDate}>{getRoundDateOnly(round) || "-"}</div>

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
            onClick={() => setIndex((prev) => Math.min(filteredRounds.length - 1, prev + 1))}
            disabled={!filteredRounds.length || safeIndex === filteredRounds.length - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
