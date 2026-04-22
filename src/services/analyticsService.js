import { supabase } from "../supabase"

export async function fetchRoundsForAnalytics({ startDate, endDate, courseId }) {
  let query = supabase
    .from("rounds")
    .select("*")
    .order("date", { ascending: true })

  if (startDate) query = query.gte("date", startDate)
  if (endDate) query = query.lte("date", endDate)
  if (courseId && courseId !== "all") query = query.eq("course_id", courseId)

  return query
}

export async function fetchShotsForRoundIds(roundIds) {
  if (!roundIds || roundIds.length === 0) {
    return { data: [], error: null }
  }

  return supabase
    .from("shots")
    .select("round_id, hole_number, shot_number, lie, distance_to_flag, sg_category, strokes_gained, miss_pattern, strike_quality, auto_penalty")
    .in("round_id", roundIds)
}

export async function fetchHolesForRoundIds(roundIds) {
  if (!roundIds || roundIds.length === 0) {
    return { data: [], error: null }
  }

  return supabase
    .from("holes")
    .select("*")
    .in("round_id", roundIds)
    .order("hole_number", { ascending: true })
}
