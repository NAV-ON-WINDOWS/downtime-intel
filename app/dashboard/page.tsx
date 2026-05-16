'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DowntimeLog, Machine } from '@/lib/types'
import { totalBleed, avgDowntimeMinutes, worstMachine } from '@/lib/costEngine'
import CostCard from '@/components/CostCard'
import DowntimeChart from '@/components/DowntimeChart'

export default function Dashboard() {
  const router = useRouter()
  const [logs, setLogs] = useState<DowntimeLog[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/machines').then(r => r.json()),
      fetch('/api/logs').then(r => r.json()),
    ]).then(([machinesData, logsData]) => {
      setMachines(Array.isArray(machinesData) ? machinesData : [])
      setLogs(Array.isArray(logsData) ? logsData : [])
      setLoading(false)
    })
  }, [])

  const worst = worstMachine(machines, logs)
  const thisMonth = logs.filter(l => {
    const d = new Date(l.started_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Downtime Intel</h1>
          <p className="text-zinc-400 text-sm mt-1">Manufacturing downtime cost tracker</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/machines')}
            className="text-sm px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Machines
          </button>
          <button
            onClick={() => router.push('/dashboard/logs')}
            className="text-sm px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            + Log Event
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <CostCard
          title="Total Cost MTD"
          value={`₹${totalBleed(thisMonth).toLocaleString()}`}
          subtitle="This month"
          highlight={totalBleed(thisMonth) > 100000}
        />
        <CostCard
          title="Total Events MTD"
          value={`${thisMonth.length}`}
          subtitle="This month"
        />
        <CostCard
          title="Avg Duration"
          value={`${avgDowntimeMinutes(logs)} min`}
          subtitle="Per event"
        />
        <CostCard
          title="Worst Machine"
          value={worst?.name || 'N/A'}
          subtitle={worst ? `₹${worst.totalCost.toLocaleString()} total` : 'No data yet'}
          highlight={!!worst}
        />
      </div>

      {/* Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-white font-medium mb-4">Daily Cost Over Time</h2>
        <DowntimeChart logs={logs} />
      </div>

      {/* Recent Logs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">Recent Events</h2>
          <button
            onClick={() => router.push('/dashboard/logs')}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            View all →
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="text-zinc-500 text-sm">No events logged yet. Add your first downtime event.</p>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm text-white capitalize">{log.cause_category} failure</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(log.started_at).toLocaleDateString()} · {log.duration_minutes} min
                  </p>
                </div>
                <p className="text-red-400 font-medium text-sm">₹{log.total_cost?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}