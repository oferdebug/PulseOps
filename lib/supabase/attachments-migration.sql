-- ============================================================
-- PulseOps — File Attachments System
-- Phase 1.1: Foundation for file uploads across the app
-- ============================================================

-- Attachment types: what can have attachments
create type attachment_entity_type as enum (
  'ticket',
  'ticket_comment',
  'article',
  'user_profile'
);

-- Main attachments table
create table attachments (
  id              uuid primary key default gen_random_uuid(),
  
  -- What this attachment belongs to
  entity_type     attachment_entity_type not null,
  entity_id       uuid not null,
  
  -- File metadata
  file_name       text not null,
  file_size       bigint not null,  -- in bytes
  mime_type       text not null,
  storage_path    text not null,     -- Supabase Storage path
  
  -- User tracking
  uploaded_by     uuid references auth.users(id) on delete set null,
  uploaded_at     timestamptz not null default now(),
  
  -- Optional description
  description     text,
  
  -- Soft delete support
  deleted_at      timestamptz
);

-- Index for queries
create index attachments_entity_idx on attachments (entity_type, entity_id) where deleted_at is null;
create index attachments_uploaded_by_idx on attachments (uploaded_by);
create index attachments_uploaded_at_idx on attachments (uploaded_at desc);

-- RLS: Users can view attachments for entities they have access to
alter table attachments enable row level security;

-- View policy: can view if you have access to the parent entity
create policy "Users can view attachments for accessible entities"
  on attachments for select
  using (
    case entity_type
      when 'ticket' then exists (
        select 1 from tickets t 
        where t.id = entity_id 
        and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
      )
      when 'ticket_comment' then exists (
        select 1 from ticket_comments tc
        join tickets t on t.id = tc.ticket_id
        where tc.id = entity_id
        and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
      )
      when 'article' then exists (
        select 1 from articles a
        where a.id = entity_id
        and (a.status = 'published' or a.created_by = auth.uid())
      )
      when 'user_profile' then entity_id = auth.uid()
    end
  );

-- Insert policy: can upload if you have permission
create policy "Users can upload attachments"
  on attachments for insert
  with check (uploaded_by = auth.uid());

-- Delete policy: can delete own uploads or if admin
create policy "Users can delete own attachments"
  on attachments for delete
  using (uploaded_by = auth.uid());

-- Soft delete function (optional - use instead of hard delete)
create or replace function soft_delete_attachment(attachment_id uuid)
returns void as $$
begin
  update attachments
  set deleted_at = now()
  where id = attachment_id
  and uploaded_by = auth.uid();
end;
$$ language plpgsql security definer;

-- Helper function: Get attachment count for an entity
create or replace function get_attachment_count(
  p_entity_type attachment_entity_type,
  p_entity_id uuid
)
returns bigint as $$
  select count(*)
  from attachments
  where entity_type = p_entity_type
    and entity_id = p_entity_id
    and deleted_at is null;
$$ language sql stable;

-- Storage bucket setup (run this in Supabase Dashboard or via API)
-- insert into storage.buckets (id, name, public)
-- values ('attachments', 'attachments', false);

-- Storage policies (adjust based on your needs)
-- create policy "Authenticated users can upload files"
--   on storage.objects for insert
--   with check (bucket_id = 'attachments' and auth.role() = 'authenticated');
-- 
-- create policy "Users can view their accessible files"
--   on storage.objects for select
--   using (bucket_id = 'attachments' and auth.role() = 'authenticated');
