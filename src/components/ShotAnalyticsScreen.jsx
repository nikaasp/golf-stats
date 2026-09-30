import { useCallback, useEffect, useMemo, useState } from "react"
import { useToast } from "./ToastProvider"
import ShotFiltersCard from "./ShotFiltersCard"
import {
  fetchRoundsForAnalytics,
  fetchHolesForRoundIds,
  fetchShotsForRoundIds,
} from "../services/analyticsService"
import {
  collectAvailableTags,
  hydrateRoundsWithStoredTags,
  roundMatchesTagFilter,
} from "../utils/roundTags"
import {
  buildShotRows,
  formatNumber,
  getCourseLabel,
  getDistanceLabel,
  summarizeShots,
  finiteNumber,
} from "../utils/shotInsights"

function MetricCard({ label, value, styles }) {
  return (
    <div style={styles.compactMetricCard}>
      <div style={styles.compactMetricValue}>{value}</div>
      <div style={styles.compactMetricLabel}>{label}</div>
    </div>
  )
}

export default function ShotAnalyticsScreen({ courses, styles, goHome }) {
  const toast = useToast()

  const today = new Date().toISOString().slice(0, 10)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rounds, setRounds] = useState([])
  const [shots, setShots] = useState([])
  const [holes, setHoles] = useState([])
  const [availableTags, setAvailableTags] = useState([])

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
  const pages = ["Filter", "SG", "Accuracy"]

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
      toast.error("Could not load analytics rounds: " + roundsRes.error.message)
      return
    }

    const taggedRounds = hydrateRoundsWithStoredTags(roundsRes.data || [])
    setAvailableTags(collectAvailableTags(taggedRounds))
    const filteredRounds = taggedRounds.filter((round) =>
      roundMatchesTagFilter(round, appliedFilters.tagFilter)
    )
    const roundIds = filteredRounds.map((round) => round.id)
    const [shotsRes, holesRes] = await Promise.all([
      fetchShotsForRoundIds(roundIds),
      fetchHolesForRoundIds(roundIds),
    ])

    setLoading(false)

    if (shotsRes.error) {
      toast.error("Could not load analytics shots: " + shotsRes.error.message)
      return
    }

    if (holesRes.error) {
      toast.error("Could not load analytics holes: " + holesRes.error.message)
      return
    }

    setRounds(filteredRounds)
    setShots(shotsRes.data || [])
    setHoles(holesRes.data || [])
  }, [appliedFilters, toast])

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
      return true
    })
  }, [appliedFilters, shotRows])

  const summary = useMemo(() => summarizeShots(filteredShots), [filteredShots])

  const accuracySummary = useMemo(() => {
    const playedHoles = holes.filter((hole) => !hole.skipped)
    const fairwayEligible = playedHoles.filter((hole) => Number(hole.par) > 3)
    const fairwayHits = fairwayEligible.filter((hole) => hole.fairway === true).length
    const girEligible = playedHoles.filter((hole) => Number.isFinite(Number(hole.par)))
    const girHits = girEligible.filter((hole) => hole.gir === true).length

    return {
      fairwayPct:
        fairwayEligible.length > 0 ? (fairwayHits / fairwayEligible.length) * 100 : null,
      girPct: girEligible.length > 0 ? (girHits / girEligible.length) * 100 : null,
      avgEndDistance: summary.avgEndDistance,
    }
  }, [holes, summary.avgEndDistance])

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
          <h1 style={styles.pageTitle}>Analytics</h1>
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
            statusText={`Showing ${filteredShots.length} shots from ${rounds.length} rounds.`}
          />
        )}

        {page === 1 && (
          <div style={styles.sectionCardCompact}>
            <div style={styles.statsGrid}>
              <MetricCard label="Shots" value={summary.count} styles={styles} />
              <MetricCard
                label="Avg SG"
                value={formatNumber(summary.avgSg)}
                styles={styles}
              />
              <MetricCard
                label="Positive SG"
                value={formatNumber(summary.positivePct, 1, "%")}
                styles={styles}
              />
            </div>
          </div>
        )}

        {page === 2 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Accuracy</h2>
            <div style={styles.statsGrid}>
              <MetricCard
                label="Fairway hit %"
                value={formatNumber(accuracySummary.fairwayPct, 1, "%")}
                styles={styles}
              />
              <MetricCard
                label="GIR %"
                value={formatNumber(accuracySummary.girPct, 1, "%")}
                styles={styles}
              />
              <MetricCard
                label="Distance to flag after shot"
                value={formatNumber(accuracySummary.avgEndDistance, 1, " m")}
                styles={styles}
              />
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
