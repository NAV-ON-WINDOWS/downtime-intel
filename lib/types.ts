export type CauseCategory =
  | 'mechanical'
  | 'electrical'
  | 'operator'
  | 'material'
  | 'unknown'

export type RiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'insufficient_data'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Machine {
  id: string
  org_id: string
  name: string
  line: string
  hourly_revenue: number
  hourly_labor_cost: number
  hourly_overhead: number
  created_at: string
}

export interface DowntimeLog {
  id: string
  machine_id: string
  started_at: string
  ended_at: string | null
  duration_minutes: number
  cause_category: CauseCategory
  cause_notes: string
  total_cost: number
  created_at: string
}

export interface Prediction {
  id: string
  machine_id: string
  predicted_failure_date: string
  predicted_duration_minutes: number
  confidence_score: number
  risk_level: RiskLevel
  model_version: string
  generated_at: string
}

export interface Alert {
  id: string
  machine_id: string
  prediction_id: string
  message: string
  is_read: boolean
  created_at: string
}

export interface CostBreakdown {
  downtimeMinutes: number
  revenueLost: number
  laborWasted: number
  overheadBurned: number
  totalCost: number
  costPerMinute: number
}