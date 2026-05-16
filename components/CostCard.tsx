interface CostCardProps {
  title: string
  value: string
  subtitle?: string
  highlight?: boolean
}

export default function CostCard({ title, value, subtitle, highlight }: CostCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'border-red-500 bg-red-950' : 'border-zinc-800 bg-zinc-900'}`}>
      <p className="text-sm text-zinc-400 mb-1">{title}</p>
      <p className={`text-2xl font-semibold ${highlight ? 'text-red-400' : 'text-white'}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  )
}