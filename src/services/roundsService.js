import { supabase } from "../supabase"

export async function createRound({ user_id, date, course }) {
  return supabase
    .from("rounds")
    .insert([{ user_id, date, course }])
    .select()
}

export async function fetchRounds() {
  return supabase
    .from("rounds")
    .select("*")
    .order("date", { ascending: false })
}

export async function fetchRoundBundle(roundId) {
  const [holesRes, shotsRes] = await Promise.all([
    supabase
      .from("holes")
      .select("*")
      .eq("round_id", roundId)
      .order("hole_number", { ascending: true }),

    supabase
      .from("shots")
      .select("*")
      .eq("round_id", roundId)
      .order("hole_number", { ascending: true })
      .order("shot_number", { ascending: true }),
  ])

  return { holesRes, shotsRes }
}

export async function deleteRoundById(roundId) {
  const deleteShots = await supabase.from("shots").delete().eq("round_id", roundId)
  if (deleteShots.error) return { error: deleteShots.error }

  const deleteHoles = await supabase.from("holes").delete().eq("round_id", roundId)
  if (deleteHoles.error) return { error: deleteHoles.error }

  return supabase.from("rounds").delete().eq("id", roundId)
}