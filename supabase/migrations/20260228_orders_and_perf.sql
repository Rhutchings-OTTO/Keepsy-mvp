-- Keepsy order + webhook persistence tables

create table if not exists public.stripe_events (
  id bigserial primary key,
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigserial primary key,
  order_ref text not null unique,
  stripe_session_id text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  currency text not null default 'gbp',
  total_gbp numeric(10,2) not null default 0,
  prompt text null,
  generated_image_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_ref text not null references public.orders(order_ref) on delete cascade,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_gbp numeric(10,2) not null,
  line_total_gbp numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.perf_metrics (
  id bigserial primary key,
  source text not null default 'generate-image',
  metrics jsonb not null,
  created_at timestamptz not null default now()
);
