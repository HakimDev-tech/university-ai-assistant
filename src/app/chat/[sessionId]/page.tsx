import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatBox from '@/components/ChatBox'
import ChatSessionActions from '@/components/ChatSessionActions'
import Link from 'next/link'
import type { UIMessage } from 'ai'
import { ArrowLeft, FileText, GitBranch } from 'lucide-react'

interface SourceRow { id: string; chunk_index: number; content: string }
interface MessageRow { id: string; sender: string; content: string; source_chunk_ids: string[] | null }

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ branchId?: string }>
}) {
  const { sessionId } = await params
  const { branchId: requestedBranchId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session, error } = await supabase
    .from('chat_sessions')
    .select('id, title, document_id, default_branch_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (error || !session) redirect('/dashboard')

  const { data: branchRows } = await supabase
    .from('chat_branches')
    .select('id, name, created_at')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const branches = branchRows ?? []
  const activeBranch = branches.find(branch => branch.id === requestedBranchId)
    ?? branches.find(branch => branch.id === session.default_branch_id)
    ?? branches[0]
  if (!activeBranch) redirect('/dashboard')

  const { data: messages, error: msgsError } = await supabase
    .from('chat_messages')
    .select('id, sender, content, source_chunk_ids, created_at')
    .eq('session_id', sessionId)
    .eq('branch_id', activeBranch.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (msgsError) console.error('Failed to load messages:', msgsError)

  const typedMessages = (messages ?? []) as MessageRow[]
  const initialMessages: UIMessage[] = typedMessages.map(msg => ({
    id: msg.id,
    role: msg.sender === 'user' ? 'user' : 'assistant',
    parts: [{ type: 'text', text: msg.content }],
  }))
  const sourceIds = [...new Set(typedMessages.flatMap(message => message.source_chunk_ids ?? []))]
  let initialSources: Record<string, { id: string; chunkIndex: number; content: string }[]> = {}
  if (sourceIds.length) {
    const { data: sourceRows } = await supabase.from('document_chunks')
      .select('id, chunk_index, content')
      .eq('document_id', session.document_id).eq('user_id', user.id).in('id', sourceIds)
    const typedSources = (sourceRows ?? []) as SourceRow[]
    initialSources = Object.fromEntries(typedMessages
      .filter(message => message.sender === 'assistant' && (message.source_chunk_ids?.length ?? 0) > 0)
      .map(message => [message.id, (message.source_chunk_ids ?? [])
        .map(id => typedSources.find(source => source.id === id))
        .filter((source): source is SourceRow => Boolean(source))
        .map(source => ({ id: source.id, chunkIndex: source.chunk_index, content: source.content }))]))
  }

  return (
    <main className="site-shell chat-page-shell">
      <div className="chat-page-header">
        <div className="min-w-0">
          <Link href="/dashboard" className="back-link"><ArrowLeft size={14} /> Study desk</Link>
          <div className="eyebrow mb-2 flex items-center gap-2"><FileText size={12} /> Document conversation / source-linked</div>
          <h1 className="chat-page-title">{session.title || 'Untitled study thread'}</h1>
          <div className="chat-page-meta"><GitBranch size={12} /> {activeBranch.name} <span>·</span> {session.id.slice(0, 8)}</div>
        </div>
        <ChatSessionActions sessionId={sessionId} title={session.title || 'Untitled study thread'} />
      </div>
      <div className="mx-auto max-w-5xl">
        <ChatBox
          sessionId={sessionId}
          branchId={activeBranch.id}
          branchName={activeBranch.name}
          branches={branches.map(branch => ({ id: branch.id, name: branch.name }))}
          initialMessages={initialMessages}
          initialSources={initialSources}
        />
      </div>
    </main>
  )
}
