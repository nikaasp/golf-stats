export default function HomeScreen({
  course,
  date,
  setCourse,
  setDate,
  startRound,
  loading,
  styles,
  courses,
  selectedCourseId,
  setSelectedCourseId,
  isNewCourse,
  setIsNewCourse,
  goToRounds,
  goToAnalytics,
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
          <button style={styles.primaryButton} onClick={goToRounds}>
            Rounds Played
          </button>

          <div style={{ height: 10 }} />

          <button style={styles.primaryButton} onClick={goToAnalytics}>
            Analytics
          </button>
        </div>
      </div>
    </div>
  )
}