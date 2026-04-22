import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

export default function TrendMetricLineChart({
  title,
  data,
  series,
  styles,
  yDomain,
  valueSuffix = "",
}) {
  return (
    <div style={styles.sectionCardCompact}>
      <h2 style={styles.sectionTitle}>{title}</h2>

      <div style={{ width: "100%", height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              minTickGap={28}
              tick={{ fontSize: 10 }}
            />
            <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
            <Tooltip
              labelFormatter={(label) => formatDateLabel(label)}
              formatter={(value, name) => [
                value == null ? "No data" : `${Number(value).toFixed(1)}${valueSuffix}`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            {series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name}
                stroke={item.color}
                strokeWidth={2}
                connectNulls
                dot={{ r: 2.5 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
