import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { calculateDowntimeCost } from '@/lib/costEngine'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const machineId = searchParams.get('machine_id')

  let query = supabase
    .from('downtime_logs')
    .select('*')
    .order('started_at', { ascending: false })

  if (machineId) query = query.eq('machine_id', machineId)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()

  // fetch machine to get cost rates
  const { data: machine, error: machineError } = await supabase
    .from('machines')
    .select('hourly_revenue, hourly_labor_cost, hourly_overhead')
    .eq('id', body.machine_id)
    .single()

  if (machineError || !machine) {
    return NextResponse.json({ error: 'Machine not found' }, { status: 404 })
  }

  // calculate duration
  const started = new Date(body.started_at)
  const ended = new Date(body.ended_at)
  const durationMinutes = Math.round((ended.getTime() - started.getTime()) / 60000)

  // calculate cost using our cost engine
  const cost = calculateDowntimeCost(
    durationMinutes,
    machine.hourly_revenue,
    machine.hourly_labor_cost,
    machine.hourly_overhead
  )

  const { data, error } = await supabase
    .from('downtime_logs')
    .insert({
      machine_id: body.machine_id,
      started_at: body.started_at,
      ended_at: body.ended_at,
      duration_minutes: durationMinutes,
      cause_category: body.cause_category,
      cause_notes: body.cause_notes || '',
      total_cost: cost.totalCost,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, costBreakdown: cost })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'No id provided' }, { status: 400 })

  const { error } = await supabase
    .from('downtime_logs')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}