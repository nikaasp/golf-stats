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
  const [newCourseName, setNewCourseName] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [roundTags, setRoundTags] = useState([])

  const addTag = () => {
    const cleaned = tagInput.trim()
    if (!cleaned) return
    if (roundTags.includes(cleaned)) return
    setRoundTags((prev) => [...prev, cleaned])
    setTagInput("")
  }

  const removeTag = (tagToRemove) => {
    setRoundTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleCreateCourse = async () => {
    const cleaned = newCourseName.trim()
    if (!cleaned) return
    await createCourse(cleaned)
    setNewCourseName("")
  }

  return (
    <div style={styles.screenContainer}>
      <h1 style={styles.pageTitle}>Play Round</h1>

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

      <div style={{ height: 16 }} />

      <label style={styles.label}>New course</label>
      <div style={styles.inlineRow}>
        <input
          type="text"
          value={newCourseName}
          onChange={(e) => setNewCourseName(e.target.value)}
          placeholder="Type course name"
          style={styles.textInput}
        />
        <button type="button" style={styles.secondaryButton} onClick={handleCreateCourse}>
          Save
        </button>
      </div>

      <div style={{ height: 16 }} />

      <label style={styles.label}>Round tags</label>
      <div style={styles.inlineRow}>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="rainy, played with Matt..."
          style={styles.textInput}
        />
        <button type="button" style={styles.secondaryButton} onClick={addTag}>
          Add
        </button>
      </div>

      <div style={styles.tagRow}>
        {roundTags.map((tag) => (
          <button
            key={tag}
            type="button"
            style={styles.tagChip}
            onClick={() => removeTag(tag)}
          >
            {tag} ×
          </button>
        ))}
      </div>

      <div style={{ height: 20 }} />

      <div style={styles.inlineRow}>
        <button type="button" style={styles.secondaryButton} onClick={goHome}>
          Back
        </button>

        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => startRound({ roundTags })}
        >
          Play Round
        </button>
      </div>
    </div>
  )
}