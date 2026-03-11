import { useEffect, useState } from "react"

export default function DistancePicker({ value, onChange, styles }) {
  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [",", "0", "backspace"],
  ]
  const [draftValue, setDraftValue] = useState("")

  useEffect(() => {
    setDraftValue(formatValue(value))
  }, [value])

  function formatValue(nextValue) {
    if (nextValue === null || nextValue === undefined || nextValue === "") {
      return ""
    }

    return String(nextValue).replace(".", ",")
  }

  function parseValue(nextValue) {
    if (nextValue === "") {
      return ""
    }

    if (!/^\d+(,\d*)?$/.test(nextValue)) {
      return null
    }

    if (nextValue.endsWith(",")) {
      return null
    }

    const parsedValue = Number(nextValue.replace(",", "."))
    return Number.isFinite(parsedValue) ? parsedValue : null
  }

  function commitValue(nextValue) {
    setDraftValue(nextValue)

    const parsedValue = parseValue(nextValue)
    if (parsedValue === null) {
      return
    }

    onChange(parsedValue)
  }

  function appendKey(key) {
    if (key === "backspace") {
      commitValue(draftValue.slice(0, -1))
      return
    }

    if (key === ",") {
      if (draftValue.includes(",")) {
        return
      }

      commitValue(draftValue ? `${draftValue},` : "0,")
      return
    }

    const nextValue = draftValue === "0" ? key : `${draftValue}${key}`
    commitValue(nextValue)
  }

  function handleManualInput(event) {
    const rawValue = event.target.value.replace(/\./g, ",")

    if (rawValue === "") {
      commitValue("")
      return
    }

    if (!/^\d*(,\d*)?$/.test(rawValue)) {
      return
    }

    commitValue(rawValue.startsWith(",") ? `0${rawValue}` : rawValue)
  }

  return (
    <div
      style={{
        ...styles.input,
        padding: "12px",
        borderRadius: "18px",
        border: "1px solid #cbd5e1",
        background: "linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          borderRadius: "16px",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #dbe5f0",
          padding: "14px 16px",
          boxShadow: "inset 0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#64748b",
            marginBottom: "6px",
          }}
        >
          Distance
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          <input
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            aria-label="Distance to hole in meters"
            placeholder="0"
            value={draftValue}
            onChange={handleManualInput}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              padding: 0,
              fontSize: "34px",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              color: "#0f172a",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            m
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        {keypadRows.flat().map((key) => {
          const isUtilityKey = key === "," || key === "backspace"
          const label = key === "backspace" ? "Delete" : key

          return (
            <button
              key={key}
              type="button"
              onClick={() => appendKey(key)}
              style={{
                minHeight: "54px",
                borderRadius: "16px",
                border: isUtilityKey ? "1px solid #bfdbfe" : "1px solid #dbe5f0",
                background: isUtilityKey
                  ? "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)"
                  : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                color: "#0f172a",
                fontSize: key === "backspace" ? "15px" : "24px",
                fontWeight: 700,
                boxShadow: "0 6px 16px rgba(15,23,42,0.06)",
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}