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

function formatDateLabel(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  })
}

export default function PercentLineChart({ data, styles }) {
  return (
    <div style={styles.sectionCard}>
      <h2 style={styles.sectionTitle}>Fairway % and GIR % Over Time</h2>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              minTickGap={24}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip
              labelFormatter={(label) => formatDateLabel(label)}
              formatter={(value, name) => [
                value == null ? "No data" : `${Number(value).toFixed(0)}%`,
                name,
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="fairwayPct"
              name="Fairway %"
              stroke="#2563eb"
              strokeWidth={2}
              connectNulls
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="girPct"
              name="GIR %"
              stroke="#16a34a"
              strokeWidth={2}
              connectNulls
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}