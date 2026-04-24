import { useMemo, useState } from "react"
import StatCard from "./StatCard"
import Scorecard from "./Scorecard"
import HoleValueChart from "./HoleValueChart"
import ReviewHoleEditor from "./ReviewHoleEditor"
import RoundTagsEditor from "./RoundTagsEditor"
import { formatToPar } from "../utils/golfFormatters"
import { buildRoundHoleStats } from "../utils/analyticsTransforms"

function formatBooleanResult(value) {
  if (value === 1) return "Hit"
  if (value === 0) return "Miss"
  return "-"
}

function formatScoreToPar(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return "-"
  if (numeric === 0) return "E"
  return numeric > 0 ? `+${numeric}` : String(numeric)
}

function buildApproachBandLieCounts(shots = []) {
  const bands = [
    { label: "0-50 m", min: 0, max: 50 },
    { label: "50-100 m", min: 50, max: 100 },
    { label: "100-150 m", min: 100, max: 150 },
    { label: "150-200 m", min: 150, max: 200 },
    { label: "200+ m", min: 200, max: Infinity },
  ]

  const rows = bands.map((band) => ({
    band: band.label,
    Fairway: 0,
    Rough: 0,
    Sand: 0,
    Recovery: 0,
  }))

  shots.forEach((shot) => {
    const category = String(shot.sg_category || "")
    if (!category.startsWith("Approach") && !category.startsWith("Short Game")) return

    const distance = Number(shot.distance_to_flag)
    if (!Number.isFinite(distance)) return

    const row = rows.find((item, index) => {
      const band = bands[index]
      return distance >= band.min && distance < band.max
    })
    if (!row) return

    const lie = ["Fairway", "Rough", "Sand", "Recovery"].includes(shot.lie)
      ? shot.lie
      : null
    if (!lie) return
    row[lie] += 1
  })

  return rows
}

export default function ReviewRoundScreen({
  selectedReviewRound,
  selectedReviewShots = [],
  selectedReviewHoles = [],
  reviewSummary,
  updateRoundTags,
  availableTags = [],
  deleteRound,
  saveReviewHoleEdits,
  deleteReviewHole,
  loading,
  goHome,
  styles,
}) {
  const [page, setPage] = useState(0)
  const [editingHole, setEditingHole] = useState(null)
  const pages = [
    "Stats",
    "Score",
    "SG",
    "Accuracy",
    "Approach",
    "Putting",
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

  const approachBandLieCounts = useMemo(
    () => buildApproachBandLieCounts(selectedReviewShots),
    [selectedReviewShots]
  )

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
            <div style={styles.sectionCardCompact}>
              <HoleValueChart
                title="Score vs Par by Hole"
                data={holeStats}
                dataKey="toPar"
                type="bar"
                color="#2563eb"
                valueFormatter={formatScoreToPar}
              />
            </div>
          </div>
        )}

        {page === 4 && (
          <div style={styles.fixedChartGrid}>
            <div style={styles.sectionCardCompact}>
              <HoleValueChart
                title="Approach Accuracy by Hole"
                data={holeStats}
                dataKey="firstPuttDistance"
                color="#0f766e"
                valueFormatter={(value) => `${Number(value).toFixed(1)} m`}
              />
            </div>
            <div style={styles.sectionCardCompact}>
              <h2 style={styles.sectionTitle}>Approach Distance Bands by Lie</h2>
              <div style={styles.analyticsTable}>
                {approachBandLieCounts.map((row) => (
                  <div key={row.band} style={styles.analyticsTableRow}>
                    <strong>{row.band}</strong>
                    <span>FW {row.Fairway}</span>
                    <span>RGH {row.Rough}</span>
                    <span>SND {row.Sand}</span>
                    <span>REC {row.Recovery}</span>
                    <span>Total {row.Fairway + row.Rough + row.Sand + row.Recovery}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === 5 && (
          <div style={styles.fixedChartGrid}>
            <div style={styles.sectionCardCompact}>
              <HoleValueChart
                title="Putts by Hole"
                data={holeStats}
                dataKey="putts"
                type="bar"
                color="#803c87"
              />
            </div>
            <div style={styles.sectionCardCompact}>
              <HoleValueChart
                title="1st Putt Accuracy by Hole"
                data={holeStats}
                dataKey="firstPuttLeaveDistance"
                color="#0f766e"
                valueFormatter={(value) => `${Number(value).toFixed(1)} m`}
              />
            </div>
          </div>
        )}

        {page === 6 && (
          <div style={styles.sectionCardCompact}>
            <RoundTagsEditor
              initialTags={selectedReviewRound?.tags || []}
              availableTags={availableTags}
              onSave={(tags) => updateRoundTags(selectedReviewRound?.id, tags)}
              styles={styles}
            />

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
