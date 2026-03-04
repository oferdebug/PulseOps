create type article_status as enum ('draft', 'published');
create type article_category as enum (
  'networking', 'hardware', 'software', 'security',
  'active-directory', 'email', 'general'
);

create table articles (
                          id          uuid primary key default gen_random_uuid(),
                          title       text not null,
                          content     text not null default '',
                          status      article_status not null default 'draft',
                          category    article_category not null default 'general',
                          created_by  uuid references auth.users(id) on delete set null,
                          created_at  timestamptz not null default now(),
                          updated_at  timestamptz not null default now()
);

create trigger articles_updated_at
    before update on articles
    for each row execute function update_updated_at();

alter table articles enable row level security;

create policy "Anyone can view published articles"
  on articles for select
                             using (status = 'published' or auth.uid() = created_by);

create policy "Users can insert articles"
  on articles for insert
  with check (auth.uid() = created_by);

create policy "Users can update their articles"
  on articles for update
                                    using (auth.uid() = created_by);

create policy "Users can delete their articles"
  on articles for delete
using (auth.uid() = created_by);

create index articles_status_idx   on articles (status);
create index articles_category_idx on articles (category);
create index articles_created_at_idx on articles (created_at desc);