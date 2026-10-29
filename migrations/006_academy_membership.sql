-- Approved pricing: BRL 9.99/month per course. Stripe prices are provisioned separately.
UPDATE courses SET monthly_price_cents=999,included_in_all_access=true,updated_at=now();
ALTER TABLE courses ALTER COLUMN included_in_all_access SET DEFAULT true;
