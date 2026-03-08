create type log_action as enum ('created', 'updated', 'deleted', 'viewed', 'logged_in', 'logged_out');
create type log_entity as enum ('ticket', 'article', 'user', 'profile', 'system');

create table activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  user_email  text,
  action      log_action not null,
  entity      log_entity not null,
  entity_id   text,
  description text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

alter table activity_logs enable row level security;

create policy "Authenticated users can view logs"
  on activity_logs for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert logs"
  on activity_logs for insert
  with check (auth.uid() is not null);

create index logs_user_id_idx   on activity_logs (user_id);
create index logs_action_idx    on activity_logs (action);
create index logs_entity_idx    on activity_logs (entity);
create index logs_created_at_idx on activity_logs (created_at desc);