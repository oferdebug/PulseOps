-- ============================================================
-- PulseOps — Ticket Comments System
-- Phase 2.1: Threaded discussions and internal notes
-- ============================================================

DO $$ BEGIN
  CREATE TYPE comment_type AS ENUM ('public', 'internal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create table if not exists ticket_comments (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references tickets(id) on delete cascade,
  
  -- Comment content
  content         text not null,
  comment_type    comment_type not null default 'public',
  
  -- User tracking
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  
  -- Editing history
  is_edited       boolean not null default false,
  edited_at       timestamptz,
  
  -- Mentions (JSON array of user IDs)
  mentions        jsonb default '[]'::jsonb,
  
  -- Threading (optional - for nested replies)
  parent_id       uuid references ticket_comments(id) on delete cascade
);

-- Indexes
create index if not exists ticket_comments_ticket_id_idx on ticket_comments (ticket_id);
create index if not exists ticket_comments_created_by_idx on ticket_comments (created_by);
create index if not exists ticket_comments_created_at_idx on ticket_comments (created_at desc);
create index if not exists ticket_comments_parent_id_idx on ticket_comments (parent_id) where parent_id is not null;

-- Auto-update updated_at trigger
drop trigger if exists ticket_comments_updated_at on ticket_comments;
create trigger ticket_comments_updated_at
  before update on ticket_comments
  for each row execute function update_updated_at();

-- RLS: Only users with ticket access can see comments
alter table ticket_comments enable row level security;

drop policy if exists "Users can view comments on accessible tickets" on ticket_comments;
create policy "Users can view comments on accessible tickets"
  on ticket_comments for select
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
    -- Internal comments only visible to agents/admins
    and (
      comment_type = 'public'
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
        and p.role in ('admin', 'agent')
      )
    )
  );

drop policy if exists "Users can create comments on accessible tickets" on ticket_comments;
create policy "Users can create comments on accessible tickets"
  on ticket_comments for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

drop policy if exists "Users can update own comments" on ticket_comments;
create policy "Users can update own comments"
  on ticket_comments for update
  using (created_by = auth.uid());

drop policy if exists "Users can delete own comments" on ticket_comments;
create policy "Users can delete own comments"
  on ticket_comments for delete
  using (created_by = auth.uid());

-- Function: Get comment count for a ticket
create or replace function get_comment_count(p_ticket_id uuid)
returns bigint as $$
  select count(*)
  from ticket_comments
  where ticket_id = p_ticket_id
  and (
    comment_type = 'public'
    or created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'agent'))
  );
$$ language sql stable security invoker;

-- Function: Notify mentioned users (integrate with your notification system)
create or replace function notify_mentioned_users()
returns trigger as $
declare
  mentioned_id uuid;
begin
  -- Loop through mentioned user IDs safely
  for mentioned_id in
    select v::uuid from jsonb_array_elements_text(new.mentions) as v
    where v ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  loop
    null; -- Replace with actual notification logic
  end loop;
  return new;
end;
$ language plpgsql;

-- Trigger to notify on mentions
-- TODO: Enable when notification system is implemented
-- drop trigger if exists notify_on_comment_mention on ticket_comments;
-- create trigger notify_on_comment_mention
--   after insert on ticket_comments
--   for each row
--   when (new.mentions <> '[]'::jsonb)
--   execute function notify_mentioned_users();
-- Function: Notify mentioned users (integrate with your notification system)
create or replace function notify_mentioned_users()
returns trigger as $
declare
  user_id uuid;
  mention_text text;
begin
  -- Loop through mentioned user IDs
  for mention_text in select jsonb_array_elements_text(new.mentions)
  loop
    begin
      user_id := mention_text::uuid;
    exception when invalid_text_representation then
      continue; -- Skip invalid UUIDs
    end;
    -- Insert notification (assumes you have a notifications table)
    -- insert into notifications (user_id, type, entity_type, entity_id, message)
    -- values (
    --   user_id,
    --   'mention',
    --   'ticket_comment',
    --   new.id,
    --   'You were mentioned in a ticket comment'
    -- );
    null; -- Replace with actual notification logic
  end loop;
  return new;
end;
$ language plpgsql;

-- Trigger to notify on mentions
drop trigger if exists notify_on_comment_mention on ticket_comments;
create trigger notify_on_comment_mention
  after insert on ticket_comments
  for each row
  when (new.mentions <> '[]'::jsonb)
  execute function notify_mentioned_users();
