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
]

const LIE_OPTIONS = ["Tee", "Fairway", "Rough", "Sand", "Green"]
const SHOT_RESULT_OPTIONS = ["Pured", "Draw", "Fade", "Hook", "Slice", "Duff", "Top"]
const PENALTY_TYPE_OPTIONS = ["None", "Hazard", "OB"]

const DISTANCE_OPTIONS = Array.from({ length: 1301 }, (_, i) => (i * 0.5).toFixed(1))

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function getPenaltyFromType(type) {
  if (type === "Hazard") return 1
  if (type === "OB") return 2
  return 0
}

function getDefaultLieForShot(shotNumber) {
  return shotNumber === 1 ? "Tee" : "Fairway"
}

function makeShot(shotNumber) {
  return {
    shot_number: shotNumber,
    is_putt: false,
    lie: getDefaultLieForShot(shotNumber),
    distance_to_flag: 100,
    club: "",
    shot_result: "Pured",
    penalty_type: "None",
  }
}

function formatDistance(value) {
  return `${Number(value).toFixed(1)} m`
}

function groupShotsByHole(shots) {
  const grouped = {}
  for (const shot of shots) {
    const key = shot.hole_number
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(shot)
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.shot_number - b.shot_number)
  }
  return grouped
}

function inferHoleMetrics(hole, holeShots) {
  const par = hole.par ?? null

  if (hole.entry_mode === "score") {
    return {
      fairway: par === 3 ? null : hole.fairway,
      gir: hole.gir,
      putts: hole.putts,
      drivingDistance: null,
      approachAccuracy: null,
    }
  }

  if (hole.entry_mode !== "shot_by_shot") {
    return {
      fairway: null,
      gir: null,
      putts: null,
      drivingDistance: null,
      approachAccuracy: null,
    }
  }

  const shots = [...holeShots].sort((a, b) => a.shot_number - b.shot_number)
  const firstPutt = shots.find((s) => s.is_putt)
  const firstPuttIndex = shots.findIndex((s) => s.is_putt)

  let fairway = null
  if (par && par > 3 && shots.length >= 2) {
    const secondShot = shots[1]
    fairway = !secondShot.is_putt && secondShot.lie === "Fairway"
  }

  let gir = null
  if (par && firstPutt) {
    gir = firstPutt.shot_number <= par - 1
  } else if (par) {
    gir = false
  }

  const putts = shots.filter((s) => s.is_putt).length

  let drivingDistance = null
  if (
    par &&
    par > 3 &&
    shots.length >= 2 &&
    shots[0].distance_to_flag != null &&
    shots[1].distance_to_flag != null
  ) {
    drivingDistance = clamp(
      Number(shots[0].distance_to_flag) - Number(shots[1].distance_to_flag),
      0,
      650
    )
  }

  let approachAccuracy = null
  if (firstPuttIndex > 0) {
    const approachShot = shots[firstPuttIndex - 1]
    const firstPuttShot = shots[firstPuttIndex]
    if (
      approachShot?.distance_to_flag != null &&
      firstPuttShot?.distance_to_flag != null
    ) {
      approachAccuracy = clamp(
        Number(approachShot.distance_to_flag) - Number(firstPuttShot.distance_to_flag),
        0,
        650
      )
    }
  }

  return {
    fairway,
    gir,
    putts,
    drivingDistance,
    approachAccuracy,
  }
}

