ALTER TABLE bills
ADD COLUMN IF NOT EXISTS whatsapp_metadata JSONB NOT NULL DEFAULT '{
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
