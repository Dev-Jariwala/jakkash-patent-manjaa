# Store WhatsApp service toggle in database

The WhatsApp service toggle will be stored as a persistent database-backed setting rather than an environment flag. That lets the shopkeeper manage the feature from the product UI while allowing the backend to enforce the setting consistently for bill creation, resend, and other delivery actions.
