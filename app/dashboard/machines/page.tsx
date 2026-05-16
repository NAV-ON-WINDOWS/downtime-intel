'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Machine } from '@/lib/types'

export default function MachinesPage() {
  const router = useRouter()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', line: '', hourly_revenue: '', hourly_labor_cost: '', hourly_overhead: ''
  })

  useEffect(() => {
    fetch('/api/machines').then(r => r.json()).then(data => {
      setMachines(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  async function handleAdd() {
    if (!form.name || !form.hourly_revenue) {
      alert('Machine name and hourly revenue are required')
      return
    }
    const res = await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        line: form.line,
        hourly_revenue: parseFloat(form.hourly_revenue),
        hourly_labor_cost: parseFloat(form.hourly_labor_cost) || 0,
        hourly_overhead: parseFloat(form.hourly_overhead) || 0,
      }),
    })
    const data = await res.json()
    if (data.id) {
      setMachines([data, ...machines])
      setShowForm(false)
      setForm({ name: '', line: '', hourly_revenue: '', hourly_labor_cost: '', hourly_overhead: '' })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => router.push('/dashboard')} className="text-xs text-zinc-500 hover:text-white mb-2 block">← Back to dashboard</button>
          <h1 className="text-2xl font-bold text-white">Machines</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          + Add Machine
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 space-y-4">
          <h2 className="text-white font-medium">New Machine</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Machine name *</label>
              <input className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. CNC Mill #3"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Production line</label>
              <input className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Line A"
                value={form.line} onChange={e => setForm({ ...form, line: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Hourly revenue (₹) *</label>
              <input type="number" className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 5000"
                value={form.hourly_revenue} onChange={e => setForm({ ...form, hourly_revenue: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Hourly labor cost (₹)</label>
              <input type="number" className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 800"
                value={form.hourly_labor_cost} onChange={e => setForm({ ...form, hourly_labor_cost: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Hourly overhead (₹)</label>
              <input type="number" className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 300"
                value={form.hourly_overhead} onChange={e => setForm({ ...form, hourly_overhead: e.target.value })} />
            </div>
          </div>
          <button onClick={handleAdd} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg text-sm transition-colors">
            Add Machine
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : machines.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-sm">No machines yet. Add your first machine to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {machines.map(machine => (
            <div key={machine.id}
              onClick={() => router.push(`/dashboard/machines/${machine.id}`)}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{machine.name}</p>
                  <p className="text-zinc-500 text-sm mt-0.5">{machine.line || 'No line specified'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400">₹{machine.hourly_revenue.toLocaleString()}/hr revenue</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Click to view details →</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}