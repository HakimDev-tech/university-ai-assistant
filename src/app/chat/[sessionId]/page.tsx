import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatBox from '@/components/ChatBox'
import Link from 'next/link'
import type { UIMessage } from 'ai'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
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

  if (error || !session) {
    redirect('/dashboard')
  }

  const { data: messages, error: msgsError } = await supabase
    .from('chat_messages')
    .select('id, sender, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (msgsError) {
    console.error('Failed to load messages:', msgsError)
  }

  const initialMessages: UIMessage[] = (messages || []).map((msg) => ({
    id: msg.id,
    role: msg.sender === 'user' ? 'user' : 'assistant',
    parts: [{ type: 'text', text: msg.content }],
  }))

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <Link
          href="/dashboard"
          className="text-sm text-ink-secondary hover:text-ink-primary transition-colors duration-150"
        >
          ← Dashboard
        </Link>
        <h1 className="text-sm font-medium text-ink-primary truncate max-w-md">
          {session.title}
        </h1>
        <div className="w-16" /> {/* spacer for centering */}
      </div>

      {/* Chat area */}
      <div className="flex-1 px-6 py-4">
        <div className="mx-auto max-w-3xl h-full">
          <ChatBox sessionId={sessionId} initialMessages={initialMessages} />
        </div>
      </div>
    </div>
  )
}