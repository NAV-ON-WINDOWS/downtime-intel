'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Machine, DowntimeLog, Prediction } from '@/lib/types'
import { totalBleed, avgDowntimeMinutes } from '@/lib/costEngine'
import CostCard from '@/components/CostCard'
import DowntimeChart from '@/components/DowntimeChart'
import PredictionBadge from '@/components/PredictionBadge'

export default function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [machineId, setMachineId] = useState<string>('')
  const [machine, setMachine] = useState<Machine | null>(null)
  const [logs, setLogs] = useState<DowntimeLog[]>([])
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [predicting, setPredicting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.resolve(params).then(p => setMachineId(p.id))
  }, [params])

  useEffect(() => {
    if (!machineId) return
    Promise.all([
      fetch('/api/machines').then(r => r.json()),
      fetch(`/api/logs?machine_id=${machineId}`).then(r => r.json()),
    ]).then(([machinesData, logsData]) => {
      const found = Array.isArray(machinesData)
        ? machinesData.find((m: Machine) => m.id === machineId)
        : null
      setMachine(found || null)
      setLogs(Array.isArray(logsData) ? logsData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [machineId])

  async function runPrediction() {
    setPredicting(true)
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machine_id: machineId }),
    })
    const data = await res.json()
    setPrediction(data)
    setPredicting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400">Loading...</p>
    </div>
  )

  if (!machine) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400">Machine not found</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <button onClick={() => router.push('/dashboard/machines')} className="text-xs text-zinc-500 hover:text-white mb-2 block">
          ← Back to machines
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{machine.name}</h1>
            <p className="text-zinc-400 text-sm mt-1">{machine.line || 'No line specified'}</p>
          </div>
          <button
            onClick={runPrediction}
            disabled={predicting}
            className="text-sm px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-colors"
          >
            {predicting ? 'Running model...' : 'Run Prediction'}
          </button>
        </div>
      </div>

      {prediction && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-white font-medium mb-4">Prediction Result</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <PredictionBadge risk={prediction.risk_level} />
            {prediction.predicted_failure_date && (
              <p className="text-sm text-zinc-400">
                Predicted failure window:{' '}
                <span className="text-white">
                  {new Date(prediction.predicted_failure_date).toLocaleDateString('en-GB')}
                </span>
              </p>
            )}
            {prediction.confidence_score > 0 && (
              <p className="text-sm text-zinc-400">
                Confidence:{' '}
                <span className="text-white">{Math.round(prediction.confidence_score * 100)}%</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <CostCard title="Total Cost" value={`₹${totalBleed(logs).toLocaleString()}`} subtitle="All time" highlight={totalBleed(logs) > 500000} />
        <CostCard title="Total Events" value={`${logs.length}`} subtitle="All time" />
        <CostCard title="Avg Duration" value={`${avgDowntimeMinutes(logs)} min`} subtitle="All time" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="text-white font-medium mb-4">Cost Over Time</h2>
        <DowntimeChart logs={logs} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-white font-medium mb-4">Event History</h2>
        {logs.length === 0 ? (
          <p className="text-zinc-500 text-sm">No events logged for this machine yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm text-white capitalize">{log.cause_category} failure</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(log.started_at).toLocaleDateString('en-GB')} · {log.duration_minutes} min
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