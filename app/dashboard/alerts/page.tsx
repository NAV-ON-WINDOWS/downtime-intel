'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/lib/types'

export default function AlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/alerts').then(r => r.json()).then(data => {
      setAlerts(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <button onClick={() => router.push('/dashboard')} className="text-xs text-zinc-500 hover:text-white mb-2 block">← Back to dashboard</button>
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <p className="text-zinc-400 text-sm mt-1">Machines flagged as high or critical risk by the prediction model</p>
      </div>

      {loading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-sm">No alerts yet. Alerts appear when the ML model predicts high or critical failure risk.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`rounded-xl border p-5 ${alert.is_read ? 'border-zinc-800 bg-zinc-900' : 'border-orange-800 bg-orange-950'}`}>
              <p className={`text-sm font-medium ${alert.is_read ? 'text-zinc-300' : 'text-orange-300'}`}>{alert.message}</p>
              <p className="text-xs text-zinc-500 mt-1">{new Date(alert.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}