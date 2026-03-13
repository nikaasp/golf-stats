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

export default function PuttsLineChart({ data, styles }) {
  return (
    <div style={styles.sectionCard}>
      <h2 style={styles.sectionTitle}>Average Putts per Round Over Time</h2>

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
            <YAxis />
            <Tooltip
              labelFormatter={(label) => formatDateLabel(label)}
              formatter={(value, name) => [
                value == null ? "No data" : Number(value).toFixed(2),
                name,
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgPutts"
              name="Avg Putts"
              stroke="#803c87"
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