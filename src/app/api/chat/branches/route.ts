import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { sessionId?: unknown; branchId?: unknown; messageId?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { sessionId, branchId, messageId } = body
  if (typeof sessionId !== 'string' || typeof branchId !== 'string' || typeof messageId !== 'string') {
    return NextResponse.json({ error: 'sessionId, branchId and messageId are required' }, { status: 400 })
  }

  const { data: session } = await supabase.from('chat_sessions')
    .select('id').eq('id', sessionId).eq('user_id', user.id).single()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const { data: sourceBranch } = await supabase.from('chat_branches')
    .select('id').eq('id', branchId).eq('session_id', sessionId).eq('user_id', user.id).single()
  if (!sourceBranch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 })

  const { data: allMessages, error: messagesError } = await supabase.from('chat_messages')
    .select('id, client_message_id, sender, content, source_chunk_ids, created_at')
    .eq('branch_id', branchId).eq('session_id', sessionId).eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (messagesError || !allMessages) return NextResponse.json({ error: 'Could not load this version' }, { status: 503 })

  const targetIndex = allMessages.findIndex(message =>
    message.sender === 'user' && (message.id === messageId || message.client_message_id === messageId))
  if (targetIndex < 0) return NextResponse.json({ error: 'Question not found in this version' }, { status: 404 })

  const { count } = await supabase.from('chat_branches')
    .select('id', { count: 'exact', head: true }).eq('session_id', sessionId).eq('user_id', user.id)
  const nextVersion = (count ?? 1) + 1
  const { data: newBranch, error: branchError } = await supabase.from('chat_branches').insert({
    session_id: sessionId, user_id: user.id, name: `Version ${nextVersion}`,
    parent_branch_id: branchId, forked_from_message_id: allMessages[targetIndex].id,
  }).select('id, name').single()
  if (branchError || !newBranch) {
    console.error('Conversation branch creation failed')
    return NextResponse.json({ error: 'Could not create a new version' }, { status: 503 })
  }

  // Copy the exact prefix before the edited prompt. Every later exchange remains
  // isolated in the parent version and is never included in the new branch.
  const prefix = allMessages.slice(0, targetIndex)
  if (prefix.length) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      await supabase.from('chat_branches').delete().eq('id', newBranch.id).eq('user_id', user.id)
      return NextResponse.json({ error: 'Server-side history copy is not configured' }, { status: 503 })
    }
    const admin = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { error: copyError } = await admin.from('chat_messages').insert(prefix.map(message => ({
      session_id: sessionId, branch_id: newBranch.id, user_id: user.id,
      sender: message.sender, content: message.content,
      source_chunk_ids: message.source_chunk_ids ?? [],
      created_at: message.created_at,
    })))
    if (copyError) {
      await supabase.from('chat_branches').delete().eq('id', newBranch.id).eq('user_id', user.id)
      return NextResponse.json({ error: 'Could not preserve the earlier conversation' }, { status: 503 })
    }
  }

  return NextResponse.json({ branchId: newBranch.id, branchName: newBranch.name })
}
