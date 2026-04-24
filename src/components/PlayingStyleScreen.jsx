import { useCallback, useEffect, useMemo, useState } from "react"
import ShotFiltersCard from "./ShotFiltersCard"
import TrendMetricLineChart from "./TrendMetricLineChart"
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
} from "../utils/shotInsights"

const STRIKE_ORDER = ["poor", "ok", "pure"]
const STRIKE_LABELS = {
  poor: "Poor",
  ok: "OK",
  pure: "Pure",
}

function MetricCard({ label, value, styles }) {
  return (
    <div style={styles.compactMetricCard}>
      <div style={styles.compactMetricValue}>{value}</div>
      <div style={styles.compactMetricLabel}>{label}</div>
    </div>
  )
}

function summarizeStrikeGroup(shots = []) {
  const misses = shots.filter((shot) => shot.miss_pattern).length
  const penalties = shots.filter((shot) => Number(shot.auto_penalty || 0) > 0).length
  const sgValues = shots
    .map((shot) => Number(shot.strokes_gained))
    .filter((value) => Number.isFinite(value))
  const positive = sgValues.filter((value) => value > 0).length

  return {
    count: shots.length,
    missRate: shots.length > 0 ? (misses / shots.length) * 100 : null,
    penaltyRate: shots.length > 0 ? (penalties / shots.length) * 100 : null,
    avgSg:
      sgValues.length > 0
        ? sgValues.reduce((sum, value) => sum + value, 0) / sgValues.length
        : null,
    positivePct: sgValues.length > 0 ? (positive / sgValues.length) * 100 : null,
  }
}

function buildPlayingStyleTimeline(rounds = [], shots = []) {
  const shotsByRound = {}

  shots.forEach((shot) => {
    if (!shotsByRound[shot.round_id]) shotsByRound[shot.round_id] = []
    shotsByRound[shot.round_id].push(shot)
  })

  return rounds.map((round) => {
    const roundShots = shotsByRound[round.id] || []
    const ratedShots = roundShots.filter((shot) => shot.strike_quality)
    const poorShots = ratedShots.filter((shot) => shot.strike_quality === "poor")
    const penalties = roundShots.filter((shot) => Number(shot.auto_penalty || 0) > 0).length
    const misses = roundShots.filter((shot) => shot.miss_pattern).length
    const goodStrikeMisses = ratedShots.filter(
      (shot) => shot.miss_pattern && (shot.strike_quality === "ok" || shot.strike_quality === "pure")
    ).length
    const positiveRatedShots = ratedShots.filter(
      (shot) => Number.isFinite(Number(shot.strokes_gained)) && Number(shot.strokes_gained) > 0
    )

    const sharePositive = (quality) => {
      if (positiveRatedShots.length === 0) return null
      const hits = positiveRatedShots.filter((shot) => shot.strike_quality === quality).length
      return (hits / positiveRatedShots.length) * 100
    }

    return {
      round_id: round.id,
      date: round.date,
      course: round.course,
      poorStrikePct: ratedShots.length > 0 ? (poorShots.length / ratedShots.length) * 100 : null,
      missRate: roundShots.length > 0 ? (misses / roundShots.length) * 100 : null,
      penaltyRate: roundShots.length > 0 ? (penalties / roundShots.length) * 100 : null,
      goodStrikeMissPct: ratedShots.length > 0 ? (goodStrikeMisses / ratedShots.length) * 100 : null,
      positiveFromPoorPct: sharePositive("poor"),
      positiveFromOkPct: sharePositive("ok"),
      positiveFromPurePct: sharePositive("pure"),
    }
  })
}

