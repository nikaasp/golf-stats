export default function RoundFilters({
  styles,
  courses,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  courseId,
  setCourseId,
  tagFilter,
  setTagFilter,
  onApply,
  loading = false,
}) {
  return (
    <form
      style={styles.analyticsFilterCard}
      onSubmit={(event) => {
        event.preventDefault()
        onApply()
      }}
    >
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

      <button style={styles.primaryButton} type="submit" disabled={loading}>
        {loading ? "Loading..." : "Apply Filter"}
      </button>
    </form>
  )
}
