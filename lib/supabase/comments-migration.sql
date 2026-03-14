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
  content         text not null constraint ticket_comments_non_empty_content_chk check (char_length(trim(content)) > 0),
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
      and (
        t.created_by = auth.uid()
        or t.assigned_to = auth.uid()
        or exists (
          select 1 from profiles p
          where p.id = auth.uid()
          and p.role in ('admin', 'agent')
        )
      )
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
    and (
      exists (
        select 1 from tickets t
        where t.id = ticket_id
        and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
      )
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
        and p.role in ('admin', 'agent')
      )
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

-- Function: Get comment count for a ticket (relies on RLS for visibility)
create or replace function get_comment_count(p_ticket_id uuid)
returns bigint as $$
  select count(*)
  from ticket_comments
  where ticket_id = p_ticket_id;
$$ language sql stable security invoker;

-- Function: Notify mentioned users (integrate with your notification system)
create or replace function notify_mentioned_users()
returns trigger as $$
declare
  mentioned_id uuid;
  mention_text text;
  ticket_title_val text;
begin
  -- Look up ticket title once for notification message
  select title into ticket_title_val from tickets where id = new.ticket_id;

  -- On UPDATE, only process newly added mentions
  if TG_OP = 'UPDATE' then
    for mention_text in
      select e.val from jsonb_array_elements_text(new.mentions) as e(val)
      where not exists (
        select 1 from jsonb_array_elements_text(old.mentions) as o(val) where o.val = e.val
      )
    loop
      begin
        mentioned_id := mention_text::uuid;
      exception when invalid_text_representation then
        continue;
      end;
      -- Skip self-mentions: don't notify the comment author
      if mentioned_id = new.created_by then
        continue;
      end if;
      insert into notifications (user_id, type, title, message, ticket_id, ticket_title, link)
      values (
        mentioned_id,
        'mention',
        'You were mentioned in a comment',
        'You were mentioned in a comment on ticket: ' || coalesce(ticket_title_val, '(untitled)'),
        new.ticket_id,
        ticket_title_val,
        '/tickets/' || new.ticket_id
      )
      on conflict do nothing;
    end loop;
  else
    -- INSERT: process all mentions
    for mention_text in select jsonb_array_elements_text(new.mentions)
    loop
      begin
        mentioned_id := mention_text::uuid;
      exception when invalid_text_representation then
        continue;
      end;
      -- Skip self-mentions: don't notify the comment author
      if mentioned_id = new.created_by then
        continue;
      end if;
      insert into notifications (user_id, type, title, message, ticket_id, ticket_title, link)
      values (
        mentioned_id,
        'mention',
        'You were mentioned in a comment',
        'You were mentioned in a comment on ticket: ' || coalesce(ticket_title_val, '(untitled)'),
        new.ticket_id,
        ticket_title_val,
        '/tickets/' || new.ticket_id
      )
      on conflict do nothing;
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Trigger to notify on mentions (fires on INSERT and UPDATE when mentions change)
drop trigger if exists notify_on_comment_mention on ticket_comments;
create trigger notify_on_comment_mention
  after insert or update on ticket_comments
  for each row
  when (new.mentions <> '[]'::jsonb)
  execute function notify_mentioned_users();
