-- Add idempotency constraints for Stripe processing
-- Ensures we don't double-process the same session or payment intent

-- Unique, nullable index on stripe_session_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_session_unique
ON transactions(stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

-- Unique, nullable index on stripe_payment_intent_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_unique
ON transactions(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;


