import DistancePicker from "./DistancePicker"
import { CLUB_OPTIONS, LIE_OPTIONS, PENALTY_TYPE_OPTIONS, SHOT_RESULT_OPTIONS } from "../utils/constants"
import { getPenaltyFromType } from "../utils/analytics"

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
        <div style={styles.puttToggleRow}>
          <button
            type="button"
            style={{
              ...styles.puttToggle,
              ...(shot.is_putt ? styles.puttToggleActive : {}),
            }}
            onClick={(e) => {
              e.stopPropagation()
              updateShot(index, "is_putt", !shot.is_putt)
            }}
          >
            {shot.is_putt ? "Putting" : "Mark as Putt"}
          </button>
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
      </div>

      <label style={styles.label}>Distance to hole</label>
      <DistancePicker
        value={shot.distance_to_flag}
        onChange={(value) => updateShot(index, "distance_to_flag", value)}
        styles={styles}
      />

      {!shot.is_putt && (
        <>
          <label style={styles.label}>Lie</label>
          <select
            style={styles.input}
            value={shot.lie}
            onChange={(e) => updateShot(index, "lie", e.target.value)}
          >
            {LIE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <label style={styles.label}>Club (optional)</label>
          <select
            style={styles.input}
            value={shot.club}
            onChange={(e) => updateShot(index, "club", e.target.value)}
          >
            <option value="">No club logged</option>
            {CLUB_OPTIONS.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>

          <label style={styles.label}>Ball-club contact</label>
          <select
            style={styles.input}
            value={shot.shot_result}
            onChange={(e) => updateShot(index, "shot_result", e.target.value)}
          >
            {SHOT_RESULT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <label style={styles.label}>Penalty result</label>
          <select
            style={styles.input}
            value={shot.penalty_type}
            onChange={(e) => updateShot(index, "penalty_type", e.target.value)}
          >
            {PENALTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <div style={styles.shotPenaltyInfo}>
            Auto penalty: {getPenaltyFromType(shot.penalty_type)}
          </div>
        </>
      )}

      {shot.is_putt && (
        <div style={styles.puttInfoBox}>
          Putting shot: only distance to hole is required.
        </div>
      )}
    </div>
  )
}