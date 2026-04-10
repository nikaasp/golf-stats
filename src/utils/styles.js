export const styles = {
  page: {
    height: "100dvh",
    display: "flex",
    justifyContent: "center",
    padding: "0",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  mobileShell: {
    width: "100%",
    maxWidth: "420px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
  },

  heroCard: {
    background: "linear-gradient(180deg, #1d4ed8 0%, #2563eb 100%)",
    color: "white",
    padding: "18px",
    borderRadius: "20px",
    boxShadow: "0 10px 24px rgba(37,99,235,0.22)",
  },

  heroTitle: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.1,
  },

  heroText: {
    marginTop: "6px",
    marginBottom: "18px",
    opacity: 0.9,
  },

  sectionCard: {
    background: "white",
    padding: "16px",
    borderRadius: "18px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },

  chartCard: {
    background: "white",
    padding: "16px",
    borderRadius: "18px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },

  chartTitle: {
    fontSize: "20px",
    fontWeight: 800,
    marginBottom: "12px",
  },

  chartWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    alignItems: "center",
  },

  pie: {
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    border: "12px solid white",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
  },

  legend: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  legendSwatch: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
  },

  legendText: {
    fontSize: "14px",
  },

  noData: {
    color: "#5e6167",
    padding: "12px 0",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
  },

  mutedText: {
    color: "#6b7280",
    marginTop: "8px",
    marginBottom: 0,
  },

  label: {
    display: "block",
    marginTop: "8px",
    marginBottom: "6px",
    fontWeight: 700,
    fontSize: "13px",
  },

  input: {
    width: "100%",
    minHeight: "46px",
    padding: "10px 12px",
    fontSize: "16px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    background: "white",
  },

  primaryButton: {
    marginTop: "16px",
    width: "100%",
    minHeight: "48px",
    border: "none",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: 700,
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },

  secondaryButton: {
    width: "100%",
    minHeight: "44px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
  },

  deleteRoundButtonLarge: {
    width: "100%",
    minHeight: "50px",
    border: "none",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: 700,
    background: "#d45555",
    color: "white",
    cursor: "pointer",
  },

  buttonRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "10px",
  },

  roundList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "8px",
  },

  roundListItem: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "10px",
  },

  roundMainButton: {
    width: "100%",
    background: "transparent",
    border: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "left",
    padding: "4px 0",
    cursor: "pointer",
  },

  roundCourse: {
    fontWeight: 700,
    fontSize: "16px",
  },

  roundDate: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "3px",
  },

  roundChevron: {
    fontSize: "28px",
    color: "#9ca3af",
    lineHeight: 1,
  },

  deleteRoundButton: {
    marginTop: "10px",
    width: "100%",
    minHeight: "42px",
    borderRadius: "12px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    fontWeight: 700,
    cursor: "pointer",
  },

  playHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  playCourse: {
    fontSize: "20px",
    fontWeight: 800,
  },

  playDate: {
    color: "#6b7280",
    marginTop: "4px",
    fontSize: "14px",
  },

  holeCounter: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: "14px",
    whiteSpace: "nowrap",
  },

  parRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginTop: "8px",
  },

  parButton: {
    minHeight: "48px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "white",
    fontSize: "17px",
    fontWeight: 800,
    cursor: "pointer",
  },

  parButtonActive: {
    background: "#2563eb",
    color: "white",
    border: "1px solid #2563eb",
  },

  segmentedWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "8px",
  },

  segmentedButton: {
    minHeight: "44px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "white",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  segmentedActive: {
    background: "#2563eb",
    color: "white",
    border: "1px solid #2563eb",
  },

  twoColGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  toggleCard: {
    width: "100%",
    marginTop: "12px",
    minHeight: "84px",
    borderRadius: "16px",
    border: "1px solid #d1d5db",
    background: "white",
    padding: "14px",
    cursor: "pointer",
    textAlign: "left",
  },

  toggleCardActive: {
    background: "#eff6ff",
    border: "1px solid #60a5fa",
  },

  toggleCardLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },

  toggleCardValue: {
    marginTop: "10px",
    fontSize: "22px",
    fontWeight: 800,
  },

  shotCardList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
  },

  shotCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "10px",
    background: "#fafafa",
  },

  shotCardActive: {
    background: "#eff6ff",
    border: "2px solid #93c5fd",
  },

  shotCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },

  shotNumber: {
    fontWeight: 800,
    fontSize: "16px",
  },

  puttToggleRow: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-end",
  },

  puttToggle: {
    border: "1px solid #d1d5db",
    background: "white",
    color: "#111827",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  puttToggleActive: {
    background: "#16a34a",
    color: "white",
    border: "1px solid #16a34a",
  },

  removeGhostButton: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "13px",
  },

  puttInfoBox: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#166534",
    background: "#f0fdf4",
    padding: "8px 10px",
    borderRadius: "12px",
    border: "1px solid #bbf7d0",
  },

  shotPenaltyInfo: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#374151",
    background: "#f3f4f6",
    padding: "8px 10px",
    borderRadius: "12px",
  },

  summaryBox: {
    marginTop: "14px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  summaryInline: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "15px",
  },

  bottomActionBar: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingBottom: "16px",
  },

  primaryAction: {
    width: "100%",
    minHeight: "52px",
    border: "none",
    borderRadius: "16px",
    fontSize: "17px",
    fontWeight: 800,
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },

  secondaryActionsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "10px",
  },

  secondaryAction: {
    minHeight: "48px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  dangerAction: {
    minHeight: "48px",
    borderRadius: "14px",
    border: "none",
    background: "#dc2626",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  },

  ghostAction: {
    marginTop: "10px",
    width: "100%",
    minHeight: "44px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#374151",
    fontWeight: 700,
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    marginTop: "14px",
  },

  statCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
  },

  statValue: {
    fontSize: "22px",
    fontWeight: 800,
  },

  statLabel: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#6b7280",
  },

  scorecardSection: {
    marginTop: "12px",
  },

  scorecardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },

  scorecardTitle: {
    fontWeight: 800,
    fontSize: "16px",
  },

  scorecardSubtotal: {
    fontWeight: 700,
    color: "#374151",
  },

  scorecardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },

  scoreCell: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "10px",
    textAlign: "center",
  },

  scoreHoleNo: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "6px",
  },

  scoreBadge: {
    width: "44px",
    height: "44px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "18px",
  },

  scoreBadgeSmall: {
    width: "26px",
    height: "26px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "4px",
    marginLeft: "10px",
    fontSize: "11px",
    fontWeight: 800,
  },

  scoreSymbol: {
    marginTop: "6px",
    fontSize: "11px",
    color: "#4b5563",
  },

  scoreEagle: {
    borderRadius: "50%",
    border: "3px double #16a34a",
    background: "#f0fdf4",
    color: "#166534",
  },

  scoreBirdie: {
    borderRadius: "50%",
    border: "2px solid #2563eb",
    background: "#eff6ff",
    color: "#1d4ed8",
  },

  scorePar: {
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "white",
    color: "#111827",
  },

  scoreBogey: {
    borderRadius: "4px",
    border: "2px solid #f59e0b",
    background: "#fffbeb",
    color: "#92400e",
  },

  scoreDouble: {
    borderRadius: "4px",
    border: "3px double #dc2626",
    background: "#fef2f2",
    color: "#991b1b",
  },

  scoreLegend: {
    marginTop: "14px",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    alignItems: "center",
    fontSize: "12px",
    color: "#4b5563",
  },

  headerSparklineCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "14px",
    marginBottom: "20px",
  },

  headerSparklineLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "10px",
  },

  headerSparklinePlaceholder: {
    height: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    background: "#f9fafb",
    color: "#111827",
    fontSize: "13px",
  },

  homeButtonStack: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  selectInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    background: "#fff",
  },

  textInput: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    background: "#fff",
  },

  inlineRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  tagRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  },

  tagChip: {
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
  },

  screenContainer: {
    height: "100%",
    display: "grid",
    gridTemplateRows: "auto auto 1fr auto",
    gap: "8px",
    overflow: "hidden",
  },

  inRoundHeader: {
    background: "#eef6ee",
    border: "1px solid #d7e7d7",
    borderRadius: "14px",
    padding: "10px 12px",
    minHeight: 0,
  },

  inRoundHeaderTop: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: "4px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  inRoundHeaderBottom: {
    fontSize: "12px",
    color: "#4b5563",
    fontWeight: 600,
    lineHeight: 1.3,
  },

  parSelectorWrap: {
    minHeight: 0,
  },

  parButtonRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
  },

  inRoundMain: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflow: "hidden",
  },

  inRoundCenterWrap: {
    minHeight: 0,
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    overflow: "hidden",
  },

  inRoundShotCardWrap: {
    width: "100%",
    minHeight: 0,
    overflow: "hidden",
  },

  inRoundMetaRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  inRoundMetaCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "8px 10px",
    minHeight: "56px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  inRoundMetaLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "2px",
  },

  inRoundMetaValue: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#111827",
  },

  inRoundFooter: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minHeight: 0,
  },

  inRoundFooterInfo: {
    fontSize: "13px",
    color: "#4b5563",
    fontWeight: 600,
    textAlign: "center",
  },

  inRoundShotNavRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  inRoundHoleNavRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  sideNavButton: {
    minHeight: "44px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#111827",
    color: "#ffffff",
    fontWeight: 700,
    padding: "10px 12px",
    cursor: "pointer",
  },

  cornerNavButton: {
    minHeight: "44px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
  },

  distanceWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },

  distanceDisplay: {
    fontSize: "20px",
    fontWeight: 800,
    background: "#eef2ff",
    padding: "8px 14px",
    borderRadius: "12px",
    border: "1px solid #c7d2fe",
  },

  keypad: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 56px)",
    gap: "8px",
  },

  keypadButton: {
    height: "42px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

    fixedScreen: {
    height: "100%",
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gap: "8px",
    overflow: "hidden",
  },

  fixedTopSection: {
    minHeight: 0,
  },

  fixedMainSection: {
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  fixedMainSectionCentered: {
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  fixedBottomSection: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  sectionCardCompact: {
    background: "white",
    padding: "12px",
    borderRadius: "16px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },

  pageTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.1,
    fontWeight: 800,
  },

  screenStepPills: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginTop: "10px",
  },

  screenStepPill: {
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#f3f4f6",
    color: "#4b5563",
    fontSize: "12px",
    fontWeight: 700,
  },

  screenStepPillActive: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  bottomNavRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  bottomNavRowThree: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
  },

  secondaryButtonCompact: {
    minHeight: "44px",
    padding: "0 12px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  tagRowCompact: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "8px",
    minHeight: "32px",
    overflow: "hidden",
  },

  fixedChartGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
    minHeight: 0,
    overflow: "hidden",
  },

    chartCardCompact: {
    background: "white",
    padding: "10px",
    borderRadius: "16px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },

  chartTitleCompact: {
    fontSize: "16px",
    fontWeight: 800,
    marginBottom: "8px",
  },

  chartWrapCompact: {
    display: "grid",
    gridTemplateColumns: "96px 1fr",
    gap: "10px",
    alignItems: "center",
  },

  pieCompact: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    border: "8px solid white",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
  },

  legendCompact: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },

  legendRowCompact: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    minWidth: 0,
  },

  legendTextCompact: {
    fontSize: "12px",
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  compactControlRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },

  compactChipWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "8px",
  },

  scorecardCompactWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  scorecardToggleRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  scorecardCompactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
  },

  scoreCellCompact: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "8px 6px",
    textAlign: "center",
    minWidth: 0,
  },

  scoreHoleNoCompact: {
    fontSize: "11px",
    color: "#6b7280",
    marginBottom: "6px",
    fontWeight: 700,
  },

  scoreBadgeCompact: {
    width: "38px",
    height: "38px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "16px",
  },

  scoreParCompact: {
    marginTop: "5px",
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: 700,
  },

  scoreSymbolCompact: {
    marginTop: "4px",
    fontSize: "10px",
    color: "#4b5563",
    minHeight: "12px",
  },

  scoreLegendCompact: {
    marginTop: "4px",
    display: "grid",
    gridTemplateColumns: "repeat(5, auto)",
    gap: "4px 6px",
    alignItems: "center",
    justifyContent: "start",
    fontSize: "11px",
    color: "#4b5563",
  },

    shotStepPills: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "6px",
  },

  shotStepPill: {
    minHeight: "34px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    color: "#4b5563",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  shotStepPillActive: {
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #93c5fd",
  },

  shotStepContent: {
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
  },

  shotStepInner: {
    minHeight: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflow: "hidden",
  },

  shotStepNavRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  roundPagerMeta: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#6b7280",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  roundListItemCompact: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
  },

  statCardCompact: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "10px",
    minHeight: "72px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  statValueCompact: {
    fontSize: "20px",
    fontWeight: 800,
    lineHeight: 1.1,
  },

  statLabelCompact: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#6b7280",
    lineHeight: 1.2,
  },

    distanceWrapCompact: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },

  distanceDisplayCompact: {
    minWidth: "88px",
    minHeight: "42px",
    display: "inline-flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: "4px",
    fontSize: "18px",
    fontWeight: 800,
    background: "#eef2ff",
    padding: "8px 12px",
    borderRadius: "12px",
    border: "1px solid #c7d2fe",
    color: "#1f2937",
  },

  distanceUnitCompact: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#4b5563",
  },

  keypadCompact: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "6px",
    width: "100%",
    maxWidth: "174px",
    margin: "0 auto",
  },

  keypadButtonCompact: {
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontWeight: 800,
    fontSize: "16px",
    cursor: "pointer",
    padding: 0,
  },

  keypadButtonCompactSecondary: {
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    color: "#374151",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    padding: 0,
  },

    parSelectorWrapCompact: {
    marginBottom: "8px",
  },

  labelCompact: {
    display: "block",
    marginTop: "4px",
    marginBottom: "4px",
    fontWeight: 700,
    fontSize: "12px",
  },

  inlineHintCompact: {
    fontSize: "10px",
    color: "#6b7280",
    fontWeight: 400,
  },

  parButtonRowCompact: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "6px",
  },

  parButtonCompact: {
    minHeight: "36px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },

  parButtonCompactActive: {
    background: "#4f46e5",
    color: "#ffffff",
    border: "1px solid #4f46e5",
  },

  inRoundMainCompact: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    overflow: "hidden",
  },

  inRoundFooterCompact: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  inRoundShotNavRowCompact: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  inRoundHoleNavRowCompact: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },

  lightBlueNavButton: {
    minHeight: "34px",
    borderRadius: "10px",
    border: "1px solid #93c5fd",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: "13px",
    cursor: "pointer",
    padding: "6px 10px",
  },

  darkBlueNavButton: {
    minHeight: "34px",
    borderRadius: "10px",
    border: "1px solid #1e3a8a",
    background: "#1d4ed8",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "13px",
    cursor: "pointer",
    padding: "6px 10px",
  },

  endRoundButtonCompact: {
    minHeight: "34px",
    borderRadius: "10px",
    border: "1px solid #dc2626",
    background: "#ef4444",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "13px",
    cursor: "pointer",
    padding: "6px 10px",
  },

  shotCardCompact: {
    border: "1px solid #93c5fd",
    borderRadius: "18px",
    padding: "10px",
    background: "#f8fbff",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflow: "hidden",
  },

  shotCardActiveCompact: {
    boxShadow: "0 0 0 1px #93c5fd inset",
  },

  shotCardHeaderCompact: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    minHeight: "20px",
  },

    shotHeaderLineCompact: {
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#4b5563",
    lineHeight: 1.1,
  },

  shotTypeCompact: {
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#6b7280",
    marginBottom: "2px",
  },

  shotNumberCompact: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#111827",
  },

  removeGhostButtonCompact: {
    border: "none",
    background: "transparent",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
    lineHeight: 1,
  },

  lieButtonGridCompact: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "6px",
  },

  lieButtonCompact: {
    minHeight: "34px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    padding: "4px 6px",
  },

  resultCockpit: {
    display: "grid",
    gridTemplateColumns: "36px 1fr 36px",
    gridTemplateRows: "36px auto 36px",
    gridTemplateAreas: `
      "topLeft topCenter topRight"
      "midLeft center midRight"
      "bottomLeft bottomCenter bottomRight"
    `,
    gap: "6px",
    alignItems: "center",
  },

  resultArrowButton: {
    minHeight: "36px",
    minWidth: "36px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
  },

  resultArrowButtonActive: {
    background: "#dbeafe",
    border: "1px solid #60a5fa",
    color: "#1d4ed8",
  },

  shotBottomRowCompact: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "12px",
    alignItems: "end",
  },

  strikeRowCompact: {
    display: "flex",
    gap: "6px",
  },

  strikeButtonCompact: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontSize: "20px",
    cursor: "pointer",
    padding: 0,
  },

  strikeButtonCompactActive: {
    background: "#fff7ed",
    border: "1px solid #fdba74",
  },

  penaltyCheckboxRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  penaltyCheckboxWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#374151",
  },

  penaltyCheckbox: {
    width: "16px",
    height: "16px",
    margin: 0,
  },

  penaltyCheckboxLabel: {
    minWidth: "20px",
  },

  distanceWrapMini: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },

  distanceDisplayMini: {
    minWidth: "78px",
    minHeight: "34px",
    display: "inline-flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: "4px",
    fontSize: "16px",
    fontWeight: 800,
    background: "#eef2ff",
    padding: "6px 10px",
    borderRadius: "10px",
    border: "1px solid #c7d2fe",
    color: "#1f2937",
  },

  distanceUnitMini: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#4b5563",
  },

  keypadMini: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "4px",
    width: "100%",
    maxWidth: "126px",
    margin: "0 auto",
  },

  keypadButtonMini: {
    height: "28px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontWeight: 800,
    fontSize: "13px",
    cursor: "pointer",
    padding: 0,
  },

  keypadButtonMiniSecondary: {
    height: "28px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    color: "#374151",
    fontWeight: 800,
    fontSize: "11px",
    cursor: "pointer",
    padding: 0,
  },
}