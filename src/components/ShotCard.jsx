import DistancePicker from "./DistancePicker"
import { getPenaltyFromType } from "../utils/analytics"

const SHOT_CATEGORIES = ["Tee Shot", "Approach shot", "Short Game", "Putting"]
const CONTACT_GRID = [
  ["Hook", "Top", "Slice"],
  [null, "Pured", null],
  ["Pull", "Duff", "Push"],
]
const PENALTY_OPTIONS = [
  { value: "None", label: "None" },
  { value: "Hazard", label: "Hazard (+1)" },
  { value: "OB", label: "OB (+2)" },
]

export default function ShotCard({
  shot,
  index,
  active,
  setActive,
  updateShot,
  removeShotCard,
  styles,
}) {
  return (
    <div
      style={{
        ...styles.shotCard,
        ...(active ? styles.shotCardActive : {}),
      }}
      onClick={setActive}
    >
      <div style={styles.shotCardHeader}>
        <div style={styles.shotNumber}>Shot {index + 1}</div>
        <button
          type="button"
          style={styles.removeGhostButton}
          onClick={(e) => {
            e.stopPropagation()
            removeShotCard(index)
          }}
        >
          Remove
        </button>
      </div>

      <label style={styles.label}>Shot category</label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        {SHOT_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            style={{
              ...styles.segmentedButton,
              ...(shot.shot_category === category ? styles.segmentedActive : {}),
            }}
            onClick={(e) => {
              e.stopPropagation()
              updateShot(index, "shot_category", category)
            }}
          >
            {category}
          </button>
        ))}
      </div>

      <label style={styles.label}>Distance to hole</label>
      <DistancePicker
        value={shot.distance_to_flag}
        onChange={(value) => updateShot(index, "distance_to_flag", value)}
        styles={styles}
      />

      <label style={styles.label}>Club contact</label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        {CONTACT_GRID.flat().map((option, indexInGrid) => {
          if (!option) {
            return <div key={`blank-${indexInGrid}`} aria-hidden="true" />
          }

          return (
            <button
              key={option}
              type="button"
              style={{
                ...styles.segmentedButton,
                ...(shot.shot_result === option ? styles.segmentedActive : {}),
              }}
              onClick={(e) => {
                e.stopPropagation()
                updateShot(index, "shot_result", option)
              }}
            >
              {option}
            </button>
          )
        })}
      </div>

      <label style={styles.label}>Penalty result</label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        {PENALTY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            style={{
              ...styles.segmentedButton,
              ...(shot.penalty_type === option.value ? styles.segmentedActive : {}),
            }}
            onClick={(e) => {
              e.stopPropagation()
              updateShot(index, "penalty_type", option.value)
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div style={styles.shotPenaltyInfo}>
        Auto penalty: {getPenaltyFromType(shot.penalty_type)}
      </div>
    </div>
  )
}