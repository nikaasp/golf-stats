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
    <div style={styles.sectionCardCompact}>
      <h2 style={styles.sectionTitle}>Average Putts per Round</h2>

      <div style={{ width: "100%", height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -18, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              minTickGap={28}
              tick={{ fontSize: 10 }}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              labelFormatter={(label) => formatDateLabel(label)}
              formatter={(value, name) => [
                value == null ? "No data" : Number(value).toFixed(2),
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Line
              type="monotone"
              dataKey="avgPutts"
              name="Avg Putts"
              stroke="#803c87"
              strokeWidth={2}
              connectNulls
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}