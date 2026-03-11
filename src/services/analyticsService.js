import { supabase } from "../supabase"

export async function fetchRoundsForAnalytics({ startDate, endDate, courseId }) {
  let query = supabase
    .from("rounds")
    .select("id, date, course, course_id")
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
    .select("round_id, sg_category, strokes_gained")
    .in("round_id", roundIds)
}