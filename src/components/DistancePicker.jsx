import { useEffect, useMemo, useRef } from "react"
import { DISTANCE_OPTIONS } from "../utils/constants"

export default function DistancePicker({ value, onChange, styles }) {
  const ITEM_HEIGHT = 40
  const VISIBLE_ROWS = 5
  const SIDE_SPACER_HEIGHT = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT
  const wheelRef = useRef(null)

  const numericOptions = useMemo(
    () => DISTANCE_OPTIONS.map((opt) => Number(opt)),
    []
  )

  const selectedIndex = useMemo(() => {
    const numericValue = Number(value)
    const matchedIndex = numericOptions.findIndex((opt) => opt === numericValue)
    return matchedIndex >= 0 ? matchedIndex : 0
  }, [numericOptions, value])

  useEffect(() => {
    if (!wheelRef.current) {
      return
    }
    wheelRef.current.scrollTop = selectedIndex * ITEM_HEIGHT
  }, [selectedIndex])

  const commitFromScroll = (scrollTop) => {
    const index = Math.max(
      0,
      Math.min(numericOptions.length - 1, Math.round(scrollTop / ITEM_HEIGHT))
    )
    const nextValue = numericOptions[index]
    if (nextValue !== Number(value)) {
      onChange(nextValue)
    }
  }

  return (
    <div
      style={{
        ...styles.input,
        height: `${VISIBLE_ROWS * ITEM_HEIGHT}px`,
        padding: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={wheelRef}
        style={{
          height: "100%",
          overflowY: "auto",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onScroll={(e) => commitFromScroll(e.currentTarget.scrollTop)}
      >
        <div style={{ height: `${SIDE_SPACER_HEIGHT}px` }} aria-hidden="true" />

        {numericOptions.map((opt) => {
          const isActive = opt === Number(value)
          return (
            <button
              key={opt}
              type="button"
              style={{
                width: "100%",
                height: `${ITEM_HEIGHT}px`,
                border: "none",
                background: "transparent",
                scrollSnapAlign: "center",
                fontSize: isActive ? "20px" : "16px",
                fontWeight: isActive ? 800 : 500,
                color: isActive ? "#111827" : "#6b7280",
                cursor: "pointer",
              }}
              onClick={() => onChange(opt)}
            >
              {opt.toFixed(1)} m
            </button>
          )
        })}

        <div style={{ height: `${SIDE_SPACER_HEIGHT}px` }} aria-hidden="true" />
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
          height: `${ITEM_HEIGHT}px`,
          borderTop: "1px solid #dbeafe",
          borderBottom: "1px solid #dbeafe",
          background: "rgba(219, 234, 254, 0.35)",
          pointerEvents: "none",
        }}
      />
    </div>
  )
}