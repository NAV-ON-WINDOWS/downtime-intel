import { RiskLevel } from '@/lib/types'

const config: Record<RiskLevel, { label: string; classes: string }> = {
  low:                { label: 'Low Risk',           classes: 'bg-green-900 text-green-400 border-green-700' },
  medium:             { label: 'Medium Risk',        classes: 'bg-yellow-900 text-yellow-400 border-yellow-700' },
  high:               { label: 'High Risk',          classes: 'bg-orange-900 text-orange-400 border-orange-700' },
  critical:           { label: 'Critical Risk',      classes: 'bg-red-900 text-red-400 border-red-700' },
  insufficient_data:  { label: 'Not Enough Data',    classes: 'bg-zinc-800 text-zinc-400 border-zinc-600' },
}

export default function PredictionBadge({ risk }: { risk: RiskLevel }) {
  const { label, classes } = config[risk] || config.insufficient_data
  return (
    <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full border ${classes}`}>
      {label}
    </span>
  )
}