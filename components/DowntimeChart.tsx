'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { DowntimeLog } from '@/lib/types'
import { format, parseISO } from 'date-fns'

export default function DowntimeChart({ logs }: { logs: DowntimeLog[] }) {
  // group logs by date and sum cost per day
  const grouped: Record<string, number> = {}
  logs.forEach(log => {
    const day = format(parseISO(log.started_at), 'MMM dd')
    grouped[day] = (grouped[day] || 0) + log.total_cost
  })

  const data = Object.entries(grouped).map(([date, cost]) => ({ date, cost }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        No data yet — add downtime logs to see the chart
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
          labelStyle={{ color: '#a1a1aa' }}
          formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Cost']}
        />
        <Area type="monotone" dataKey="cost" stroke="#ef4444" fill="url(#costGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}