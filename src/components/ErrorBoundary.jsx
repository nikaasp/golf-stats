import { Component } from "react"

const styles = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    boxSizing: "border-box",
    background: "#f3f4f6",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "white",
    borderRadius: "20px",
    padding: "28px 24px",
    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
    textAlign: "center",
    boxSizing: "border-box",
  },
  eyebrow: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#b91c1c",
  },
  title: {
    margin: "10px 0 0",
    fontSize: "22px",
    color: "#111827",
  },
  body: {
    marginTop: "10px",
    marginBottom: "22px",
    color: "#6b7280",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  button: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#2563eb",
    color: "white",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
  },
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error caught by ErrorBoundary:", error, info)
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.page}>
          <div style={styles.card}>
            <p style={styles.eyebrow}>Unexpected error</p>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.body}>
              The app hit an unexpected problem. Reloading usually fixes it. Your
              saved rounds are safe.
            </p>
            <button type="button" style={styles.button} onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
