import React from "react";

const OPTIONS = [
  [
    { value: "long_left", label: "Long Left", icon: "↖" },
    { value: "long", label: "Long", icon: "↑" },
    { value: "long_right", label: "Long Right", icon: "↗" },
  ],
  [
    { value: "left", label: "Left", icon: "←" },
    { value: "spot_on", label: "Spot On!", icon: "🎯" },
    { value: "right", label: "Right", icon: "→" },
  ],
  [
    { value: "short_left", label: "Short Left", icon: "↙" },
    { value: "short", label: "Short", icon: "↓" },
    { value: "short_right", label: "Short Right", icon: "↘" },
  ],
];

export default function MissPatternGrid({ value, onChange }) {
  return (
    <div className="field-group">
      <label className="field-label">Miss Pattern</label>

      <div className="miss-pattern-grid">
        {OPTIONS.flat().map((option) => {
          const selected = value === option.value;

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
          );
        })}
      </div>
    </div>
  );
}

export const MISS_PATTERN_LABELS = {
  long_left: "Long Left",
  long: "Long",
  long_right: "Long Right",
  left: "Left",
  spot_on: "Spot On!",
  right: "Right",
  short_left: "Short Left",
  short: "Short",
  short_right: "Short Right",
}

export const MISS_PATTERN_COLORS = {
  long_left: "#06b6d4",
  long: "#2563eb",
  long_right: "#84cc16",
  left: "#ef4444",
  spot_on: "#16a34a",
  right: "#8b5cf6",
  short_left: "#ec4899",
  short: "#f59e0b",
  short_right: "#22c55e",
}

export const MISS_PATTERN_ORDER = [
  "long_left",
  "long",
  "long_right",
  "left",
  "spot_on",
  "right",
  "short_left",
  "short",
  "short_right",
]