-- ═══════════════════════════════════════════════════════════
--  GemasFiş — Supabase PostgreSQL Schema
--  Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ─── Enable UUID extension ──────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── users (public profile, extends auth.users) ─────────────
create table if not exists public.users (
  id              uuid references auth.users(id) on delete cascade primary key,
  email           text not null,
  display_name    text,
  role            text not null default 'employee' check (role in ('admin','manager','employee')),
  department      text,
  avatar_url      text,
  logo_user_id    text,  -- Logo ERP user reference
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── receipts ────────────────────────────────────────────────
create table if not exists public.receipts (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  user_name               text,

  -- Image
  image_url               text not null,
  thumbnail_url           text,

  -- Financial
  amount                  numeric(12,2) not null,
  currency                text not null default 'TRY',
  date                    date not null,
  merchant_name           text not null,
  description             text,
  tax_number              text,
  kdv_amount              numeric(12,2),
  kdv_rate                smallint default 18,

  -- Logo ERP
  logo_status             text not null default 'draft'
                           check (logo_status in ('pending','processing','success','failed','draft')),
  logo_ref_no             text,
  logo_expense_code       text,
  logo_expense_name       text,
  logo_cash_account_code  text,
  logo_cash_account_name  text,
  logo_project_code       text,
  logo_error_message      text,
  logo_transferred_at     timestamptz,

  -- AI / OCR
  raw_ocr_data            jsonb,
  ai_suggestions          jsonb,
  ai_confidence_score     numeric(4,3),

  -- Soft delete & timestamps
  is_deleted              boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Indexes
create index if not exists receipts_user_id_idx        on public.receipts(user_id);
create index if not exists receipts_logo_status_idx    on public.receipts(logo_status);
create index if not exists receipts_date_idx           on public.receipts(date desc);
create index if not exists receipts_created_at_idx     on public.receipts(created_at desc);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists receipts_updated_at on public.receipts;
create trigger receipts_updated_at
  before update on public.receipts
  for each row execute procedure public.update_updated_at();

-- ─── RPC: monthly stats ──────────────────────────────────────
create or replace function public.get_monthly_stats(
  p_user_id uuid,
  p_month   text  -- 'YYYY-MM'
)
returns json as $$
declare
  v_start date := (p_month || '-01')::date;
  v_end   date := (v_start + interval '1 month')::date;
  v_result json;
begin
  select json_build_object(
    'totalAmount',  coalesce(sum(amount), 0),
    'totalCount',   count(*),
    'successCount', count(*) filter (where logo_status = 'success'),
    'failedCount',  count(*) filter (where logo_status = 'failed'),
    'pendingCount', count(*) filter (where logo_status in ('pending','draft','processing')),
    'currency',     'TRY',
    'month',        p_month,
    'categoryBreakdown', (
      select json_agg(cat_data)
      from (
        select
          logo_expense_code                as code,
          logo_expense_name                as name,
          sum(amount)                      as amount,
          count(*)                         as count,
          round(
            sum(amount) * 100.0 /
            nullif((select sum(amount) from receipts
                    where user_id = p_user_id
                      and date >= v_start and date < v_end
                      and is_deleted = false), 0),
            1
          )                                as percentage
        from public.receipts
        where user_id = p_user_id
          and date >= v_start and date < v_end
          and is_deleted = false
          and logo_expense_code is not null
        group by logo_expense_code, logo_expense_name
        order by sum(amount) desc
        limit 5
      ) cat_data
    )
  )
  into v_result
  from public.receipts
  where user_id = p_user_id
    and date >= v_start
    and date < v_end
    and is_deleted = false;

  return v_result;
end;
$$ language plpgsql security definer;

-- ─── Row Level Security ──────────────────────────────────────
alter table public.users    enable row level security;
alter table public.receipts enable row level security;

-- Users can only see & edit their own profile
create policy "users: own profile"
  on public.users for all
  using (auth.uid() = id);

-- Users can only see & edit their own receipts
create policy "receipts: own rows"
  on public.receipts for all
  using (auth.uid() = user_id);

-- ─── Storage bucket ──────────────────────────────────────────
-- Run this in Supabase Dashboard → Storage → New Bucket
-- Name: receipts
-- Public: true  (or use signed URLs for private access)
-- 
-- Also add the storage policy below via SQL Editor:
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "receipts storage: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "receipts storage: public read"
  on storage.objects for select
  using (bucket_id = 'receipts');

create policy "receipts storage: owner delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
