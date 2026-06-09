-- FinCoach.AI — Supabase (PostgreSQL) schema.
-- Run this once in your Supabase project: Dashboard → SQL Editor → paste → Run.
-- The backend uses the service_role key, which bypasses Row Level Security,
-- so no RLS policies are required for the server to read/write.

-- ── Users (one row per phone; profile is a small 1:1 attribute bag) ──────────
create table if not exists users (
  id                    uuid primary key default gen_random_uuid(),
  phone                 text unique not null,
  plan                  text not null default 'free' check (plan in ('free','pro','elite')),
  "onboardingCompleted" boolean not null default false,
  "sessionToken"        text,
  profile               jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists users_session_idx on users ("sessionToken");

-- ── Accounts ────────────────────────────────────────────────────────────────
create table if not exists accounts (
  id         text primary key,
  "userId"   uuid not null references users(id) on delete cascade,
  name       text not null,
  type       text not null,
  subtype    text default '',
  balance    numeric not null default 0,
  "bankName" text default '',
  ifsc       text default ''
);
create index if not exists accounts_user_idx on accounts ("userId");

-- ── Transactions ─────────────────────────────────────────────────────────────
create table if not exists transactions (
  id          text primary key,
  "userId"    uuid not null references users(id) on delete cascade,
  date        text not null,
  type        text not null,
  "accountId" text default '',
  "fromId"    text default '',
  "toId"      text default '',
  amount      numeric not null,
  category    text default '',
  description text not null
);
create index if not exists transactions_user_idx on transactions ("userId");

-- ── Goals ────────────────────────────────────────────────────────────────────
create table if not exists goals (
  id        text primary key,
  "userId"  uuid not null references users(id) on delete cascade,
  name      text not null,
  current   numeric default 0,
  target    numeric not null,
  deadline  text default '',
  icon      text default 'Goal'
);
create index if not exists goals_user_idx on goals ("userId");

-- ── Bills ────────────────────────────────────────────────────────────────────
create table if not exists bills (
  id       text primary key,
  "userId" uuid not null references users(id) on delete cascade,
  name     text not null,
  due      text not null,
  amount   numeric not null,
  status   text default 'upcoming'
);
create index if not exists bills_user_idx on bills ("userId");

-- ── Subscriptions ────────────────────────────────────────────────────────────
create table if not exists subscriptions (
  id       text primary key,
  "userId" uuid not null references users(id) on delete cascade,
  name     text not null,
  category text default '',
  amount   numeric not null,
  cycle    text default 'Monthly',
  status   text default 'active'
);
create index if not exists subscriptions_user_idx on subscriptions ("userId");

-- ── Cash payments ─────────────────────────────────────────────────────────────
create table if not exists cash_payments (
  id       text primary key,
  "userId" uuid not null references users(id) on delete cascade,
  date     text not null,
  name     text not null,
  category text default 'Others',
  amount   numeric not null
);
create index if not exists cash_payments_user_idx on cash_payments ("userId");

-- ── Payments (plan upgrades via Razorpay) ─────────────────────────────────────
create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  "userId"            uuid not null references users(id) on delete cascade,
  "planId"            text not null,
  amount              numeric not null,
  currency            text default 'INR',
  receipt             text unique not null,
  "razorpayOrderId"   text unique not null,
  "razorpayPaymentId" text default '',
  "razorpaySignature" text default '',
  status              text default 'created',
  notes               jsonb default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
create index if not exists payments_user_idx on payments ("userId");