function buildTakeaways(visibleShots = [], strikeBreakdown = []) {
  const ratedShots = visibleShots.filter((shot) => shot.strike_quality)
  const misses = visibleShots.filter((shot) => shot.miss_pattern)
  const poorMisses = ratedShots.filter(
    (shot) => shot.strike_quality === "poor" && shot.miss_pattern
  ).length
  const nonPoorMisses = ratedShots.filter(
    (shot) => shot.miss_pattern && (shot.strike_quality === "ok" || shot.strike_quality === "pure")
  ).length
  const penalties = visibleShots.filter((shot) => Number(shot.auto_penalty || 0) > 0)
  const poorPenaltyShots = penalties.filter((shot) => shot.strike_quality === "poor").length
  const positiveRatedShots = ratedShots.filter(
    (shot) => Number.isFinite(Number(shot.strokes_gained)) && Number(shot.strokes_gained) > 0
  )
  const positivePure = positiveRatedShots.filter((shot) => shot.strike_quality === "pure").length
  const positiveOk = positiveRatedShots.filter((shot) => shot.strike_quality === "ok").length

  const missDriver =
    poorMisses >= nonPoorMisses
      ? "Misses mainly follow poor strike quality"
      : "Many misses happen on OK/PURE strikes too"

  const sgDriver =
    positivePure > positiveOk
      ? "Best swings drive most positive SG"
      : "Positive SG is not only coming from pure strikes"

  const penaltyDriver =
    penalties.length === 0
      ? "No penalties in this filter"
      : poorPenaltyShots / penalties.length >= 0.5
      ? "Penalties mostly follow poor strikes"
      : "Penalties are not only coming from poor strikes"

  return [
    {
      title: "Miss Driver",
      value: missDriver,
      note: `${poorMisses} poor-strike misses vs ${nonPoorMisses} OK/PURE misses`,
      context: "Strike vs decision pattern",
    },
    {
      title: "SG Driver",
      value: sgDriver,
      note: `${positivePure} pure positives vs ${positiveOk} OK positives`,
      context: "How strokes are gained",
    },
    {
      title: "Penalty Pattern",
      value: penaltyDriver,
      note: `${poorPenaltyShots} of ${penalties.length} penalties followed poor strikes`,
      context: "Risk and execution",
    },
    {
      title: "Rated Shots",
      value: `${ratedShots.length}`,
      note: "Shots with strike quality logged",
      context: "Advanced tracking depth",
    },
  ]
}

