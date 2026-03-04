-- ============================================================
-- PulseOps — Tickets Module
-- Migration: Create tickets table
-- ============================================================

create type ticket_status as enum ('open', 'in_progress', 'pending', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'critical');

create table tickets (
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

create trigger tickets_updated_at
  before update on tickets
  for each row execute function update_updated_at();

-- RLS: users can only see tickets created by them or assigned to them
alter table tickets enable row level security;

create policy "Users can view their tickets"
  on tickets for select
  using (auth.uid() = created_by or auth.uid() = assigned_to);

create policy "Users can insert tickets"
  on tickets for insert
  with check (auth.uid() = created_by);

create policy "Users can update their tickets"
  on tickets for update
  using (auth.uid() = created_by or auth.uid() = assigned_to);

-- Indexes for common query patterns
create index tickets_status_idx    on tickets (status);
create index tickets_priority_idx  on tickets (priority);
create index tickets_created_by_idx on tickets (created_by);
create index tickets_created_at_idx on tickets (created_at desc);