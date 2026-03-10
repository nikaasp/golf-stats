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

const LIE_OPTIONS = ["Tee", "Fairway", "Rough", "Sand", "Green", "Other"]

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

function makeShot(shotNumber) {
  return {
    shot_number: shotNumber,
    lie: "Fairway",
    distance_to_flag: "",
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

function App() {
  const [screen, setScreen] = useState("home") // home | play | summary | review
  const [loading, setLoading] = useState(false)

  const [roundId, setRoundId] = useState(null)
  const [hole, setHole] = useState(1)
  const [course, setCourse] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const [roundFinished, setRoundFinished] = useState(false)
  const [holesData, setHolesData] = useState([])
  const [reviewRounds, setReviewRounds] = useState([])
  const [selectedReviewRound, setSelectedReviewRound] = useState(null)
  const [selectedReviewHoles, setSelectedReviewHoles] = useState([])

  // Per-hole common
  const [par, setPar] = useState("")
  const [entryMode, setEntryMode] = useState("")

  // Score mode
  const [score, setScore] = useState("")
  const [putts, setPutts] = useState("")
  const [fairway, setFairway] = useState(false)
  const [gir, setGir] = useState(false)
  const [penalty, setPenalty] = useState(0)

  // Shot-by-shot mode
  const [shots, setShots] = useState([makeShot(1)])

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
    setRoundFinished(false)
    setHolesData([])
    resetHoleInputs()
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
  }

  function resetHoleInputs() {
    setPar("")
    setEntryMode("")
    resetScoreInputs()
    resetShotInputs()
  }

  function addShotRow() {
    setShots((prev) => [...prev, makeShot(prev.length + 1)])
  }

  function removeShotRow(index) {
    setShots((prev) => {
      if (prev.length === 1) return prev
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((shot, i) => ({
        ...shot,
        shot_number: i + 1,
      }))
    })
  }

  function updateShot(index, field, value) {
    setShots((prev) =>
      prev.map((shot, i) => (i === index ? { ...shot, [field]: value } : shot))
    )
  }

  function getValidShots() {
    return shots.filter(
      (s) =>
        s.lie ||
        s.distance_to_flag !== "" ||
        s.club !== "" ||
        s.shot_result !== "" ||
        s.penalty_type !== "None"
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
    setRoundFinished(true)
    setScreen("summary")
  }

  async function saveScoreHole() {
    if (!roundId) {
      alert("Please start a round first")
      return false
    }

    if (par === "") {
      alert("Please enter par")
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
      alert("Please enter par")
      return false
    }

    const validShots = getValidShots()

    if (validShots.length === 0) {
      alert("Please add at least one shot")
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
      distance_to_flag: shot.distance_to_flag === "" ? null : Number(shot.distance_to_flag),
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

    if (entryMode === "score") {
      ok = await saveScoreHole()
    }

    if (entryMode === "shot_by_shot") {
      ok = await saveShotByShotHole()
    }

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
    setRoundFinished(false)
    setHolesData([])
    resetHoleInputs()
  }

  const summary = useMemo(() => buildSummary(holesData), [holesData])
  const reviewSummary = useMemo(() => buildSummary(selectedReviewHoles), [selectedReviewHoles])
  const shotTotals = useMemo(() => calculateShotModeTotals(), [shots])

  if (screen === "home") {
    return (
      <div style={styles.page}>
        <div style={styles.cardWide}>
          <h1 style={styles.title}>Golf Stats Tracker</h1>

          <div style={styles.sectionBox}>
            <h2 style={styles.sectionTitle}>Start new round</h2>

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

          <div style={styles.sectionBox}>
            <h2 style={styles.sectionTitle}>Review rounds</h2>

            {reviewRounds.length === 0 ? (
              <p>No saved rounds yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Course</th>
                      <th style={styles.th}>Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewRounds.map((r) => (
                      <tr key={r.id}>
                        <td style={styles.td}>{r.date ?? "-"}</td>
                        <td style={styles.td}>{r.course ?? "-"}</td>
                        <td style={styles.td}>
                          <button
                            style={styles.smallButton}
                            onClick={() => loadRoundDetailsForReview(r)}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        <div style={styles.cardWide}>
          <h1 style={styles.title}>Round Summary</h1>

          <p><strong>Course:</strong> {course}</p>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Holes recorded:</strong> {holesData.length}</p>
          <p><strong>Played holes:</strong> {summary.playedCount}</p>
          <p><strong>Skipped holes:</strong> {summary.skippedCount}</p>
          <p><strong>Total score:</strong> {summary.totalScore}</p>
          <p><strong>Total par:</strong> {summary.totalPar}</p>
          <p><strong>Relative to par:</strong> {summary.relativeToParText}</p>
          <p><strong>Average score / played hole:</strong> {summary.avgScorePerPlayedHole}</p>
          <p><strong>Total putts:</strong> {summary.totalPutts}</p>
          <p><strong>GIR:</strong> {summary.girCount} ({summary.girPct}%)</p>
          <p><strong>Fairways:</strong> {summary.fairwayCount} ({summary.fairwayPct}%)</p>
          <p><strong>Shot-by-shot holes:</strong> {summary.shotByShotCount}</p>
          <p><strong>Score-only holes:</strong> {summary.scoreModeCount}</p>

          <h2 style={{ marginTop: 24 }}>Hole summary</h2>

          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Hole</th>
                  <th style={styles.th}>Mode</th>
                  <th style={styles.th}>Par</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>To Par</th>
                  <th style={styles.th}>Putts</th>
                  <th style={styles.th}>FW</th>
                  <th style={styles.th}>GIR</th>
                  <th style={styles.th}>Penalty</th>
                  <th style={styles.th}>Skipped</th>
                </tr>
              </thead>
              <tbody>
                {holesData.map((h) => (
                  <tr key={h.id}>
                    <td style={styles.td}>{h.hole_number}</td>
                    <td style={styles.td}>{h.entry_mode ?? "-"}</td>
                    <td style={styles.td}>{h.par ?? "-"}</td>
                    <td style={styles.td}>{h.score ?? "-"}</td>
                    <td style={styles.td}>{formatToPar(h.score, h.par)}</td>
                    <td style={styles.td}>{h.putts ?? "-"}</td>
                    <td style={styles.td}>{formatBoolean(h.fairway)}</td>
                    <td style={styles.td}>{formatBoolean(h.gir)}</td>
                    <td style={styles.td}>{h.penalty ?? "-"}</td>
                    <td style={styles.td}>{h.skipped ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.buttonRow}>
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
        <div style={styles.cardWide}>
          <h1 style={styles.title}>Review Round</h1>

          <p><strong>Course:</strong> {selectedReviewRound?.course ?? "-"}</p>
          <p><strong>Date:</strong> {selectedReviewRound?.date ?? "-"}</p>
          <p><strong>Played holes:</strong> {reviewSummary.playedCount}</p>
          <p><strong>Skipped holes:</strong> {reviewSummary.skippedCount}</p>
          <p><strong>Total score:</strong> {reviewSummary.totalScore}</p>
          <p><strong>Total par:</strong> {reviewSummary.totalPar}</p>
          <p><strong>Relative to par:</strong> {reviewSummary.relativeToParText}</p>
          <p><strong>Total putts:</strong> {reviewSummary.totalPutts}</p>
          <p><strong>GIR:</strong> {reviewSummary.girCount} ({reviewSummary.girPct}%)</p>
          <p><strong>Fairways:</strong> {reviewSummary.fairwayCount} ({reviewSummary.fairwayPct}%)</p>

          <h2 style={{ marginTop: 24 }}>Hole summary</h2>

          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Hole</th>
                  <th style={styles.th}>Mode</th>
                  <th style={styles.th}>Par</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>To Par</th>
                  <th style={styles.th}>Putts</th>
                  <th style={styles.th}>FW</th>
                  <th style={styles.th}>GIR</th>
                  <th style={styles.th}>Penalty</th>
                  <th style={styles.th}>Skipped</th>
                </tr>
              </thead>
              <tbody>
                {selectedReviewHoles.map((h) => (
                  <tr key={h.id}>
                    <td style={styles.td}>{h.hole_number}</td>
                    <td style={styles.td}>{h.entry_mode ?? "-"}</td>
                    <td style={styles.td}>{h.par ?? "-"}</td>
                    <td style={styles.td}>{h.score ?? "-"}</td>
                    <td style={styles.td}>{formatToPar(h.score, h.par)}</td>
                    <td style={styles.td}>{h.putts ?? "-"}</td>
                    <td style={styles.td}>{formatBoolean(h.fairway)}</td>
                    <td style={styles.td}>{formatBoolean(h.gir)}</td>
                    <td style={styles.td}>{h.penalty ?? "-"}</td>
                    <td style={styles.td}>{h.skipped ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.buttonRow}>
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
      <div style={styles.cardWide}>
        <h1 style={styles.title}>Golf Stats Tracker</h1>

        <p style={styles.roundInfo}><strong>Course:</strong> {course}</p>
        <p style={styles.roundInfo}><strong>Date:</strong> {date}</p>
        <p style={styles.roundInfo}><strong>Hole:</strong> {hole} / 18</p>

        <label style={styles.label}>Par</label>
        <input
          style={styles.input}
          type="number"
          value={par}
          onChange={(e) => setPar(e.target.value)}
          placeholder="Enter par"
        />

        <label style={styles.label}>How do you want to log this hole?</label>
        <div style={styles.modeRow}>
          <button
            type="button"
            style={{
              ...styles.modeButton,
              ...(entryMode === "shot_by_shot" ? styles.modeButtonActive : {}),
            }}
            onClick={() => setEntryMode("shot_by_shot")}
          >
            Shot by shot
          </button>

          <button
            type="button"
            style={{
              ...styles.modeButton,
              ...(entryMode === "score" ? styles.modeButtonActive : {}),
            }}
            onClick={() => setEntryMode("score")}
          >
            Score
          </button>
        </div>

        {entryMode === "score" && (
          <div style={styles.sectionBox}>
            <h2 style={styles.sectionTitle}>Score mode</h2>

            <label style={styles.label}>Score</label>
            <input
              style={styles.input}
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />

            <label style={styles.label}>Putts</label>
            <input
              style={styles.input}
              type="number"
              value={putts}
              onChange={(e) => setPutts(e.target.value)}
            />

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={fairway}
                onChange={(e) => setFairway(e.target.checked)}
              />
              <span>Fairway hit (optional)</span>
            </label>

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={gir}
                onChange={(e) => setGir(e.target.checked)}
              />
              <span>GIR (optional)</span>
            </label>

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
          <div style={styles.sectionBox}>
            <h2 style={styles.sectionTitle}>Shot-by-shot mode</h2>

            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Lie</th>
                    <th style={styles.th}>Dist. to flag</th>
                    <th style={styles.th}>Club</th>
                    <th style={styles.th}>Contact</th>
                    <th style={styles.th}>Penalty</th>
                    <th style={styles.th}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {shots.map((shot, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{index + 1}</td>

                      <td style={styles.td}>
                        <select
                          style={styles.tableInput}
                          value={shot.lie}
                          onChange={(e) => updateShot(index, "lie", e.target.value)}
                        >
                          {LIE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>

                      <td style={styles.td}>
                        <input
                          style={styles.tableInput}
                          type="number"
                          value={shot.distance_to_flag}
                          onChange={(e) => updateShot(index, "distance_to_flag", e.target.value)}
                          placeholder="145"
                        />
                      </td>

                      <td style={styles.td}>
                        <select
                          style={styles.tableInput}
                          value={shot.club}
                          onChange={(e) => updateShot(index, "club", e.target.value)}
                        >
                          <option value="">Select club</option>
                          {CLUB_OPTIONS.map((club) => (
                            <option key={club} value={club}>{club}</option>
                          ))}
                        </select>
                      </td>

                      <td style={styles.td}>
                        <select
                          style={styles.tableInput}
                          value={shot.shot_result}
                          onChange={(e) => updateShot(index, "shot_result", e.target.value)}
                        >
                          {SHOT_RESULT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>

                      <td style={styles.td}>
                        <select
                          style={styles.tableInput}
                          value={shot.penalty_type}
                          onChange={(e) => updateShot(index, "penalty_type", e.target.value)}
                        >
                          {PENALTY_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>

                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.smallButton}
                          onClick={() => removeShotRow(index)}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" style={styles.secondaryButton} onClick={addShotRow}>
              Add shot row
            </button>

            <div style={styles.summaryBox}>
              <p><strong>Shots entered:</strong> {shotTotals.shotCount}</p>
              <p><strong>Auto penalties:</strong> {shotTotals.autoPenalty}</p>
              <p><strong>Calculated hole score:</strong> {shotTotals.totalScore}</p>
            </div>
          </div>
        )}

        <div style={styles.buttonRow}>
          <button style={styles.primaryButton} onClick={saveHole} disabled={loading}>
            {hole === 18 ? "Save Hole 18 & Finish" : "Save Hole"}
          </button>

          <button style={styles.secondaryButton} onClick={skipHole} disabled={loading}>
            {hole === 18 ? "Skip Hole 18 & Finish" : "Skip Hole"}
          </button>

          <button style={styles.dangerButton} onClick={endRoundNow} disabled={loading}>
            End Round Now
          </button>

          <button style={styles.secondaryButton} onClick={goHomeAndReset} disabled={loading}>
            Cancel Round
          </button>
        </div>
      </div>
    </div>
  )
}

function buildSummary(holes) {
  const playedHoles = holes.filter((h) => !h.skipped)
  const skippedHoles = holes.filter((h) => h.skipped)

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
  const relativeToParText =
    relativeToPar > 0 ? `+${relativeToPar}` : `${relativeToPar}`

  const avgScorePerPlayedHole =
    playedHoles.length > 0 ? (totalScore / playedHoles.length).toFixed(2) : "0.00"

  const shotByShotCount = playedHoles.filter((h) => h.entry_mode === "shot_by_shot").length
  const scoreModeCount = playedHoles.filter((h) => h.entry_mode === "score").length

  return {
    playedCount: playedHoles.length,
    skippedCount: skippedHoles.length,
    totalScore,
    totalPar,
    totalPutts,
    girCount,
    fairwayCount,
    girPct,
    fairwayPct,
    relativeToParText,
    avgScorePerPlayedHole,
    shotByShotCount,
    scoreModeCount,
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
    background: "#f3f4f6",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  cardWide: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  title: {
    marginTop: 0,
    marginBottom: "20px",
  },
  roundInfo: {
    margin: "8px 0",
  },
  label: {
    display: "block",
    marginTop: "14px",
    marginBottom: "6px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
  },
  tableInput: {
    width: "100%",
    minWidth: "110px",
    padding: "8px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "16px",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    flexWrap: "wrap",
  },
  modeRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "10px",
    marginBottom: "16px",
  },
  modeButton: {
    padding: "12px 16px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #9ca3af",
    cursor: "pointer",
    background: "white",
    color: "#111827",
  },
  modeButtonActive: {
    background: "#2563eb",
    color: "white",
    border: "1px solid #2563eb",
  },
  primaryButton: {
    marginTop: "20px",
    padding: "12px 16px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    background: "#2563eb",
    color: "white",
  },
  secondaryButton: {
    marginTop: "20px",
    padding: "12px 16px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #9ca3af",
    cursor: "pointer",
    background: "white",
    color: "#111827",
  },
  dangerButton: {
    marginTop: "20px",
    padding: "12px 16px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    background: "#dc2626",
    color: "white",
  },
  smallButton: {
    padding: "6px 10px",
    fontSize: "12px",
    borderRadius: "8px",
    border: "1px solid #9ca3af",
    cursor: "pointer",
    background: "white",
  },
  sectionBox: {
    marginTop: "18px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    background: "#fafafa",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "12px",
  },
  summaryBox: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "12px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "12px",
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #d1d5db",
    padding: "8px",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "8px",
    fontSize: "14px",
    verticalAlign: "top",
  },
}

export default App