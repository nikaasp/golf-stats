import StatCard from "./StatCard"
import PieChart from "./PieChart"
import Scorecard from "./Scorecard"
import { formatToPar } from "../utils/golfFormatters"

export default function SummaryScreen({
  course,
  date,
  summary,
  goHomeAndReset,
  styles,
}) {
  const fwChart = [
    { label: "Hit", value: summary.fwHits, color: "#2563eb" },
    { label: "Miss", value: summary.fwMisses, color: "#cbd5e1" },
  ]

  const girChart = [
    { label: "GIR", value: summary.girHits, color: "#16a34a" },
    { label: "No GIR", value: summary.girMisses, color: "#d1d5db" },
  ]

  const contactChart = Object.entries(summary.contactCounts)
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
          <h1 style={styles.heroTitle}>Round Summary</h1>
          <p style={styles.mutedText}>
            {course} • {date}
          </p>

          <div style={styles.statsGrid}>
            <StatCard label="Score" value={summary.totalScore} styles={styles} />
            <StatCard
              label="To Par"
              value={formatToPar(summary.totalScore, summary.totalPar)}
              styles={styles}
            />
            <StatCard label="Putts" value={summary.totalPutts} styles={styles} />
            <StatCard label="Played" value={summary.playedCount} styles={styles} />
            <StatCard
              label="Avg Drive"
              value={summary.avgDrive === "-" ? "-" : `${summary.avgDrive} m`}
              styles={styles}
            />
            <StatCard
              label="Avg Approach"
              value={summary.avgApproach === "-" ? "-" : `${summary.avgApproach} m`}
              styles={styles}
            />
            <StatCard label="Avg Par 3" value={summary.avgPar3} styles={styles} />
            <StatCard label="Avg Par 4" value={summary.avgPar4} styles={styles} />
            <StatCard label="Avg Par 5" value={summary.avgPar5} styles={styles} />
          </div>
        </div>

        <div style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Scorecard</h2>
          <Scorecard holes={summary.holes} styles={styles} />
        </div>

        <PieChart title="Fairways" data={fwChart} styles={styles} />
        <PieChart title="GIR" data={girChart} styles={styles} />
        <PieChart title="Club Contact" data={contactChart} styles={styles} />

        <button style={styles.primaryButton} onClick={goHomeAndReset}>
          Back to Home
        </button>
      </div>
    </div>
  )
}