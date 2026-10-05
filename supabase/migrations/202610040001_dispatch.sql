-- Durable leases: concurrent workers cannot claim the same message.
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS first_attempt_at timestamptz;
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS lease_until timestamptz;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS lease_until timestamptz;
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS first_attempt_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS discount_codes_one_offer_per_email ON public.discount_codes(email_canonical,offer_id);
CREATE UNIQUE INDEX IF NOT EXISTS contact_purchase_once ON public.contact_events(contact_id,order_ref) WHERE type='purchase';
CREATE OR REPLACE FUNCTION public.claim_email_queue(batch_size integer DEFAULT 10)
RETURNS SETOF public.email_queue LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 WITH exhausted AS (
 UPDATE public.email_queue SET status='failed',lease_until=NULL,
 last_error='Automatic retries stopped; check provider delivery before retrying'
 WHERE status IN ('failed','sending') AND (lease_until IS NULL OR lease_until<now())
 AND (attempts>=6 OR first_attempt_at<=now()-interval '23 hours') RETURNING id
 )
 UPDATE public.email_queue SET status='sending', attempts=attempts+1,
 first_attempt_at=coalesce(first_attempt_at,now()), lease_until=now()+interval '10 minutes'
 WHERE id IN (SELECT id FROM public.email_queue
 WHERE ((status IN ('queued','failed') AND next_attempt_at<=now()) OR (status='sending' AND lease_until<now()))
 AND attempts<6 AND (first_attempt_at IS NULL OR first_attempt_at>now()-interval '23 hours')
 AND (campaign_id IS NULL OR EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id=email_queue.campaign_id AND c.status IN ('ready','sending')))
 ORDER BY next_attempt_at FOR UPDATE SKIP LOCKED LIMIT greatest(1,least(batch_size,20))) RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_email_queue(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_queue(integer) TO service_role;
CREATE OR REPLACE FUNCTION public.claim_owner_notifications(batch_size integer DEFAULT 10)
RETURNS SETOF public.notification_outbox LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 WITH exhausted AS (
 UPDATE public.notification_outbox SET status='failed',lease_until=NULL,
 last_error='Automatic retries stopped; review provider acknowledgement'
 WHERE status IN ('failed','partial','sending') AND (lease_until IS NULL OR lease_until<now())
 AND (attempts>=6 OR first_attempt_at<=now()-interval '23 hours') RETURNING id
 )
 UPDATE public.notification_outbox SET status='sending',attempts=attempts+1,
 first_attempt_at=coalesce(first_attempt_at,now()),lease_until=now()+interval '10 minutes'
 WHERE id IN (SELECT id FROM public.notification_outbox
 WHERE ((status IN ('queued','failed','partial') AND coalesce(next_attempt_at,now())<=now()) OR (status='sending' AND lease_until<now()))
 AND attempts<6 AND (first_attempt_at IS NULL OR first_attempt_at>now()-interval '23 hours')
 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT greatest(1,least(batch_size,20))) RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_owner_notifications(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_owner_notifications(integer) TO service_role;
