-- Mandi foundation schema.
--
-- Design rules:
-- 1. Every user-owned row carries `owner_id uuid REFERENCES auth.users(id)`.
-- 2. Row Level Security is ON for all tables; policies restrict every
--    operation to `owner_id = auth.uid()`. The app NEVER bypasses RLS —
--    it only ever uses the anon key, never the service role key.
-- 3. Money uses `numeric(12,2)`; weights `numeric(10,3)`. No floats.
-- 4. Apply with the Supabase CLI (`supabase db push`) or paste into the
--    SQL editor. Requires a linked project — none is needed for UI work.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- people: farmers, traders, labour — photo-first identity
-- ---------------------------------------------------------------------------

create table public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  photo_url text,
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  type text not null default 'farmer'
    check (type in ('farmer', 'trader', 'labour', 'other')),
  village text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index people_owner_idx on public.people (owner_id);
create index people_owner_name_idx on public.people (owner_id, name);

create trigger people_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

alter table public.people enable row level security;

create policy "owners manage own people"
  on public.people for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- khata_entries: udhaar / payment ledger per person
-- ---------------------------------------------------------------------------

create table public.khata_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  date date not null default current_date,
  kind text not null check (kind in ('credit', 'debit', 'payment')),
  amount numeric(12, 2) not null check (amount > 0),
  method text not null default 'cash'
    check (method in ('cash', 'upi', 'udhaar')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index khata_owner_person_date_idx
  on public.khata_entries (owner_id, person_id, date desc);

create trigger khata_entries_updated_at
  before update on public.khata_entries
  for each row execute function public.set_updated_at();

alter table public.khata_entries enable row level security;

create policy "owners manage own khata entries"
  on public.khata_entries for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- sale_records: one row per auction sale
-- ---------------------------------------------------------------------------

create table public.sale_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  person_id uuid references public.people (id) on delete set null,
  date date not null default current_date,
  commodity text not null,
  variety text,
  qty_kg numeric(10, 3) not null check (qty_kg > 0),
  crates integer check (crates is null or crates > 0),
  rate_per_kg numeric(12, 2) not null check (rate_per_kg >= 0),
  total numeric(12, 2) not null check (total >= 0),
  expenses jsonb not null default '{}'::jsonb,
  net numeric(12, 2) not null,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- expenses shape: {"hamali": n, "tolai": n, "commission": n, "transport": n}
-- invariant (enforced in app code): net = total - (hamali+tolai+commission+transport)

create index sales_owner_date_idx
  on public.sale_records (owner_id, date desc);

create trigger sale_records_updated_at
  before update on public.sale_records
  for each row execute function public.set_updated_at();

alter table public.sale_records enable row level security;

create policy "owners manage own sale records"
  on public.sale_records for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: private photo buckets (create in Dashboard → Storage or via API)
-- ---------------------------------------------------------------------------
--
--   buckets: person-photos (private), record-photos (private)
--
-- Suggested storage policies (objects keyed `<owner_id>/<uuid>.jpg`):
--
--   create policy "owners upload own photos" on storage.objects for insert
--     with check (
--       bucket_id in ('person-photos', 'record-photos')
--       and (storage.foldername(name))[1] = auth.uid()::text
--     );
--   create policy "owners read own photos" on storage.objects for select
--     using (
--       bucket_id in ('person-photos', 'record-photos')
--       and (storage.foldername(name))[1] = auth.uid()::text
--     );
--   create policy "owners delete own photos" on storage.objects for delete
--     using (
--       bucket_id in ('person-photos', 'record-photos')
--       and (storage.foldername(name))[1] = auth.uid()::text
--     );
