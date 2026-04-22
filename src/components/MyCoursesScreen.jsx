import { useMemo, useState } from "react"

const HOLE_COUNT = 18

function formatDate(value) {
  if (!value) return "Not played yet"
  return String(value).slice(0, 10)
}

function makeHoleDraft(course) {
  const savedHoles = Array.isArray(course?.hole_pars) ? course.hole_pars : []

  return Array.from({ length: HOLE_COUNT }, (_, index) => {
    const holeNumber = index + 1
    const saved = savedHoles.find((item) => Number(item?.hole) === holeNumber) || {}

    return {
      hole: holeNumber,
      par: saved.par ?? null,
      length_m: saved.length_m ?? "",
      hole_index: saved.hole_index ?? saved.index ?? "",
    }
  })
}

function normalizeOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeHoleDrafts(holes) {
  return holes.map((hole) => ({
    hole: hole.hole,
    par: normalizeOptionalNumber(hole.par),
    length_m: normalizeOptionalNumber(hole.length_m),
    hole_index: normalizeOptionalNumber(hole.hole_index),
  }))
}

function getConfiguredHoleCount(course) {
  const holes = Array.isArray(course?.hole_pars) ? course.hole_pars : []
  return holes.filter(
    (hole) =>
      (hole?.par !== null && hole?.par !== undefined) ||
      hole?.length_m ||
      hole?.hole_index
  ).length
}

export default function MyCoursesScreen({
  courses,
  loading,
  renameCourse,
  deleteCourse,
  goHome,
  styles,
}) {
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [draftName, setDraftName] = useState(null)
  const [draftHoles, setDraftHoles] = useState(null)
  const [status, setStatus] = useState("")

  const sortedCourses = useMemo(
    () =>
      [...courses].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      ),
    [courses]
  )

  const selectedCourse = useMemo(
    () => sortedCourses.find((course) => course.id === selectedCourseId) || null,
    [selectedCourseId, sortedCourses]
  )

  const isEditing = Boolean(selectedCourse)
  const currentDraftName = draftName ?? selectedCourse?.name ?? ""
  const currentDraftHoles = draftHoles ?? makeHoleDraft(selectedCourse)

  const updateHoleDraft = (holeNumber, field, value) => {
    setDraftHoles(
      currentDraftHoles.map((hole) =>
        hole.hole === holeNumber ? { ...hole, [field]: value } : hole
      )
    )
    setStatus("")
  }

  const handleSave = async () => {
    if (!selectedCourse) return
    const ok = await renameCourse(
      selectedCourse,
      currentDraftName,
      normalizeHoleDrafts(currentDraftHoles)
    )

    if (ok) {
      setStatus(`${currentDraftName.trim() || selectedCourse.name} saved`)
      setSelectedCourseId("")
      setDraftName(null)
      setDraftHoles(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedCourse) return
    const ok = await deleteCourse(selectedCourse)
    if (ok) {
      setStatus("Course deleted")
      setSelectedCourseId("")
      setDraftName(null)
      setDraftHoles(null)
    }
  }

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div
          style={
            isEditing
              ? { ...styles.sectionCardCompact, ...styles.courseEditorHeader }
              : styles.sectionCardCompact
          }
        >
          {isEditing ? (
            <>
              <label style={styles.labelCompact}>Course name</label>
              <input
                type="text"
                value={currentDraftName}
                onChange={(event) => {
                  setDraftName(event.target.value)
                  setStatus("")
                }}
                style={styles.inputCompact}
              />
              <p style={styles.mutedText}>
                {`${getConfiguredHoleCount(selectedCourse)} holes saved | ${formatDate(
                  selectedCourse.last_played_at
                )}`}
              </p>
            </>
          ) : (
            <>
              <h1 style={styles.pageTitle}>My Courses</h1>
              <p style={styles.mutedText}>
                {courses.length ? `${courses.length} saved courses` : "No saved courses yet."}
              </p>
            </>
          )}
        </div>
      </div>

      {!isEditing ? (
        <div style={styles.courseListPaneFull}>
          {status ? <p style={styles.filterStatusText}>{status}</p> : null}

          {loading && !courses.length ? (
            <div style={styles.sectionCardCompact}>
              <p style={styles.mutedText}>Loading courses...</p>
            </div>
          ) : null}

          {!loading && !courses.length ? (
            <div style={styles.sectionCardCompact}>
              <p style={styles.mutedText}>
                Courses are added when you start or finish rounds.
              </p>
            </div>
          ) : null}

          {sortedCourses.map((course) => (
            <button
              key={course.id}
              type="button"
              style={styles.courseListButton}
              onClick={() => {
                setSelectedCourseId(course.id)
                setDraftName(null)
                setDraftHoles(null)
                setStatus("")
              }}
            >
              <span style={styles.courseListName}>{course.name || "Untitled course"}</span>
              <span style={styles.courseListMeta}>
                {getConfiguredHoleCount(course)} holes saved | {formatDate(course.last_played_at)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div style={styles.courseDetailPane}>
          <div style={styles.courseHoleList}>
            {currentDraftHoles.map((hole) => (
              <div key={hole.hole} style={styles.courseHoleRow}>
                <div style={styles.courseHoleNumber}>Hole {hole.hole}</div>

                <label style={styles.courseHoleField}>
                  <span style={styles.courseHoleLabel}>Tee distance</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={hole.length_m ?? ""}
                    onChange={(event) =>
                      updateHoleDraft(hole.hole, "length_m", event.target.value)
                    }
                    style={styles.inputCompact}
                  />
                </label>

                <label style={styles.courseHoleField}>
                  <span style={styles.courseHoleLabel}>Index</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="18"
                    value={hole.hole_index ?? ""}
                    onChange={(event) =>
                      updateHoleDraft(hole.hole, "hole_index", event.target.value)
                    }
                    style={styles.inputCompact}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.fixedBottomSection}>
        {isEditing ? (
          <>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                setSelectedCourseId("")
                setDraftName(null)
                setDraftHoles(null)
                setStatus("")
              }}
            >
              Back to Courses
            </button>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={handleSave}
              disabled={loading}
            >
              Save Edits
            </button>

            <button
              type="button"
              style={styles.deleteRoundButton}
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Course
            </button>
          </>
        ) : null}

        <button type="button" style={styles.secondaryButton} onClick={goHome}>
          Home
        </button>
      </div>
    </div>
  )
}
