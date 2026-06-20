# Track WhatsApp delivery status separately from bill creation

Bill creation and WhatsApp bill delivery will be separate outcomes. A bill is always created first, then its WhatsApp delivery moves through explicit states such as not sent, sending, sent, or failed, with resend allowed when the current state is not in progress. This keeps billing reliable during messaging failures and gives operators clear visibility and control over delivery retries.
