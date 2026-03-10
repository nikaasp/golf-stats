export const CLUB_OPTIONS = [
  "Driver",
  "3 Wood",
  "5 Wood",
  "7 Wood",
  "3 Hybrid",
  "4 Hybrid",
  "5 Hybrid",
  "3 Iron",
  "4 Iron",
  "5 Iron",
  "6 Iron",
  "7 Iron",
  "8 Iron",
  "9 Iron",
  "PW",
  "50d",
  "56d"
]

export const LIE_OPTIONS = ["Tee", "Fairway", "Rough", "Sand", "Green"]

export const SHOT_RESULT_OPTIONS = [
  "Pured",
  "Draw",
  "Fade",
  "Hook",
  "Slice",
  "Duff",
  "Top",
]

export const PENALTY_TYPE_OPTIONS = ["None", "Hazard", "OB"]

export const DISTANCE_OPTIONS = Array.from(
  { length: 1301 },
  (_, i) => (i * 0.5).toFixed(1)
)