import { useCallback, useEffect, useMemo, useState } from "react"
import SgLineChart from "./SgLineChart"
import PercentLineChart from "./PercentLineChart"
import PuttsLineChart from "./PuttsLineChart"
import FirstPuttDistanceLineChart from "./FirstPuttDistanceLineChart"
import MissPatternBarChart from "./MissPatternBarChart"
import RoundFilters from "./RoundFilters"
import TrendMetricLineChart from "./TrendMetricLineChart"
import {
  fetchRoundsForAnalytics,
  fetchShotsForRoundIds,
  fetchHolesForRoundIds,
} from "../services/analyticsService"
import {
  buildSgTimeline,
  buildAccuracyTimeline,
  buildPuttsTimeline,
  buildScoringTimeline,
  buildApproachProximityBandSummary,
  buildFirstPuttDistanceTimeline,
  buildMissPatternByCategoryFromShots,
} from "../utils/analyticsTransforms"
import { SG_CATEGORY_LABELS } from "../utils/sgConfig"
import {
  hydrateRoundsWithStoredTags,
  roundMatchesTagFilter,
} from "../utils/roundTags"

function sumMissCounts(grouped = {}) {
  return Object.values(grouped).reduce((acc, counts) => {
    for (const [key, value] of Object.entries(counts || {})) {
      acc[key] = Number(acc[key] || 0) + Number(value || 0)
    }
    return acc
  }, {})
}

function countMisses(counts = {}) {
  return Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0)
}

