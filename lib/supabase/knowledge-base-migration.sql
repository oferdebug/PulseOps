DO $$ BEGIN
  CREATE TYPE article_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE article_category AS ENUM (
    'networking', 'hardware', 'software', 'security',
    'active-directory', 'email', 'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create table if not exists articles (
                          id          uuid primary key default gen_random_uuid(),
                          title       text not null,
                          content     text not null default '',
                          status      article_status not null default 'draft',
                          category    article_category not null default 'general',
                          created_by  uuid references auth.users(id) on delete set null,
                          created_at  timestamptz not null default now(),
                          updated_at  timestamptz not null default now()
);

drop trigger if exists articles_updated_at on articles;
create trigger articles_updated_at
    before update on articles
    for each row execute function update_updated_at();

alter table articles enable row level security;

drop policy if exists "Anyone can view published articles" on articles;
create policy "Anyone can view published articles"
  on articles for select
                             using (status = 'published' or auth.uid() = created_by);

drop policy if exists "Users can insert articles" on articles;
create policy "Users can insert articles"
  on articles for insert
  with check (auth.uid() = created_by);

drop policy if exists "Users can update their articles" on articles;
create policy "Users can update their articles"
  on articles for update
                                    using (auth.uid() = created_by);

drop policy if exists "Users can delete their articles" on articles;
create policy "Users can delete their articles"
  on articles for delete
using (auth.uid() = created_by);

create index if not exists articles_status_idx   on articles (status);
create index if not exists articles_category_idx on articles (category);
create index if not exists articles_created_at_idx on articles (created_at desc);