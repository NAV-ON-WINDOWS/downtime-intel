'use client'

import { useState } from 'react'
import Papa from 'papaparse'

export default function CsvUpload({ onSuccess }: { onSuccess: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[]
        let success = 0

        for (const row of rows) {
          const res = await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              machine_id: row.machine_id,
              started_at: row.started_at,
              ended_at: row.ended_at,
              cause_category: row.cause_category || 'unknown',
              cause_notes: row.cause_notes || '',
            }),
          })
          if (res.ok) success++
        }

        setUploading(false)
        setSummary(`Uploaded ${success} of ${rows.length} logs successfully`)
        onSuccess()
      },
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-white font-medium mb-3">Bulk Upload via CSV</h2>
      <p className="text-xs text-zinc-500 mb-4">
        CSV must have columns: machine_id, started_at, ended_at, cause_category, cause_notes
      </p>
      <input
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 cursor-pointer"
      />
      {uploading && <p className="text-sm text-zinc-400 mt-3">Uploading...</p>}
      {summary && <p className="text-sm text-green-400 mt-3">{summary}</p>}
    </div>
  )
}