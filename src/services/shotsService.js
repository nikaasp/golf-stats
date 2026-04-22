import { supabase } from "../supabase"

export async function insertShots(shotRows) {
  return supabase.from("shots").insert(shotRows).select()
}

export async function deleteShotsByRoundAndHole(roundId, holeNumber) {
  return supabase
    .from("shots")
    .delete()
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber)
}
