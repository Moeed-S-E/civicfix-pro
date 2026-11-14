import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ClipboardList
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import KpiCard from './ui/KpiCard.jsx';

const chartColors = ['#1e5b46', '#75a84b', '#a8cf5b', '#d2e6a8'];
const statusColors = ['#d49a32', '#4b83b6', '#4b9a62'];

function DashboardAnalytics({ stats }) {
  const cards = [
    { label: 'Total reports',  value: stats.total,                icon: ClipboardList, detail: 'All community reports',  color: 'card-green' },
    { label: 'Pending review', value: stats.byStatus.pending,     icon: AlertCircle,   detail: 'Waiting for attention',  color: 'card-amber' },
    { label: 'In progress',    value: stats.byStatus.inProgress,  icon: Activity,      detail: 'Being worked on',        color: 'card-blue'  },
    { label: 'Resolved',       value: stats.byStatus.resolved,    icon: CheckCircle2,  detail: 'Issues taken care of',   color: 'card-lime'  }
  ];

  const statusChartData = [
    { name: 'Pending',     value: stats.byStatus.pending    },
    { name: 'In Progress', value: stats.byStatus.inProgress },
    { name: 'Resolved',    value: stats.byStatus.resolved   }
  ];

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="dashboard-panel">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold">Issues by category</h2>
              <p className="mt-1 text-sm text-ink/50">Reports grouped by the kind of issue</p>
            </div>
            <span className="category-label">ALL TIME</span>
          </div>
          <div className="h-72 w-full">
            {stats.byCategory.every(({ count }) => count === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-ink/45">
                Category data will appear when reports come in.
              </div>
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={stats.byCategory} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                  <CartesianGrid stroke="#e9eee9" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="category"
                    tick={{ fill: '#64766e', fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tick={{ fill: '#84928c', fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      border: '1px solid #e8eee8',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(24,51,44,.08)'
                    }}
                    cursor={{ fill: '#f3f7f0' }}
                  />
                  <Bar dataKey="count" name="Reports" radius={[7, 7, 0, 0]}>
                    {stats.byCategory.map((entry, index) => (
                      <Cell fill={chartColors[index % chartColors.length]} key={entry.category} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold">Reports by status</h2>
            <p className="mt-1 text-sm text-ink/50">Current progress across all reports</p>
          </div>
          <div className="h-72 w-full">
            {statusChartData.every(({ value }) => value === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-ink/45">
                Status data will appear when reports come in.
              </div>
            ) : (
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    innerRadius={55}
                    nameKey="name"
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell fill={statusColors[index]} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      border: '1px solid #e8eee8',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(24,51,44,.08)'
                    }}
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default DashboardAnalytics;
