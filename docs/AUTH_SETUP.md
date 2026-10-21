# Authentication setup and signup diagnostics

## Required Vercel environment variables

Set these for the preview environment as well as Production when appropriate:

- `NEXT_PUBLIC_SUPABASE_URL`: the project's HTTPS URL, e.g. `https://YOUR_PROJECT.supabase.co`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the project's public anon/publishable key.
- `GEMINI_API_KEY`: a Google AI Studio API key. Server-only.
- `SUPABASE_SERVICE_ROLE_KEY`: the Supabase service-role secret, used only for server-side assistant-response persistence. Server-only.

The Supabase URL and publishable/anon key are public browser configuration. The Gemini key and service-role key are secrets: never prefix them with `NEXT_PUBLIC_`, never commit them, and never paste them into issue reports or chat messages. The current upload path uses the authenticated user's Supabase session and private Storage RLS; the service-role key remains required for saving generated assistant messages.

In Vercel → Project → Settings → Environment Variables, set the Supabase URL and public key for Preview, Production and Development as needed. Add Gemini and service-role secrets to Preview and Production; use a local `.env.local` for development. After changing environment variables, redeploy the affected environment. Next.js must rebuild to bake public values into the browser bundle.

## Supabase Auth URL configuration

In Supabase Dashboard → Authentication → URL Configuration:

1. Set **Site URL** to the canonical deployed application origin.
2. Add the exact preview origin to **Redirect URLs**, including the callback path, for example:
   `https://YOUR-DEPLOYMENT.vercel.app/auth/callback`
   Add the current Vercel preview URL as well as the stable production domain if it differs.
3. Add the production callback path separately if production uses another domain.
4. For local development, add `http://localhost:3000/auth/callback`.

Do not use a wildcard redirect to arbitrary external domains. The signup flow passes a same-origin callback URL and the callback route only redirects to a safe local path.

## Signup flow

1. The browser checks that the public Supabase URL and key exist.
2. Supabase Auth receives the email and password.
3. If email confirmation is enabled, the confirmation link returns to `/auth/callback?next=/dashboard`.
4. The server callback exchanges the one-time code for a session and redirects to the dashboard.
5. If confirmation is disabled, Supabase may return a session immediately and the browser navigates to the dashboard.

## Diagnosing “Failed to fetch”

A browser `Failed to fetch` is a transport/configuration symptom, not a precise Supabase Auth error. Check in this order:

1. Open the deployed site's browser DevTools → Network and reproduce signup.
2. Confirm the request is going to the expected `*.supabase.co/auth/v1/signup` host.
3. If there is no valid host or the request URL is malformed, check `NEXT_PUBLIC_SUPABASE_URL`.
4. If the request reaches Supabase and returns an HTTP error, inspect its status and response. Check the anon key, Auth provider settings, rate limits and project availability.
5. Confirm the deployment's redirect allowlist includes the exact callback URL.
6. Redeploy after any Vercel environment change.

The UI intentionally avoids showing raw provider errors to students. Use the browser Network response and Supabase Auth logs for diagnosis; do not paste service-role keys, access tokens, passwords or confirmation links into issue reports.
