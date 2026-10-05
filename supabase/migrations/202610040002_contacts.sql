-- Capture account emails without enrolling them in marketing.
CREATE OR REPLACE FUNCTION public.crm_canonical_email(raw_email text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT CASE WHEN split_part(lower(trim(raw_email)),'@',2) IN ('gmail.com','googlemail.com')
 THEN replace(split_part(split_part(lower(trim(raw_email)),'@',1),'+',1),'.','')||'@gmail.com'
 ELSE split_part(split_part(lower(trim(raw_email)),'@',1),'+',1)||'@'||split_part(lower(trim(raw_email)),'@',2) END;
$$;
CREATE OR REPLACE FUNCTION public.crm_capture_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.email IS NOT NULL THEN
 INSERT INTO public.contacts(email,email_canonical,user_id,first_source)
 VALUES(lower(NEW.email),public.crm_canonical_email(NEW.email),NEW.id,'account')
 ON CONFLICT(email_canonical) DO UPDATE SET user_id=coalesce(contacts.user_id,EXCLUDED.user_id);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.crm_capture_account() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS keepsy_crm_account ON auth.users;
CREATE TRIGGER keepsy_crm_account AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.crm_capture_account();
INSERT INTO public.contacts(email,email_canonical,user_id,first_source)
SELECT lower(email),public.crm_canonical_email(email),id,'legacy' FROM auth.users WHERE email IS NOT NULL
ON CONFLICT(email_canonical) DO NOTHING;
CREATE OR REPLACE FUNCTION public.crm_recount_orders(contact uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM 1 FROM public.contacts WHERE id=contact FOR UPDATE;
 UPDATE public.contacts SET orders_count=(SELECT count(*) FROM public.orders WHERE contact_id=contact AND status IN ('paid','in_production','shipped','delivered')),
 last_order_at=(SELECT max(created_at) FROM public.orders WHERE contact_id=contact AND status IN ('paid','in_production','shipped','delivered')) WHERE id=contact;
END $$;
REVOKE ALL ON FUNCTION public.crm_recount_orders(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.crm_recount_orders(uuid) TO service_role;


-- Normalise BOTH the historic order email and the entered email. An alias
-- must not allow a returning guest to receive a first-order-only discount.
CREATE OR REPLACE FUNCTION public.crm_count_paid_orders(email_address text, customer_id uuid DEFAULT NULL)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT count(*) FROM public.orders WHERE status IN ('paid','in_production','shipped','delivered')
 AND ((email_address IS NOT NULL AND (public.crm_canonical_email(customer_email)=public.crm_canonical_email(email_address)
 OR public.crm_canonical_email(checkout_email)=public.crm_canonical_email(email_address)))
 OR (customer_id IS NOT NULL AND user_id=customer_id));
$$;
REVOKE ALL ON FUNCTION public.crm_count_paid_orders(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.crm_count_paid_orders(text,uuid) TO service_role;
