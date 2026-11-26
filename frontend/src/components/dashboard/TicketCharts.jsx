import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const STATUS_CHART_COLORS = {
  Open: '#4f46e5',
  'In Progress': '#f59e0b',
  Resolved: '#10b981',
  Closed: '#64748b',
};

const PRIORITY_CHART_COLORS = {
  Low: '#94a3b8',
  Medium: '#0ea5e9',
  High: '#f97316',
  Critical: '#e11d48',
};

export function TicketCharts({ statusDistribution = [], priorityDistribution = [] }) {
  const hasStatusData = statusDistribution.some((item) => item.value > 0);
  const hasPriorityData = priorityDistribution.some((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">
          Tickets by Status
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Current distribution across lifecycle stages
        </p>

        <div className="mt-4 h-64">
          {!hasStatusData ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              No ticket data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusDistribution}
                margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" name="Tickets" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {statusDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_CHART_COLORS[entry.name] || '#4f46e5'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">
          Tickets by Priority
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Breakdown by urgency level
        </p>

        <div className="mt-4 h-64">
          {!hasPriorityData ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              No ticket data available yet.
            </div>
          ) : (
            <div className="h-full flex flex-col sm:flex-row items-center">
              <div className="w-full sm:w-3/5 h-52 sm:h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityDistribution.filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {priorityDistribution
                        .filter((d) => d.value > 0)
                        .map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={PRIORITY_CHART_COLORS[entry.name] || '#64748b'}
                          />
                        ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-2/5 space-y-2 px-2">
                {priorityDistribution.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            PRIORITY_CHART_COLORS[entry.name] || '#64748b',
                        }}
                      />
                      {entry.name}
                    </span>
                    <span className="font-semibold text-slate-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
