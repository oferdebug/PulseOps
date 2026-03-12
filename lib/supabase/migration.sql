-- ============================================================
-- PulseOps — Tickets Module
-- Migration: Create tickets table
-- ============================================================

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'pending', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create table if not exists tickets (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  status        ticket_status not null default 'open',
  priority      ticket_priority not null default 'medium',
  assigned_to   uuid references auth.users(id) on delete set null,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at on every row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tickets_updated_at on tickets;
create trigger tickets_updated_at
  before update on tickets
  for each row execute function update_updated_at();

-- RLS: users can only see tickets created by them or assigned to them
alter table tickets enable row level security;

drop policy if exists "Users can view their tickets" on tickets;
create policy "Users can view their tickets"
  on tickets for select
  using (auth.uid() = created_by or auth.uid() = assigned_to);

drop policy if exists "Users can insert tickets" on tickets;
create policy "Users can insert tickets"
  on tickets for insert
  with check (auth.uid() = created_by);

drop policy if exists "Users can update their tickets" on tickets;
create policy "Users can update their tickets"
  on tickets for update
  using (auth.uid() = created_by or auth.uid() = assigned_to);

-- Indexes for common query patterns
create index if not exists tickets_status_idx    on tickets (status);
create index if not exists tickets_priority_idx  on tickets (priority);
create index if not exists tickets_created_by_idx on tickets (created_by);
create index if not exists tickets_created_at_idx on tickets (created_at desc);