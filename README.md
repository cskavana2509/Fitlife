# FitLife – Fitness Centre Management & Booking Platform

React (Vite) · Supabase (Auth, Postgres, RLS, Edge Functions) · Razorpay · Resend · Twilio · Gemini · Vercel

## Roles
| Role | How to create | What they can do |
|---|---|---|
| customer | Sign up (default) | Browse, buy memberships, book trainers, AI picks |
| trainer | Sign up with "I'm a trainer" | Create profile, publish slots, see bookings |
| admin | SQL: `update profiles set role='admin' where id=...` | Approve trainers, manage centres, plans, diets, users |
| coordinator | SQL: `update profiles set role='coordinator' where id=...` | View all memberships, bookings and payments |

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill the `VITE_` values.
3. Run the SQL in `supabase/migrations/` in order (SQL Editor).
4. `supabase secrets set ...` for the function secrets listed in `.env.example`.
5. `supabase functions deploy create-order verify-payment ai-recommend notify send-email send-sms send-whatsapp`
6. `npm run dev`

## Deploy
Push to GitHub, import the repo in Vercel, add the two `VITE_` variables, then add the Vercel URL to Supabase **Authentication → URL Configuration**.

**Live URL:** https://your-app.vercel.app
