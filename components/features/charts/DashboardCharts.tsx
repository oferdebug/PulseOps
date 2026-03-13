'use client';

import {
  Area,
  AreaChart,
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
  YAxis,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  open: '#f59e0b',
  in_progress: '#6366f1',
  pending: '#f97316',
  closed: '#22c55e',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22d3ee',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const tooltipStyle = {
  contentStyle: {
    background: '#111118',
    border: '1px solid #1e1e2e',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#e2e8f0',
  },
  labelStyle: { color: '#94a3b8', fontWeight: 700, fontSize: '11px' },
};

export function TicketTrendChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  return (
    <ResponsiveContainer width='100%' height={220}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id='trendFill' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#6366f1' stopOpacity={0.3} />
            <stop offset='100%' stopColor='#6366f1' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke='#1e1e2e' strokeDasharray='3 3' />
        <XAxis
          dataKey='label'
          tick={{ fill: '#64748b', fontSize: 10 }}
          interval='preserveStartEnd'
          tickLine={false}
          axisLine={{ stroke: '#1e1e2e' }}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip {...tooltipStyle} />
        <Area
          type='monotone'
          dataKey='count'
          stroke='#6366f1'
          strokeWidth={2}
          fill='url(#trendFill)'
          name='Tickets'
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  if (items.length === 0) return null;

  return (
    <ResponsiveContainer width='100%' height={220}>
      <PieChart>
        <Pie
          data={items}
          cx='50%'
          cy='50%'
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey='value'
          stroke='none'
        >
          {items.map((entry) => (
            <Cell
              key={entry.name}
              fill={STATUS_COLORS[entry.name.replace(/ /g, '_')] ?? '#6366f1'}
            />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend
          formatter={(value) => (
            <span
              style={{
                color: '#94a3b8',
                fontSize: '11px',
                textTransform: 'capitalize',
              }}
            >
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PriorityBarChart({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).map(([name, value]) => ({ name, value }));

  if (items.length === 0) return null;

  return (
    <ResponsiveContainer width='100%' height={220}>
      <BarChart data={items} barCategoryGap='25%'>
        <CartesianGrid stroke='#1e1e2e' strokeDasharray='3 3' />
        <XAxis
          dataKey='name'
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: '#1e1e2e' }}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey='value' radius={[6, 6, 0, 0]} name='Tickets'>
          {items.map((entry) => (
            <Cell
              key={entry.name}
              fill={PRIORITY_COLORS[entry.name] ?? '#6366f1'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AgentWorkloadChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const top = [...data].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <ResponsiveContainer width='100%' height={220}>
      <BarChart data={top} layout='vertical' barCategoryGap='20%'>
        <CartesianGrid stroke='#1e1e2e' strokeDasharray='3 3' />
        <XAxis
          type='number'
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type='category'
          dataKey='name'
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip {...tooltipStyle} />
        <Bar
          dataKey='count'
          fill='#6366f1'
          radius={[0, 6, 6, 0]}
          name='Tickets'
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
