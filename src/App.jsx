import { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabase"

const CLUB_OPTIONS = [
  "Driver",
  "3 Wood",
  "5 Wood",
  "7 Wood",
  "3 Hybrid",
  "4 Hybrid",
  "5 Hybrid",
  "3 Iron",
  "4 Iron",
  "5 Iron",
  "6 Iron",
  "7 Iron",
  "8 Iron",
  "9 Iron",
  "PW",
  "GW",
  "SW",
  "LW",
  "Putter",
]

const LIE_OPTIONS = ["Tee", "Fairway", "Rough", "Sand", "Green"]

const SHOT_RESULT_OPTIONS = [
  "Pured",
  "Draw",
  "Fade",
  "Hook",
  "Slice",
  "Duff",
  "Top",
]

const PENALTY_TYPE_OPTIONS = ["None", "Hazard", "OB"]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function formatDistance(value) {
  return `${Number(value).toFixed(1)} m`
}

function getDefaultLieForShot(shotNumber) {
  return shotNumber === 1 ? "Tee" : "Fairway"
}

function makeShot(shotNumber) {
  return {
    shot_number: shotNumber,
    lie: getDefaultLieForShot(shotNumber),
    distance_to_flag: 100,
    club: "",
    shot_result: "Pured",
    penalty_type: "None",
  }
}

function getPenaltyFromType(type) {
  if (type === "Hazard") return 1
  if (type === "OB") return 2
  return 0
}

function DistanceDial({ value, onChange }) {
  const safeValue = typeof value === "number" ? value : 100

  function step(delta) {
    const next = clamp(Math.round((safeValue + delta) * 2) / 2, 0, 650)
    onChange(next)
  }

  return (
    <div style={styles.dialWrap}>
      <div style={styles.dialValue}>{formatDistance(safeValue)}</div>

      <div style={styles.dialRow}>
        <button type="button" style={styles.dialButton} onClick={() => step(-25)}>
          -25
        </button>
        <button type="button" style={styles.dialButton} onClick={() => step(-5)}>
          -5
        </button>
        <button type="button" style={styles.dialButton} onClick={() => step(-0.5)}>
          -0.5
        </button>
        <button type="button" style={styles.dialButton} onClick={() => step(0.5)}>
          +0.5
        </button>
        <button type="button" style={styles.dialButton} onClick={() => step(5)}>
          +5
        </button>
        <button type="button" style={styles.dialButton} onClick={() => step(25)}>
          +25
        </button>
      </div>

      <input
        style={styles.rangeInput}
        type="range"
        min="0"
        max="650"
        step="0.5"
        value={safeValue}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState("home")
  const [loading, setLoading] = useState(false)

  const [roundId, setRoundId] = useState(null)
  const [hole, setHole] = useState(1)
  const [course, setCourse] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const [holesData, setHolesData] = useState([])
  const [reviewRounds, setReviewRounds] = useState([])
  const [selectedReviewRound, setSelectedReviewRound] = useState(null)
  const [selectedReviewHoles, setSelectedReviewHoles] = useState([])

  const [par, setPar] = useState("")
  const [entryMode, setEntryMode] = useState("")

  const [score, setScore] = useState("")
  const [putts, setPutts] = useState("")
  const [fairway, setFairway] = useState(false)
  const [gir, setGir] = useState(false)
  const [penalty, setPenalty] = useState(0)

  const [shots, setShots] = useState([makeShot(1)])
  const [activeShotIndex, setActiveShotIndex] = useState(0)

  useEffect(() => {
    if (screen === "home") {
      loadRounds()
    }
  }, [screen])

  async function loadRounds() {
    const { data, error } = await supabase
      .from("rounds")
      .select("*")
      .order("date", { ascending: false })

    if (error) {
      alert("Could not load rounds: " + error.message)
      return
    }

    setReviewRounds(data || [])
  }

  async function loadRoundDetailsForReview(round) {
    setLoading(true)

    const { data, error } = await supabase
      .from("holes")
      .select("*")
      .eq("round_id", round.id)
      .order("hole_number", { ascending: true })

    setLoading(false)

    if (error) {
      alert("Could not load round details: " + error.message)
      return
    }

    setSelectedReviewRound(round)
    setSelectedReviewHoles(data || [])
    setScreen("review")
  }

  async function startRound() {
    if (!course.trim()) {
      alert("Please enter a course name")
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from("rounds")
      .insert({
        date,
        course: course.trim(),
      })
      .select()

    setLoading(false)

    if (error) {
      alert("Error starting round: " + error.message)
      return
    }

    setRoundId(data[0].id)
    setHole(1)
    resetHoleInputs()
    setHolesData([])
    setScreen("play")
  }

  function resetScoreInputs() {
    setScore("")
    setPutts("")
    setFairway(false)
    setGir(false)
    setPenalty(0)
  }

  function resetShotInputs() {
    setShots([makeShot(1)])
    setActiveShotIndex(0)
  }

  function resetHoleInputs() {
    setPar("")
    setEntryMode("")
    resetScoreInputs()
    resetShotInputs()
  }

  function addShotCard() {
    setShots((prev) => {
      const next = [...prev, makeShot(prev.length + 1)]
      setActiveShotIndex(next.length - 1)
      return next
    })
  }

  function removeShotCard(index) {
    setShots((prev) => {
      if (prev.length === 1) return prev
      const updated = prev.filter((_, i) => i !== index).map((shot, i) => ({
        ...shot,
        shot_number: i + 1,
        lie: i === 0 ? "Tee" : shot.lie === "Tee" ? "Fairway" : shot.lie,
      }))
      const nextActive = Math.max(0, Math.min(activeShotIndex, updated.length - 1))
      setActiveShotIndex(nextActive)
      return updated
    })
  }

  function updateShot(index, field, value) {
    setShots((prev) =>
      prev.map((shot, i) => (i === index ? { ...shot, [field]: value } : shot))
    )
    setActiveShotIndex(index)
  }

  function getValidShots() {
    return shots.filter(
      (s) =>
        s.distance_to_flag !== null &&
        s.distance_to_flag !== "" &&
        Number.isFinite(Number(s.distance_to_flag))
    )
  }

  function calculateShotModeTotals() {
    const validShots = getValidShots()
    const shotCount = validShots.length
    const autoPenalty = validShots.reduce(
      (sum, shot) => sum + getPenaltyFromType(shot.penalty_type),
      0
    )

    return {
      shotCount,
      autoPenalty,
      totalScore: shotCount + autoPenalty,
    }
  }

  async function fetchRoundHoles(currentRoundId) {
    const { data, error } = await supabase
      .from("holes")
      .select("*")
      .eq("round_id", currentRoundId)
      .order("hole_number", { ascending: true })

    if (error) {
      alert("Could not load round summary: " + error.message)
      return
    }

    setHolesData(data || [])
  }

  async function finishRound() {
    await fetchRoundHoles(roundId)
    setScreen("summary")
  }

  async function saveScoreHole() {
    if (!roundId) {
      alert("Please start a round first")
      return false
    }

    if (par === "") {
      alert("Please choose par")
      return false
    }

    if (score === "" || putts === "") {
      alert("Please enter score and putts")
      return false
    }

    setLoading(true)

    const { error } = await supabase.from("holes").insert({
      round_id: roundId,
      hole_number: hole,
      par: parseInt(par, 10),
      entry_mode: "score",
      score: parseInt(score, 10),
      putts: parseInt(putts, 10),
      fairway,
      gir,
      penalty: parseInt(penalty || 0, 10),
      skipped: false,
    })

    setLoading(false)

    if (error) {
      alert("Error saving hole: " + error.message)
      return false
    }

    return true
  }

  async function saveShotByShotHole() {
    if (!roundId) {
      alert("Please start a round first")
      return false
    }

    if (par === "") {
      alert("Please choose par")
      return false
    }

    const validShots = getValidShots()

    if (validShots.length === 0) {
      alert("Please log at least one shot with distance to flag")
      return false
    }

    const totals = calculateShotModeTotals()

    setLoading(true)

    const { data: holeInsertData, error: holeInsertError } = await supabase
      .from("holes")
      .insert({
        round_id: roundId,
        hole_number: hole,
        par: parseInt(par, 10),
        entry_mode: "shot_by_shot",
        score: totals.totalScore,
        putts: null,
        fairway: null,
        gir: null,
        penalty: totals.autoPenalty,
        skipped: false,
      })
      .select()

    if (holeInsertError) {
      setLoading(false)
      alert("Error saving hole: " + holeInsertError.message)
      return false
    }

    const newHoleId = holeInsertData[0].id

    const shotRows = validShots.map((shot, index) => ({
      round_id: roundId,
      hole_id: newHoleId,
      hole_number: hole,
      shot_number: index + 1,
      lie: shot.lie,
      distance_to_flag: Number(shot.distance_to_flag),
      club: shot.club || null,
      shot_result: shot.shot_result || null,
      penalty_type: shot.penalty_type || "None",
      auto_penalty: getPenaltyFromType(shot.penalty_type),
    }))

    const { error: shotsInsertError } = await supabase.from("shots").insert(shotRows)

    setLoading(false)

    if (shotsInsertError) {
      alert("Hole was saved, but shots failed to save: " + shotsInsertError.message)
      return false
    }

    return true
  }

  async function saveHole() {
    if (!entryMode) {
      alert('Please choose either "Shot by shot" or "Score"')
      return
    }

    let ok = false

    if (entryMode === "score") ok = await saveScoreHole()
    if (entryMode === "shot_by_shot") ok = await saveShotByShotHole()

    if (!ok) return

    if (hole >= 18) {
      resetHoleInputs()
      await finishRound()
      return
    }

    setHole(hole + 1)
    resetHoleInputs()
  }

  async function skipHole() {
    if (!roundId) {
      alert("Please start a round first")
      return
    }

    const confirmed = window.confirm(`Skip hole ${hole}?`)
    if (!confirmed) return

    setLoading(true)

    const { error } = await supabase.from("holes").insert({
      round_id: roundId,
      hole_number: hole,
      par: null,
      entry_mode: "skipped",
      score: null,
      putts: null,
      fairway: null,
      gir: null,
      penalty: 0,
      skipped: true,
    })

    setLoading(false)

    if (error) {
      alert("Error skipping hole: " + error.message)
      return
    }

    if (hole >= 18) {
      resetHoleInputs()
      await finishRound()
      return
    }

    setHole(hole + 1)
    resetHoleInputs()
  }

  function currentHoleHasData() {
    if (entryMode === "score") {
      return par !== "" || score !== "" || putts !== "" || penalty !== 0 || fairway || gir
    }

    if (entryMode === "shot_by_shot") {
      return par !== "" || getValidShots().length > 0
    }

    return false
  }

  async function endRoundNow() {
    if (!roundId) return

    const hasData = currentHoleHasData()

    if (!hasData) {
      const confirmed = window.confirm("End round now without saving the current hole?")
      if (!confirmed) return
      await finishRound()
      return
    }

    const confirmed = window.confirm(
      "Save current hole if possible and end the round now?"
    )
    if (!confirmed) return

    if (!entryMode) {
      alert('Choose "Shot by shot" or "Score", or clear the hole and end without saving.')
      return
    }

    let ok = false

    if (entryMode === "score") ok = await saveScoreHole()
    if (entryMode === "shot_by_shot") ok = await saveShotByShotHole()

    if (!ok) return

    resetHoleInputs()
    await finishRound()
  }

  function goHomeAndReset() {
    setScreen("home")
    setRoundId(null)
    setHole(1)
    setCourse("")
    setDate(new Date().toISOString().slice(0, 10))
    setHolesData([])
    setSelectedReviewRound(null)
    setSelectedReviewHoles([])
    resetHoleInputs()
  }

  const summary = useMemo(() => buildSummary(holesData), [holesData])
  const reviewSummary = useMemo(() => buildSummary(selectedReviewHoles), [selectedReviewHoles])
  const shotTotals = useMemo(() => calculateShotModeTotals(), [shots])

  if (screen === "home") {
    return (
      <div style={styles.page}>
        <div style={styles.mobileShell}>
          <div style={styles.heroCard}>
            <h1 style={styles.heroTitle}>Golf Stats</h1>
            <p style={styles.heroText}>Quick logging for the course.</p>

            <label style={styles.label}>Course name</label>
            <input
              style={styles.input}
              placeholder="Course name"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />

            <label style={styles.label}>Date</label>
            <input
              style={styles.input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <button style={styles.primaryButton} onClick={startRound} disabled={loading}>
              {loading ? "Starting..." : "Start New Round"}
            </button>
          </div>

          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Previous Rounds</h2>

            {reviewRounds.length === 0 ? (
              <p style={styles.mutedText}>No saved rounds yet.</p>
            ) : (
              <div style={styles.roundList}>
                {reviewRounds.map((r) => (
                  <button
                    key={r.id}
                    style={styles.roundListItem}
                    onClick={() => loadRoundDetailsForReview(r)}
                  >
                    <div>
                      <div style={styles.roundCourse}>{r.course || "Untitled round"}</div>
                      <div style={styles.roundDate}>{r.date || "-"}</div>
                    </div>
                    <div style={styles.roundChevron}>›</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (screen === "summary") {
    return (
      <div style={styles.page}>
        <div style={styles.mobileShell}>
          <div style={styles.sectionCard}>
            <h1 style={styles.heroTitle}>Round Summary</h1>
            <p style={styles.mutedText}>{course} • {date}</p>

            <div style={styles.statsGrid}>
              <StatCard label="Score" value={summary.totalScore} />
              <StatCard label="To Par" value={summary.relativeToParText} />
              <StatCard label="Putts" value={summary.totalPutts} />
              <StatCard label="Played" value={summary.playedCount} />
              <StatCard label="Avg / Hole" value={summary.avgScorePerPlayedHole} />
              <StatCard label="GIR %" value={summary.girPct} />
              <StatCard label="FW %" value={summary.fairwayPct} />
              <StatCard label="Total Par" value={summary.totalPar} />
            </div>
          </div>

          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Hole Summary</h2>
            <div style={styles.holeCardList}>
              {holesData
                .filter((h) => !h.skipped)
                .map((h) => (
                  <div key={h.id} style={styles.holeCard}>
                    <div style={styles.holeCardTop}>
                      <div style={styles.holeBadge}>Hole {h.hole_number}</div>
                      <div style={styles.modePill}>{h.entry_mode ?? "-"}</div>
                    </div>

                    <div style={styles.holeStatRow}>
                      <SmallMetric label="Par" value={h.par ?? "-"} />
                      <SmallMetric label="Score" value={h.score ?? "-"} />
                      <SmallMetric label="To Par" value={formatToPar(h.score, h.par)} />
                      <SmallMetric label="Putts" value={h.putts ?? "-"} />
                    </div>

                    <div style={styles.holeMetaRow}>
                      <span>FW: {formatBoolean(h.fairway)}</span>
                      <span>GIR: {formatBoolean(h.gir)}</span>
                      <span>Pen: {h.penalty ?? "-"}</span>
                    </div>
                  </div>
                ))}
            </div>

            <button style={styles.primaryButton} onClick={goHomeAndReset}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === "review") {
    return (
      <div style={styles.page}>
        <div style={styles.mobileShell}>
          <div style={styles.sectionCard}>
            <h1 style={styles.heroTitle}>Review Round</h1>
            <p style={styles.mutedText}>
              {selectedReviewRound?.course ?? "-"} • {selectedReviewRound?.date ?? "-"}
            </p>

            <div style={styles.statsGrid}>
              <StatCard label="Score" value={reviewSummary.totalScore} />
              <StatCard label="To Par" value={reviewSummary.relativeToParText} />
              <StatCard label="Putts" value={reviewSummary.totalPutts} />
              <StatCard label="Played" value={reviewSummary.playedCount} />
              <StatCard label="Avg / Hole" value={reviewSummary.avgScorePerPlayedHole} />
              <StatCard label="GIR %" value={reviewSummary.girPct} />
              <StatCard label="FW %" value={reviewSummary.fairwayPct} />
              <StatCard label="Total Par" value={reviewSummary.totalPar} />
            </div>
          </div>

          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Hole Summary</h2>

            <div style={styles.holeCardList}>
              {selectedReviewHoles
                .filter((h) => !h.skipped)
                .map((h) => (
                  <div key={h.id} style={styles.holeCard}>
                    <div style={styles.holeCardTop}>
                      <div style={styles.holeBadge}>Hole {h.hole_number}</div>
                      <div style={styles.modePill}>{h.entry_mode ?? "-"}</div>
                    </div>

                    <div style={styles.holeStatRow}>
                      <SmallMetric label="Par" value={h.par ?? "-"} />
                      <SmallMetric label="Score" value={h.score ?? "-"} />
                      <SmallMetric label="To Par" value={formatToPar(h.score, h.par)} />
                      <SmallMetric label="Putts" value={h.putts ?? "-"} />
                    </div>

                    <div style={styles.holeMetaRow}>
                      <span>FW: {formatBoolean(h.fairway)}</span>
                      <span>GIR: {formatBoolean(h.gir)}</span>
                      <span>Pen: {h.penalty ?? "-"}</span>
                    </div>
                  </div>
                ))}
            </div>

            <button style={styles.primaryButton} onClick={() => setScreen("home")}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.mobileShell}>
        <div style={styles.sectionCard}>
          <div style={styles.playHeader}>
            <div>
              <div style={styles.playCourse}>{course}</div>
              <div style={styles.playDate}>{date}</div>
            </div>
            <div style={styles.holeCounter}>Hole {hole}/18</div>
          </div>

          <label style={styles.label}>Par</label>
          <div style={styles.parRow}>
            {[3, 4, 5].map((parOption) => (
              <button
                key={parOption}
                type="button"
                style={{
                  ...styles.parButton,
                  ...(String(par) === String(parOption) ? styles.parButtonActive : {}),
                }}
                onClick={() => setPar(String(parOption))}
              >
                {parOption}
              </button>
            ))}
          </div>

          <label style={styles.label}>How do you want to log this hole?</label>
          <div style={styles.segmentedWrap}>
            <button
              type="button"
              style={{
                ...styles.segmentedButton,
                ...(entryMode === "shot_by_shot" ? styles.segmentedActive : {}),
              }}
              onClick={() => setEntryMode("shot_by_shot")}
            >
              Shot by shot
            </button>

            <button
              type="button"
              style={{
                ...styles.segmentedButton,
                ...(entryMode === "score" ? styles.segmentedActive : {}),
              }}
              onClick={() => setEntryMode("score")}
            >
              Score
            </button>
          </div>
        </div>

        {entryMode === "score" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Score Mode</h2>

            <div style={styles.twoColGrid}>
              <div>
                <label style={styles.label}>Score</label>
                <input
                  style={styles.input}
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Putts</label>
                <input
                  style={styles.input}
                  type="number"
                  value={putts}
                  onChange={(e) => setPutts(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.twoColGrid}>
              <ToggleCard
                label="Fairway hit"
                value={fairway}
                onClick={() => setFairway((v) => !v)}
              />
              <ToggleCard
                label="GIR"
                value={gir}
                onClick={() => setGir((v) => !v)}
              />
            </div>

            <label style={styles.label}>Penalties</label>
            <input
              style={styles.input}
              type="number"
              value={penalty}
              onChange={(e) => setPenalty(e.target.value)}
            />
          </div>
        )}

        {entryMode === "shot_by_shot" && (
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Shot-by-Shot</h2>

            <div style={styles.shotCardList}>
              {shots.map((shot, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.shotCard,
                    ...(activeShotIndex === index ? styles.shotCardActive : {}),
                  }}
                  onClick={() => setActiveShotIndex(index)}
                >
                  <div style={styles.shotCardHeader}>
                    <div style={styles.shotNumber}>Shot {index + 1}</div>
                    <button
                      type="button"
                      style={styles.removeGhostButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeShotCard(index)
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  <label style={styles.label}>Lie</label>
                  <select
                    style={styles.input}
                    value={shot.lie}
                    onChange={(e) => updateShot(index, "lie", e.target.value)}
                  >
                    {LIE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  <label style={styles.label}>Distance to flag</label>
                  <DistanceDial
                    value={Number(shot.distance_to_flag)}
                    onChange={(value) => updateShot(index, "distance_to_flag", value)}
                  />

                  <label style={styles.label}>Club (optional)</label>
                  <select
                    style={styles.input}
                    value={shot.club}
                    onChange={(e) => updateShot(index, "club", e.target.value)}
                  >
                    <option value="">No club logged</option>
                    {CLUB_OPTIONS.map((club) => (
                      <option key={club} value={club}>{club}</option>
                    ))}
                  </select>

                  <label style={styles.label}>Ball-club contact</label>
                  <select
                    style={styles.input}
                    value={shot.shot_result}
                    onChange={(e) => updateShot(index, "shot_result", e.target.value)}
                  >
                    {SHOT_RESULT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  <label style={styles.label}>Penalty result</label>
                  <select
                    style={styles.input}
                    value={shot.penalty_type}
                    onChange={(e) => updateShot(index, "penalty_type", e.target.value)}
                  >
                    {PENALTY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  <div style={styles.shotPenaltyInfo}>
                    Auto penalty: {getPenaltyFromType(shot.penalty_type)}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" style={styles.primaryButton} onClick={addShotCard}>
              + Add Shot
            </button>

            <div style={styles.summaryBox}>
              <div style={styles.summaryInline}>
                <span>Shots entered</span>
                <strong>{shotTotals.shotCount}</strong>
              </div>
              <div style={styles.summaryInline}>
                <span>Auto penalties</span>
                <strong>{shotTotals.autoPenalty}</strong>
              </div>
              <div style={styles.summaryInline}>
                <span>Calculated score</span>
                <strong>{shotTotals.totalScore}</strong>
              </div>
            </div>
          </div>
        )}

        <div style={styles.stickyActionBar}>
          <button style={styles.primaryAction} onClick={saveHole} disabled={loading}>
            {hole === 18 ? "Save & Finish" : "Save Hole"}
          </button>

          <div style={styles.secondaryActionsRow}>
            <button style={styles.secondaryAction} onClick={skipHole} disabled={loading}>
              Skip Hole
            </button>
            <button style={styles.dangerAction} onClick={endRoundNow} disabled={loading}>
              End Round
            </button>
          </div>

          <button style={styles.ghostAction} onClick={goHomeAndReset} disabled={loading}>
            Cancel Round
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

function SmallMetric({ label, value }) {
  return (
    <div style={styles.smallMetric}>
      <div style={styles.smallMetricLabel}>{label}</div>
      <div style={styles.smallMetricValue}>{value}</div>
    </div>
  )
}

function ToggleCard({ label, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.toggleCard,
        ...(value ? styles.toggleCardActive : {}),
      }}
    >
      <div style={styles.toggleCardLabel}>{label}</div>
      <div style={styles.toggleCardValue}>{value ? "Yes" : "No"}</div>
    </button>
  )
}

function buildSummary(holes) {
  const playedHoles = holes.filter((h) => !h.skipped)

  const totalScore = playedHoles.reduce((sum, h) => sum + (h.score || 0), 0)
  const totalPar = playedHoles.reduce((sum, h) => sum + (h.par || 0), 0)
  const totalPutts = playedHoles.reduce((sum, h) => sum + (h.putts || 0), 0)

  const girEligible = playedHoles.filter((h) => h.gir !== null && h.gir !== undefined)
  const fairwayEligible = playedHoles.filter((h) => h.fairway !== null && h.fairway !== undefined)

  const girCount = girEligible.filter((h) => h.gir).length
  const fairwayCount = fairwayEligible.filter((h) => h.fairway).length

  const girPct =
    girEligible.length > 0 ? ((girCount / girEligible.length) * 100).toFixed(1) : "0.0"

  const fairwayPct =
    fairwayEligible.length > 0
      ? ((fairwayCount / fairwayEligible.length) * 100).toFixed(1)
      : "0.0"

  const relativeToPar = totalScore - totalPar
  const relativeToParText = relativeToPar > 0 ? `+${relativeToPar}` : `${relativeToPar}`

  const avgScorePerPlayedHole =
    playedHoles.length > 0 ? (totalScore / playedHoles.length).toFixed(2) : "0.00"

  return {
    playedCount: playedHoles.length,
    totalScore,
    totalPar,
    totalPutts,
    girCount,
    fairwayCount,
    girPct,
    fairwayPct,
    relativeToParText,
    avgScorePerPlayedHole,
  }
}

function formatBoolean(value) {
  if (value === null || value === undefined) return "-"
  return value ? "Yes" : "No"
}

function formatToPar(score, par) {
  if (score == null || par == null) return "-"
  const diff = score - par
  if (diff > 0) return `+${diff}`
  return `${diff}`
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef2f7",
    padding: "12px",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#111827",
  },
  mobileShell: {
    maxWidth: "430px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingBottom: "120px",
  },
  heroCard: {
    background: "linear-gradient(180deg, #1d4ed8 0%, #2563eb 100%)",
    color: "white",
    padding: "18px",
    borderRadius: "20px",
    boxShadow: "0 10px 24px rgba(37,99,235,0.22)",
  },
  heroTitle: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.1,
  },
  heroText: {
    marginTop: "6px",
    marginBottom: "18px",
    opacity: 0.9,
  },
  sectionCard: {
    background: "white",
    padding: "16px",
    borderRadius: "18px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },
  mutedText: {
    color: "#6b7280",
    marginTop: "8px",
    marginBottom: 0,
  },
  label: {
    display: "block",
    marginTop: "12px",
    marginBottom: "6px",
    fontWeight: 700,
    fontSize: "14px",
  },
  input: {
    width: "100%",
    minHeight: "50px",
    padding: "12px 14px",
    fontSize: "16px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    background: "white",
  },
  primaryButton: {
    marginTop: "16px",
    width: "100%",
    minHeight: "50px",
    border: "none",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: 700,
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  roundList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "8px",
  },
  roundListItem: {
    width: "100%",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    textAlign: "left",
    cursor: "pointer",
  },
  roundCourse: {
    fontWeight: 700,
    fontSize: "16px",
  },
  roundDate: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "3px",
  },
  roundChevron: {
    fontSize: "28px",
    color: "#9ca3af",
    lineHeight: 1,
  },
  playHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  playCourse: {
    fontSize: "20px",
    fontWeight: 800,
  },
  playDate: {
    color: "#6b7280",
    marginTop: "4px",
    fontSize: "14px",
  },
  holeCounter: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  parRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginTop: "8px",
  },
  parButton: {
    minHeight: "52px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "white",
    fontSize: "18px",
    fontWeight: 800,
    cursor: "pointer",
  },
  parButtonActive: {
    background: "#2563eb",
    color: "white",
    border: "1px solid #2563eb",
  },
  segmentedWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "8px",
  },
  segmentedButton: {
    minHeight: "50px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "white",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  segmentedActive: {
    background: "#2563eb",
    color: "white",
    border: "1px solid #2563eb",
  },
  twoColGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  toggleCard: {
    width: "100%",
    marginTop: "12px",
    minHeight: "84px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    background: "white",
    padding: "14px",
    cursor: "pointer",
    textAlign: "left",
  },
  toggleCardActive: {
    background: "#eff6ff",
    border: "1px solid #60a5fa",
  },
  toggleCardLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },
  toggleCardValue: {
    marginTop: "10px",
    fontSize: "22px",
    fontWeight: 800,
  },
  shotCardList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
  },
  shotCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "14px",
    background: "#fafafa",
  },
  shotCardActive: {
    background: "#eff6ff",
    border: "2px solid #93c5fd",
  },
  shotCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  shotNumber: {
    fontWeight: 800,
    fontSize: "17px",
  },
  removeGhostButton: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },
  dialWrap: {
    marginTop: "4px",
    border: "1px solid #d1d5db",
    borderRadius: "16px",
    padding: "12px",
    background: "white",
  },
  dialValue: {
    textAlign: "center",
    fontSize: "28px",
    fontWeight: 800,
    marginBottom: "12px",
  },
  dialRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  dialButton: {
    minHeight: "42px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
  rangeInput: {
    width: "100%",
    marginTop: "12px",
  },
  shotPenaltyInfo: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#374151",
    background: "#f3f4f6",
    padding: "10px 12px",
    borderRadius: "12px",
  },
  summaryBox: {
    marginTop: "14px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  summaryInline: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "15px",
  },
  stickyActionBar: {
    position: "sticky",
    bottom: "10px",
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(8px)",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "12px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
  },
  primaryAction: {
    width: "100%",
    minHeight: "52px",
    border: "none",
    borderRadius: "16px",
    fontSize: "17px",
    fontWeight: 800,
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  secondaryActionsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "10px",
  },
  secondaryAction: {
    minHeight: "48px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  dangerAction: {
    minHeight: "48px",
    borderRadius: "14px",
    border: "none",
    background: "#dc2626",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  ghostAction: {
    marginTop: "10px",
    width: "100%",
    minHeight: "44px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#374151",
    fontWeight: 700,
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginTop: "14px",
  },
  statCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: 800,
  },
  statLabel: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#6b7280",
  },
  holeCardList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px",
  },
  holeCard: {
    background: "#fafafa",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
  },
  holeCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  holeBadge: {
    fontWeight: 800,
    fontSize: "16px",
  },
  modePill: {
    background: "#e5e7eb",
    color: "#374151",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  holeStatRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
  },
  smallMetric: {
    background: "white",
    borderRadius: "12px",
    padding: "10px",
    border: "1px solid #e5e7eb",
  },
  smallMetricLabel: {
    color: "#6b7280",
    fontSize: "12px",
  },
  smallMetricValue: {
    fontWeight: 800,
    fontSize: "18px",
    marginTop: "4px",
  },
  holeMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "12px",
    fontSize: "13px",
    color: "#4b5563",
  },
}

export default App