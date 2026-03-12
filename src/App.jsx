import { useEffect, useMemo, useState } from "react"

import { supabase } from "./supabase"

import AuthScreen from "./components/AuthScreen"
import HomeScreen from "./components/HomeScreen"
import PlayRoundScreen from "./components/PlayRoundScreen"
import SummaryScreen from "./components/SummaryScreen"
import ReviewRoundScreen from "./components/ReviewRoundScreen"
import RoundsListScreen from "./components/RoundsListScreen"
import AnalyticsScreen from "./components/AnalyticsScreen"

import {
  createCourse,
  fetchCourses,
  findCourseByName,
  updateCourseById,
  updateCourseLastPlayed,
  updateRoundCourse,
} from "./services/coursesService"

import { styles } from "./utils/styles"

import {
  evaluateHoleStrokesGained,
  summarizeRoundStrokesGained
} from "./utils/strokesGained"

import {
  buildRoundAnalytics,
  calculateShotModeTotals,
  getDefaultLieForShot,
  getPenaltyFromType,
  getValidShots,
  inferHoleValuesFromShots,
  makeShot,
} from "./utils/analytics"

import {
  createRound,
  deleteRoundById,
  fetchRoundBundle,
  fetchRounds,
} from "./services/roundsService"

import { insertHole, insertSkippedHole } from "./services/holesService"
import { insertShots } from "./services/shotsService"

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

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

  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedCourseData, setSelectedCourseData] = useState(null)
  const [isNewCourse, setIsNewCourse] = useState(true)
  const [newCoursePars, setNewCoursePars] = useState([])

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Error loading session:", error.message)
      }

      if (mounted) {
        setSession(session ?? null)
        setAuthLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
      setAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session && screen === "home") {
      loadRounds()
      loadCourses()
    }
  }, [screen, session])

  useEffect(() => {
    if (!selectedCourseId || selectedCourseId === "new") {
      setSelectedCourseData(null)
      return
    }

    const selected = courses.find((c) => c.id === selectedCourseId) || null
    setSelectedCourseData(selected)
  }, [selectedCourseId, courses])

  useEffect(() => {
    if (screen !== "play") return
    if (isNewCourse) return
    if (!selectedCourseData?.hole_pars?.length) return

    const holeData = selectedCourseData.hole_pars.find((h) => h.hole === hole)
    if (holeData) {
      setPar(String(holeData.par))
    } else {
      setPar("")
    }
  }, [hole, screen, isNewCourse, selectedCourseData])

  async function loadRounds() {
    const { data, error } = await fetchRounds()
    if (error) {
      alert("Could not load rounds: " + error.message)
      return
    }
    setReviewRounds(data || [])
  }

  async function loadCourses() {
    const { data, error } = await fetchCourses()
    if (error) {
      alert("Could not load courses: " + error.message)
      return
    }
    setCourses(data || [])
  }

  async function loadRoundDetailsForReview(round) {
    setLoading(true)
    const bundle = await fetchRoundBundle(round.id)
    setLoading(false)

    if (bundle.holesRes.error) {
      alert("Could not load holes: " + bundle.holesRes.error.message)
      return
    }
    if (bundle.shotsRes.error) {
      alert("Could not load shots: " + bundle.shotsRes.error.message)
      return
    }

    setSelectedReviewRound(round)
    setSelectedReviewHoles(bundle.holesRes.data || [])
    setSelectedReviewShots(bundle.shotsRes.data || [])
    setScreen("review")
  }

  async function startRound() {
    if (isNewCourse) {
      if (!course.trim()) {
        alert("Please enter a course name")
        return
      }
    } else {
      if (!selectedCourseData) {
        alert("Please select a saved course")
        return
      }
    }

    if (!session?.user) {
      alert("Please log in first")
      return
    }

    const courseName = isNewCourse ? course.trim() : selectedCourseData.name
    const courseId = isNewCourse ? null : selectedCourseData.id

    setLoading(true)
    const { data, error } = await createRound({
      user_id: session.user.id,
      date,
      course: courseName,
      course_id: courseId,
    })
    setLoading(false)

    if (error) {
      alert("Error starting round: " + error.message)
      return
    }

    if (!isNewCourse && courseId) {
      await updateCourseLastPlayed(courseId)
    }

    setRoundId(data[0].id)
    setCourse(courseName)
    setHole(1)
    setNewCoursePars([])
    setHolesData([])
    setRoundShots([])

    if (!isNewCourse && selectedCourseData?.hole_pars?.length) {
      const hole1 = selectedCourseData.hole_pars.find((h) => h.hole === 1)
      setPar(hole1 ? String(hole1.par) : "")
    } else {
      setPar("")
    }

    setEntryMode("")
    resetScoreInputs()
    resetShotInputs()
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
          lie: getDefaultLieForShot(i + 1),
        }))

      setActiveShotIndex(Math.max(0, Math.min(activeShotIndex, updated.length - 1)))
      return updated
    })
  }

  function updateShot(index, field, value) {
  setShots((prev) =>
    prev.map((shot, i) => {
      if (i !== index) return shot
      return { ...shot, [field]: value }
    })
  )

  setActiveShotIndex(index)
  }

  async function finishRound(finalCoursePars = null) {
    const parsToSave = finalCoursePars || newCoursePars

    if (isNewCourse && session?.user && course.trim() && parsToSave.length > 0) {
      const normalizedName = course.trim()

      const existingCourseRes = await findCourseByName(session.user.id, normalizedName)

      if (existingCourseRes.error) {
        alert("Round saved, but course lookup failed: " + existingCourseRes.error.message)
      } else {
        const existingCourse = existingCourseRes.data?.[0]

        if (existingCourse) {
          const updateRes = await updateCourseById(existingCourse.id, {
            name: normalizedName,
            hole_pars: parsToSave,
            last_played_at: new Date().toISOString(),
          })

          if (updateRes.error) {
            alert("Round saved, but existing course could not be updated: " + updateRes.error.message)
          } else if (roundId) {
            await updateRoundCourse(roundId, existingCourse.id)
          }
        } else {
          const { data: courseData, error: courseError } = await createCourse({
            user_id: session.user.id,
            name: normalizedName,
            hole_pars: parsToSave,
            last_played_at: new Date().toISOString(),
          })

          if (courseError) {
            alert("Round saved, but course could not be created: " + courseError.message)
          } else if (courseData?.[0]?.id && roundId) {
            await updateRoundCourse(roundId, courseData[0].id)
          }
        }
      }
    }

    const bundle = await fetchRoundBundle(roundId)

    if (bundle.holesRes.error) {
      alert("Could not load holes: " + bundle.holesRes.error.message)
      return
    }
    if (bundle.shotsRes.error) {
      alert("Could not load shots: " + bundle.shotsRes.error.message)
      return
    }

    setHolesData(bundle.holesRes.data || [])
    setRoundShots(bundle.shotsRes.data || [])
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

    const parValue = parseInt(par, 10)
    const scoreValue = score === "" ? parValue : parseInt(score, 10)
    const puttsValue = putts === "" ? 2 : parseInt(putts, 10)
    const penaltyValue = penalty === "" ? 0 : parseInt(penalty, 10)

    if (isNewCourse) {
      setNewCoursePars((prev) => {
        const filtered = prev.filter((h) => h.hole !== hole)
        return [...filtered, { hole, par: parValue }].sort((a, b) => a.hole - b.hole)
      })
    }

    setLoading(true)

    const { error } = await insertHole({
      user_id: session.user.id,
      round_id: roundId,
      hole_number: hole,
      par: parValue,
      entry_mode: "score",
      score: scoreValue,
      putts: puttsValue,
      fairway,
      gir,
      penalty: penaltyValue,
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
    const validShots = getValidShots(shots)

    if (validShots.length === 0) {
      alert("Please log at least one shot with distance to hole")
      return false
    }

    if (isNewCourse) {
      setNewCoursePars((prev) => {
        const filtered = prev.filter((h) => h.hole !== hole)
        return [...filtered, { hole, par: selectedPar }].sort((a, b) => a.hole - b.hole)
      })
    }

    const totals = calculateShotModeTotals(shots)
    const inferred = inferHoleValuesFromShots(selectedPar, validShots)
    const evaluatedShots = evaluateHoleStrokesGained(validShots)

    setLoading(true)

    const { data, error } = await insertHole({
      user_id: session.user.id,
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

    if (error) {
      setLoading(false)
      alert("Error saving hole: " + error.message)
      return false
    }

    const newHoleId = data[0].id

    const shotRows = evaluatedShots.map((shot, index) => ({
      user_id: session.user.id,
      round_id: roundId,
      hole_id: newHoleId,
      hole_number: hole,
      shot_number: index + 1,
      lie: shot.lie,
      distance_to_flag: Number(shot.distance_to_flag),
      miss_pattern: shot.miss_pattern || null,
      penalty_type: shot.penalty_type || "None",
      auto_penalty: getPenaltyFromType(shot.penalty_type),
      sg_category: shot.sg_category,
      expected_before: shot.expected_before,
      expected_after: shot.expected_after,
      strokes_gained: shot.strokes_gained,
    }))

    const shotInsert = await insertShots(shotRows)

    setLoading(false)

    if (shotInsert.error) {
      alert("Hole was saved, but shots failed to save: " + shotInsert.error.message)
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
    let parForThisHole = null

    if (entryMode === "score") {
      parForThisHole = par === "" ? null : parseInt(par, 10)
      ok = await saveScoreHole()
    }

    if (entryMode === "shot_by_shot") {
      parForThisHole = par === "" ? null : parseInt(par, 10)
      ok = await saveShotByShotHole()
    }

    if (!ok) return

    const finalPars =
      isNewCourse && parForThisHole !== null
        ? [...newCoursePars.filter((h) => h.hole !== hole), { hole, par: parForThisHole }].sort(
            (a, b) => a.hole - b.hole
          )
        : newCoursePars

    if (hole >= 18) {
      resetHoleInputs()
      await finishRound(finalPars)
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

    const { error } = await insertSkippedHole({
      user_id: session.user.id,
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
      return par !== "" || getValidShots(shots).length > 0
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
    const result = await deleteRoundById(round.id)
    setLoading(false)

    if (result.error) {
      alert("Could not delete round: " + result.error.message)
      return
    }

    if (selectedReviewRound?.id === round.id) {
      setScreen("home")
      setSelectedReviewRound(null)
      setSelectedReviewHoles([])
      setSelectedReviewShots([])
    }

    await loadRounds()
    await loadCourses()
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      alert("Could not sign out: " + error.message)
      return
    }

    setSession(null)
    goHomeAndReset()
  }

  function goHomeAndReset() {
    setScreen("home")
    setRoundId(null)
    setHole(1)
    setCourse("")
    setDate(new Date().toISOString().slice(0, 10))
    setHolesData([])
    setRoundShots([])
    setReviewRounds([])
    setSelectedReviewRound(null)
    setSelectedReviewHoles([])
    setSelectedReviewShots([])
    setSelectedCourseId("")
    setSelectedCourseData(null)
    setIsNewCourse(true)
    setNewCoursePars([])
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

  const shotTotals = useMemo(() => calculateShotModeTotals(shots), [shots])

  const roundSgSummary = useMemo(
    () => summarizeRoundStrokesGained(roundShots),
    [roundShots]
  )

  const reviewSgSummary = useMemo(
    () => summarizeRoundStrokesGained(selectedReviewShots),
    [selectedReviewShots]
  )

  if (authLoading) {
    return (
      <div className="app-shell">
        <div style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="app-shell">
        <AuthScreen />
      </div>
    )
  }

  if (screen === "home") {
    return (
      <div className="app-shell">
        <HomeScreen
          course={course}
          date={date}
          setCourse={setCourse}
          setDate={setDate}
          startRound={startRound}
          loading={loading}
          styles={styles}
          session={session}
          signOut={signOut}
          courses={courses}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          isNewCourse={isNewCourse}
          setIsNewCourse={setIsNewCourse}
          goToRounds={() => setScreen("rounds")}
          goToAnalytics={() => setScreen("analytics")}
        />
      </div>
    )
  }

  if (screen === "rounds") {
    return (
      <div className="app-shell">
        <RoundsListScreen
          reviewRounds={reviewRounds}
          loadRoundDetailsForReview={loadRoundDetailsForReview}
          deleteRound={deleteRound}
          loading={loading}
          goHome={() => setScreen("home")}
          styles={styles}
        />
      </div>
    )
  }

  if (screen === "analytics") {
    return (
      <div className="app-shell">
        <AnalyticsScreen
          courses={courses}
          goHome={() => setScreen("home")}
          styles={styles}
        />
      </div>
    )
  }

  if (screen === "summary") {
    return (
      <div className="app-shell">
        <SummaryScreen
          course={course}
          date={date}
          summary={summary}
          sgSummary={roundSgSummary}
          goHomeAndReset={goHomeAndReset}
          styles={styles}
        />
      </div>
    )
  }

  if (screen === "review") {
    return (
      <div className="app-shell">
        <ReviewRoundScreen
          selectedReviewRound={selectedReviewRound}
          reviewSummary={reviewSummary}
          reviewSgSummary={reviewSgSummary}
          deleteRound={deleteRound}
          loading={loading}
          goHome={() => setScreen("home")}
          styles={styles}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <PlayRoundScreen
        course={course}
        date={date}
        hole={hole}
        par={par}
        setPar={setPar}
        entryMode={entryMode}
        setEntryMode={setEntryMode}
        score={score}
        setScore={setScore}
        putts={putts}
        setPutts={setPutts}
        fairway={fairway}
        setFairway={setFairway}
        gir={gir}
        setGir={setGir}
        penalty={penalty}
        setPenalty={setPenalty}
        shots={shots}
        activeShotIndex={activeShotIndex}
        setActiveShotIndex={setActiveShotIndex}
        updateShot={updateShot}
        removeShotCard={removeShotCard}
        addShotCard={addShotCard}
        shotTotals={shotTotals}
        saveHole={saveHole}
        skipHole={skipHole}
        endRoundNow={endRoundNow}
        goHomeAndReset={goHomeAndReset}
        loading={loading}
        styles={styles}
      />
    </div>
  )
}

export default App