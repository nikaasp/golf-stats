import { LIE_OPTIONS, STRIKE_OPTIONS } from "../utils/shotInsights"

export default function ShotFiltersCard({
  styles,
  courses,
  draftFilters,
  updateDraft,
  availableTags = [],
  loading = false,
  onApply,
  statusText,
  showStrikeFilter = false,
}) {
  return (
    <form
      style={styles.sectionCardCompact}
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
            value={draftFilters.startDate}
            onChange={(e) => updateDraft("startDate", e.target.value)}
          />
        </div>
        <div>
          <label style={styles.label}>End date</label>
          <input
            style={styles.inputCompact}
            type="date"
            value={draftFilters.endDate}
            onChange={(e) => updateDraft("endDate", e.target.value)}
          />
        </div>
      </div>

      <label style={styles.label}>Course</label>
      <select
        style={styles.inputCompact}
        value={draftFilters.courseId}
        onChange={(e) => updateDraft("courseId", e.target.value)}
      >
        <option value="all">All courses</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>

      <div style={styles.analyticsFilterGrid}>
        <div>
          <label style={styles.label}>Min distance</label>
          <input
            style={styles.inputCompact}
            type="number"
            inputMode="decimal"
            value={draftFilters.minDistance}
            onChange={(e) => updateDraft("minDistance", e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label style={styles.label}>Max distance</label>
          <input
            style={styles.inputCompact}
            type="number"
            inputMode="decimal"
            value={draftFilters.maxDistance}
            onChange={(e) => updateDraft("maxDistance", e.target.value)}
            placeholder="200"
          />
        </div>
      </div>

      <div style={styles.analyticsFilterGrid}>
        <div>
          <label style={styles.label}>Lie</label>
          <select
            style={styles.inputCompact}
            value={draftFilters.lie}
            onChange={(e) => updateDraft("lie", e.target.value)}
          >
            {LIE_OPTIONS.map((lie) => (
              <option key={lie} value={lie}>
                {lie === "all" ? "All lies" : lie}
              </option>
            ))}
          </select>
        </div>

        {showStrikeFilter ? (
          <div>
            <label style={styles.label}>Ball-striking</label>
            <select
              style={styles.inputCompact}
              value={draftFilters.strike}
              onChange={(e) => updateDraft("strike", e.target.value)}
            >
              {STRIKE_OPTIONS.map((strike) => (
                <option key={strike} value={strike}>
                  {strike === "all" ? "All" : strike.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}
      </div>

      <label style={styles.label}>Tag</label>
      <input
        style={styles.inputCompact}
        type="text"
        value={draftFilters.tagFilter}
        onChange={(e) => updateDraft("tagFilter", e.target.value)}
        placeholder="rain, windy, tournament"
      />

      <label style={styles.label}>Existing tags</label>
      {availableTags.length === 0 ? (
        <p style={styles.mutedText}>No saved tags yet.</p>
      ) : (
        <div style={styles.tagRowCompact}>
          {availableTags.map((tag) => {
            const selected =
              String(draftFilters.tagFilter || "").trim().toLowerCase() === tag.toLowerCase()

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
                onClick={() => updateDraft("tagFilter", selected ? "" : tag)}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}

      <button style={styles.primaryButton} type="submit" disabled={loading}>
        {loading ? "Loading..." : "Apply Filter"}
      </button>
      {statusText ? <p style={styles.filterStatusText}>{statusText}</p> : null}
    </form>
  )
}