function buildRoundAnalytics(holes, shots) {
  const playedHoles = holes.filter((h) => !h.skipped)
  const shotsByHole = groupShotsByHole(shots)

  let totalScore = 0
  let totalPar = 0
  let totalPutts = 0

  let girHits = 0
  let girOpp = 0
  let fwHits = 0
  let fwOpp = 0

  let driveValues = []
  let approachValues = []

  let par3Scores = []
  let par4Scores = []
  let par5Scores = []

  const contactCounts = {
    Pured: 0,
    Draw: 0,
    Fade: 0,
    Hook: 0,
    Slice: 0,
    Duff: 0,
    Top: 0,
  }

  const perHole = playedHoles.map((hole) => {
    const holeShots = shotsByHole[hole.hole_number] || []
    const inferred = inferHoleMetrics(hole, holeShots)

    totalScore += hole.score || 0
    totalPar += hole.par || 0
    totalPutts += inferred.putts || 0

    if (hole.par === 3) par3Scores.push(hole.score || 0)
    if (hole.par === 4) par4Scores.push(hole.score || 0)
    if (hole.par === 5) par5Scores.push(hole.score || 0)

    if (inferred.fairway !== null) {
      fwOpp += 1
      if (inferred.fairway) fwHits += 1
    }

    if (inferred.gir !== null) {
      girOpp += 1
      if (inferred.gir) girHits += 1
    }

    if (inferred.drivingDistance !== null) {
      driveValues.push(inferred.drivingDistance)
    }

    if (inferred.approachAccuracy !== null) {
      approachValues.push(inferred.approachAccuracy)
    }

    for (const shot of holeShots) {
      if (!shot.is_putt && shot.shot_result && contactCounts[shot.shot_result] !== undefined) {
        contactCounts[shot.shot_result] += 1
      }
    }

    return {
      ...hole,
      inferred,
    }
  })

  const frontNine = perHole.filter((h) => h.hole_number <= 9)
  const backNine = perHole.filter((h) => h.hole_number >= 10)

  const frontScore = frontNine.reduce((s, h) => s + (h.score || 0), 0)
  const frontPar = frontNine.reduce((s, h) => s + (h.par || 0), 0)
  const backScore = backNine.reduce((s, h) => s + (h.score || 0), 0)
  const backPar = backNine.reduce((s, h) => s + (h.par || 0), 0)

  const avg = (arr) =>
    arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : "-"

  const girPct = girOpp > 0 ? ((girHits / girOpp) * 100).toFixed(1) : "0.0"
  const fwPct = fwOpp > 0 ? ((fwHits / fwOpp) * 100).toFixed(1) : "0.0"

  const contactTotal = Object.values(contactCounts).reduce((a, b) => a + b, 0)

  return {
    playedCount: perHole.length,
    totalScore,
    totalPar,
    relativeToPar: totalScore - totalPar,
    totalPutts,

    fwHits,
    fwMisses: Math.max(0, fwOpp - fwHits),
    fwOpp,
    fwPct,

    girHits,
    girMisses: Math.max(0, girOpp - girHits),
    girOpp,
    girPct,

    contactCounts,
    contactTotal,

    avgDrive: avg(driveValues),
    avgApproach: avg(approachValues),

    avgPar3: avg(par3Scores),
    avgPar4: avg(par4Scores),
    avgPar5: avg(par5Scores),

    frontScore,
    frontPar,
    backScore,
    backPar,

    holes: perHole,
  }
}

function formatToPar(score, par) {
  if (score == null || par == null) return "-"
  const diff = score - par
  if (diff > 0) return `+${diff}`
  return `${diff}`
}

function scoreStyle(score, par) {
  if (score == null || par == null) return styles.scorePar
  const diff = score - par
  if (diff <= -2) return styles.scoreEagle
  if (diff === -1) return styles.scoreBirdie
  if (diff === 0) return styles.scorePar
  if (diff === 1) return styles.scoreBogey
  return styles.scoreDouble
}

function scoreLabel(score, par) {
  if (score == null || par == null) return "-"
  const diff = score - par
  if (diff <= -2) return "Eagle+"
  if (diff === -1) return "Birdie"
  if (diff === 0) return "Par"
  if (diff === 1) return "Bogey"
  return "Double+"
}

