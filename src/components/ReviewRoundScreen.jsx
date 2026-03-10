import StatCard from "./StatCard"
import PieChart from "./PieChart"
import Scorecard from "./Scorecard"
import { formatToPar } from "../utils/golfFormatters"

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

  const contactChart = Object.entries(reviewSummary.contactCounts)
    .filter(([, value]) => value > 0)
    .map(([label, value], idx) => ({
      label,
      value,
      color: ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"][idx % 7],
    }))

  return (
    <div style={styles.page}>
      <div style={styles.mobileShell}>
        <div style={styles.sectionCard}>
          <h1 style={styles.heroTitle}>Review Round</h1>
          <p style={styles.mutedText}>
            {selectedReviewRound?.course ?? "-"} • {selectedReviewRound?.date ?? "-"}
          </p>

          <div style={styles.statsGrid}>
            <StatCard label="Score" value={reviewSummary.totalScore} styles={styles} />
            <StatCard
              label="To Par"
              value={formatToPar(reviewSummary.totalScore, reviewSummary.totalPar)}
              styles={styles}
            />
            <StatCard label="Putts" value={reviewSummary.totalPutts} styles={styles} />
            <StatCard label="Played" value={reviewSummary.playedCount} styles={styles} />
            <StatCard
              label="Avg Drive"
              value={reviewSummary.avgDrive === "-" ? "-" : `${reviewSummary.avgDrive} m`}
              styles={styles}
            />
            <StatCard
              label="Avg Approach"
              value={reviewSummary.avgApproach === "-" ? "-" : `${reviewSummary.avgApproach} m`}
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
        <PieChart title="Club Contact" data={contactChart} styles={styles} />

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