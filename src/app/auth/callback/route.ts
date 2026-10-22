import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/dashboard'
  return value
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeNextPath(requestUrl.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL('/auth/confirmation-error', requestUrl.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/auth/confirmation-error', requestUrl.origin))
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
