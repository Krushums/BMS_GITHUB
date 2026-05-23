create type public.user_role as enum ('parent', 'child');
create type public.task_cadence as enum ('once', 'daily', 'weekly');
create type public.task_category as enum ('home', 'school', 'wellbeing', 'responsibility');
create type public.task_status as enum ('open', 'submitted', 'approved', 'rejected');
create type public.evidence_status as enum ('pending', 'approved', 'rejected');
create type public.reward_redemption_status as enum ('requested', 'approved', 'rejected', 'fulfilled');
create type public.points_transaction_source as enum ('task', 'reward', 'adjustment', 'streak');
create type public.streak_cadence as enum ('daily', 'weekly');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  category public.task_category not null default 'responsibility',
  cadence public.task_cadence not null default 'once',
  point_value integer not null check (point_value >= 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  due_date date,
  status public.task_status not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.evidence_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.task_assignments(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text,
  note text,
  status public.evidence_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  point_cost integer not null check (point_cost >= 0),
  requires_approval boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  status public.reward_redemption_status not null default 'requested',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  source public.points_transaction_source not null,
  source_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles(id) on delete cascade,
  cadence public.streak_cadence not null,
  current_count integer not null default 0 check (current_count >= 0),
  best_count integer not null default 0 check (best_count >= 0),
  last_activity_date date,
  updated_at timestamptz not null default now(),
  unique (child_id, cadence)
);

create index household_members_user_id_idx on public.household_members(user_id);
create index tasks_household_id_idx on public.tasks(household_id);
create index task_assignments_child_id_idx on public.task_assignments(child_id);
create index evidence_submissions_assignment_id_idx on public.evidence_submissions(assignment_id);
create index rewards_household_id_idx on public.rewards(household_id);
create index points_transactions_child_id_idx on public.points_transactions(child_id);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.evidence_submissions enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.points_transactions enable row level security;
alter table public.streaks enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Members can read their household memberships"
  on public.household_members for select
  using (user_id = auth.uid());

create policy "Members can read households they belong to"
  on public.households for select
  using (
    exists (
      select 1
      from public.household_members members
      where members.household_id = households.id
        and members.user_id = auth.uid()
    )
  );

create policy "Members can read household tasks"
  on public.tasks for select
  using (
    exists (
      select 1
      from public.household_members members
      where members.household_id = tasks.household_id
        and members.user_id = auth.uid()
    )
  );

create policy "Children can read their assignments"
  on public.task_assignments for select
  using (child_id = auth.uid());

create policy "Children can read their submissions"
  on public.evidence_submissions for select
  using (child_id = auth.uid());

create policy "Children can create their submissions"
  on public.evidence_submissions for insert
  with check (child_id = auth.uid());

create policy "Members can read household rewards"
  on public.rewards for select
  using (
    exists (
      select 1
      from public.household_members members
      where members.household_id = rewards.household_id
        and members.user_id = auth.uid()
    )
  );

create policy "Children can read their point history"
  on public.points_transactions for select
  using (child_id = auth.uid());

create policy "Children can read their streaks"
  on public.streaks for select
  using (child_id = auth.uid());
