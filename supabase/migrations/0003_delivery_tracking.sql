alter type public.recipient_delivery_status add value if not exists 'delivered';
alter type public.recipient_delivery_status add value if not exists 'delayed';
alter type public.recipient_delivery_status add value if not exists 'suppressed';
alter type public.recipient_delivery_status add value if not exists 'bounced';
alter type public.recipient_delivery_status add value if not exists 'complained';

alter table public.deliveries
  add column if not exists from_name text,
  add column if not exists from_email text,
  add column if not exists reply_to text;

alter table public.delivery_recipients
  add column if not exists delivered_at timestamptz,
  add column if not exists last_event_at timestamptz;

create index if not exists delivery_recipients_provider_message_idx
  on public.delivery_recipients(provider_message_id)
  where provider_message_id is not null;
