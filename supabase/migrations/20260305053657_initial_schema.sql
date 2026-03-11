-- ============================================================
-- Maison - Initial Schema
-- ============================================================

-- Utility: auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text not null default '',
  location text,
  temp_unit text not null default 'celsius' check (temp_unit in ('celsius', 'fahrenheit')),
  week_start_day text not null default 'monday' check (week_start_day in ('monday', 'sunday')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = user_id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = user_id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- clothing_items
-- ============================================================
create table public.clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  layer text not null check (layer in ('outer','top-over','top-base','dress','bottom','footwear','accessory','bag')),
  color text not null,
  photo_url text,
  temp_min integer,
  temp_max integer,
  seasons text[] not null default '{}',
  is_clean boolean not null default true,
  is_favorite boolean not null default false,
  wear_count integer not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clothing_items enable row level security;

create policy "Users can view own items"
  on public.clothing_items for select using (auth.uid() = user_id);
create policy "Users can insert own items"
  on public.clothing_items for insert with check (auth.uid() = user_id);
create policy "Users can update own items"
  on public.clothing_items for update using (auth.uid() = user_id);
create policy "Users can delete own items"
  on public.clothing_items for delete using (auth.uid() = user_id);

create index clothing_items_user_id on public.clothing_items(user_id);

create trigger clothing_items_updated_at
  before update on public.clothing_items
  for each row execute function public.update_updated_at();

-- ============================================================
-- matching_groups
-- ============================================================
create table public.matching_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  item_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.matching_groups enable row level security;

create policy "Users can view own groups"
  on public.matching_groups for select using (auth.uid() = user_id);
create policy "Users can insert own groups"
  on public.matching_groups for insert with check (auth.uid() = user_id);
create policy "Users can update own groups"
  on public.matching_groups for update using (auth.uid() = user_id);
create policy "Users can delete own groups"
  on public.matching_groups for delete using (auth.uid() = user_id);

-- ============================================================
-- group_compatibilities
-- ============================================================
create table public.group_compatibilities (
  id uuid primary key default gen_random_uuid(),
  group_a_id uuid references public.matching_groups(id) on delete cascade not null,
  group_b_id uuid references public.matching_groups(id) on delete cascade not null,
  unique (group_a_id, group_b_id)
);

alter table public.group_compatibilities enable row level security;

create policy "Users can view own compatibilities"
  on public.group_compatibilities for select
  using (exists (
    select 1 from public.matching_groups where id = group_a_id and user_id = auth.uid()
  ));
create policy "Users can insert own compatibilities"
  on public.group_compatibilities for insert
  with check (exists (
    select 1 from public.matching_groups where id = group_a_id and user_id = auth.uid()
  ));
create policy "Users can delete own compatibilities"
  on public.group_compatibilities for delete
  using (exists (
    select 1 from public.matching_groups where id = group_a_id and user_id = auth.uid()
  ));

-- ============================================================
-- wearing_rules
-- ============================================================
create table public.wearing_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  layer text not null check (layer in ('outer','top-over','top-base','dress','bottom','footwear','accessory','bag')),
  max_per_week integer not null default 3,
  allow_consecutive boolean not null default true,
  unique (user_id, layer)
);

alter table public.wearing_rules enable row level security;

create policy "Users can view own rules"
  on public.wearing_rules for select using (auth.uid() = user_id);
create policy "Users can insert own rules"
  on public.wearing_rules for insert with check (auth.uid() = user_id);
create policy "Users can update own rules"
  on public.wearing_rules for update using (auth.uid() = user_id);
create policy "Users can delete own rules"
  on public.wearing_rules for delete using (auth.uid() = user_id);

-- ============================================================
-- color_clashes
-- ============================================================
create table public.color_clashes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  color_a text not null,
  color_b text not null,
  unique (user_id, color_a, color_b)
);

alter table public.color_clashes enable row level security;

create policy "Users can view own clashes"
  on public.color_clashes for select using (auth.uid() = user_id);
create policy "Users can insert own clashes"
  on public.color_clashes for insert with check (auth.uid() = user_id);
create policy "Users can delete own clashes"
  on public.color_clashes for delete using (auth.uid() = user_id);

-- ============================================================
-- week_plans
-- ============================================================
create table public.week_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  status text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.week_plans enable row level security;

create policy "Users can view own plans"
  on public.week_plans for select using (auth.uid() = user_id);
create policy "Users can insert own plans"
  on public.week_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own plans"
  on public.week_plans for update using (auth.uid() = user_id);
create policy "Users can delete own plans"
  on public.week_plans for delete using (auth.uid() = user_id);

create index week_plans_user_week on public.week_plans(user_id, week_start);

create trigger week_plans_updated_at
  before update on public.week_plans
  for each row execute function public.update_updated_at();

-- ============================================================
-- day_outfit_items
-- ============================================================
create table public.day_outfit_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.week_plans(id) on delete cascade not null,
  date date not null,
  layer text not null check (layer in ('outer','top-over','top-base','dress','bottom','footwear','accessory','bag')),
  item_id uuid references public.clothing_items(id) on delete set null,
  is_locked boolean not null default false,
  unique (plan_id, date, layer)
);

alter table public.day_outfit_items enable row level security;

create policy "Users can view own outfit items"
  on public.day_outfit_items for select
  using (exists (
    select 1 from public.week_plans where id = plan_id and user_id = auth.uid()
  ));
create policy "Users can insert own outfit items"
  on public.day_outfit_items for insert
  with check (exists (
    select 1 from public.week_plans where id = plan_id and user_id = auth.uid()
  ));
create policy "Users can update own outfit items"
  on public.day_outfit_items for update
  using (exists (
    select 1 from public.week_plans where id = plan_id and user_id = auth.uid()
  ));
create policy "Users can delete own outfit items"
  on public.day_outfit_items for delete
  using (exists (
    select 1 from public.week_plans where id = plan_id and user_id = auth.uid()
  ));

create index day_outfit_items_plan_id on public.day_outfit_items(plan_id);

-- ============================================================
-- Storage: clothing-photos bucket
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('clothing-photos', 'clothing-photos', true);

create policy "Users can upload own photos"
  on storage.objects for insert
  with check (bucket_id = 'clothing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own photos"
  on storage.objects for update
  using (bucket_id = 'clothing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own photos"
  on storage.objects for delete
  using (bucket_id = 'clothing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Anyone can view clothing photos"
  on storage.objects for select
  using (bucket_id = 'clothing-photos');
