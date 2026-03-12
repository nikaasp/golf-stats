import StatCard from "./StatCard"
import PieChart from "./PieChart"
import Scorecard from "./Scorecard"
import { formatToPar } from "../utils/golfFormatters"

const MISS_PATTERN_LABELS = {
  long_left: "Long Left",
  long: "Long",
  long_right: "Long Right",
  left: "Left",
  spot_on: "Spot On!",
  right: "Right",
  short_left: "Short Left",
  short: "Short",
  short_right: "Short Right",
}

const CATEGORY_LABELS = {
  "Tee": "Off the tee",
  "Approach + Fairway": "Approach (FW)",
  "Approach + Rough": "Approach (RGH)",
  "Approach + Sand": "Approach (SND)",
  "Short Game + Fairway": "Short game (FW)",
  "Short Game + Rough": "Short game (RGH)",
  "Short Game + Sand": "Short game (SND)",
  Recovery: "Recovery",
  Putting: "On the green",
}

const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
]

export default function SummaryScreen({
  course,
  date,
  summary,
  sgSummary,
  goHomeAndReset,
  styles,
}) {
  const formatStrokesGained = (value) => {
    if (value === null || value === undefined || value === "") return "-"
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return "-"
    return `${numericValue >= 0 ? "+" : ""}${numericValue.toFixed(2)}`
  }

  const fwChart = [
    { label: "Hit", value: summary.fwHits, color: "#2563eb" },
    { label: "Miss", value: summary.fwMisses, color: "#cbd5e1" },
  ]

  const girChart = [
    { label: "GIR", value: summary.girHits, color: "#16a34a" },
    { label: "No GIR", value: summary.girMisses, color: "#d1d5db" },
  ]

  const buildMissPatternChart = (counts) =>
    Object.entries(counts || {})
      .filter(([, value]) => value > 0)
      .map(([key, value], idx) => ({
        label: MISS_PATTERN_LABELS[key] || key,
        value,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      }))

  const missPatternCharts = Object.entries(summary.missPatternByCategory || {})
    .map(([categoryKey, counts]) => ({
      key: categoryKey,
      title: CATEGORY_LABELS[categoryKey] || categoryKey,
      data: buildMissPatternChart(counts),
    }))
    .filter((chart) => chart.data.length > 0)

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
          </div>
        </div>

        <div style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Avg Shots by Par</h2>
          <div style={styles.statsGrid}>
            <StatCard label="Avg Par 3" value={summary.avgPar3} styles={styles} />
            <StatCard label="Avg Par 4" value={summary.avgPar4} styles={styles} />
            <StatCard label="Avg Par 5" value={summary.avgPar5} styles={styles} />
          </div>
        </div>

        <div style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Strokes Gained</h2>

          <div style={styles.summaryInline}>
            <span>Off the tee</span>
            <strong>{formatStrokesGained(sgSummary?.tee)}</strong>
          </div>

          <div style={styles.summaryInline}>
            <span>Approach (FW)</span>
            <strong>{formatStrokesGained(sgSummary?.approachFairway)}</strong>
          </div>

          <div style={styles.summaryInline}>
            <span>Approach (RGH)</span>
            <strong>{formatStrokesGained(sgSummary?.approachRough)}</strong>
          </div>

          <div style={styles.summaryInline}>
            <span>Approach (SND)</span>
            <strong>{formatStrokesGained(sgSummary?.approachSand)}</strong>
          </div>

          <div style={styles.summaryInline}>
            <span>Short game (FW)</span>
            <strong>{formatStrokesGained(sgSummary?.shortGameFairway)}</strong>
          </div>

          <div style={styles.summaryInline}>
            <span>Short game (RGH)</span>
            <strong>{formatStrokesGained(sgSummary?.shortGameRough)}</strong>
          </div>

          <div style={styles.summaryInline}>
            <span>Short game (SND)</span>
            <strong>{formatStrokesGained(sgSummary?.shortGameSand)}</strong>
          </div>

          <div style={styles.summaryInline}>
            <span>Recovery</span>
            <strong>{formatStrokesGained(sgSummary?.recovery)}</strong>
          </div>

          <div style={styles.summaryInline}>
            <span>On the green</span>
            <strong>{formatStrokesGained(sgSummary?.green)}</strong>
          </div>

          <div style={styles.summaryInline}>
            <span>Total</span>
            <strong>{formatStrokesGained(sgSummary?.total)}</strong>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Scorecard</h2>
          <Scorecard holes={summary.holes} styles={styles} />
        </div>

        <PieChart title="Fairways" data={fwChart} styles={styles} />
        <PieChart title="GIR" data={girChart} styles={styles} />

        {missPatternCharts.length > 0 && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Miss Patterns by Category</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {missPatternCharts.map((chart) => (
                <div key={chart.key} style={{ minWidth: 0 }}>
                  <PieChart
                    title={chart.title}
                    data={chart.data}
                    styles={styles}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <button style={styles.primaryButton} onClick={goHomeAndReset}>
          Back to Home
        </button>
      </div>
    </div>
  )
}