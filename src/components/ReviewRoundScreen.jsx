import { useMemo, useState } from "react"
import StatCard from "./StatCard"
import Scorecard from "./Scorecard"
import HoleValueChart from "./HoleValueChart"
import MissPatternBarChart from "./MissPatternBarChart"
import ReviewHoleEditor from "./ReviewHoleEditor"
import { formatToPar } from "../utils/golfFormatters"
import {
  buildMissPatternByCategoryFromShots,
  buildRoundHoleStats,
} from "../utils/analyticsTransforms"
import { SG_CATEGORY_LABELS } from "../utils/sgConfig"

function normalizeTagInput(value) {
  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  )
}

function sumMissCounts(grouped = {}) {
  return Object.values(grouped).reduce((acc, counts) => {
    for (const [key, value] of Object.entries(counts || {})) {
      acc[key] = Number(acc[key] || 0) + Number(value || 0)
    }
    return acc
  }, {})
}

function countMisses(counts = {}) {
  return Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0)
}

function formatBooleanResult(value) {
  if (value === 1) return "Hit"
  if (value === 0) return "Miss"
  return "-"
}

export default function ReviewRoundScreen({
  selectedReviewRound,
  selectedReviewShots = [],
  selectedReviewHoles = [],
  reviewSummary,
  updateRoundTags,
  deleteRound,
  saveReviewHoleEdits,
  deleteReviewHole,
  loading,
  goHome,
  styles,
}) {
  const [page, setPage] = useState(0)
  const [missChartIndex, setMissChartIndex] = useState(0)
  const [editingHole, setEditingHole] = useState(null)
  const [tagInput, setTagInput] = useState(() => (selectedReviewRound?.tags || []).join(", "))
  const pages = [
    "Stats",
    "Score",
    "SG",
    "Accuracy",
    "Approach",
    "Short",
    "Putting",
    "1st Putt",
    "Mistakes",
    "Misses",
    "Tags",
  ]

  const holeStats = useMemo(
    () => buildRoundHoleStats(selectedReviewHoles, selectedReviewShots),
    [selectedReviewHoles, selectedReviewShots]
  )

  const firstPuttDistances = holeStats
    .map((hole) => Number(hole.firstPuttDistance))
    .filter((value) => Number.isFinite(value))

  const avgFirstPuttDistance =
    firstPuttDistances.length > 0
      ? (
          firstPuttDistances.reduce((sum, value) => sum + value, 0) /
          firstPuttDistances.length
        ).toFixed(1)
      : "-"

  const missPatternCharts = useMemo(() => {
    const grouped = buildMissPatternByCategoryFromShots(selectedReviewShots)
    const overallCounts = sumMissCounts(grouped)

    const categoryCharts = Object.entries(grouped)
      .map(([categoryKey, counts]) => ({
        key: categoryKey,
        title: SG_CATEGORY_LABELS[categoryKey] || categoryKey,
        counts,
        total: countMisses(counts),
      }))
      .filter((chart) => chart.total > 0)

    return [
      {
        key: "overall",
        title: "All Misses",
        counts: overallCounts,
        total: countMisses(overallCounts),
      },
      ...categoryCharts,
    ].filter((chart) => chart.total > 0)
  }, [selectedReviewShots])

  const activeMissChart =
    missPatternCharts[
      Math.min(Math.max(0, missChartIndex - 1), Math.max(0, missPatternCharts.length - 1))
    ]

  const editingHoleShots = editingHole
    ? selectedReviewShots.filter(
        (shot) => Number(shot.hole_number) === Number(editingHole.hole_number)
      )
    : []

  if (editingHole) {
    return (
      <ReviewHoleEditor
        hole={editingHole}
        savedShots={editingHoleShots}
        styles={styles}
        loading={loading}
        onCancel={() => setEditingHole(null)}
        onSave={async (holeToSave, par, shots) => {
          const ok = await saveReviewHoleEdits(holeToSave, par, shots)
          if (ok) setEditingHole(null)
        }}
        onDelete={async (holeToDelete) => {
          const ok = await deleteReviewHole(holeToDelete)
          if (ok) setEditingHole(null)
        }}
      />
    )
  }

  return (
    <div style={styles.fixedScreen}>
      <div style={styles.fixedTopSection}>
        <div style={styles.sectionCardCompact}>
          <h1 style={styles.pageTitle}>Review Round</h1>
          <p style={styles.mutedText}>
            {selectedReviewRound?.course} | {selectedReviewRound?.date}
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
              <StatCard
                label="Avg 1st Putt"
                value={avgFirstPuttDistance === "-" ? "-" : `${avgFirstPuttDistance} m`}
                styles={styles}
              />
              <StatCard
                label="1st Putt GIR"
                value={
                  reviewSummary.avgFirstPuttOnGir === "-"
                    ? "-"
                    : `${reviewSummary.avgFirstPuttOnGir} m`
                }
                styles={styles}
              />
              <StatCard label="FW %" value={`${reviewSummary.fwPct}%`} styles={styles} />
              <StatCard label="GIR %" value={`${reviewSummary.girPct}%`} styles={styles} />
              <StatCard
                label="Scramble %"
                value={`${reviewSummary.scramblePct}%`}
                styles={styles}
              />
              <StatCard
                label="Up/down %"
                value={`${reviewSummary.upDownPct}%`}
                styles={styles}
              />
              <StatCard
                label="3-putt %"
                value={`${reviewSummary.threePuttPct}%`}
                styles={styles}
              />
              <StatCard
                label="Penalties"
                value={reviewSummary.penaltyStrokes}
                styles={styles}
              />
            </div>
          </div>
        )}

        {page === 1 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Scorecard</h2>
            <Scorecard
              holes={reviewSummary.holes}
              styles={styles}
              onHoleSelect={setEditingHole}
            />
          </div>
        )}

        {page === 2 && (
          <div style={styles.sectionCardCompact}>
            <HoleValueChart
              title="Strokes Gained by Hole"
              data={holeStats}
              dataKey="totalSg"
              color="#2563eb"
              valueFormatter={(value) => Number(value).toFixed(2)}
            />
          </div>
        )}

        {page === 3 && (
          <div style={styles.fixedChartGrid}>
            <div style={styles.sectionCardCompact}>
              <HoleValueChart
                title="Fairway by Hole"
                data={holeStats}
                dataKey="fairway"
                type="bar"
                color="#e6aa06"
                domain={[0, 1]}
                valueFormatter={formatBooleanResult}
              />
            </div>
            <div style={styles.sectionCardCompact}>
              <HoleValueChart
                title="GIR by Hole"
                data={holeStats}
                dataKey="gir"
                type="bar"
                color="#16a34a"
                domain={[0, 1]}
                valueFormatter={formatBooleanResult}
              />
            </div>
          </div>
        )}

        {page === 4 && (
          <div style={styles.sectionCardCompact}>
            <h2 style={styles.sectionTitle}>Approach Proximity</h2>
            <div style={styles.statsGrid}>
              {Object.entries(reviewSummary.approachProximityBands || {}).map(
                ([band, value]) => (
                  <StatCard
                    key={band}
                    label={`${band} m`}
                    value={value === "-" ? "-" : `${value} m`}
                    styles={styles}
                  />
                )
              )}
              <StatCard
                label="1st Putt GIR"
                value={
                  reviewSummary.avgFirstPuttOnGir === "-"
                    ? "-"
                    : `${reviewSummary.avgFirstPuttOnGir} m`
                }
                styles={styles}
              />
            </div>
          </div>
        )}

        {page === 5 && (
          <div style={styles.sectionCardCompact}>
            <HoleValueChart
              title="Scrambling by Hole"
              data={holeStats}
              dataKey="scramble"
              type="bar"
              color="#16a34a"
              domain={[0, 1]}
              valueFormatter={(value) => (Number(value) === 1 ? "Saved par" : "No save")}
            />
          </div>
        )}

        {page === 6 && (
          <div style={styles.sectionCardCompact}>
            <HoleValueChart
              title="Putts by Hole"
              data={holeStats}
              dataKey="putts"
              type="bar"
              color="#803c87"
            />
          </div>
        )}

        {page === 7 && (
          <div style={styles.sectionCardCompact}>
            <HoleValueChart
              title="1st Putt Distance by Hole"
              data={holeStats}
              dataKey="firstPuttDistance"
              color="#0f766e"
              valueFormatter={(value) => `${Number(value).toFixed(1)} m`}
            />
          </div>
        )}

        {page === 8 && (
          <div style={styles.fixedChartGrid}>
            <div style={styles.sectionCardCompact}>
              <HoleValueChart
                title="Penalty Strokes by Hole"
                data={holeStats}
                dataKey="penalty"
                type="bar"
                color="#dc2626"
              />
            </div>
            <div style={styles.sectionCardCompact}>
              <HoleValueChart
                title="3-Putts by Hole"
                data={holeStats}
                dataKey="threePutt"
                type="bar"
                color="#f97316"
                domain={[0, 1]}
                valueFormatter={(value) => (Number(value) === 1 ? "3-putt" : "No")}
              />
            </div>
          </div>
        )}

        {page === 9 && (
          <div style={styles.sectionCardCompact}>
            {missPatternCharts.length === 0 ? (
              <p style={styles.mutedText}>No miss pattern data for this round.</p>
            ) : (
              <>
                <div style={styles.compactChipWrap}>
                  <button
                    type="button"
                    style={{
                      ...styles.screenStepPill,
                      ...(missChartIndex === 0 ? styles.screenStepPillActive : {}),
                    }}
                    onClick={() => setMissChartIndex(0)}
                  >
                    By Hole
                  </button>
                  {missPatternCharts.map((chart, index) => (
                    <button
                      key={chart.key}
                      type="button"
                      style={{
                        ...styles.screenStepPill,
                        ...(index + 1 === missChartIndex ? styles.screenStepPillActive : {}),
                      }}
                      onClick={() => setMissChartIndex(index + 1)}
                    >
                      {chart.title}
                    </button>
                  ))}
                </div>
                {missChartIndex === 0 ? (
                  <HoleValueChart
                    title="Misses Logged by Hole"
                    data={holeStats}
                    dataKey="missCount"
                    type="bar"
                    color="#f97316"
                  />
                ) : (
                  <MissPatternBarChart
                    title={activeMissChart?.title || "Miss Patterns"}
                    counts={activeMissChart?.counts}
                    styles={styles}
                  />
                )}
              </>
            )}
          </div>
        )}

        {page === 10 && (
          <div style={styles.sectionCardCompact}>
            <label style={styles.label}>Round tags</label>
            <input
              style={styles.inputCompact}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="rain, windy, casual"
            />
            <button
              style={styles.primaryButton}
              onClick={() => updateRoundTags(selectedReviewRound?.id, normalizeTagInput(tagInput))}
              disabled={!selectedReviewRound?.id}
            >
              Save Tags
            </button>

            <button
              style={styles.deleteRoundButtonLarge}
              onClick={() => deleteRound(selectedReviewRound)}
              disabled={loading}
            >
              Delete Round
            </button>
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