export default function AnalyticsScreen({ courses, styles, goHome }) {
  const today = new Date().toISOString().slice(0, 10)

  const [page, setPage] = useState(0)
  const [missChartIndex, setMissChartIndex] = useState(0)
  const pages = ["Filter", "SG", "Accuracy", "Putting", "Mistakes", "Approach", "Misses"]

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
      alert("Could not load trend rounds: " + roundsRes.error.message)
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
      alert("Could not load trend shots: " + shotsRes.error.message)
      return
    }

    if (holesRes.error) {
      alert("Could not load trend holes: " + holesRes.error.message)
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

  const firstPuttDistanceTimeline = useMemo(
    () => buildFirstPuttDistanceTimeline(rounds, shots),
    [rounds, shots]
  )

  const scoringTimeline = useMemo(
    () => buildScoringTimeline(rounds, holes),
    [rounds, holes]
  )

  const approachBandSummary = useMemo(
    () => buildApproachProximityBandSummary(shots),
    [shots]
  )

  const avgPuttsAcrossRounds = useMemo(() => {
    const values = puttsTimeline
      .map((row) => Number(row.avgPutts))
      .filter((value) => Number.isFinite(value))

    if (values.length === 0) return "-"
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)
  }, [puttsTimeline])

  const firstPuttStats = useMemo(() => {
    const totals = firstPuttDistanceTimeline.reduce(
      (acc, row) => {
        const distance = Number(row.avgFirstPuttDistance)
        const count = Number(row.firstPuttHoleCount || 0)

        if (Number.isFinite(distance) && count > 0) {
          acc.distance += distance * count
          acc.count += count
        }

        return acc
      },
      { distance: 0, count: 0 }
    )

    return {
      avgDistance:
        totals.count > 0 ? (totals.distance / totals.count).toFixed(1) : "-",
      holeCount: totals.count,
    }
  }, [firstPuttDistanceTimeline])

  const missPatternCharts = useMemo(() => {
    const grouped = buildMissPatternByCategoryFromShots(shots)
    const overallCounts = sumMissCounts(grouped)

    const categoryCharts = Object.entries(grouped)
      .map(([categoryKey, counts]) => ({
        key: categoryKey,
        title: SG_CATEGORY_LABELS[categoryKey] || categoryKey,
        counts,
        total: countMisses(counts),
      }))
      .filter((chart) => chart.total > 0)

    return [
      {
        key: "overall",
        title: "All Misses",
        counts: overallCounts,
        total: countMisses(overallCounts),
      },
      ...categoryCharts,
    ].filter((chart) => chart.total > 0)
  }, [shots])

  const activeMissChart =
    missPatternCharts[Math.min(missChartIndex, Math.max(0, missPatternCharts.length - 1))]

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Trends</h1>

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
            <p style={styles.filterStatusText}>
              {loading ? "Loading trends..." : `Showing ${rounds.length} rounds.`}
            </p>
          </div>
        )}

        {page === 1 && <SgLineChart data={timeline} slopes={slopes} styles={styles} />}

        {page === 2 && (
          <div style={styles.fixedChartGrid}>
            <PercentLineChart data={accuracyTimeline} styles={styles} />
          </div>
        )}

        {page === 3 && (
          <div style={styles.fixedChartGrid}>
            <div style={styles.puttingStatsGrid}>
              <div style={styles.compactMetricCard}>
                <div style={styles.compactMetricValue}>{avgPuttsAcrossRounds}</div>
                <div style={styles.compactMetricLabel}>Avg putts per round</div>
              </div>
              <div style={styles.compactMetricCard}>
                <div style={styles.compactMetricValue}>{puttsTimeline.length}</div>
                <div style={styles.compactMetricLabel}>Rounds in filter</div>
              </div>
            </div>
            <PuttsLineChart data={puttsTimeline} styles={styles} />
          </div>
        )}

        {page === 4 && (
          <div style={styles.fixedChartGrid}>
            <TrendMetricLineChart
              title="Penalties per Round"
              data={scoringTimeline}
              styles={styles}
              series={[
                { key: "penaltyStrokes", name: "Penalty strokes", color: "#dc2626" },
                { key: "penaltyHoles", name: "Penalty holes", color: "#f97316" },
              ]}
            />
            <TrendMetricLineChart
              title="Scrambling and Putting Rates"
              data={scoringTimeline}
              styles={styles}
              yDomain={[0, 100]}
              valueSuffix="%"
              series={[
                { key: "scramblePct", name: "Scramble %", color: "#16a34a" },
                { key: "upDownPct", name: "Up/down %", color: "#2563eb" },
                { key: "threePuttPct", name: "3-putt %", color: "#dc2626" },
                { key: "onePuttPct", name: "1-putt %", color: "#0f766e" },
              ]}
            />
          </div>
        )}

        {page === 5 && (
          <div style={styles.fixedChartGrid}>
            <div style={styles.puttingStatsGrid}>
              <div style={styles.compactMetricCard}>
                <div style={styles.compactMetricValue}>
                  {firstPuttStats.avgDistance === "-"
                    ? "-"
                    : `${firstPuttStats.avgDistance} m`}
                </div>
                <div style={styles.compactMetricLabel}>Avg 1st putt distance</div>
              </div>
              <div style={styles.compactMetricCard}>
                <div style={styles.compactMetricValue}>{firstPuttStats.holeCount}</div>
                <div style={styles.compactMetricLabel}>Holes with 1st putt</div>
              </div>
            </div>
            <FirstPuttDistanceLineChart
              data={firstPuttDistanceTimeline}
              styles={styles}
            />
            <div style={styles.sectionCardCompact}>
              <h2 style={styles.sectionTitle}>Approach Proximity Bands</h2>
              <div style={styles.statsGrid}>
                {approachBandSummary.map((band) => (
                  <div key={band.band} style={styles.compactMetricCard}>
                    <div style={styles.compactMetricValue}>
                      {band.avgProximity == null
                        ? "-"
                        : `${Number(band.avgProximity).toFixed(1)} m`}
                    </div>
                    <div style={styles.compactMetricLabel}>
                      {band.band} m ({band.count})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 6 && (
          <div style={styles.sectionCardCompact}>
            {missPatternCharts.length === 0 ? (
              <p style={styles.mutedText}>No miss pattern data available.</p>
            ) : (
              <>
                <div style={styles.compactChipWrap}>
                  {missPatternCharts.map((chart, index) => (
                    <button
                      key={chart.key}
                      type="button"
                      style={{
                        ...styles.screenStepPill,
                        ...(index === missChartIndex ? styles.screenStepPillActive : {}),
                      }}
                      onClick={() => setMissChartIndex(index)}
                    >
                      {chart.title}
                    </button>
                  ))}
                </div>
                <MissPatternBarChart
                  title={activeMissChart?.title || "Miss Patterns"}
                  counts={activeMissChart?.counts}
                  styles={styles}
                />
              </>
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
