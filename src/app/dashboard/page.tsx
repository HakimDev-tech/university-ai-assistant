import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import FileUpload from '@/components/FileUpload'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's chat sessions
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('id, title, document_id, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <LogoutButton />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Upload a new document</h2>
          <FileUpload />
        </div>

        {/* Existing sessions */}
        {sessions && sessions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Your conversations</h2>
            <div className="space-y-2">
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/chat/${s.id}`}
                  className="block rounded-lg border p-4 hover:bg-gray-50 transition"
                >
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-gray-500">
                    Last activity: {new Date(s.updated_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}