import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: { title?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120) {
    return NextResponse.json({ error: 'Title must contain 1–120 characters' }, { status: 400 })
  }
  const { data, error } = await supabase.from('chat_sessions')
    .update({ title: body.title.trim() }).eq('id', sessionId).eq('user_id', user.id)
    .select('id, title').single()
  if (error || !data) return NextResponse.json({ error: 'Session not found or title could not be changed' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('chat_sessions')
    .delete().eq('id', sessionId).eq('user_id', user.id).select('id').single()
  if (error || !data) return NextResponse.json({ error: 'Session not found or could not be deleted' }, { status: 404 })
  return NextResponse.json({ success: true })
}
