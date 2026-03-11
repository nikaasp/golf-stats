export default function HomeScreen({
  course,
  date,
  setCourse,
  setDate,
  startRound,
  reviewRounds,
  loadRoundDetailsForReview,
  deleteRound,
  loading,
  styles,
  courses,
  selectedCourseId,
  setSelectedCourseId,
  isNewCourse,
  setIsNewCourse,
}) {
  function handleCourseSelection(value) {
    if (value === "new") {
      setSelectedCourseId("new")
      setIsNewCourse(true)
      setCourse("")
      return
    }

    setSelectedCourseId(value)
    setIsNewCourse(false)

    const selectedCourse = courses.find((c) => c.id === value)
    if (selectedCourse) {
      setCourse(selectedCourse.name)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.mobileShell}>
        <div style={styles.heroCard}>
          <h1 style={styles.heroTitle}>Golf Stats</h1>
          <p style={styles.heroText}>Quick logging for the course.</p>

          <label style={styles.label}>Select course</label>
          <select
            style={styles.input}
            value={selectedCourseId}
            onChange={(e) => handleCourseSelection(e.target.value)}
          >
            <option value="">Select course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="new">+ New course</option>
          </select>

          {isNewCourse && (
            <>
              <label style={styles.label}>New course name</label>
              <input
                style={styles.input}
                placeholder="Course name"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
            </>
          )}

          <label style={styles.label}>Date</label>
          <input
            style={styles.input}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button style={styles.primaryButton} onClick={startRound} disabled={loading}>
            {loading ? "Starting..." : "Start New Round"}
          </button>
        </div>

        <div style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Previous Rounds</h2>

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
      </div>
    </div>
  )
}