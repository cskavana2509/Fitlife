# FitLife

**Fitness centre management and booking platform.** FitLife connects customers, fitness centres, and trainers on one platform. Customers find centres, buy memberships, book trainers, follow diet plans, and get AI-based picks. Centre owners list their gyms, trainers offer sessions, and admins and coordinators run the operation.

**Live demo:** https://your-app.vercel.app

---

## Features

| Area | What it does |
|---|---|
| Sign up and login | Email and password accounts, with email verification and a forgot-password flow |
| Roles | Customer, trainer, centre owner, admin, and coordinator, each with its own dashboard |
| Fitness centres | Browse, filter by city, view plans, buy memberships |
| Trainers | Browse approved trainers, book free time slots |
| Centre owners | Submit a centre, add membership plans, wait for admin approval |
| Admin panel | Approve trainers and centres, manage plans, view users and revenue |
| Coordinator panel | Track memberships, bookings, and payments across all centres |
| Diet plans | Macro-based plans for weight loss, muscle gain, maintenance, and endurance |
| Search | Find centres by name, city, or amenity, and trainers by name or specialty |
| Payments | Razorpay checkout for memberships and sessions, with server-side verification |
| AI Picks | Gemini recommends centres, diets, and workout tips from your profile and location |
| FitBot | A chat assistant that answers from live FitLife data |
| Notifications | Email (Resend), SMS and WhatsApp (Twilio) after successful payments |

---

## Tech stack

- **Frontend:** React (Vite), React Router, Lucide icons, React Hot Toast
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Edge Functions)
- **Payments:** Razorpay (test mode)
- **AI:** Google Gemini (with a rule-based fallback)
- **Notifications:** Resend (email), Twilio (SMS and WhatsApp)
- **Hosting:** Vercel (frontend), Supabase (backend)

---

## Project structure