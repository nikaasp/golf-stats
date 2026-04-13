import { useCallback, useEffect, useMemo, useState } from "react"
import SgLineChart from "./SgLineChart"
import PercentLineChart from "./PercentLineChart"
import PuttsLineChart from "./PuttsLineChart"
import PieChart from "./PieChart"
import RoundFilters from "./RoundFilters"
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
import {
  hydrateRoundsWithStoredTags,
  roundMatchesTagFilter,
} from "../utils/roundTags"

export default function AnalyticsScreen({ courses, styles, goHome }) {
  const today = new Date().toISOString().slice(0, 10)

  const [page, setPage] = useState(0)
  const pages = ["SG", "Accuracy", "Misses"]

  const [draftStartDate, setDraftStartDate] = useState("")
  const [draftEndDate, setDraftEndDate] = useState(today)
  const [draftCourseId, setDraftCourseId] = useState("all")
  const [draftTagFilter, setDraftTagFilter] = useState("")

  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: today,
    courseId: "all",
    tagFilter: "",
  })

  const [loading, setLoading] = useState(false)
  const [rounds, setRounds] = useState([])
  const [shots, setShots] = useState([])
  const [holes, setHoles] = useState([])

  const applyFilters = useCallback(() => {
    setAppliedFilters({
      startDate: draftStartDate,
      endDate: draftEndDate,
      courseId: draftCourseId,
      tagFilter: draftTagFilter,
    })
  }, [draftCourseId, draftEndDate, draftStartDate, draftTagFilter])

  const loadAnalytics = useCallback(async () => {
    setLoading(true)

    const roundsRes = await fetchRoundsForAnalytics({
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      courseId: appliedFilters.courseId,
    })

    if (roundsRes.error) {
      setLoading(false)
      alert("Could not load analytics rounds: " + roundsRes.error.message)
      return
    }

    const taggedRounds = hydrateRoundsWithStoredTags(roundsRes.data || [])
    const filteredRounds = taggedRounds.filter((round) =>
      roundMatchesTagFilter(round, appliedFilters.tagFilter)
    )

    setRounds(filteredRounds)

    const roundIds = filteredRounds.map((round) => round.id)

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
  }, [appliedFilters])

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadAnalytics()
    }, 0)

    return () => clearTimeout(timerId)
  }, [loadAnalytics])

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
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Analytics</h1>
          <p style={styles.mutedText}>Filter your rounds and view trends across sessions.</p>

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

          <RoundFilters
            styles={styles}
            courses={courses}
            startDate={draftStartDate}
            setStartDate={setDraftStartDate}
            endDate={draftEndDate}
            setEndDate={setDraftEndDate}
            courseId={draftCourseId}
            setCourseId={setDraftCourseId}
            tagFilter={draftTagFilter}
            setTagFilter={setDraftTagFilter}
            onApply={applyFilters}
            loading={loading}
          />
        </div>
      </div>

      <div style={styles.fixedMainSection}>
        {page === 0 && <SgLineChart data={timeline} slopes={slopes} styles={styles} />}

        {page === 1 && (
          <div style={styles.fixedChartGrid}>
            <PercentLineChart data={accuracyTimeline} styles={styles} />
            <PuttsLineChart data={puttsTimeline} styles={styles} />
          </div>
        )}

        {page === 2 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Miss Patterns by Category</h2>

            {missPatternCharts.length === 0 ? (
              <p style={styles.mutedText}>No miss pattern data available.</p>
            ) : (
              <div style={styles.fixedChartGrid}>
                {missPatternCharts.slice(0, 2).map((chart) => (
                  <PieChart key={chart.key} title={chart.title} data={chart.data} styles={styles} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.fixedBottomSection}>
        <div style={styles.bottomNavRow}>
          <button style={styles.secondaryButton} onClick={goHome}>
            Home
          </button>

          <button style={styles.primaryButton} onClick={goHome}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
