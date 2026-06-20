# Use best-effort force-cancel for WhatsApp delivery

Force-cancel will be best-effort rather than pretending the system can instantly stop every in-flight action. If a BullMQ job is still waiting, we will remove it from the queue. If it is already active, we will mark the bill as force-canceled in `whatsapp_metadata` and require the worker to check that state between major steps so it can exit safely without sending or without applying a later success result after cancellation.
