import { supabase } from "../supabase"

export async function insertHole(holeData) {
  return supabase.from("holes").insert(holeData).select()
}

export async function insertSkippedHole(holeData) {
  return supabase.from("holes").insert(holeData).select()
}