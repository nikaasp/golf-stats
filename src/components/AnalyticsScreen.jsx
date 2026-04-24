import { useCallback, useEffect, useMemo, useState } from "react"
import SgLineChart from "./SgLineChart"
import PercentLineChart from "./PercentLineChart"
import RoundFilters from "./RoundFilters"
import TrendMetricLineChart from "./TrendMetricLineChart"
import {
  fetchRoundsForAnalytics,
  fetchShotsForRoundIds,
  fetchHolesForRoundIds,
} from "../services/analyticsService"
import {
  buildAccuracyTimeline,
  buildApproachShortGameTimeline,
  buildOffTeeTimeline,
  buildPuttingSplitTimeline,
  buildScoringTimeline,
  buildSgTimeline,
} from "../utils/analyticsTransforms"
import {
  collectAvailableTags,
  hydrateRoundsWithStoredTags,
  roundMatchesTagFilter,
} from "../utils/roundTags"

function getCourseLabel(courses, courseId) {
  if (!courseId || courseId === "all") return "All courses"
  return courses.find((course) => String(course.id) === String(courseId))?.name || "Course"
}

function formatValue(value, suffix = "", decimals = 1) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return "-"
  return `${numeric.toFixed(decimals)}${suffix}`
}

function findLatestFinite(data = [], key) {
  for (let i = data.length - 1; i >= 0; i -= 1) {
    const value = Number(data[i]?.[key])
    if (Number.isFinite(value)) return value
  }
  return null
}

function findSlopeDirection(data = [], key) {
  const values = data
    .map((row) => Number(row?.[key]))
    .filter((value) => Number.isFinite(value))

  if (values.length < 2) return null
  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first
  if (Math.abs(delta) < 1) return "steady"
  return delta > 0 ? "up" : "down"
}

