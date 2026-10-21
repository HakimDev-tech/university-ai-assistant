import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatBox from '@/components/ChatBox'
import Link from 'next/link'
import type { UIMessage } from 'ai'
import { ArrowLeft, FileText } from 'lucide-react'

export default async function ChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session, error } = await supabase
    .from('chat_sessions')
    .select('id, title, document_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (error || !session) redirect('/dashboard')

  const { data: messages, error: msgsError } = await supabase
    .from('chat_messages')
    .select('id, sender, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (msgsError) console.error('Failed to load messages:', msgsError)

  const initialMessages: UIMessage[] = (messages || []).map(msg => ({
    id: msg.id,
    role: msg.sender === 'user' ? 'user' : 'assistant',
    parts: [{ type: 'text', text: msg.content }],
  }))

  return (
    <main className="site-shell py-5 md:py-8">
      <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs text-ink-secondary hover:text-brand-700">
            <ArrowLeft size={13} /> Back to study desk
          </Link>
          <div className="eyebrow mb-2 flex items-center gap-2"><FileText size={12} /> Document conversation / source-linked</div>
          <h1 className="max-w-3xl truncate font-display text-3xl tracking-tight md:text-4xl">{session.title || 'Untitled study thread'}</h1>
        </div>
        <span className="eyebrow">Thread / {session.id.slice(0, 8)}</span>
      </div>
      <div className="mx-auto max-w-5xl">
        <ChatBox sessionId={sessionId} initialMessages={initialMessages} />
      </div>
    </main>
  )
}
