export const SG_SERIES = [
  { key: "total", label: "Total", color: "#111827", locked: true },

  { key: "tee", label: "Off the tee", color: "#2563eb" },

  { key: "approachFairway", label: "Approach (FW)", color: "#16a34a" },
  { key: "approachRough", label: "Approach (RGH)", color: "#22c55e" },
  { key: "approachSand", label: "Approach (SND)", color: "#84cc16" },

  { key: "shortGameFairway", label: "Short game (FW)", color: "#f59e0b" },
  { key: "shortGameRough", label: "Short game (RGH)", color: "#f97316" },
  { key: "shortGameSand", label: "Short game (SND)", color: "#ea580c" },

  { key: "recovery", label: "Recovery", color: "#ef4444" },

  { key: "green", label: "Putting", color: "#7c3aed" },
]

export const SG_SERIES_BY_KEY = Object.fromEntries(
  SG_SERIES.map((item) => [item.key, item])
)

export const SG_COLORS = Object.fromEntries(
  SG_SERIES.map(({ key, color }) => [key, color])
)

export const SG_LABELS = Object.fromEntries(
  SG_SERIES.map(({ key, label }) => [key, label])
)

export const SG_CATEGORY_LABELS = {
  Tee: "Off the tee",
  "Approach + Fairway": "Approach (FW)",
  "Approach + Rough": "Approach (RGH)",
  "Approach + Sand": "Approach (SND)",
  "Short Game + Fairway": "Short game (FW)",
  "Short Game + Rough": "Short game (RGH)",
  "Short Game + Sand": "Short game (SND)",
  Recovery: "Recovery",
  Putting: "Putting",
  "On green": "Putting",
}