export default function PlayingStyleScreen({ courses, styles, goHome }) {
  const today = new Date().toISOString().slice(0, 10)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rounds, setRounds] = useState([])
  const [shots, setShots] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const pages = ["Filter", "Takeaways", "Trends", "Strike x Miss", "Penalties"]

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

  const loadPlayingStyle = useCallback(async () => {
    setLoading(true)

    const roundsRes = await fetchRoundsForAnalytics({
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      courseId: appliedFilters.courseId,
    })

    if (roundsRes.error) {
      setLoading(false)
      alert("Could not load playing style rounds: " + roundsRes.error.message)
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
      alert("Could not load playing style shots: " + shotsRes.error.message)
      return
    }

    setRounds(filteredRounds)
    setShots(shotsRes.data || [])
  }, [appliedFilters])

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadPlayingStyle()
    }, 0)

    return () => clearTimeout(timerId)
  }, [loadPlayingStyle])

  const shotRows = useMemo(() => buildShotRows(shots), [shots])

  const visibleShots = useMemo(() => {
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

  const strikeBreakdown = useMemo(
    () =>
      STRIKE_ORDER.map((quality) => ({
        label: STRIKE_LABELS[quality],
        ...summarizeStrikeGroup(visibleShots.filter((shot) => shot.strike_quality === quality)),
      })),
    [visibleShots]
  )

  const styleTimeline = useMemo(
    () => buildPlayingStyleTimeline(rounds, visibleShots),
    [rounds, visibleShots]
  )

  const takeaways = useMemo(
    () => buildTakeaways(visibleShots, strikeBreakdown),
    [visibleShots, strikeBreakdown]
  )

  const penaltyBreakdown = useMemo(() => {
    return STRIKE_ORDER.map((quality) => {
      const shotsForQuality = visibleShots.filter((shot) => shot.strike_quality === quality)
      const penaltyShots = shotsForQuality.filter((shot) => Number(shot.auto_penalty || 0) > 0)
      const missShots = shotsForQuality.filter((shot) => shot.miss_pattern)

      return {
        label: STRIKE_LABELS[quality],
        shots: shotsForQuality.length,
        penaltyRate:
          shotsForQuality.length > 0 ? (penaltyShots.length / shotsForQuality.length) * 100 : null,
        missRate:
          shotsForQuality.length > 0 ? (missShots.length / shotsForQuality.length) * 100 : null,
        avgSg: summarizeStrikeGroup(shotsForQuality).avgSg,
      }
    })
  }, [visibleShots])

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
          <h1 style={styles.pageTitle}>Playing Style</h1>
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
            statusText={`Showing ${visibleShots.length} shots from ${rounds.length} rounds.`}
          />
        )}

        {page === 1 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Key Takeaways</h2>
            <div style={styles.analyticsTable}>
              {takeaways.map((item) => (
                <div key={item.title} style={styles.analyticsTableRow}>
                  <strong>{item.title}</strong>
                  <span>{item.value}</span>
                  <span>{item.note}</span>
                  <span>{item.context}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 2 && (
          <div style={styles.fixedChartGrid}>
            <TrendMetricLineChart
              title="Misses, Poor Strikes, and Penalties"
              data={styleTimeline}
              styles={styles}
              yDomain={[0, 100]}
              valueSuffix="%"
              series={[
                { key: "poorStrikePct", name: "Poor strike %", color: "#dc2626" },
                { key: "missRate", name: "Miss rate %", color: "#2563eb" },
                { key: "penaltyRate", name: "Penalty rate %", color: "#d97706" },
              ]}
            />
            <TrendMetricLineChart
              title="Where Positive SG Comes From"
              data={styleTimeline}
              styles={styles}
              yDomain={[0, 100]}
              valueSuffix="%"
              series={[
                { key: "positiveFromPoorPct", name: "From poor shots", color: "#dc2626" },
                { key: "positiveFromOkPct", name: "From OK shots", color: "#2563eb" },
                { key: "positiveFromPurePct", name: "From pure shots", color: "#16a34a" },
              ]}
            />
          </div>
        )}

        {page === 3 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Strike Quality vs Miss Outcome</h2>
            <div style={styles.analyticsTable}>
              {strikeBreakdown.map((row) => (
                <div key={row.label} style={styles.analyticsTableRow}>
                  <strong>{row.label}</strong>
                  <span>{row.count} shots</span>
                  <span>{formatNumber(row.missRate, 1, "%")} miss</span>
                  <span>{formatNumber(row.avgSg)} SG</span>
                  <span>{formatNumber(row.positivePct, 1, "%")} positive</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 4 && (
          <div style={styles.fixedChartGrid}>
            <div style={styles.sectionCardCompact}>
              <div style={styles.statsGrid}>
                <MetricCard
                  label="Shots with penalties"
                  value={visibleShots.filter((shot) => Number(shot.auto_penalty || 0) > 0).length}
                  styles={styles}
                />
                <MetricCard
                  label="Misses on OK/PURE"
                  value={
                    visibleShots.filter(
                      (shot) =>
                        shot.miss_pattern &&
                        (shot.strike_quality === "ok" || shot.strike_quality === "pure")
                    ).length
                  }
                  styles={styles}
                />
              </div>
            </div>
            <div style={styles.sectionCardCompact}>
              <h2 style={styles.sectionTitle}>Penalties by Strike Quality</h2>
              <div style={styles.analyticsTable}>
                {penaltyBreakdown.map((row) => (
                  <div key={row.label} style={styles.analyticsTableRow}>
                    <strong>{row.label}</strong>
                    <span>{row.shots} shots</span>
                    <span>{formatNumber(row.penaltyRate, 1, "%")} penalties</span>
                    <span>{formatNumber(row.missRate, 1, "%")} misses</span>
                    <span>{formatNumber(row.avgSg)} SG</span>
                  </div>
                ))}
              </div>
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
