import { useState } from "react"

export default function PlayRoundScreen({
  courses,
  selectedCourseId,
  setSelectedCourseId,
  createCourse,
  startRound,
  goHome,
  styles,
}) {
  const [page, setPage] = useState(0)
  const [newCourseName, setNewCourseName] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [roundTags, setRoundTags] = useState([])
  const pages = ["Course", "Tags"]

  const handleCreateCourse = async () => {
    const cleaned = newCourseName.trim()
    if (!cleaned) return
    await createCourse(cleaned)
    setNewCourseName("")
  }

  const addTag = () => {
    const cleaned = tagInput.trim()
    if (!cleaned || roundTags.includes(cleaned)) return
    setRoundTags((prev) => [...prev, cleaned])
    setTagInput("")
  }

  const removeTag = (tagToRemove) => {
    setRoundTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Play Round</h1>

          <div style={styles.screenStepPills}>
            {pages.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setPage(index)}
                style={{
                  ...styles.screenStepPill,
                  ...(page === index ? styles.screenStepPillActive : {}),
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.fixedMainSection}>
        {page === 0 && (
          <div style={styles.sectionCardCompact}>
            <label style={styles.label}>Existing course</label>
            <select
              value={selectedCourseId || ""}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={styles.selectInput}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <label style={styles.label}>New course</label>
            <div style={styles.inlineRow}>
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Type course name"
                style={styles.textInput}
              />
              <button
                type="button"
                style={styles.secondaryButtonCompact}
                onClick={handleCreateCourse}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {page === 1 && (
          <div style={styles.sectionCardCompact}>
            <label style={styles.label}>Round tags</label>
            <div style={styles.inlineRow}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="rain, windy, casual"
                style={styles.textInput}
              />
              <button
                type="button"
                style={styles.secondaryButtonCompact}
                onClick={addTag}
              >
                Add
              </button>
            </div>

            <div style={styles.tagRowCompact}>
              {roundTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  style={styles.tagChip}
                  onClick={() => removeTag(tag)}
                >
                  {tag} x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.fixedBottomSection}>
        <div style={styles.bottomNavRow}>
          <button type="button" style={styles.secondaryButton} onClick={goHome}>
            Back
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => startRound(roundTags)}
          >
            Play Round
          </button>
        </div>
      </div>
    </div>
  )
}
