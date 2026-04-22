import { useCallback, useEffect, useMemo, useState } from "react"
import MissPatternBarChart from "./MissPatternBarChart"
import {
  fetchRoundsForAnalytics,
  fetchShotsForRoundIds,
} from "../services/analyticsService"
import {
  hydrateRoundsWithStoredTags,
  roundMatchesTagFilter,
} from "../utils/roundTags"

const LIE_OPTIONS = ["all", "Tee", "Fairway", "Rough", "Sand", "Recovery", "Green"]
const STRIKE_OPTIONS = ["all", "poor", "ok", "pure"]
const PAGES = ["Filter", "Overview", "Lies", "Strike", "Misses"]

function finiteNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function average(values = []) {
  const finite = values.filter((value) => Number.isFinite(value))
  if (finite.length === 0) return null
  return finite.reduce((sum, value) => sum + value, 0) / finite.length
}

function median(values = []) {
  const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
  if (finite.length === 0) return null
  const middle = Math.floor(finite.length / 2)
  return finite.length % 2 === 0
    ? (finite[middle - 1] + finite[middle]) / 2
    : finite[middle]
}

function formatNumber(value, decimals = 2, suffix = "") {
  if (!Number.isFinite(value)) return "-"
  return `${value.toFixed(decimals)}${suffix}`
}

function summarizeShots(shots = []) {
  const sgValues = shots.map((shot) => finiteNumber(shot.strokes_gained)).filter((v) => v !== null)
  const endDistances = shots
    .map((shot) => finiteNumber(shot.endDistance))
    .filter((v) => v !== null)
  const misses = shots.filter((shot) => shot.miss_pattern).length
  const positiveSg = sgValues.filter((value) => value > 0).length

  return {
    count: shots.length,
    avgSg: average(sgValues),
    medianSg: median(sgValues),
    positivePct: sgValues.length > 0 ? (positiveSg / sgValues.length) * 100 : null,
    avgEndDistance: average(endDistances),
    missRate: shots.length > 0 ? (misses / shots.length) * 100 : null,
  }
}

function buildShotRows(shots = []) {
  const grouped = {}

  for (const shot of shots) {
    const roundKey = String(shot.round_id)
    const holeKey = String(shot.hole_number)
    if (!grouped[roundKey]) grouped[roundKey] = {}
    if (!grouped[roundKey][holeKey]) grouped[roundKey][holeKey] = []
    grouped[roundKey][holeKey].push(shot)
  }

  const rows = []

  for (const holeGroups of Object.values(grouped)) {
    for (const holeShots of Object.values(holeGroups)) {
      const sorted = [...holeShots].sort((a, b) => Number(a.shot_number) - Number(b.shot_number))
      sorted.forEach((shot, index) => {
        const nextShot = sorted[index + 1] || null
        rows.push({
          ...shot,
          startDistance: finiteNumber(shot.distance_to_flag),
          endDistance: finiteNumber(nextShot?.distance_to_flag),
        })
      })
    }
  }

  return rows
}

function countMissPatterns(shots = []) {
  return shots.reduce((acc, shot) => {
    if (shot.miss_pattern) {
      acc[shot.miss_pattern] = Number(acc[shot.miss_pattern] || 0) + 1
    }
    return acc
  }, {})
}

function MetricCard({ label, value, styles }) {
  return (
    <div style={styles.compactMetricCard}>
      <div style={styles.compactMetricValue}>{value}</div>
      <div style={styles.compactMetricLabel}>{label}</div>
    </div>
  )
}

function getCourseLabel(courses, courseId) {
  if (!courseId || courseId === "all") return "All courses"
  return courses.find((course) => String(course.id) === String(courseId))?.name || "Course"
}

function getDistanceLabel(filters) {
  const min = filters.minDistance || "0"
  const max = filters.maxDistance || "any"
  return `${min}-${max} m`
}

