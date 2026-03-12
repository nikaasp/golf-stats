import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"

export default function PercentLineChart({ data, styles }) {
  return (
    <div style={styles.sectionCard}>
      <h2 style={styles.sectionTitle}>Fairway % and GIR % Over Time</h2>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="fairwayPct" name="Fairway %" stroke="#2563eb" strokeWidth={2} />
            <Line type="monotone" dataKey="girPct" name="GIR %" stroke="#16a34a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}