-- Migration 002 shipped without `provider_accepted_at`, but the metadata
-- builders in services/whatsappBillMetadata.js always write it. This aligns the
-- column default and any pre-existing rows with the canonical metadata shape so
-- resend (and later cancel) reads never hit a missing key.
-- Safe to re-run.

-- migrate:up

ALTER TABLE bills
ALTER COLUMN whatsapp_metadata SET DEFAULT '{
  "status": "no",
  "delivery_requested": false,
  "delivery_requested_at": null,
  "processing_started_at": null,
  "completed_at": null,
  "error_message": null,
  "provider_message_id": null,
  "provider_accepted_at": null,
  "queue_job_id": null,
  "cancel_requested": false,
  "canceled_at": null
}'::jsonb;

UPDATE bills
SET whatsapp_metadata = whatsapp_metadata || '{"provider_accepted_at": null}'::jsonb
WHERE NOT (whatsapp_metadata ? 'provider_accepted_at');

-- migrate:down

ALTER TABLE bills
ALTER COLUMN whatsapp_metadata SET DEFAULT '{
  "status": "no",
  "delivery_requested": false,
  "delivery_requested_at": null,
  "processing_started_at": null,
  "completed_at": null,
  "error_message": null,
  "provider_message_id": null,
  "queue_job_id": null,
  "cancel_requested": false,
  "canceled_at": null
}'::jsonb;
