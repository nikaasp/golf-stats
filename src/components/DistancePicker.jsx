import { DISTANCE_OPTIONS } from "../utils/constants"

export default function DistancePicker({ value, onChange, styles }) {
  return (
    <select
      style={styles.input}
      value={Number(value).toFixed(1)}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {DISTANCE_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt} m
        </option>
      ))}
    </select>
  )
}