function KeyTakeaways({ items, styles }) {
  return (
    <div style={styles.sectionCardCompact}>
      <h2 style={styles.sectionTitle}>Key Takeaways</h2>
      <div style={styles.analyticsTable}>
        {items.map((item) => (
          <div key={item.title} style={styles.analyticsTableRow}>
            <strong>{item.title}</strong>
            <span>{item.value}</span>
            <span>{item.note}</span>
            <span>{item.context}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsScreen({ courses, styles, goHome }) {
  const today = new Date().toISOString().slice(0, 10)

  const [page, setPage] = useState(0)
  const pages = [
    "Filter",
    "Takeaways",
    "SG",
    "Accuracy",
    "Mistakes",
    "Off The Tee",
    "Approach",
    "Putting",
  ]

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
  const [availableTags, setAvailableTags] = useState([])

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
    setAvailableTags(collectAvailableTags(taggedRounds))
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

  const { timeline, slopes } = useMemo(() => buildSgTimeline(rounds, shots), [rounds, shots])
  const accuracyTimeline = useMemo(() => buildAccuracyTimeline(rounds, holes), [rounds, holes])
  const scoringTimeline = useMemo(
    () => buildScoringTimeline(rounds, holes, shots),
    [rounds, holes, shots]
  )
  const offTeeTimeline = useMemo(
    () => buildOffTeeTimeline(rounds, holes, shots),
    [rounds, holes, shots]
  )
  const approachTimeline = useMemo(
    () => buildApproachShortGameTimeline(rounds, shots),
    [rounds, shots]
  )
  const puttingTimeline = useMemo(
    () => buildPuttingSplitTimeline(rounds, holes),
    [rounds, holes]
  )

  const takeaways = useMemo(() => {
    const latestTotal = findLatestFinite(timeline, "total")
    const fairwayTrend = findSlopeDirection(accuracyTimeline, "fairwayPct")
    const latestDrive = findLatestFinite(offTeeTimeline, "avgDriveDistance")
    const latestOnePutt = findLatestFinite(puttingTimeline, "onePuttPct")
    const latestMistakes = findLatestFinite(scoringTimeline, "penaltyStrokes")

    return [
      {
        title: "Overall SG",
        value: formatValue(latestTotal),
        note:
          latestTotal == null
            ? "No SG rounds yet"
            : latestTotal >= 0
            ? "Latest round finished positive"
            : "Latest round finished below baseline",
        context: "Latest filtered round",
      },
      {
        title: "Driving",
        value: formatValue(latestDrive, " m"),
        note: "Average distance on par 4s and 5s only",
        context: "Off-the-tee focus",
      },
      {
        title: "Fairway trend",
        value:
          fairwayTrend === "up"
            ? "Improving"
            : fairwayTrend === "down"
            ? "Falling"
            : fairwayTrend === "steady"
            ? "Stable"
            : "-",
        note: "Based on fairway % across filtered rounds",
        context: "Accuracy",
      },
      {
        title: "Putting",
        value: formatValue(latestOnePutt, "%"),
        note: "Latest 1-putt rate",
        context: formatValue(latestMistakes, " penalties", 0),
      },
    ]
  }, [accuracyTimeline, offTeeTimeline, puttingTimeline, scoringTimeline, timeline])

  const filterSummary = [
    `Period: ${appliedFilters.startDate || "any"} - ${appliedFilters.endDate || "any"}`,
    `Course: ${getCourseLabel(courses, appliedFilters.courseId)}`,
    `Tag: ${appliedFilters.tagFilter || "all"}`,
  ]

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

          <div style={styles.analyticsFilterSummaryCard}>
            <div style={styles.inRoundHeaderTop}>Active filters</div>
            <div style={styles.analyticsFilterSummary}>
              {filterSummary.map((item) => (
                <span key={item} style={styles.analyticsFilterSummaryChip}>
                  {item}
                </span>
              ))}
            </div>
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
              availableTags={availableTags}
              onApply={applyFilters}
              loading={loading}
            />
            <p style={styles.filterStatusText}>
              {loading ? "Loading trends..." : `Showing ${rounds.length} rounds.`}
            </p>
          </div>
        )}

        {page === 1 && <KeyTakeaways items={takeaways} styles={styles} />}

        {page === 2 && <SgLineChart data={timeline} slopes={slopes} styles={styles} />}

        {page === 3 && (
          <div style={styles.fixedChartGrid}>
            <PercentLineChart data={accuracyTimeline} styles={styles} />
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
              title="Scrambling, Up-and-Down, and Sand Save %"
              data={scoringTimeline}
              styles={styles}
              yDomain={[0, 100]}
              valueSuffix="%"
              series={[
                { key: "scramblePct", name: "Scramble %", color: "#16a34a" },
                { key: "upDownPct", name: "Up/down %", color: "#2563eb" },
                { key: "sandSavePct", name: "Sand save %", color: "#d97706" },
              ]}
            />
          </div>
        )}

        {page === 5 && (
          <div style={styles.fixedChartGrid}>
            <TrendMetricLineChart
              title="Average Driving Distance by Round"
              data={offTeeTimeline}
              styles={styles}
              valueSuffix=" m"
              series={[
                {
                  key: "avgDriveDistance",
                  name: "Avg drive distance (par 4s and 5s only)",
                  color: "#2563eb",
                },
              ]}
            />
            <TrendMetricLineChart
              title="Positive SG Off the Tee by Hole Type"
              data={offTeeTimeline}
              styles={styles}
              yDomain={[0, 100]}
              valueSuffix="%"
              series={[
                { key: "teePositivePar3Pct", name: "Par 3", color: "#16a34a" },
                { key: "teePositivePar4Pct", name: "Par 4", color: "#2563eb" },
                { key: "teePositivePar5Pct", name: "Par 5", color: "#7c3aed" },
              ]}
            />
          </div>
        )}

        {page === 6 && (
          <div style={styles.fixedChartGrid}>
            <TrendMetricLineChart
              title="Average Leave by Distance Band"
              data={approachTimeline}
              styles={styles}
              valueSuffix=" m"
              series={[
                { key: "band0_50Proximity", name: "0-50 m", color: "#0f766e" },
                { key: "band50_100Proximity", name: "50-100 m", color: "#16a34a" },
                { key: "band100_150Proximity", name: "100-150 m", color: "#2563eb" },
                { key: "band150_200Proximity", name: "150-200 m", color: "#7c3aed" },
                { key: "band200PlusProximity", name: "200+ m", color: "#dc2626" },
              ]}
            />
            <TrendMetricLineChart
              title="Green Hit % by Distance Band"
              data={approachTimeline}
              styles={styles}
              yDomain={[0, 100]}
              valueSuffix="%"
              series={[
                { key: "band0_50GreenPct", name: "0-50 m", color: "#0f766e" },
                { key: "band50_100GreenPct", name: "50-100 m", color: "#16a34a" },
                { key: "band100_150GreenPct", name: "100-150 m", color: "#2563eb" },
                { key: "band150_200GreenPct", name: "150-200 m", color: "#7c3aed" },
                { key: "band200PlusGreenPct", name: "200+ m", color: "#dc2626" },
              ]}
            />
          </div>
        )}

        {page === 7 && (
          <div style={styles.fixedChartGrid}>
            <TrendMetricLineChart
              title="Putting Split per Round"
              data={puttingTimeline}
              styles={styles}
              yDomain={[0, 100]}
              valueSuffix="%"
              series={[
                { key: "onePuttPct", name: "1-putt %", color: "#16a34a" },
                { key: "twoPuttPct", name: "2-putt %", color: "#2563eb" },
                { key: "threePlusPuttPct", name: "3-putt+ %", color: "#dc2626" },
              ]}
            />
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
