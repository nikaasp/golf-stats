import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

const ToastContext = createContext(null)

const AUTO_DISMISS_MS = 4500

const VARIANT_STYLES = {
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    accent: "#dc2626",
  },
  success: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    accent: "#16a34a",
  },
  info: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    accent: "#2563eb",
  },
}

const styles = {
  container: {
    position: "fixed",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 24px)",
    maxWidth: "396px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    zIndex: 9999,
    pointerEvents: "none",
  },
  toast: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "14px",
    boxShadow: "0 8px 20px rgba(15,23,42,0.14)",
    fontSize: "14px",
    lineHeight: 1.4,
    pointerEvents: "auto",
  },
  accent: {
    width: "4px",
    alignSelf: "stretch",
    borderRadius: "4px",
    flexShrink: 0,
  },
  message: {
    flex: 1,
    wordBreak: "break-word",
  },
  dismiss: {
    border: "none",
    background: "transparent",
    color: "inherit",
    fontSize: "18px",
    lineHeight: 1,
    cursor: "pointer",
    padding: "0 2px",
    opacity: 0.6,
    flexShrink: 0,
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (message, variant) => {
      const text = String(message || "").trim()
      if (!text) return

      const id = ++idRef.current
      setToasts((prev) => [...prev, { id, message: text, variant }])

      if (typeof window !== "undefined") {
        window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      }

      return id
    },
    [dismiss]
  )

  const toast = useMemo(
    () => ({
      error: (message) => push(message, "error"),
      success: (message) => push(message, "success"),
      info: (message) => push(message, "info"),
      dismiss,
    }),
    [push, dismiss]
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={styles.container} aria-live="polite">
        {toasts.map((item) => {
          const variantStyle = VARIANT_STYLES[item.variant] || VARIANT_STYLES.info
          return (
            <div
              key={item.id}
              role="alert"
              style={{
                ...styles.toast,
                background: variantStyle.background,
                border: variantStyle.border,
                color: variantStyle.color,
              }}
            >
              <span style={{ ...styles.accent, background: variantStyle.accent }} />
              <span style={styles.message}>{item.message}</span>
              <button
                type="button"
                style={styles.dismiss}
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const toast = useContext(ToastContext)

  if (!toast) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return toast
}
