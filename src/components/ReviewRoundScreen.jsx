import StatCard from "./StatCard"
import PieChart from "./PieChart"
import Scorecard from "./Scorecard"
import { formatToPar } from "../utils/golfFormatters"

import {
  MISS_PATTERN_LABELS,
  MISS_PATTERN_ORDER,
  MISS_PATTERN_COLORS,
} from "../utils/missPatternConfig"

export default function ReviewRoundScreen({
  selectedReviewRound,
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

  const missPatternChart = MISS_PATTERN_ORDER
    .map((key) => ({
      key,
      value: reviewSummary.missPatternCounts?.[key] || 0,
    }))
    .filter((d) => d.value > 0)
    .map((d) => ({
      label: MISS_PATTERN_LABELS[d.key],
      value: d.value,
      color: MISS_PATTERN_COLORS[d.key],
    }))

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
        <PieChart title="Miss Pattern" data={missPatternChart} styles={styles} />

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