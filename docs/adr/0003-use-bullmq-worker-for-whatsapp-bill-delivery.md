# Use BullMQ worker for WhatsApp bill delivery

WhatsApp bill delivery must not slow down bill creation, so delivery will run asynchronously through a BullMQ queue backed by Redis. The API will create the bill quickly, update the bill's latest WhatsApp delivery status, and enqueue delivery work for a separate worker process that sends bills with a configurable concurrency limit, initially controlled by an environment variable with a value such as `2`.
