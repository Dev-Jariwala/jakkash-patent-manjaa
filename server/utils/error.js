/**
 * Single error responder for the controllers.
 *
 * Errors the domain raises deliberately (`WhatsAppServiceDisabledError`,
 * `BillEditBlockedError`, ...) carry a `statusCode` and a message written for
 * the operator, so those are surfaced verbatim — the resend and edit-lock flows
 * depend on the client reading `code` to decide what to show.
 *
 * An error without a `statusCode` is an unexpected failure, and its message is
 * whatever the driver or library produced. Those get a generic message outside
 * development so a stack-shaped detail or a query fragment never reaches the
 * client. The full error is always logged.
 */
export const handleError = (fnName, res, error, message = "Internal server error") => {
    console.error(`Error in function : ${fnName}: `, error);

    const status = error?.statusCode || error?.status || 500;
    const code = error?.code || "INTERNAL_SERVER_ERROR";
    const isDeliberate = Boolean(error?.statusCode || error?.status);
    const exposeInternals = isDeliberate || process.env.NODE_ENV !== "production";
    const responseMessage = exposeInternals ? (error?.message || message) : message;

    return res.status(status).json({
        success: false,
        message: responseMessage,
        code,
        ...(exposeInternals && { error: error?.message }),
    });
};
