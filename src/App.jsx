import { useCallback, useEffect, useMemo, useState } from "react"

import { supabase, supabaseConfigError } from "./supabase"

import AuthScreen from "./components/AuthScreen"
import HomeScreen from "./components/HomeScreen"
import PlayRoundScreen from "./components/PlayRoundScreen"
import SummaryScreen from "./components/SummaryScreen"
import ReviewRoundScreen from "./components/ReviewRoundScreen"
import RoundsListScreen from "./components/RoundsListScreen"
import AnalyticsScreen from "./components/AnalyticsScreen"
import InRoundScreen from "./components/InRoundScreen"

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
  summarizeRoundStrokesGained,
} from "./utils/strokesGained"

import {
  buildRoundAnalytics,
  calculateShotModeTotals,
  getDefaultLieForShot,
  getValidShots,
  inferHoleValuesFromShots,
  makeShot,
} from "./utils/analytics"
import { buildSgTimeline } from "./utils/analyticsTransforms"

import {
  createRound,
  deleteRoundById,
  fetchRoundBundle,
  fetchRounds,
} from "./services/roundsService"
import { fetchShotsForRoundIds } from "./services/analyticsService"

import { deleteHoleByRoundAndNumber, insertHole } from "./services/holesService"
import { deleteShotsByRoundAndHole, insertShots } from "./services/shotsService"
import {
  hydrateRoundsWithStoredTags,
  setStoredRoundTags,
} from "./utils/roundTags"

function getHoleLengthFromShots(validShots = []) {
  if (!Array.isArray(validShots) || validShots.length === 0) return null

  const firstShot =
    validShots.find((shot) => Number(shot.shot_number) === 1) || validShots[0]
  const distance = Number(firstShot?.distance_to_flag)

  return Number.isFinite(distance) && distance > 0 ? distance : null
}

function mergeHoleData(existing = [], incomingHole) {
  const existingArray = Array.isArray(existing) ? existing : []
  const holeNumber = Number(incomingHole?.hole)

  if (!Number.isInteger(holeNumber) || holeNumber < 1 || holeNumber > 18) {
    return existingArray
  }

  const existingEntry = existingArray.find((h) => Number(h?.hole) === holeNumber)

  const mergedEntry = {
    hole: holeNumber,
    par: incomingHole?.par ?? existingEntry?.par ?? null,
    length_m: incomingHole?.length_m ?? existingEntry?.length_m ?? null,
  }

  return [
    ...existingArray.filter((h) => Number(h?.hole) !== holeNumber),
    mergedEntry,
  ].sort((a, b) => a.hole - b.hole)
}

function getSavedCoursePar(courseData, holeNumber) {
  if (!courseData?.hole_pars?.length) return ""

  const holeData = courseData.hole_pars.find((h) => Number(h.hole) === Number(holeNumber))
  return holeData?.par != null ? String(holeData.par) : ""
}

function getSavedCourseLength(courseData, holeNumber) {
  if (!courseData?.hole_pars?.length) return null

  const holeData = courseData.hole_pars.find((h) => Number(h.hole) === Number(holeNumber))
  const length = Number(holeData?.length_m)
  return Number.isFinite(length) && length > 0 ? length : null
}

