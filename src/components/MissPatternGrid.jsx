const OPTIONS = [
  [
    { value: "long_left", label: "Long Left", icon: "NW" },
    { value: "long", label: "Long", icon: "N" },
    { value: "long_right", label: "Long Right", icon: "NE" },
  ],
  [
    { value: "left", label: "Left", icon: "L" },
    { value: "spot_on", label: "Spot On!", icon: "OK" },
    { value: "right", label: "Right", icon: "R" },
  ],
  [
    { value: "short_left", label: "Short Left", icon: "SW" },
    { value: "short", label: "Short", icon: "S" },
    { value: "short_right", label: "Short Right", icon: "SE" },
  ],
]

export default function MissPatternGrid({ value, onChange }) {
  return (
    <div className="field-group">
      <label className="field-label">Miss Pattern</label>

      <div className="miss-pattern-grid">
        {OPTIONS.flat().map((option) => {
          const selected = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              className={`miss-pattern-btn ${selected ? "selected" : ""} ${
                option.value === "spot_on" ? "spot-on" : ""
              }`}
              onClick={() => onChange(option.value)}
            >
              <span className="miss-pattern-icon">{option.icon}</span>
              <span className="miss-pattern-text">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
