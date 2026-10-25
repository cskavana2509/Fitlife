-- ============================================================
-- 001_init.sql : base schema for FitLife (run once on a fresh project)
-- ============================================================

-- ========== EXTENSIONS ==========
create extension if not exists "pgcrypto";

-- ========== TABLES ==========
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer','trainer','admin')),
  phone text,
  goal text,
  created_at timestamptz default now()
);

create table fitness_centres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  address text,
  description text,
  image_url text,
  amenities text[] default '{}',
  rating numeric(2,1) default 4.5,
  created_at timestamptz default now()
);

create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid references fitness_centres on delete cascade,
  name text not null,
  duration_days int not null,
  price_paise int not null,              -- store money in paise (₹1 = 100)
  features text[] default '{}'
);

create table trainers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles on delete cascade,
  centre_id uuid references fitness_centres on delete set null,
  display_name text not null,
  specialization text[] default '{}',
  bio text,
  experience_years int default 0,
  hourly_rate_paise int not null default 50000,
  image_url text,
  is_approved boolean default false,     -- admin approves trainers
  created_at timestamptz default now()
);

create table training_slots (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references trainers on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean default false
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  kind text not null check (kind in ('membership','session')),
  item_id uuid not null,
  amount_paise int not null,
  status text not null default 'created' check (status in ('created','paid','failed')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  created_at timestamptz default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  plan_id uuid references membership_plans,
  centre_id uuid references fitness_centres,
  starts_on date default current_date,
  ends_on date,
  status text default 'active'
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  slot_id uuid unique references training_slots on delete cascade,
  trainer_id uuid references trainers on delete cascade,
  status text default 'confirmed' check (status in ('confirmed','cancelled','completed')),
  created_at timestamptz default now()
);

create table diet_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  goal text check (goal in ('weight_loss','muscle_gain','maintenance','endurance')),
  description text,
  calories int,
  protein_g int,
  carbs_g int,
  fat_g int,
  meals jsonb not null default '[]'
);

-- ========== AUTO-CREATE PROFILE ON SIGNUP ==========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    case when new.raw_user_meta_data->>'role' = 'trainer' then 'trainer' else 'customer' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ========== ROW LEVEL SECURITY ==========
alter table profiles enable row level security;
alter table fitness_centres enable row level security;
alter table membership_plans enable row level security;
alter table trainers enable row level security;
alter table training_slots enable row level security;
alter table orders enable row level security;
alter table memberships enable row level security;
alter table bookings enable row level security;
alter table diet_plans enable row level security;

-- Profiles: users read/update their own row. Role can NOT be changed by the client.
create policy "own profile read"   on profiles for select using (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
revoke update on profiles from authenticated;
grant  update (full_name, phone, goal) on profiles to authenticated;

-- Public catalogue
create policy "public centres" on fitness_centres for select using (true);
create policy "public plans"   on membership_plans for select using (true);
create policy "public diets"   on diet_plans for select using (true);

-- Trainers: public sees approved; owner sees own; owner manages own
create policy "approved or own trainers" on trainers for select
  using (is_approved or profile_id = auth.uid());
create policy "trainer creates own" on trainers for insert
  with check (profile_id = auth.uid());
create policy "trainer updates own" on trainers for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Slots: public read; trainer manages their own slots
create policy "public slots" on training_slots for select using (true);
create policy "trainer adds slots" on training_slots for insert
  with check (exists (select 1 from trainers t where t.id = trainer_id and t.profile_id = auth.uid()));
create policy "trainer deletes slots" on training_slots for delete
  using (exists (select 1 from trainers t where t.id = trainer_id and t.profile_id = auth.uid()) and is_booked = false);

-- Orders / memberships / bookings: users see their own (writes happen server-side)
create policy "own orders"      on orders      for select using (user_id = auth.uid());
create policy "own memberships" on memberships for select using (user_id = auth.uid());
create policy "own or trainer bookings" on bookings for select
  using (user_id = auth.uid()
    or exists (select 1 from trainers t where t.id = trainer_id and t.profile_id = auth.uid()));

-- ========== SEED DATA ==========
insert into fitness_centres (name, city, address, description, amenities, rating) values
 ('Iron Forge Gym', 'Bengaluru', 'Indiranagar, 100 Ft Road', 'Premium strength & conditioning hub with free weights and functional zones.', '{"Free weights","Sauna","Cardio deck","Locker rooms"}', 4.8),
 ('Zen Flow Studio', 'Bengaluru', 'Koramangala 5th Block', 'Yoga, Pilates and mobility classes in a calm, airy space.', '{"Yoga","Pilates","Steam room","Cafe"}', 4.7),
 ('PowerHouse Fitness', 'Mumbai', 'Bandra West', 'Olympic lifting platforms, boxing ring and HIIT studio.', '{"Boxing","HIIT","Olympic lifting","Parking"}', 4.6);

insert into membership_plans (centre_id, name, duration_days, price_paise, features)
select id, 'Monthly', 30, 189900, '{"Full gym access","Group classes"}' from fitness_centres where name = 'Iron Forge Gym'
union all
select id, 'Quarterly', 90, 499900, '{"Full gym access","Group classes","1 free PT session"}' from fitness_centres where name = 'Iron Forge Gym'
union all
select id, 'Monthly', 30, 149900, '{"Yoga & Pilates classes"}' from fitness_centres where name = 'Zen Flow Studio';

insert into diet_plans (title, goal, description, calories, protein_g, carbs_g, fat_g, meals) values
 ('Lean Shred', 'weight_loss', 'Calorie-deficit plan with high protein to preserve muscle.', 1600, 140, 150, 50,
  '[{"meal":"Breakfast","items":["Oats with berries","2 boiled eggs"]},{"meal":"Lunch","items":["Grilled chicken","Brown rice","Salad"]},{"meal":"Snack","items":["Greek yogurt"]},{"meal":"Dinner","items":["Paneer tikka","Vegetable soup"]}]'),
 ('Muscle Builder', 'muscle_gain', 'Surplus plan built around lean protein and complex carbs.', 2800, 180, 320, 80,
  '[{"meal":"Breakfast","items":["4 egg omelette","Whole wheat toast","Banana"]},{"meal":"Lunch","items":["Chicken biryani (brown rice)","Curd"]},{"meal":"Snack","items":["Peanut butter shake"]},{"meal":"Dinner","items":["Salmon or tofu","Quinoa","Broccoli"]}]');