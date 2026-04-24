import { useCallback, useEffect, useMemo, useState } from "react"
import MissPatternBarChart from "./MissPatternBarChart"
import ShotFiltersCard from "./ShotFiltersCard"
import {
  fetchRoundsForAnalytics,
  fetchShotsForRoundIds,
} from "../services/analyticsService"
import {
  collectAvailableTags,
  hydrateRoundsWithStoredTags,
  roundMatchesTagFilter,
} from "../utils/roundTags"
import {
  buildShotRows,
  countMissPatterns,
  finiteNumber,
  formatNumber,
  getCourseLabel,
  getDistanceLabel,
  getTopKey,
  summarizeShots,
} from "../utils/shotInsights"

const MISS_LABELS = {
  long_left: "Long Left",
  long: "Long",
  long_right: "Long Right",
  left: "Left",
  right: "Right",
  short_left: "Short Left",
  short: "Short",
  short_right: "Short Right",
  spot_on: "Spot On",
}

function MetricCard({ label, value, styles }) {
  return (
    <div style={styles.compactMetricCard}>
      <div style={styles.compactMetricValue}>{value}</div>
      <div style={styles.compactMetricLabel}>{label}</div>
    </div>
  )
}

export default function MissesScreen({ courses, styles, goHome }) {
  const today = new Date().toISOString().slice(0, 10)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rounds, setRounds] = useState([])
  const [shots, setShots] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const pages = ["Filter", "Overview", "Directions", "Lies"]

  const [draftFilters, setDraftFilters] = useState({
    startDate: "",
    endDate: today,
    courseId: "all",
    tagFilter: "",
    minDistance: "",
    maxDistance: "",
    lie: "all",
  })

  const [appliedFilters, setAppliedFilters] = useState(draftFilters)

  const updateDraft = (field, value) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }))
  }

  const loadMisses = useCallback(async () => {
    setLoading(true)

    const roundsRes = await fetchRoundsForAnalytics({
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      courseId: appliedFilters.courseId,
    })

    if (roundsRes.error) {
      setLoading(false)
      alert("Could not load misses rounds: " + roundsRes.error.message)
      return
    }

    const taggedRounds = hydrateRoundsWithStoredTags(roundsRes.data || [])
    setAvailableTags(collectAvailableTags(taggedRounds))
    const filteredRounds = taggedRounds.filter((round) =>
      roundMatchesTagFilter(round, appliedFilters.tagFilter)
    )
    const roundIds = filteredRounds.map((round) => round.id)
    const shotsRes = await fetchShotsForRoundIds(roundIds)

    setLoading(false)

    if (shotsRes.error) {
      alert("Could not load misses shots: " + shotsRes.error.message)
      return
    }

    setRounds(filteredRounds)
    setShots(shotsRes.data || [])
  }, [appliedFilters])

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadMisses()
    }, 0)

    return () => clearTimeout(timerId)
  }, [loadMisses])

  const shotRows = useMemo(() => buildShotRows(shots), [shots])

  const filteredShots = useMemo(() => {
    const minDistance = finiteNumber(appliedFilters.minDistance)
    const maxDistance = finiteNumber(appliedFilters.maxDistance)

    return shotRows.filter((shot) => {
      if (shot.startDistance === null) return false
      if (!shot.miss_pattern) return false
      if (minDistance !== null && shot.startDistance < minDistance) return false
      if (maxDistance !== null && shot.startDistance > maxDistance) return false
      if (appliedFilters.lie !== "all" && shot.lie !== appliedFilters.lie) return false
      return true
    })
  }, [appliedFilters, shotRows])

  const allVisibleShots = useMemo(() => {
    const minDistance = finiteNumber(appliedFilters.minDistance)
    const maxDistance = finiteNumber(appliedFilters.maxDistance)

    return shotRows.filter((shot) => {
      if (shot.startDistance === null) return false
      if (minDistance !== null && shot.startDistance < minDistance) return false
      if (maxDistance !== null && shot.startDistance > maxDistance) return false
      if (appliedFilters.lie !== "all" && shot.lie !== appliedFilters.lie) return false
      return true
    })
  }, [appliedFilters, shotRows])

  const summary = useMemo(() => summarizeShots(allVisibleShots), [allVisibleShots])
  const missCounts = useMemo(() => countMissPatterns(filteredShots), [filteredShots])
  const topMiss = getTopKey(missCounts)

  const lieBreakdown = useMemo(() => {
    const lies = ["Tee", "Fairway", "Rough", "Sand", "Recovery", "Green"]
    return lies.map((lie) => {
      const shotsForLie = allVisibleShots.filter((shot) => shot.lie === lie)
      const missShots = shotsForLie.filter((shot) => shot.miss_pattern)
      const counts = countMissPatterns(missShots)

      return {
        label: lie,
        totalShots: shotsForLie.length,
        missShots: missShots.length,
        missRate: shotsForLie.length > 0 ? (missShots.length / shotsForLie.length) * 100 : null,
        topMiss: MISS_LABELS[getTopKey(counts)] || "-",
      }
    })
  }, [allVisibleShots])

  const filterSummary = [
    `Period: ${appliedFilters.startDate || "any"} - ${appliedFilters.endDate || "any"}`,
    `Course: ${getCourseLabel(courses, appliedFilters.courseId)}`,
    `Distance: ${getDistanceLabel(appliedFilters)}`,
    `Lie: ${appliedFilters.lie === "all" ? "all" : appliedFilters.lie}`,
    `Tag: ${appliedFilters.tagFilter || "all"}`,
  ]

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Misses</h1>
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
          <ShotFiltersCard
            styles={styles}
            courses={courses}
            draftFilters={draftFilters}
            updateDraft={updateDraft}
            availableTags={availableTags}
            loading={loading}
            onApply={() => setAppliedFilters(draftFilters)}
            statusText={`Showing ${filteredShots.length} misses from ${rounds.length} rounds.`}
          />
        )}

        {page === 1 && (
          <div style={styles.sectionCardCompact}>
            <div style={styles.statsGrid}>
              <MetricCard label="Misses logged" value={filteredShots.length} styles={styles} />
              <MetricCard
                label="Miss rate"
                value={formatNumber(summary.missRate, 1, "%")}
                styles={styles}
              />
              <MetricCard
                label="Most common"
                value={MISS_LABELS[topMiss] || "-"}
                styles={styles}
              />
            </div>
          </div>
        )}

        {page === 2 && (
          <div style={styles.sectionCardCompact}>
            {filteredShots.length === 0 ? (
              <p style={styles.mutedText}>No miss direction data available.</p>
            ) : (
              <MissPatternBarChart title="Miss Directions" counts={missCounts} styles={styles} />
            )}
          </div>
        )}

        {page === 3 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>By Lie</h2>
            <div style={styles.analyticsTable}>
              {lieBreakdown.map((row) => (
                <div key={row.label} style={styles.analyticsTableRow}>
                  <strong>{row.label}</strong>
                  <span>{row.missShots} misses</span>
                  <span>{formatNumber(row.missRate, 1, "%")}</span>
                  <span>{row.topMiss}</span>
                </div>
              ))}
            </div>
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
