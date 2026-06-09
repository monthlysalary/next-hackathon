-- Optional: store Stripe subscription id on profile for cancel on any device
alter table public.profiles
  add column if not exists stripe_subscription_id text;
