import { useMemo, useState } from "react"
import StatCard from "./StatCard"
import PieChart from "./PieChart"
import Scorecard from "./Scorecard"
import { formatToPar } from "../utils/golfFormatters"
import {
  MISS_PATTERN_LABELS,
  MISS_PATTERN_ORDER,
  MISS_PATTERN_COLORS,
} from "../utils/missPatternConfig"

const CATEGORY_LABELS = {
  Tee: "Off the tee",
  "Approach + Fairway": "Approach (FW)",
  "Approach + Rough": "Approach (RGH)",
  "Approach + Sand": "Approach (SND)",
  "Short Game + Fairway": "Short game (FW)",
  "Short Game + Rough": "Short game (RGH)",
  "Short Game + Sand": "Short game (SND)",
  Recovery: "Recovery",
  Putting: "On the green",
}

export default function SummaryScreen({
  course,
  date,
  summary,
  sgSummary,
  goHomeAndReset,
  styles,
}) {
  const [page, setPage] = useState(0)

  const pages = ["Overview", "SG", "Scorecard", "Charts"]

  const formatStrokesGained = (value) => {
    if (value === null || value === undefined || value === "") return "-"
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return "-"
    return `${numericValue >= 0 ? "+" : ""}${numericValue.toFixed(2)}`
  }

  const fwChart = [
    { label: "Hit", value: summary.fwHits, color: "#e6aa06" },
    { label: "Miss", value: summary.fwMisses, color: "#636363" },
  ]

  const girChart = [
    { label: "GIR", value: summary.girHits, color: "#4ab140" },
    { label: "No GIR", value: summary.girMisses, color: "#636363" },
  ]

  const missPatternCharts = useMemo(() => {
    const buildMissPatternChart = (counts) =>
      MISS_PATTERN_ORDER
        .map((key) => ({
          key,
          value: counts[key] || 0,
        }))
        .filter((d) => d.value > 0)
        .map((d) => ({
          label: MISS_PATTERN_LABELS[d.key],
          value: d.value,
          color: MISS_PATTERN_COLORS[d.key],
        }))

    return Object.entries(summary.missPatternByCategory || {})
      .map(([categoryKey, counts]) => ({
        key: categoryKey,
        title: CATEGORY_LABELS[categoryKey] || categoryKey,
        data: buildMissPatternChart(counts),
      }))
      .filter((chart) => chart.data.length > 0)
  }, [summary])

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Round Summary</h1>
          <p style={styles.mutedText}>
            {course} • {date}
          </p>
          <div style={styles.screenStepPills}>
            {pages.map((label, index) => (
              <div
                key={label}
                style={{
                  ...styles.screenStepPill,
                  ...(page === index ? styles.screenStepPillActive : {}),
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.fixedMainSection}>
        {page === 0 && (
          <div style={styles.sectionCardCompact}>
            <div style={styles.statsGrid}>
              <StatCard label="Score" value={summary.totalScore} styles={styles} />
              <StatCard
                label="To Par"
                value={formatToPar(summary.totalScore, summary.totalPar)}
                styles={styles}
              />
              <StatCard label="Avg Par 3" value={summary.avgPar3} styles={styles} />
              <StatCard label="Avg Par 4" value={summary.avgPar4} styles={styles} />
              <StatCard label="Avg Par 5" value={summary.avgPar5} styles={styles} />
            </div>
          </div>
        )}

        {page === 1 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Strokes Gained</h2>

            <div style={styles.summaryInline}><span>Off the tee</span><strong>{formatStrokesGained(sgSummary?.tee)}</strong></div>
            <div style={styles.summaryInline}><span>Approach (FW)</span><strong>{formatStrokesGained(sgSummary?.approachFairway)}</strong></div>
            <div style={styles.summaryInline}><span>Approach (RGH)</span><strong>{formatStrokesGained(sgSummary?.approachRough)}</strong></div>
            <div style={styles.summaryInline}><span>Approach (SND)</span><strong>{formatStrokesGained(sgSummary?.approachSand)}</strong></div>
            <div style={styles.summaryInline}><span>Short game (FW)</span><strong>{formatStrokesGained(sgSummary?.shortGameFairway)}</strong></div>
            <div style={styles.summaryInline}><span>Short game (RGH)</span><strong>{formatStrokesGained(sgSummary?.shortGameRough)}</strong></div>
            <div style={styles.summaryInline}><span>Short game (SND)</span><strong>{formatStrokesGained(sgSummary?.shortGameSand)}</strong></div>
            <div style={styles.summaryInline}><span>Recovery</span><strong>{formatStrokesGained(sgSummary?.recovery)}</strong></div>
            <div style={styles.summaryInline}><span>On the green</span><strong>{formatStrokesGained(sgSummary?.green)}</strong></div>
            <div style={styles.summaryInline}><span>Total</span><strong>{formatStrokesGained(sgSummary?.total)}</strong></div>
          </div>
        )}

        {page === 2 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Scorecard</h2>
            <Scorecard holes={summary.holes} styles={styles} />
          </div>
        )}

        {page === 3 && (
          <div style={styles.fixedChartGrid}>
            <PieChart title="Fairways" data={fwChart} styles={styles} />
            <PieChart title="GIR" data={girChart} styles={styles} />

            {missPatternCharts.length > 0 && (
              <div style={styles.sectionCardCompact}>
                <h2 style={styles.sectionTitle}>Miss Patterns</h2>
                <div style={styles.fixedChartGrid}>
                  {missPatternCharts.slice(0, 2).map((chart) => (
                    <PieChart
                      key={chart.key}
                      title={chart.title}
                      data={chart.data}
                      styles={styles}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.fixedBottomSection}>
        <div style={styles.bottomNavRowThree}>
          <button
            style={styles.secondaryButton}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
          >
            Back
          </button>

          <button style={styles.secondaryButton} onClick={goHomeAndReset}>
            Home
          </button>

          <button
            style={styles.primaryButton}
            onClick={() => {
              if (page < pages.length - 1) {
                setPage((prev) => prev + 1)
              } else {
                goHomeAndReset()
              }
            }}
          >
            {page < pages.length - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    </div>
  )
}