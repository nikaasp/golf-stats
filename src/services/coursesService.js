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

export async function findCourseByName(userId, courseName) {
  return supabase
    .from("courses")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", courseName.trim())
    .limit(1)
}

export async function updateCourseById(courseId, updates) {
  return supabase
    .from("courses")
    .update(updates)
    .eq("id", courseId)
    .select()
}

export async function updateRoundsCourseNameByCourseId(courseId, courseName) {
  return supabase
    .from("rounds")
    .update({ course: courseName })
    .eq("course_id", courseId)
    .select()
}

export async function clearRoundCourseByCourseId(courseId) {
  return supabase
    .from("rounds")
    .update({ course_id: null })
    .eq("course_id", courseId)
    .select()
}

export async function deleteCourseById(courseId) {
  return supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .select()
}
