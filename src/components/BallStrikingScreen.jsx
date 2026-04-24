import { useCallback, useEffect, useMemo, useState } from "react"
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
  finiteNumber,
  formatNumber,
  getCourseLabel,
  getDistanceLabel,
  summarizeShots,
} from "../utils/shotInsights"

function MetricCard({ label, value, styles }) {
  return (
    <div style={styles.compactMetricCard}>
      <div style={styles.compactMetricValue}>{value}</div>
      <div style={styles.compactMetricLabel}>{label}</div>
    </div>
  )
}

export default function BallStrikingScreen({ courses, styles, goHome }) {
  const today = new Date().toISOString().slice(0, 10)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rounds, setRounds] = useState([])
  const [shots, setShots] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const pages = ["Filter", "Overview", "Strike", "Lies"]

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

  const loadBallStriking = useCallback(async () => {
    setLoading(true)

    const roundsRes = await fetchRoundsForAnalytics({
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      courseId: appliedFilters.courseId,
    })

    if (roundsRes.error) {
      setLoading(false)
      alert("Could not load ball-striking rounds: " + roundsRes.error.message)
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
      alert("Could not load ball-striking shots: " + shotsRes.error.message)
      return
    }

    setRounds(filteredRounds)
    setShots(shotsRes.data || [])
  }, [appliedFilters])

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadBallStriking()
    }, 0)

    return () => clearTimeout(timerId)
  }, [loadBallStriking])

  const shotRows = useMemo(() => buildShotRows(shots), [shots])

  const filteredShots = useMemo(() => {
    const minDistance = finiteNumber(appliedFilters.minDistance)
    const maxDistance = finiteNumber(appliedFilters.maxDistance)

    return shotRows.filter((shot) => {
      if (shot.startDistance === null) return false
      if (!shot.strike_quality) return false
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

  const strikeBreakdown = useMemo(() => {
    const values = ["poor", "ok", "pure"]
    return values.map((strike) => ({
      label: strike.toUpperCase(),
      ...summarizeShots(filteredShots.filter((shot) => shot.strike_quality === strike)),
    }))
  }, [filteredShots])

  const lieBreakdown = useMemo(() => {
    const lies = ["Tee", "Fairway", "Rough", "Sand", "Recovery", "Green"]
    return lies.map((lie) => ({
      label: lie,
      ...summarizeShots(filteredShots.filter((shot) => shot.lie === lie)),
    }))
  }, [filteredShots])

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
          <h1 style={styles.pageTitle}>Ball Striking</h1>
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
            statusText={`Showing ${filteredShots.length} rated shots from ${rounds.length} rounds.`}
            showStrikeFilter
          />
        )}

        {page === 1 && (
          <div style={styles.sectionCardCompact}>
            <div style={styles.statsGrid}>
              <MetricCard label="Rated shots" value={filteredShots.length} styles={styles} />
              <MetricCard
                label="Pure rate"
                value={formatNumber(summary.pureRate, 1, "%")}
                styles={styles}
              />
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
            <h2 style={styles.sectionTitle}>By Strike Rating</h2>
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

        {page === 3 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>By Lie</h2>
            <div style={styles.analyticsTable}>
              {lieBreakdown.map((row) => (
                <div key={row.label} style={styles.analyticsTableRow}>
                  <strong>{row.label}</strong>
                  <span>{row.count} shots</span>
                  <span>{formatNumber(row.avgSg)} SG</span>
                  <span>{formatNumber(row.pureRate, 1, "%")} pure</span>
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
