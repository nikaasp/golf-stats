import { supabase } from "../supabase"

export async function fetchCourses() {
  return supabase
    .from("courses")
    .select("*")
    .order("last_played_at", { ascending: false })
    .order("name", { ascending: true })
}

export async function createCourse(courseData) {
  return supabase.from("courses").insert([courseData]).select()
}

export async function updateCourseLastPlayed(courseId) {
  return supabase
    .from("courses")
    .update({ last_played_at: new Date().toISOString() })
    .eq("id", courseId)
    .select()
}

export async function updateRoundCourse(roundId, courseId) {
  return supabase
    .from("rounds")
    .update({ course_id: courseId })
    .eq("id", roundId)
    .select()
}