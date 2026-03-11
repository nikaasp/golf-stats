import { useEffect, useMemo, useRef, useState } from "react"
import { DISTANCE_OPTIONS } from "../utils/constants"

export default function DistancePicker({ value, onChange, styles }) {
  const ITEM_HEIGHT = 44
  const VISIBLE_ROWS = 7
  const SIDE_SPACER_HEIGHT = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT
  const wheelRef = useRef(null)
  const scrollTimeoutRef = useRef(null)

  const numericOptions = useMemo(
    () => DISTANCE_OPTIONS.map((opt) => Number(opt)),
    []
  )
  const [scrollTop, setScrollTop] = useState(0)

  const selectedIndex = useMemo(() => {
    const numericValue = Number(value)
    const matchedIndex = numericOptions.findIndex((opt) => opt === numericValue)
    return matchedIndex >= 0 ? matchedIndex : 0
  }, [numericOptions, value])

  useEffect(() => {
    if (!wheelRef.current) {
      return
    }
    const nextScrollTop = selectedIndex * ITEM_HEIGHT
    wheelRef.current.scrollTo({ top: nextScrollTop, behavior: "auto" })
    setScrollTop(nextScrollTop)
  }, [selectedIndex])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const clampIndex = (index) =>
    Math.max(0, Math.min(numericOptions.length - 1, index))

  const scrollToIndex = (index, behavior = "smooth") => {
    if (!wheelRef.current) {
      return
    }

    const safeIndex = clampIndex(index)
    const nextScrollTop = safeIndex * ITEM_HEIGHT
    wheelRef.current.scrollTo({ top: nextScrollTop, behavior })
    setScrollTop(nextScrollTop)

    const nextValue = numericOptions[safeIndex]
    if (nextValue !== Number(value)) {
      onChange(nextValue)
    }
  }

  const commitFromScroll = (scrollTop) => {
    const index = clampIndex(Math.round(scrollTop / ITEM_HEIGHT))
    const nextValue = numericOptions[index]
    if (nextValue !== Number(value)) {
      onChange(nextValue)
    }
  }

  const handleScroll = (event) => {
    const nextScrollTop = event.currentTarget.scrollTop
    setScrollTop(nextScrollTop)
    commitFromScroll(nextScrollTop)

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      scrollToIndex(Math.round(nextScrollTop / ITEM_HEIGHT))
    }, 80)
  }

  const floatingIndex = scrollTop / ITEM_HEIGHT

  return (
    <div
      style={{
        ...styles.input,
        height: `${VISIBLE_ROWS * ITEM_HEIGHT}px`,
        padding: 0,
        position: "relative",
        overflow: "hidden",
        borderRadius: "22px",
        border: "1px solid #d6deea",
        background: "linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 24px rgba(37,99,235,0.08)",
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
          overscrollBehaviorY: "contain",
          paddingInline: "8px",
        }}
        onScroll={handleScroll}
        role="listbox"
        aria-label="Distance to hole"
      >
        <div style={{ height: `${SIDE_SPACER_HEIGHT}px` }} aria-hidden="true" />

        {numericOptions.map((opt, index) => {
          const isActive = opt === Number(value)
          const distanceFromCenter = Math.abs(index - floatingIndex)
          const emphasis = Math.max(0, 1 - distanceFromCenter / 3)
          const scale = 0.82 + emphasis * 0.24
          const opacity = 0.28 + emphasis * 0.72
          const rotateX = (index - floatingIndex) * -11
          return (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={isActive}
              style={{
                width: "100%",
                height: `${ITEM_HEIGHT}px`,
                border: "none",
                background: "transparent",
                scrollSnapAlign: "center",
                scrollSnapStop: "always",
                fontSize: isActive ? "26px" : `${17 + emphasis * 3}px`,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? "#0f172a" : "#64748b",
                cursor: "pointer",
                opacity,
                transform: `perspective(320px) rotateX(${rotateX}deg) scale(${scale})`,
                transformOrigin: "center center",
                transition: "transform 120ms ease, opacity 120ms ease, color 120ms ease, font-size 120ms ease",
                letterSpacing: isActive ? "-0.04em" : "-0.02em",
                textShadow: isActive ? "0 1px 0 rgba(255,255,255,0.6)" : "none",
              }}
              onClick={() => scrollToIndex(index)}
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
          left: "10px",
          right: "10px",
          transform: "translateY(-50%)",
          height: `${ITEM_HEIGHT}px`,
          borderTop: "1px solid rgba(37,99,235,0.18)",
          borderBottom: "1px solid rgba(37,99,235,0.18)",
          borderRadius: "16px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(219,234,254,0.72) 100%)",
          boxShadow: "0 6px 16px rgba(37,99,235,0.12)",
          pointerEvents: "none",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(238,244,255,0.96) 0%, rgba(238,244,255,0.6) 18%, rgba(238,244,255,0) 34%, rgba(238,244,255,0) 66%, rgba(238,244,255,0.6) 82%, rgba(238,244,255,0.96) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  )
}