export default function ShotAnalyticsScreen({ courses, styles, goHome }) {
  const today = new Date().toISOString().slice(0, 10)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rounds, setRounds] = useState([])
  const [shots, setShots] = useState([])

  const [draftFilters, setDraftFilters] = useState({
    startDate: "",
    endDate: today,
    courseId: "all",
    tagFilter: "",
    minDistance: "",
    maxDistance: "",
    lie: "all",
    strike: "all",
  })

  const [appliedFilters, setAppliedFilters] = useState(draftFilters)

  const updateDraft = (field, value) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }))
  }

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
    const roundIds = filteredRounds.map((round) => round.id)
    const shotsRes = await fetchShotsForRoundIds(roundIds)

    setLoading(false)

    if (shotsRes.error) {
      alert("Could not load analytics shots: " + shotsRes.error.message)
      return
    }

    setRounds(filteredRounds)
    setShots(shotsRes.data || [])
  }, [appliedFilters])

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadAnalytics()
    }, 0)

    return () => clearTimeout(timerId)
  }, [loadAnalytics])

  const shotRows = useMemo(() => buildShotRows(shots), [shots])

  const filteredShots = useMemo(() => {
    const minDistance = finiteNumber(appliedFilters.minDistance)
    const maxDistance = finiteNumber(appliedFilters.maxDistance)

    return shotRows.filter((shot) => {
      if (shot.startDistance === null) return false
      if (minDistance !== null && shot.startDistance < minDistance) return false
      if (maxDistance !== null && shot.startDistance > maxDistance) return false
      if (appliedFilters.lie !== "all" && shot.lie !== appliedFilters.lie) return false
      if (
        appliedFilters.strike !== "all" &&
        shot.strike_quality !== appliedFilters.strike
      ) {
        return false
      }
      return true
    })
  }, [appliedFilters, shotRows])

  const summary = useMemo(() => summarizeShots(filteredShots), [filteredShots])

  const lieBreakdown = useMemo(
    () =>
      LIE_OPTIONS.filter((lie) => lie !== "all").map((lie) => ({
        label: lie,
        ...summarizeShots(filteredShots.filter((shot) => shot.lie === lie)),
      })),
    [filteredShots]
  )

  const strikeBreakdown = useMemo(
    () =>
      STRIKE_OPTIONS.filter((strike) => strike !== "all").map((strike) => ({
        label: strike.toUpperCase(),
        ...summarizeShots(filteredShots.filter((shot) => shot.strike_quality === strike)),
      })),
    [filteredShots]
  )

  const missCounts = useMemo(() => countMissPatterns(filteredShots), [filteredShots])
  const filterSummary = [
    `Period: ${appliedFilters.startDate || "any"} - ${appliedFilters.endDate || "any"}`,
    `Course: ${getCourseLabel(courses, appliedFilters.courseId)}`,
    `Distance: ${getDistanceLabel(appliedFilters)}`,
    `Lie: ${appliedFilters.lie === "all" ? "all" : appliedFilters.lie}`,
    `Strike: ${
      appliedFilters.strike === "all" ? "all" : appliedFilters.strike.toUpperCase()
    }`,
    `Tag: ${appliedFilters.tagFilter || "all"}`,
  ]

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Analytics</h1>
          <div style={styles.screenStepPills}>
            {PAGES.map((label, index) => (
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
          <form
            style={styles.sectionCardCompact}
            onSubmit={(event) => {
              event.preventDefault()
              setAppliedFilters(draftFilters)
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
            </div>

            <label style={styles.label}>Tag</label>
            <input
              style={styles.inputCompact}
              type="text"
              value={draftFilters.tagFilter}
              onChange={(e) => updateDraft("tagFilter", e.target.value)}
              placeholder="rain, windy, tournament"
            />

            <button style={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? "Loading..." : "Apply Filter"}
            </button>
            <p style={styles.filterStatusText}>
              Showing {filteredShots.length} shots from {rounds.length} rounds.
            </p>
          </form>
        )}

        {page === 1 && (
          <div style={styles.sectionCardCompact}>
            <div style={styles.statsGrid}>
              <MetricCard label="Shots" value={summary.count} styles={styles} />
              <MetricCard
                label="Positive SG"
                value={formatNumber(summary.positivePct, 1, "%")}
                styles={styles}
              />
              <MetricCard
                label="Avg ending distance"
                value={formatNumber(summary.avgEndDistance, 1, " m")}
                styles={styles}
              />
            </div>
          </div>
        )}

        {page === 2 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>By Lie</h2>
            <div style={styles.analyticsTable}>
              {lieBreakdown.map((row) => (
                <div key={row.label} style={styles.analyticsTableRow}>
                  <strong>{row.label}</strong>
                  <span>{row.count} shots</span>
                  <span>{formatNumber(row.avgSg)} SG</span>
                  <span>{formatNumber(row.avgEndDistance, 1, " m")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 3 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Ball-Striking</h2>
            <div style={styles.analyticsTable}>
              {strikeBreakdown.map((row) => (
                <div key={row.label} style={styles.analyticsTableRow}>
                  <strong>{row.label}</strong>
                  <span>{row.count} shots</span>
                  <span>{formatNumber(row.avgSg)} SG</span>
                  <span>{formatNumber(row.positivePct, 1, "%")} positive</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 4 && (
          <MissPatternBarChart
            title="Miss Patterns"
            counts={missCounts}
            styles={styles}
          />
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
