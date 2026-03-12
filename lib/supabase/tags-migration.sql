-- ============================================================
-- PulseOps — Tags System
-- Phase 1.2: Flexible tagging for tickets and articles
-- ============================================================

create table if not exists tags (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  color           text,  -- Hex color for UI display
  description     text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Many-to-many: Tickets <-> Tags
create table if not exists ticket_tags (
  ticket_id       uuid not null references tickets(id) on delete cascade,
  tag_id          uuid not null references tags(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (ticket_id, tag_id)
);

-- Many-to-many: Articles <-> Tags
create table if not exists article_tags (
  article_id      uuid not null references articles(id) on delete cascade,
  tag_id          uuid not null references tags(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (article_id, tag_id)
);

-- Indexes
create index if not exists tags_name_idx on tags (lower(name));
create index if not exists ticket_tags_tag_id_idx on ticket_tags (tag_id);
create index if not exists article_tags_tag_id_idx on article_tags (tag_id);

-- RLS
alter table tags enable row level security;
alter table ticket_tags enable row level security;
alter table article_tags enable row level security;

-- Tags: Everyone can view, authenticated can create
drop policy if exists "Anyone can view tags" on tags;
create policy "Anyone can view tags"
  on tags for select
  using (true);

drop policy if exists "Authenticated users can create tags" on tags;
create policy "Authenticated users can create tags"
  on tags for insert
  to authenticated
  with check (true);

-- Ticket tags: Only users with ticket access
drop policy if exists "Users can view tags on accessible tickets" on ticket_tags;
create policy "Users can view tags on accessible tickets"
  on ticket_tags for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

drop policy if exists "Users can tag their tickets" on ticket_tags;
create policy "Users can tag their tickets"
  on ticket_tags for insert
  with check (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

drop policy if exists "Users can remove tags from their tickets" on ticket_tags;
create policy "Users can remove tags from their tickets"
  on ticket_tags for delete
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

-- Article tags: Can tag if you can edit the article
drop policy if exists "Users can view tags on published articles" on article_tags;
create policy "Users can view tags on published articles"
  on article_tags for select
  using (
    exists (
      select 1 from articles a
      where a.id = article_id
      and (a.status = 'published' or a.created_by = auth.uid())
    )
  );

drop policy if exists "Users can tag their articles" on article_tags;
create policy "Users can tag their articles"
  on article_tags for insert
  with check (
    exists (
      select 1 from articles a
      where a.id = article_id
      and a.created_by = auth.uid()
    )
  );

drop policy if exists "Users can remove tags from their articles" on article_tags;
create policy "Users can remove tags from their articles"
  on article_tags for delete
  using (
    exists (
      select 1 from articles a
      where a.id = article_id
      and a.created_by = auth.uid()
    )
  );

-- Helper function: Get popular tags
create or replace function get_popular_tags(limit_count int default 10)
returns table(
  tag_id uuid,
  tag_name text,
  usage_count bigint
) as $$
  select 
    t.id,
    t.name,
    (select count(*) from ticket_tags tt where tt.tag_id = t.id)
    + (select count(*) from article_tags ats where ats.tag_id = t.id) as usage_count
  from tags t
  order by usage_count desc
  limit limit_count;
$$ language sql stable;
