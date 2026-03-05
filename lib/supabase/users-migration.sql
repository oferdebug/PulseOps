create type user_role as enum ('admin', 'technician', 'user');

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text not null default '',
  role        user_role not null default 'user',
  department  text,
  phone       text,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

alter table profiles enable row level security;

create policy "Users can view all profiles"
  on profiles for select
  using (auth.uid() is not null);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete profiles"
  on profiles for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index profiles_role_idx on profiles (role);
create index profiles_is_active_idx on profiles (is_active);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();