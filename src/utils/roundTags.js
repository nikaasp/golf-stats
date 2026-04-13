const STORAGE_KEY = "golf-stats-round-tags"

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return []

  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
    )
  )
}

export function getStoredRoundTagsMap() {
  if (!canUseStorage()) return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function setStoredRoundTags(roundId, tags = []) {
  if (!canUseStorage() || !roundId) return

  const map = getStoredRoundTagsMap()
  map[String(roundId)] = normalizeTags(tags)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getRoundTags(round) {
  if (!round) return []

  const dbTags = Array.isArray(round.tags) ? round.tags : []
  const storedTags = getStoredRoundTagsMap()[String(round.id)] || []
  return normalizeTags([...dbTags, ...storedTags])
}

export function hydrateRoundsWithStoredTags(rounds = []) {
  return rounds.map((round) => ({
    ...round,
    tags: getRoundTags(round),
  }))
}

export function roundMatchesTagFilter(round, tagFilter) {
  const query = String(tagFilter || "").trim().toLowerCase()
  if (!query) return true

  return getRoundTags(round).some((tag) => tag.toLowerCase().includes(query))
}
