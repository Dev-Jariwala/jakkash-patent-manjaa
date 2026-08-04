// Helper function to handle errors
export const handleError = (fnName, res, error, message = "Internal server error") => {
    console.error(`Error in function : ${fnName}: `, error);
    const status = error?.statusCode || error?.status || 500;
    const code = error?.code || "INTERNAL_SERVER_ERROR";
    const responseMessage = error?.message || message;

    return res.status(status).json({
        success: false,
        message: responseMessage,
        code,
        error: error?.message,
    });
};
