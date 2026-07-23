import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, go straight to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">University AI Assistant</h1>
      <p className="mt-2 text-gray-600">
        Chat intelligently with your course materials
      </p>
      <div className="mt-8 flex space-x-4">
        <Link
          href="/login"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50"
        >
          Sign up
        </Link>
      </div>
    </main>
  )
}