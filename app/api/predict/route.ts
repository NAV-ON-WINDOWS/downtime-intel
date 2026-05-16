import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    ml_url: process.env.ML_SERVICE_URL || 'NOT SET'
  })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()
  const machineId = body.machine_id

  const { data: logs, error } = await supabase
    .from('downtime_logs')
    .select('started_at, duration_minutes, cause_category')
    .eq('machine_id', machineId)
    .order('started_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  console.log('Sending logs to ML service:', logs?.length, 'logs')

  try {
    const mlResponse = await fetch(`https://downtime-intel.onrender.com/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machine_id: machineId, downtime_logs: logs }),
    })

    const prediction = await mlResponse.json()
    console.log('Prediction result:', prediction)

    if (prediction.risk_level && prediction.risk_level !== 'insufficient_data') {
      await supabase.from('predictions').insert({
        machine_id: machineId,
        predicted_failure_date: prediction.predicted_failure_date,
        confidence_score: prediction.confidence_score,
        risk_level: prediction.risk_level,
        model_version: prediction.model_version,
      })

      if (prediction.risk_level === 'high' || prediction.risk_level === 'critical') {
        await supabase.from('alerts').insert({
          machine_id: machineId,
          message: `Machine at ${prediction.risk_level.toUpperCase()} risk — predicted failure around ${prediction.predicted_failure_date}`,
        })
      }
    }

    return NextResponse.json(prediction)
  } catch (e: any) {
    console.log('ML service error:', e.message)
    return NextResponse.json({ error: 'ML service unavailable' }, { status: 503 })
  }
}