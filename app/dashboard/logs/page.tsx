'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DowntimeLog } from '@/lib/types'
import LogForm from '@/components/LogForm'
import CsvUpload from '@/components/CsvUpload'

export default function LogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<DowntimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchLogs = useCallback(() => {
    fetch('/api/logs').then(r => r.json()).then(data => {
      setLogs(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function handleDelete(id: string) {
    if (!confirm('Delete this log?')) return
    setDeleting(id)
    await fetch(`/api/logs?id=${id}`, { method: 'DELETE' })
    setDeleting(null)
    fetchLogs()
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <button onClick={() => router.push('/dashboard')} className="text-xs text-zinc-500 hover:text-white mb-2 block">← Back to dashboard</button>
        <h1 className="text-2xl font-bold text-white">Downtime Logs</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <LogForm onSuccess={fetchLogs} />
        <CsvUpload onSuccess={fetchLogs} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-white font-medium mb-4">All Events</h2>
        {loading ? (
          <p className="text-zinc-400 text-sm">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-zinc-500 text-sm">No logs yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm text-white capitalize">{log.cause_category} failure</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(log.started_at).toLocaleDateString()} · {log.duration_minutes} min
                    {log.cause_notes && ` · ${log.cause_notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-red-400 font-medium text-sm">₹{log.total_cost?.toLocaleString()}</p>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deleting === log.id}
                    className="text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                  >
                    {deleting === log.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}