function PieChart({ title, data }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>{title}</div>
        <div style={styles.noData}>No data</div>
      </div>
    )
  }

  let current = 0
  const gradientStops = data
    .map((d) => {
      const start = current
      const end = current + (d.value / total) * 100
      current = end
      return `${d.color} ${start}% ${end}%`
    })
    .join(", ")

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartTitle}>{title}</div>
      <div style={styles.chartWrap}>
        <div
          style={{
            ...styles.pie,
            background: `conic-gradient(${gradientStops})`,
          }}
        />
        <div style={styles.legend}>
          {data.map((d) => {
            const pct = ((d.value / total) * 100).toFixed(1)
            return (
              <div key={d.label} style={styles.legendRow}>
                <span style={{ ...styles.legendSwatch, background: d.color }} />
                <span style={styles.legendText}>
                  {d.label}: {pct}% ({d.value})
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DistancePicker({ value, onChange }) {
  return (
    <select
      style={styles.input}
      value={Number(value).toFixed(1)}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {DISTANCE_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt} m
        </option>
      ))}
    </select>
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

function App() {
  const [screen, setScreen] = useState("home")
  const [loading, setLoading] = useState(false)

  const [roundId, setRoundId] = useState(null)
  const [hole, setHole] = useState(1)
  const [course, setCourse] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const [holesData, setHolesData] = useState([])
  const [roundShots, setRoundShots] = useState([])

  const [reviewRounds, setReviewRounds] = useState([])
  const [selectedReviewRound, setSelectedReviewRound] = useState(null)
  const [selectedReviewHoles, setSelectedReviewHoles] = useState([])
  const [selectedReviewShots, setSelectedReviewShots] = useState([])

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
    if (screen === "home") loadRounds()
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

  async function fetchRoundBundle(targetRoundId) {
    const [holesRes, shotsRes] = await Promise.all([
      supabase
        .from("holes")
        .select("*")
        .eq("round_id", targetRoundId)
        .order("hole_number", { ascending: true }),
      supabase
        .from("shots")
        .select("*")
        .eq("round_id", targetRoundId)
        .order("hole_number", { ascending: true })
        .order("shot_number", { ascending: true }),
    ])

    if (holesRes.error) {
      alert("Could not load holes: " + holesRes.error.message)
      return null
    }
    if (shotsRes.error) {
      alert("Could not load shots: " + shotsRes.error.message)
      return null
    }

    return {
      holes: holesRes.data || [],
      shots: shotsRes.data || [],
    }
  }

  async function loadRoundDetailsForReview(round) {
    setLoading(true)
    const bundle = await fetchRoundBundle(round.id)
    setLoading(false)
    if (!bundle) return

    setSelectedReviewRound(round)
    setSelectedReviewHoles(bundle.holes)
    setSelectedReviewShots(bundle.shots)
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
    setRoundShots([])
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
      const updated = prev
        .filter((_, i) => i !== index)
        .map((shot, i) => ({
          ...shot,
          shot_number: i + 1,
          lie: shot.is_putt ? shot.lie : getDefaultLieForShot(i + 1),
        }))
      setActiveShotIndex(Math.max(0, Math.min(activeShotIndex, updated.length - 1)))
      return updated
    })
  }

  function updateShot(index, field, value) {
    setShots((prev) =>
      prev.map((shot, i) => {
        if (i !== index) return shot
        const updated = { ...shot, [field]: value }
        if (field === "is_putt" && value === true) {
          return {
            ...updated,
            lie: "Green",
            club: "",
            shot_result: "Pured",
            penalty_type: "None",
          }
        }
        if (field === "is_putt" && value === false) {
          return {
            ...updated,
            lie: getDefaultLieForShot(index + 1),
          }
        }
        return updated
      })
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

  function inferHoleValuesFromShots(selectedPar, validShots) {
    const firstPutt = validShots.find((s) => s.is_putt)
    const secondShot = validShots[1]

    const fairway =
      selectedPar > 3 && secondShot ? !secondShot.is_putt && secondShot.lie === "Fairway" : null

    const gir = firstPutt ? firstPutt.shot_number <= selectedPar - 1 : false
    const putts = validShots.filter((s) => s.is_putt).length

    return {
      fairway,
      gir,
      putts,
    }
  }

  async function finishRound() {
    const bundle = await fetchRoundBundle(roundId)
    if (!bundle) return
    setHolesData(bundle.holes)
    setRoundShots(bundle.shots)
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

    const selectedPar = parseInt(par, 10)
    const validShots = getValidShots()

    if (validShots.length === 0) {
      alert("Please log at least one shot with distance to hole")
      return false
    }

    const totals = calculateShotModeTotals()
    const inferred = inferHoleValuesFromShots(selectedPar, validShots)

    setLoading(true)

    const { data: holeInsertData, error: holeInsertError } = await supabase
      .from("holes")
      .insert({
        round_id: roundId,
        hole_number: hole,
        par: selectedPar,
        entry_mode: "shot_by_shot",
        score: totals.totalScore,
        putts: inferred.putts,
        fairway: inferred.fairway,
        gir: inferred.gir,
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
      lie: shot.is_putt ? "Green" : shot.lie,
      distance_to_flag: Number(shot.distance_to_flag),
      club: shot.is_putt ? null : shot.club || null,
      shot_result: shot.is_putt ? null : shot.shot_result || null,
      penalty_type: shot.is_putt ? "None" : shot.penalty_type || "None",
      auto_penalty: shot.is_putt ? 0 : getPenaltyFromType(shot.penalty_type),
      is_putt: shot.is_putt,
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

    const confirmed = window.confirm("Save current hole if possible and end the round now?")
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

  async function deleteRound(round) {
    const confirmed = window.confirm(`Delete round "${round.course}" on ${round.date}?`)
    if (!confirmed) return

    setLoading(true)

    const deleteShots = await supabase.from("shots").delete().eq("round_id", round.id)
    if (deleteShots.error) {
      setLoading(false)
      alert("Could not delete shots: " + deleteShots.error.message)
      return
    }

    const deleteHoles = await supabase.from("holes").delete().eq("round_id", round.id)
    if (deleteHoles.error) {
      setLoading(false)
      alert("Could not delete holes: " + deleteHoles.error.message)
      return
    }

    const deleteRoundRes = await supabase.from("rounds").delete().eq("id", round.id)
    setLoading(false)

    if (deleteRoundRes.error) {
      alert("Could not delete round: " + deleteRoundRes.error.message)
      return
    }

    if (selectedReviewRound?.id === round.id) {
      setScreen("home")
      setSelectedReviewRound(null)
      setSelectedReviewHoles([])
      setSelectedReviewShots([])
    }

    await loadRounds()
  }

  function goHomeAndReset() {
    setScreen("home")
    setRoundId(null)
    setHole(1)
    setCourse("")
    setDate(new Date().toISOString().slice(0, 10))
    setHolesData([])
    setRoundShots([])
    setSelectedReviewRound(null)
    setSelectedReviewHoles([])
    setSelectedReviewShots([])
    resetHoleInputs()
  }

  const summary = useMemo(
    () => buildRoundAnalytics(holesData, roundShots),
    [holesData, roundShots]
  )
  const reviewSummary = useMemo(
    () => buildRoundAnalytics(selectedReviewHoles, selectedReviewShots),
    [selectedReviewHoles, selectedReviewShots]
  )
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
                  <div key={r.id} style={styles.roundListItem}>
                    <button
                      style={styles.roundMainButton}
                      onClick={() => loadRoundDetailsForReview(r)}
                    >
                      <div>
                        <div style={styles.roundCourse}>{r.course || "Untitled round"}</div>
                        <div style={styles.roundDate}>{r.date || "-"}</div>
                      </div>
                      <div style={styles.roundChevron}>›</div>
                    </button>
                    <button
                      style={styles.deleteRoundButton}
                      onClick={() => deleteRound(r)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (screen === "summary") {
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
              <StatCard label="Score" value={summary.totalScore} />
              <StatCard label="To Par" value={formatToPar(summary.totalScore, summary.totalPar)} />
              <StatCard label="Putts" value={summary.totalPutts} />
              <StatCard label="Played" value={summary.playedCount} />
              <StatCard label="Avg Drive" value={summary.avgDrive === "-" ? "-" : `${summary.avgDrive} m`} />
              <StatCard
                label="Avg Approach"
                value={summary.avgApproach === "-" ? "-" : `${summary.avgApproach} m`}
              />
              <StatCard label="Avg Par 3" value={summary.avgPar3} />
              <StatCard label="Avg Par 4" value={summary.avgPar4} />
              <StatCard label="Avg Par 5" value={summary.avgPar5} />
            </div>
          </div>

          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Scorecard</h2>
            <Scorecard holes={summary.holes} />
          </div>

          <PieChart title="Fairways" data={fwChart} />
          <PieChart title="GIR" data={girChart} />
          <PieChart title="Club Contact" data={contactChart} />

          <button style={styles.primaryButton} onClick={goHomeAndReset}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (screen === "review") {
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
              <StatCard label="Score" value={reviewSummary.totalScore} />
              <StatCard
                label="To Par"
                value={formatToPar(reviewSummary.totalScore, reviewSummary.totalPar)}
              />
              <StatCard label="Putts" value={reviewSummary.totalPutts} />
              <StatCard label="Played" value={reviewSummary.playedCount} />
              <StatCard
                label="Avg Drive"
                value={reviewSummary.avgDrive === "-" ? "-" : `${reviewSummary.avgDrive} m`}
              />
              <StatCard
                label="Avg Approach"
                value={reviewSummary.avgApproach === "-" ? "-" : `${reviewSummary.avgApproach} m`}
              />
              <StatCard label="Avg Par 3" value={reviewSummary.avgPar3} />
              <StatCard label="Avg Par 4" value={reviewSummary.avgPar4} />
              <StatCard label="Avg Par 5" value={reviewSummary.avgPar5} />
            </div>
          </div>

          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>Scorecard</h2>
            <Scorecard holes={reviewSummary.holes} />
          </div>

          <PieChart title="Fairways" data={fwChart} />
          <PieChart title="GIR" data={girChart} />
          <PieChart title="Club Contact" data={contactChart} />

          <div style={styles.buttonRow}>
            <button style={styles.primaryButton} onClick={() => setScreen("home")}>
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
              <ToggleCard label="GIR" value={gir} onClick={() => setGir((v) => !v)} />
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
                    <div style={styles.puttToggleRow}>
                      <button
                        type="button"
                        style={{
                          ...styles.puttToggle,
                          ...(shot.is_putt ? styles.puttToggleActive : {}),
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          updateShot(index, "is_putt", !shot.is_putt)
                        }}
                      >
                        {shot.is_putt ? "Putting" : "Mark as Putt"}
                      </button>
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
                  </div>

                  <label style={styles.label}>Distance to hole</label>
                  <DistancePicker
                    value={Number(shot.distance_to_flag)}
                    onChange={(value) => updateShot(index, "distance_to_flag", value)}
                  />

                  {!shot.is_putt && (
                    <>
                      <label style={styles.label}>Lie</label>
                      <select
                        style={styles.input}
                        value={shot.lie}
                        onChange={(e) => updateShot(index, "lie", e.target.value)}
                      >
                        {LIE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      <label style={styles.label}>Club (optional)</label>
                      <select
                        style={styles.input}
                        value={shot.club}
                        onChange={(e) => updateShot(index, "club", e.target.value)}
                      >
                        <option value="">No club logged</option>
                        {CLUB_OPTIONS.map((club) => (
                          <option key={club} value={club}>
                            {club}
                          </option>
                        ))}
                      </select>

                      <label style={styles.label}>Ball-club contact</label>
                      <select
                        style={styles.input}
                        value={shot.shot_result}
                        onChange={(e) => updateShot(index, "shot_result", e.target.value)}
                      >
                        {SHOT_RESULT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      <label style={styles.label}>Penalty result</label>
                      <select
                        style={styles.input}
                        value={shot.penalty_type}
                        onChange={(e) => updateShot(index, "penalty_type", e.target.value)}
                      >
                        {PENALTY_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      <div style={styles.shotPenaltyInfo}>
                        Auto penalty: {getPenaltyFromType(shot.penalty_type)}
                      </div>
                    </>
                  )}

                  {shot.is_putt && (
                    <div style={styles.puttInfoBox}>
                      Putting shot: only distance to hole is required.
                    </div>
                  )}
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

function Scorecard({ holes }) {
  const front = holes.filter((h) => h.hole_number <= 9)
  const back = holes.filter((h) => h.hole_number >= 10)

  const renderNine = (label, list) => {
    const score = list.reduce((s, h) => s + (h.score || 0), 0)
    const par = list.reduce((s, h) => s + (h.par || 0), 0)

    return (
      <div style={styles.scorecardSection}>
        <div style={styles.scorecardHeaderRow}>
          <div style={styles.scorecardTitle}>{label}</div>
          <div style={styles.scorecardSubtotal}>
            {score} ({formatToPar(score, par)})
          </div>
        </div>

        <div style={styles.scorecardGrid}>
          {list.map((h) => (
            <div key={h.id} style={styles.scoreCell}>
              <div style={styles.scoreHoleNo}>{h.hole_number}</div>
              <div style={{ ...styles.scoreBadge, ...scoreStyle(h.score, h.par) }}>{h.score}</div>
              <div style={styles.scoreSymbol}>{scoreLabel(h.score, h.par)}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {renderNine("Front 9", front)}
      {renderNine("Back 9", back)}
      <div style={styles.scoreLegend}>
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreEagle }}>E</span> Eagle+
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreBirdie }}>B</span> Birdie
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scorePar }}>P</span> Par
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreBogey }}>Bo</span> Bogey
        <span style={{ ...styles.scoreBadgeSmall, ...styles.scoreDouble }}>D</span> Double+
      </div>
    </>
  )
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
  chartCard: {
    background: "white",
    padding: "16px",
    borderRadius: "18px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },
  chartTitle: {
    fontSize: "20px",
    fontWeight: 800,
    marginBottom: "12px",
  },
  chartWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    alignItems: "center",
  },
  pie: {
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    border: "12px solid white",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
  },
  legend: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  legendSwatch: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
  },
  legendText: {
    fontSize: "14px",
  },
  noData: {
    color: "#6b7280",
    padding: "12px 0",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
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
  deleteRoundButtonLarge: {
    width: "100%",
    minHeight: "50px",
    border: "none",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: 700,
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
  },
  buttonRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "10px",
  },
  roundList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "8px",
  },
  roundListItem: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "10px",
  },
  roundMainButton: {
    width: "100%",
    background: "transparent",
    border: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "left",
    padding: "4px 0",
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
  deleteRoundButton: {
    marginTop: "10px",
    width: "100%",
    minHeight: "42px",
    borderRadius: "12px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    fontWeight: 700,
    cursor: "pointer",
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
    alignItems: "flex-start",
    gap: "10px",
  },
  shotNumber: {
    fontWeight: 800,
    fontSize: "17px",
  },
  puttToggleRow: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-end",
  },
  puttToggle: {
    border: "1px solid #d1d5db",
    background: "white",
    color: "#111827",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  puttToggleActive: {
    background: "#16a34a",
    color: "white",
    border: "1px solid #16a34a",
  },
  removeGhostButton: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },
  puttInfoBox: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#166534",
    background: "#f0fdf4",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid #bbf7d0",
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
    fontSize: "22px",
    fontWeight: 800,
  },
  statLabel: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#6b7280",
  },
  scorecardSection: {
    marginTop: "12px",
  },
  scorecardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  scorecardTitle: {
    fontWeight: 800,
    fontSize: "16px",
  },
  scorecardSubtotal: {
    fontWeight: 700,
    color: "#374151",
  },
  scorecardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  scoreCell: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "10px",
    textAlign: "center",
  },
  scoreHoleNo: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "6px",
  },
  scoreBadge: {
    width: "44px",
    height: "44px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "18px",
  },
  scoreBadgeSmall: {
    width: "26px",
    height: "26px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "4px",
    marginLeft: "10px",
    fontSize: "11px",
    fontWeight: 800,
  },
  scoreSymbol: {
    marginTop: "6px",
    fontSize: "11px",
    color: "#4b5563",
  },
  scoreEagle: {
    borderRadius: "50%",
    border: "3px double #16a34a",
    background: "#f0fdf4",
    color: "#166534",
  },
  scoreBirdie: {
    borderRadius: "50%",
    border: "2px solid #2563eb",
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  scorePar: {
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "white",
    color: "#111827",
  },
  scoreBogey: {
    borderRadius: "4px",
    border: "2px solid #f59e0b",
    background: "#fffbeb",
    color: "#92400e",
  },
  scoreDouble: {
    borderRadius: "4px",
    border: "3px double #dc2626",
    background: "#fef2f2",
    color: "#991b1b",
  },
  scoreLegend: {
    marginTop: "14px",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    alignItems: "center",
    fontSize: "12px",
    color: "#4b5563",
  },
}

export default App