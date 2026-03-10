import { supabase } from "../supabase"

export async function createRound({ date, course }) {
  return supabase.from("rounds").insert({ date, course }).select()
}

export async function fetchRounds() {
  return supabase.from("rounds").select("*").order("date", { ascending: false })
}

export async function deleteRoundById(roundId) {
  await supabase.from("shots").delete().eq("round_id", roundId)
  await supabase.from("holes").delete().eq("round_id", roundId)
  return supabase.from("rounds").delete().eq("id", roundId)
}

export async function fetchRoundBundle(roundId) {
  const [holesRes, shotsRes] = await Promise.all([
    supabase.from("holes").select("*").eq("round_id", roundId).order("hole_number", { ascending: true }),
    supabase.from("shots").select("*").eq("round_id", roundId).order("hole_number", { ascending: true }).order("shot_number", { ascending: true }),
  ])

  return { holesRes, shotsRes }
}