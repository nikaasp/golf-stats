import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

function formatHole(value) {
  return `H${value}`
}

export default function HoleValueChart({
  title,
  data = [],
  dataKey,
  color = "#2563eb",
  type = "line",
  valueFormatter = (value) => value,
  domain,
}) {
  const chartData = data.filter((row) => row[dataKey] !== null && row[dataKey] !== undefined)

  return (
    <div style={{ width: "100%", height: 210 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 16, lineHeight: 1.15 }}>{title}</h2>
      <ResponsiveContainer width="100%" height="88%">
        {type === "bar" ? (
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hole" tickFormatter={formatHole} tick={{ fontSize: 10 }} />
            <YAxis domain={domain} tick={{ fontSize: 10 }} />
            <Tooltip
              labelFormatter={(label) => formatHole(label)}
              formatter={(value) => [valueFormatter(value), title]}
            />
            <Bar dataKey={dataKey} fill={color} radius={[5, 5, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hole" tickFormatter={formatHole} tick={{ fontSize: 10 }} />
            <YAxis domain={domain} tick={{ fontSize: 10 }} />
            <Tooltip
              labelFormatter={(label) => formatHole(label)}
              formatter={(value) => [valueFormatter(value), title]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              connectNulls
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
