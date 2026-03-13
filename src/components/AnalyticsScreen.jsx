import { useEffect, useMemo, useState } from "react"
import SgLineChart from "./SgLineChart"
import PercentLineChart from "./PercentLineChart"
import PuttsLineChart from "./PuttsLineChart"
import PieChart from "./PieChart"
import {
  fetchRoundsForAnalytics,
  fetchShotsForRoundIds,
  fetchHolesForRoundIds,
} from "../services/analyticsService"
import {
  buildSgTimeline,
  buildAccuracyTimeline,
  buildPuttsTimeline,
  buildMissPatternByCategoryFromShots,
} from "../utils/analyticsTransforms"
import {
  MISS_PATTERN_LABELS,
  MISS_PATTERN_ORDER,
  MISS_PATTERN_COLORS,
} from "../utils/missPatternConfig"

import { SG_CATEGORY_LABELS } from "../utils/sgConfig"

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
  const [holes, setHoles] = useState([])

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

    const [shotsRes, holesRes] = await Promise.all([
      fetchShotsForRoundIds(roundIds),
      fetchHolesForRoundIds(roundIds),
    ])

    setLoading(false)

    if (shotsRes.error) {
      alert("Could not load analytics shots: " + shotsRes.error.message)
      return
    }

    if (holesRes.error) {
      alert("Could not load analytics holes: " + holesRes.error.message)
      return
    }

    setShots(shotsRes.data || [])
    setHoles(holesRes.data || [])
  }

  const { timeline, slopes } = useMemo(
    () => buildSgTimeline(rounds, shots),
    [rounds, shots]
  )

  const accuracyTimeline = useMemo(
    () => buildAccuracyTimeline(rounds, holes),
    [rounds, holes]
  )

  const puttsTimeline = useMemo(
    () => buildPuttsTimeline(rounds, holes),
    [rounds, holes]
  )

  const missPatternCharts = useMemo(() => {
    const grouped = buildMissPatternByCategoryFromShots(shots)

    return Object.entries(grouped)
      .map(([categoryKey, counts]) => ({
        key: categoryKey,
        title: SG_CATEGORY_LABELS[categoryKey] || categoryKey,
        data: MISS_PATTERN_ORDER
          .map((key) => ({
            key,
            value: counts[key] || 0,
          }))
          .filter((d) => d.value > 0)
          .map((d) => ({
            label: MISS_PATTERN_LABELS[d.key],
            value: d.value,
            color: MISS_PATTERN_COLORS[d.key],
          })),
      }))
      .filter((chart) => chart.data.length > 0)
  }, [shots])

  return (
    <div style={styles.page}>
      <div style={styles.mobileShell}>
        <div style={styles.sectionCard}>
          <h1 style={styles.heroTitle}>Analytics</h1>
          <p style={styles.mutedText}>
            Filter your rounds and view strokes gained, accuracy, putts, and miss patterns over time.
          </p>

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
        <PercentLineChart data={accuracyTimeline} styles={styles} />
        <PuttsLineChart data={puttsTimeline} styles={styles} />

        {missPatternCharts.length > 0 && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Miss Patterns by Category</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "12px",
              }}
            >
              {missPatternCharts.map((chart) => (
                <div key={chart.key} style={{ minWidth: 0 }}>
                  <PieChart title={chart.title} data={chart.data} styles={styles} />
                </div>
              ))}
            </div>
          </div>
        )}

        <button style={styles.primaryButton} onClick={goHome}>
          Back to Home
        </button>
      </div>
    </div>
  )
}