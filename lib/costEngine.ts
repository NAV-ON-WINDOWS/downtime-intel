import { CostBreakdown } from './types'

export function calculateDowntimeCost(
  durationMinutes: number,
  hourlyRevenue: number,
  hourlyLabor: number,
  hourlyOverhead: number
): CostBreakdown {
  const hrs = durationMinutes / 60
  const revenueLost = hrs * hourlyRevenue
  const laborWasted = hrs * hourlyLabor
  const overheadBurned = hrs * hourlyOverhead
  const totalCost = revenueLost + laborWasted + overheadBurned

  return {
    downtimeMinutes: durationMinutes,
    revenueLost: Math.round(revenueLost),
    laborWasted: Math.round(laborWasted),
    overheadBurned: Math.round(overheadBurned),
    totalCost: Math.round(totalCost),
    costPerMinute: Math.round(totalCost / durationMinutes),
  }
}

export function totalBleed(logs: { total_cost: number }[]): number {
  return Math.round(logs.reduce((sum, l) => sum + (l.total_cost || 0), 0))
}

export function avgDowntimeMinutes(logs: { duration_minutes: number }[]): number {
  if (logs.length === 0) return 0
  const total = logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)
  return Math.round(total / logs.length)
}

export function worstMachine(
  machines: { id: string; name: string }[],
  logs: { machine_id: string; total_cost: number }[]
): { name: string; totalCost: number } | null {
  if (!machines.length || !logs.length) return null

  const costMap: Record<string, number> = {}
  logs.forEach(log => {
    costMap[log.machine_id] = (costMap[log.machine_id] || 0) + log.total_cost
  })

  let worstId = ''
  let worstCost = 0
  Object.entries(costMap).forEach(([id, cost]) => {
    if (cost > worstCost) { worstCost = cost; worstId = id }
  })

  const machine = machines.find(m => m.id === worstId)
  return machine ? { name: machine.name, totalCost: Math.round(worstCost) } : null
}