'use client'

import { useState, useEffect } from 'react'
import { Machine, CauseCategory } from '@/lib/types'

export default function LogForm({ onSuccess }: { onSuccess: () => void }) {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    machine_id: '',
    started_at: '',
    ended_at: '',
    cause_category: 'mechanical' as CauseCategory,
    cause_notes: '',
  })
  const [result, setResult] = useState<{ totalCost: number } | null>(null)

  useEffect(() => {
    fetch('/api/machines').then(r => r.json()).then(setMachines)
  }, [])

  async function handleSubmit() {
    if (!form.machine_id || !form.started_at || !form.ended_at) {
      alert('Please fill in all required fields')
      return
    }
    setLoading(true)
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.costBreakdown) {
      setResult(data.costBreakdown)
      onSuccess()
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <h2 className="text-white font-medium">Log Downtime Event</h2>

      <select
        className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
        value={form.machine_id}
        onChange={e => setForm({ ...form, machine_id: e.target.value })}
      >
        <option value="">Select machine</option>
        {machines.map(m => <option key={m.id} value={m.id}>{m.name} — {m.line}</option>)}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Started at</label>
          <input type="datetime-local" className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            value={form.started_at} onChange={e => setForm({ ...form, started_at: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Ended at</label>
          <input type="datetime-local" className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
            value={form.ended_at} onChange={e => setForm({ ...form, ended_at: e.target.value })} />
        </div>
      </div>

      <select
        className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
        value={form.cause_category}
        onChange={e => setForm({ ...form, cause_category: e.target.value as CauseCategory })}
      >
        <option value="mechanical">Mechanical</option>
        <option value="electrical">Electrical</option>
        <option value="operator">Operator</option>
        <option value="material">Material</option>
        <option value="unknown">Unknown</option>
      </select>

      <textarea
        className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-none"
        rows={3}
        placeholder="Notes (optional)"
        value={form.cause_notes}
        onChange={e => setForm({ ...form, cause_notes: e.target.value })}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
      >
        {loading ? 'Calculating...' : 'Log Event'}
      </button>

      {result && (
        <div className="bg-zinc-800 rounded-lg p-4 text-sm">
          <p className="text-zinc-400">Total cost of this event</p>
          <p className="text-2xl font-semibold text-red-400">₹{result.totalCost.toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}