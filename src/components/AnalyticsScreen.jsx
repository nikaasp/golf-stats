import { useEffect, useMemo, useState } from "react"
import SgLineChart from "./SgLineChart"
import {
  fetchRoundsForAnalytics,
  fetchShotsForRoundIds,
} from "../services/analyticsService"
import { buildSgTimeline } from "../utils/analyticsTransforms"

export default function AnalyticsScreen({
  courses,
  styles,
  goHome,
}) {
  const today = new Date().toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState(today)
  const [courseId, setCourseId] = useState("all")
  const [loading, setLoading] = useState(false)

  const [rounds, setRounds] = useState([])
  const [shots, setShots] = useState([])

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    setLoading(true)

    const roundsRes = await fetchRoundsForAnalytics({
      startDate,
      endDate,
      courseId,
    })

    if (roundsRes.error) {
      setLoading(false)
      alert("Could not load analytics rounds: " + roundsRes.error.message)
      return
    }

    const roundsData = roundsRes.data || []
    setRounds(roundsData)

    const roundIds = roundsData.map((r) => r.id)
    const shotsRes = await fetchShotsForRoundIds(roundIds)

    setLoading(false)

    if (shotsRes.error) {
      alert("Could not load analytics shots: " + shotsRes.error.message)
      return
    }

    setShots(shotsRes.data || [])
  }

  const { timeline, slopes } = useMemo(
  () => buildSgTimeline(rounds, shots),
  [rounds, shots]
  )

  return (
    <div style={styles.page}>
      <div style={styles.mobileShell}>
        <div style={styles.sectionCard}>
          <h1 style={styles.heroTitle}>Analytics</h1>
          <p style={styles.mutedText}>Filter your rounds and view strokes gained over time.</p>

          <label style={styles.label}>Start date</label>
          <input
            style={styles.input}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label style={styles.label}>End date</label>
          <input
            style={styles.input}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <label style={styles.label}>Course</label>
          <select
            style={styles.input}
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

          <button style={styles.primaryButton} onClick={loadAnalytics} disabled={loading}>
            {loading ? "Loading..." : "Apply Filter"}
          </button>
        </div>

        <SgLineChart data={timeline} slopes={slopes} styles={styles} />

        <button style={styles.primaryButton} onClick={goHome}>
          Back to Home
        </button>
      </div>
    </div>
  )
}