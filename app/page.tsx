'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Downtime Intel</h1>
          <p className="text-zinc-400 text-sm">
            Machine downtime cost calculator and failure predictor for manufacturing operations
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors"
        >
          Open Dashboard
        </button>
      </div>
    </main>
  )
}