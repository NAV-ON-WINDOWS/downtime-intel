import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const body = await req.json()
    
    console.log('Received body:', body)
    
    const { data, error } = await supabase
      .from('machines')
      .insert({
        name: body.name,
        line: body.line,
        hourly_revenue: body.hourly_revenue,
        hourly_labor_cost: body.hourly_labor_cost || 0,
        hourly_overhead: body.hourly_overhead || 0,
      })
      .select()
      .single()

    console.log('Supabase response:', { data, error })

    if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: any) {
    console.log('Caught error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}