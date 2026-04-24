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
  availableTags = [],
  showTagFilter = true,
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

      {showTagFilter && (
        <>
          <label style={styles.label}>Tag</label>
          <input
            style={styles.inputCompact}
            type="text"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="rain, windy, tournament"
          />

          <label style={styles.label}>Existing tags</label>
          {availableTags.length === 0 ? (
            <p style={styles.mutedText}>No saved tags yet.</p>
          ) : (
            <div style={styles.tagRowCompact}>
              {availableTags.map((tag) => {
                const selected = String(tagFilter || "").trim().toLowerCase() === tag.toLowerCase()

                return (
                  <button
                    key={tag}
                    type="button"
                    style={{
                      ...styles.tagChip,
                      ...(selected
                        ? {
                            background: "#dcfce7",
                            border: "1px solid #16a34a",
                            color: "#166534",
                          }
                        : {}),
                    }}
                    onClick={() => setTagFilter(selected ? "" : tag)}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      <button style={styles.primaryButton} type="submit" disabled={loading}>
        {loading ? "Loading..." : "Apply Filter"}
      </button>
    </form>
  )
}
