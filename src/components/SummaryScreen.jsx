import { useState } from "react"
import StatCard from "./StatCard"
import Scorecard from "./Scorecard"
import RoundTagsEditor from "./RoundTagsEditor"
import { formatToPar } from "../utils/golfFormatters"

export default function SummaryScreen({
  roundId,
  course,
  date,
  summary,
  sgSummary,
  roundTags = [],
  availableTags = [],
  updateRoundTags,
  goHomeAndReset,
  styles,
}) {
  const [page, setPage] = useState(0)

  const pages = ["Overview", "SG", "Scorecard", "Tags"]

  const formatStrokesGained = (value) => {
    if (value === null || value === undefined || value === "") return "-"
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return "-"
    return `${numericValue >= 0 ? "+" : ""}${numericValue.toFixed(2)}`
  }

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Round Summary</h1>
          <p style={styles.mutedText}>
            {course} | {date}
          </p>
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
        )}

        {page === 2 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Scorecard</h2>
            <Scorecard holes={summary.holes} styles={styles} />
          </div>
        )}

        {page === 3 && (
          <div style={styles.sectionCardCompact}>
            <RoundTagsEditor
              initialTags={roundTags}
              availableTags={availableTags}
              onSave={(tags) => updateRoundTags(roundId, tags)}
              styles={styles}
            />
          </div>
        )}
      </div>

      <div style={styles.fixedBottomSection}>
        <div style={styles.bottomNavRow}>
          <button style={styles.secondaryButton} onClick={goHomeAndReset}>
            Home
          </button>

          <button style={styles.primaryButton} onClick={goHomeAndReset}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
