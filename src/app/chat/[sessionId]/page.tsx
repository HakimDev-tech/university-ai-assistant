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
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl h-full">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold">{session.title}</h1>
          <div /> {/* spacer */}
        </div>
        <ChatBox sessionId={sessionId} initialMessages={initialMessages} />
      </div>
    </div>
  )
}