function ConfigErrorScreen({ message }) {
  return (
    <div className="app-shell">
      <div className="config-error-card">
        <p className="config-error-eyebrow">Setup Required</p>
        <h1 className="config-error-title">Supabase configuration is missing</h1>
        <p className="config-error-body">{message}</p>
        <div className="config-error-code">
          <div>VITE_SUPABASE_URL=...</div>
          <div>VITE_SUPABASE_ANON_KEY=...</div>
        </div>
        <p className="config-error-help">
          If you are deploying on Vercel, add both values in Project Settings under
          Environment Variables, then redeploy the app.
        </p>
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase))

  const [screen, setScreen] = useState("home")
  const [loading, setLoading] = useState(false)

  const [roundId, setRoundId] = useState(null)
  const [hole, setHole] = useState(1)
  const [course, setCourse] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const [holesData, setHolesData] = useState([])
  const [roundShots, setRoundShots] = useState([])
  const [homeTrendData, setHomeTrendData] = useState([])

  const [reviewRounds, setReviewRounds] = useState([])
  const [selectedReviewRound, setSelectedReviewRound] = useState(null)
  const [selectedReviewHoles, setSelectedReviewHoles] = useState([])
  const [selectedReviewShots, setSelectedReviewShots] = useState([])

  const [par, setPar] = useState("")

  const [shots, setShots] = useState([makeShot(1)])
  const [activeShotIndex, setActiveShotIndex] = useState(0)

  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [isNewCourse, setIsNewCourse] = useState(true)
  const [newCoursePars, setNewCoursePars] = useState([])

  const loadRounds = useCallback(async () => {
    const { data, error } = await fetchRounds()
    if (error) {
      alert("Could not load rounds: " + error.message)
      return
    }
    const hydratedRounds = hydrateRoundsWithStoredTags(data || [])
    setReviewRounds(hydratedRounds)

    const roundIds = hydratedRounds.map((round) => round.id)
    const shotsRes = await fetchShotsForRoundIds(roundIds)

    if (shotsRes.error) {
      alert("Could not load SG trend shots: " + shotsRes.error.message)
      return
    }

    const { timeline } = buildSgTimeline(hydratedRounds, shotsRes.data || [])
    setHomeTrendData(timeline)
  }, [])

  const loadCourses = useCallback(async () => {
    const { data, error } = await fetchCourses()
    if (error) {
      alert("Could not load courses: " + error.message)
      return
    }
    setCourses(data || [])
  }, [])


  useEffect(() => {
    if (!supabase) {
      return
    }

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
        if (session) {
          void loadRounds()
          void loadCourses()
        }
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
      setAuthLoading(false)
      if (session) {
        void loadRounds()
        void loadCourses()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadCourses, loadRounds])

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

  async function openRoundsScreen() {
    setScreen("rounds")
    setLoading(true)
    await Promise.all([loadRounds(), loadCourses()])
    setLoading(false)
  }

  function buildCurrentHoleCourseData(baseData = newCoursePars) {
    const parValue = par === "" ? null : parseInt(par, 10)
    if (parValue === null || Number.isNaN(parValue)) return baseData

    const holeLength = getHoleLengthFromShots(getValidShots(shots))

    return mergeHoleData(baseData, {
      hole,
      par: parValue,
      length_m: holeLength,
    })
  }
  async function handleCreateCourse(courseName) {
    if (!session?.user) {
      alert("Please log in first")
      return
    }

    const cleaned = String(courseName || "").trim()
    if (!cleaned) {
      alert("Please enter a course name")
      return
    }

    const existing = courses.find(
      (c) => c.name?.trim().toLowerCase() === cleaned.toLowerCase()
    )

    if (existing) {
      setSelectedCourseId(existing.id)
      setIsNewCourse(false)
      setCourse(existing.name)
      return
    }

    const { data, error } = await createCourse({
      user_id: session.user.id,
      name: cleaned,
      hole_pars: [],
      last_played_at: null,
    })

    if (error) {
      alert("Could not create course: " + error.message)
      return
    }

    await loadCourses()

    const newCourseId = data?.[0]?.id
    if (newCourseId) {
      setSelectedCourseId(newCourseId)
      setIsNewCourse(false)
      setCourse(cleaned)
    }
  }

  async function handleStartRound(roundTags = []) {
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

    const createdRoundId = data[0].id
    setStoredRoundTags(createdRoundId, roundTags)

    if (!isNewCourse && courseId) {
      await updateCourseLastPlayed(courseId)
    }

    setRoundId(createdRoundId)
    setCourse(courseName)
    setHole(1)
    setNewCoursePars([])
    setHolesData([])
    setRoundShots([])

    if (!isNewCourse && selectedCourseData?.hole_pars?.length) {
      setPar(getSavedCoursePar(selectedCourseData, 1))
    } else {
      setPar("")
    }

    resetShotInputs(getSavedCourseLength(selectedCourseData, 1))
    setScreen("inRound")
  }

  function resetShotInputs(initialHoleLength = null) {
    const firstShot = makeShot(1)
    const holeLengthNumber = Number(initialHoleLength)

    if (Number.isFinite(holeLengthNumber) && holeLengthNumber > 0) {
      firstShot.distance_to_flag = holeLengthNumber
      firstShot.lie = "Tee"
    }

    setShots([firstShot])
    setActiveShotIndex(0)
  }

  function setShotInputsFromSavedShots(savedShots = []) {
    const restoredShots = [...savedShots]
      .sort((a, b) => Number(a.shot_number) - Number(b.shot_number))
      .map((shot, index) => ({
        ...makeShot(index + 1),
        shot_number: index + 1,
        lie: shot.lie || getDefaultLieForShot(index + 1),
        distance_to_flag:
          shot.distance_to_flag === null || shot.distance_to_flag === undefined
            ? ""
            : String(shot.distance_to_flag),
        miss_pattern: shot.miss_pattern || null,
        strike_quality: shot.strike_quality || null,
        auto_penalty: Number(shot.auto_penalty || 0),
      }))

    setShots(restoredShots.length > 0 ? restoredShots : [makeShot(1)])
    setActiveShotIndex(0)
  }

  function resetHoleInputs() {
    setPar("")
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
          lie:
            i === 0
              ? shot.lie || "Tee"
              : shot.lie || getDefaultLieForShot(i + 1),
        }))

      setActiveShotIndex(Math.max(0, Math.min(activeShotIndex, updated.length - 1)))
      return updated
    })
  }

  function updateShot(index, field, value) {
    setShots((prev) =>
      prev.map((shot, i) => {
        if (i !== index) return shot

        let nextValue = value

        if (field === "auto_penalty") {
          nextValue = Number(value || 0)
        }

        if (field === "miss_pattern" && !value) {
          nextValue = null
        }

        if (field === "strike_quality" && !value) {
          nextValue = null
        }

        return { ...shot, [field]: nextValue }
      })
    )

    setActiveShotIndex(index)
  }

  async function finishRound(finalCoursePars = null) {
    const parsToSave = Array.isArray(finalCoursePars) ? finalCoursePars : newCoursePars

    if (session?.user && course.trim() && parsToSave.length > 0) {
      const normalizedName = course.trim()

      const existingCourseRes = await findCourseByName(session.user.id, normalizedName)

      if (existingCourseRes.error) {
        alert("Round saved, but course lookup failed: " + existingCourseRes.error.message)
      } else {
        const existingCourse = existingCourseRes.data?.[0]

        let mergedHoleData = parsToSave

        if (existingCourse?.hole_pars?.length) {
          mergedHoleData = [...existingCourse.hole_pars]

          for (const item of parsToSave) {
            mergedHoleData = mergeHoleData(mergedHoleData, item)
          }
        }

        if (existingCourse) {
          const updateRes = await updateCourseById(existingCourse.id, {
            name: normalizedName,
            hole_pars: mergedHoleData,
            last_played_at: new Date().toISOString(),
          })

          if (updateRes.error) {
            alert(
              "Round saved, but existing course could not be updated: " + updateRes.error.message
            )
          } else if (roundId) {
            await updateRoundCourse(roundId, existingCourse.id)
          }
        } else {
          const { data: courseData, error: courseError } = await createCourse({
            user_id: session.user.id,
            name: normalizedName,
            hole_pars: mergedHoleData,
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

    const holeLength = getHoleLengthFromShots(validShots)

    setNewCoursePars((prev) =>
      mergeHoleData(prev, {
        hole,
        par: selectedPar,
        length_m: holeLength,
      })
    )

    const totals = calculateShotModeTotals(shots)
    const inferred = inferHoleValuesFromShots(selectedPar, validShots)
    const evaluatedShots = evaluateHoleStrokesGained(validShots)

    setLoading(true)

    const deleteExistingShots = await deleteShotsByRoundAndHole(roundId, hole)
    if (deleteExistingShots.error) {
      setLoading(false)
      alert("Error replacing saved shots: " + deleteExistingShots.error.message)
      return false
    }

    const deleteExistingHole = await deleteHoleByRoundAndNumber(roundId, hole)
    if (deleteExistingHole.error) {
      setLoading(false)
      alert("Error replacing saved hole: " + deleteExistingHole.error.message)
      return false
    }

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
      strike_quality: shot.strike_quality || null,
      auto_penalty: Number(shot.auto_penalty || 0),
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

  async function goNextHole() {
    const ok = await saveShotByShotHole()

    if (!ok) return

    const finalPars = buildCurrentHoleCourseData(newCoursePars)

    if (hole >= 18) {
      resetHoleInputs()
      await finishRound(finalPars)
      return
    }

    setNewCoursePars(finalPars)
    setHole(hole + 1)
    await loadHoleForEditing(hole + 1, finalPars)
  }

  async function loadHoleForEditing(targetHole, fallbackCoursePars = newCoursePars) {
    if (!roundId) return

    setLoading(true)
    const bundle = await fetchRoundBundle(roundId)
    setLoading(false)

    if (bundle.holesRes.error) {
      alert("Could not load saved hole: " + bundle.holesRes.error.message)
      return
    }
    if (bundle.shotsRes.error) {
      alert("Could not load saved shots: " + bundle.shotsRes.error.message)
      return
    }

    const savedHole = (bundle.holesRes.data || []).find(
      (item) => Number(item.hole_number) === Number(targetHole)
    )

    const savedShots = (bundle.shotsRes.data || []).filter(
      (item) => Number(item.hole_number) === Number(targetHole)
    )

    if (savedHole) {
      setPar(savedHole.par == null ? "" : String(savedHole.par))
      setShotInputsFromSavedShots(savedShots)
      return
    }

    const courseDataForHole = selectedCourseData?.hole_pars?.length
      ? selectedCourseData
      : { hole_pars: fallbackCoursePars }

    setPar(isNewCourse ? "" : getSavedCoursePar(courseDataForHole, targetHole))
    resetShotInputs(getSavedCourseLength(courseDataForHole, targetHole))
  }

  async function goPrevHole() {
    if (hole <= 1) return

    const previousHole = hole - 1
    setHole(previousHole)
    await loadHoleForEditing(previousHole)
  }

  function currentHoleHasData() {
    return par !== "" || getValidShots(shots).length > 0
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

    const ok = await saveShotByShotHole()

    if (!ok) return

    const finalPars = buildCurrentHoleCourseData(newCoursePars)

    resetHoleInputs()
    await finishRound(finalPars)
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

  function updateRoundTags(roundIdValue, tags) {
    setStoredRoundTags(roundIdValue, tags)

    setReviewRounds((prev) =>
      prev.map((round) =>
        round.id === roundIdValue ? { ...round, tags: tags } : round
      )
    )

    setSelectedReviewRound((prev) =>
      prev?.id === roundIdValue ? { ...prev, tags } : prev
    )
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

  const selectedCourseData =
    selectedCourseId
      ? courses.find((courseItem) => courseItem.id === selectedCourseId) || null
      : null

  const currentCourseHoleData = useMemo(() => {
    if (!selectedCourseData?.hole_pars?.length) return null
    return (
      selectedCourseData.hole_pars.find(
        (h) => Number(h.hole) === Number(hole)
      ) || null
    )
  }, [selectedCourseData, hole])

  const currentHoleLength = currentCourseHoleData?.length_m ?? null

  if (supabaseConfigError) {
    return <ConfigErrorScreen message={supabaseConfigError} />
  }

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
          styles={styles}
          homeTrendData={homeTrendData}
          goToPlayRound={() => setScreen("playRound")}
          goToRounds={openRoundsScreen}
          goToAnalytics={() => setScreen("analytics")}
        />
      </div>
    )
  }

  if (screen === "playRound") {
    return (
      <div className="app-shell">
        <PlayRoundScreen
          styles={styles}
          courses={courses}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={(value) => {
            setSelectedCourseId(value)
            setIsNewCourse(!value)
            if (value) {
              const selected = courses.find((c) => c.id === value) || null
              setCourse(selected?.name || "")
            } else {
              setCourse("")
            }
          }}
          createCourse={handleCreateCourse}
          goHome={() => setScreen("home")}
          startRound={handleStartRound}
        />
      </div>
    )
  }

  if (screen === "inRound") {
    return (
      <div className="app-shell">
        <InRoundScreen
          styles={styles}
          course={course}
          date={date}
          hole={hole}
          par={par}
          setPar={setPar}
          shots={shots}
          activeShotIndex={activeShotIndex}
          setActiveShotIndex={setActiveShotIndex}
          updateShot={updateShot}
          removeShotCard={removeShotCard}
          addShotCard={addShotCard}
          shotTotals={shotTotals}
          loading={loading}
          onPrevHole={goPrevHole}
          onNextHole={goNextHole}
          onEndRound={endRoundNow}
          holeLength={currentHoleLength}
        />
      </div>
    )
  }


  if (screen === "rounds") {
    return (
      <div className="app-shell">
        <RoundsListScreen
          reviewRounds={reviewRounds}
          courses={courses}
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
          selectedReviewHoles={selectedReviewHoles}
          selectedReviewShots={selectedReviewShots}
          reviewSummary={reviewSummary}
          updateRoundTags={updateRoundTags}
          deleteRound={deleteRound}
          loading={loading}
          goHome={() => setScreen("home")}
          styles={styles}
        />
      </div>
    )
  }

  return null
}

export default App
