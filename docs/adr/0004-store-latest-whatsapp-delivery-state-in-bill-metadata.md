# Store latest WhatsApp delivery state in bill metadata

The bill will keep only the latest WhatsApp delivery state, not a full attempt history. We will store that latest delivery summary in a `whatsapp_metadata` JSONB field on the bill so the schema can hold status, timestamps, error details, and provider IDs without creating a separate delivery-attempt table while the feature remains focused on current operator visibility and resend control.
