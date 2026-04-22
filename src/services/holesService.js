import { supabase } from "../supabase"

export async function insertHole(holeData) {
  return supabase.from("holes").insert(holeData).select()
}

export async function deleteHoleByRoundAndNumber(roundId, holeNumber) {
  return supabase
    .from("holes")
    .delete()
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber)
}
