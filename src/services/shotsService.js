import { supabase } from "../supabase"

export async function insertShots(shotRows) {
  return supabase.from("shots").insert(shotRows)
}