const STORAGE_KEY = "golf-stats-round-tags"

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function normalizeRoundTags(tags = [], preferredTags = []) {
  if (!Array.isArray(tags)) return []

  const preferredMap = new Map()

  if (Array.isArray(preferredTags)) {
    preferredTags.forEach((tag) => {
      const cleaned = String(tag || "").trim()
      if (!cleaned) return
      const key = cleaned.toLowerCase()
      if (!preferredMap.has(key)) {
        preferredMap.set(key, cleaned)
      }
    })
  }

  const normalized = []
  const seen = new Set()

  tags.forEach((tag) => {
    const cleaned = String(tag || "").trim()
    if (!cleaned) return

    const key = cleaned.toLowerCase()
    if (seen.has(key)) return

    seen.add(key)
    normalized.push(preferredMap.get(key) || cleaned)
  })

  return normalized
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
  map[String(roundId)] = normalizeRoundTags(tags)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getRoundTags(round) {
  if (!round) return []

  const dbTags = Array.isArray(round.tags) ? round.tags : []
  const storedTags = getStoredRoundTagsMap()[String(round.id)] || []
  return normalizeRoundTags([...dbTags, ...storedTags], [...dbTags, ...storedTags])
}

export function hydrateRoundsWithStoredTags(rounds = []) {
  return rounds.map((round) => ({
    ...round,
    tags: getRoundTags(round),
  }))
}

export function collectAvailableTags(rounds = []) {
  return normalizeRoundTags(
    rounds.flatMap((round) => (Array.isArray(round?.tags) ? round.tags : []))
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
}

export function roundMatchesTagFilter(round, tagFilter) {
  const query = String(tagFilter || "").trim().toLowerCase()
  if (!query) return true

  return getRoundTags(round).some((tag) => tag.toLowerCase().includes(query))
}
