-- ===== 1. Coordinator role =====
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('customer','trainer','admin','coordinator'));

-- ===== 2. Profile fields for AI recommendations and notifications =====
alter table profiles
  add column if not exists age int,
  add column if not exists weight_kg numeric(5,1),
  add column if not exists height_cm int,
  add column if not exists activity_level text
    check (activity_level in ('sedentary','light','moderate','active'));

grant update (full_name, phone, goal, age, weight_kg, height_cm, activity_level)
  on profiles to authenticated;

-- ===== 3. Recommendations table =====
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  kind text check (kind in ('centre','workout','diet')),
  payload jsonb not null,
  created_at timestamptz default now()
);
alter table recommendations enable row level security;
create policy "own recommendations" on recommendations for select using (user_id = auth.uid());

-- ===== 4. Role helper (security definer avoids recursive RLS on profiles) =====
create or replace function public.is_role(r text)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = r);
$$;

-- ===== 5. Staff can read operational data =====
create policy "staff read profiles"    on profiles    for select using (is_role('admin') or is_role('coordinator'));
create policy "staff read memberships" on memberships for select using (is_role('admin') or is_role('coordinator'));
create policy "staff read bookings"    on bookings    for select using (is_role('admin') or is_role('coordinator'));
create policy "staff read orders"      on orders      for select using (is_role('admin') or is_role('coordinator'));
create policy "staff read trainers"    on trainers    for select using (is_role('admin') or is_role('coordinator'));

-- ===== 6. Admin manages the catalogue and trainer approvals =====
create policy "admin manages centres" on fitness_centres for all
  using (is_role('admin')) with check (is_role('admin'));
create policy "admin manages plans" on membership_plans for all
  using (is_role('admin')) with check (is_role('admin'));
create policy "admin manages diets" on diet_plans for all
  using (is_role('admin')) with check (is_role('admin'));
create policy "admin updates trainers" on trainers for update
  using (is_role('admin')) with check (is_role('admin'));