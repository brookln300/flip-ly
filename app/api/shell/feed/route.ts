import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = parseInt(searchParams.get('limit') || '20', 10)
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 20 : limitParam), 50)

    const { data, error } = await supabase
      .from('fliply_shell_attempts')
      .select('agent_name, level_attempted, result, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[SHELL] Feed query error:', error)
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
    }

    return NextResponse.json({ feed: data ?? [] })
  } catch (err) {
    console.error('[SHELL] Feed error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
