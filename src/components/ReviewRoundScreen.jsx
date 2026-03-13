import StatCard from "./StatCard"
import PieChart from "./PieChart"
import Scorecard from "./Scorecard"
import { formatToPar } from "../utils/golfFormatters"
import { buildMissPatternByCategoryFromShots } from "../utils/analyticsTransforms"

import {
  MISS_PATTERN_LABELS,
  MISS_PATTERN_ORDER,
  MISS_PATTERN_COLORS,
} from "../utils/missPatternConfig"

const CATEGORY_LABELS = {
  Tee: "Off the Tee",
  "Approach + Fairway": "Approach + Fairway",
  "Approach + Rough": "Approach + Rough",
  "Approach + Sand": "Approach + Sand",
  "Short Game + Fairway": "Short Game + Fairway",
  "Short Game + Rough": "Short Game + Rough",
  "Short Game + Sand": "Short Game + Sand",
  Recovery: "Recovery",
  "On green": "On Green",
  Putting: "On Green",
}

function getMissPatternTotal(counts = {}) {
  return Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0)
}

function countsToPieChartData(counts = {}) {
  return MISS_PATTERN_ORDER
    .map((key) => ({
      key,
      value: Number(counts[key] || 0),
    }))
    .filter((item) => item.value > 0)
    .map((item) => ({
      label: MISS_PATTERN_LABELS[item.key],
      value: item.value,
      color: MISS_PATTERN_COLORS[item.key],
    }))
}

export default function ReviewRoundScreen({
  selectedReviewRound,
  selectedReviewShots = [],
  reviewSummary,
  deleteRound,
  loading,
  goHome,
  styles,
}) {
  const fwChart = [
    { label: "Hit", value: reviewSummary.fwHits, color: "#2563eb" },
    { label: "Miss", value: reviewSummary.fwMisses, color: "#cbd5e1" },
  ]

  const girChart = [
    { label: "GIR", value: reviewSummary.girHits, color: "#16a34a" },
    { label: "No GIR", value: reviewSummary.girMisses, color: "#d1d5db" },
  ]

  const missPatternByCategoryRaw = buildMissPatternByCategoryFromShots(selectedReviewShots)

  const mergedMissPatternByCategory = Object.entries(missPatternByCategoryRaw).reduce(
    (acc, [category, counts]) => {
      const normalizedCategory = category === "Putting" ? "On green" : category

      if (!acc[normalizedCategory]) {
        acc[normalizedCategory] = {}
      }

      for (const key of MISS_PATTERN_ORDER) {
        acc[normalizedCategory][key] =
          Number(acc[normalizedCategory][key] || 0) + Number(counts?.[key] || 0)
      }

      return acc
    },
    {}
  )

  const missPatternSections = Object.entries(mergedMissPatternByCategory)
    .map(([category, counts]) => {
      const total = getMissPatternTotal(counts)

      return {
        category,
        label: CATEGORY_LABELS[category] || category,
        total,
        data: countsToPieChartData(counts),
      }
    })
    .filter((section) => section.total > 0 && section.data.length > 0)

  return (
    <div style={styles.page}>
      <div style={styles.mobileShell}>
        <div style={styles.sectionCard}>
          <h1 style={styles.heroTitle}>Review Round</h1>
          <p style={styles.mutedText}>
            {selectedReviewRound?.course} • {selectedReviewRound?.date}
          </p>

          <div style={styles.statsGrid}>
            <StatCard label="Score" value={reviewSummary.totalScore} styles={styles} />
            <StatCard
              label="To Par"
              value={formatToPar(reviewSummary.totalScore, reviewSummary.totalPar)}
              styles={styles}
            />
            <StatCard
              label="Avg Putts"
              value={
                reviewSummary.playedCount > 0
                  ? (reviewSummary.totalPutts / reviewSummary.playedCount).toFixed(1)
                  : "-"
              }
              styles={styles}
            />
            <StatCard label="Avg Par 3" value={reviewSummary.avgPar3} styles={styles} />
            <StatCard label="Avg Par 4" value={reviewSummary.avgPar4} styles={styles} />
            <StatCard label="Avg Par 5" value={reviewSummary.avgPar5} styles={styles} />
          </div>
        </div>

        <div style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Scorecard</h2>
          <Scorecard holes={reviewSummary.holes} styles={styles} />
        </div>

        <PieChart title="Fairways" data={fwChart} styles={styles} />
        <PieChart title="GIR" data={girChart} styles={styles} />

        <div style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Miss Pattern by Category</h2>

          {missPatternSections.length === 0 ? (
            <p style={styles.mutedText}>No miss pattern data for this round.</p>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              {missPatternSections.map((section) => (
                <PieChart
                  key={section.category}
                  title={section.label}
                  data={section.data}
                  styles={styles}
                />
              ))}
            </div>
          )}
        </div>

        <div style={styles.buttonRow}>
          <button style={styles.primaryButton} onClick={goHome}>
            Back to Home
          </button>
          <button
            style={styles.deleteRoundButtonLarge}
            onClick={() => deleteRound(selectedReviewRound)}
            disabled={loading}
          >
            Delete Round
          </button>
        </div>
      </div>
    </div>
  )
}