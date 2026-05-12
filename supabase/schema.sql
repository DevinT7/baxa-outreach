-- ============================================================
-- BAXA Outreach Portal — Supabase Schema
-- Run this in your Supabase project's SQL editor
-- ============================================================

-- Companies
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'not_contacted'
    check (status in ('not_contacted', 'draft_created', 'sent', 'replied', 'not_interested')),
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contacts (emails per company)
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz default now()
);

-- Email draft/send log
create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  gmail_draft_id text,
  gmail_thread_id text,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'replied')),
  sent_by text,
  subject text,
  created_at timestamptz default now()
);

-- Auto-update updated_at on companies
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at
  before update on companies
  for each row execute function update_updated_at();

-- Indexes
create index if not exists contacts_company_id_idx on contacts(company_id);
create index if not exists email_logs_company_id_idx on email_logs(company_id);
create index if not exists companies_status_idx on companies(status);

-- Enable Row Level Security (open for now — tighten if you add auth)
alter table companies enable row level security;
alter table contacts enable row level security;
alter table email_logs enable row level security;

-- Allow all operations for authenticated and anon (single-team use)
create policy "allow_all_companies" on companies for all using (true) with check (true);
create policy "allow_all_contacts" on contacts for all using (true) with check (true);
create policy "allow_all_email_logs" on email_logs for all using (true) with check (true);
