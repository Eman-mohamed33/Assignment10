
export const asyncHandler = (FN) => {
    return async (req, res, next) => {
        await FN(req, res, next).catch(error => {
            return next(error, { cause: 500 });
            //res.status(500).json({ Error_message: "Server Error", error, message: error.message, stack: error.stack });
        })
    }
};


export const globalErrorHandling = (error, req, res, next) => {
    // 400 Bad Request
    return res.status(error.cause || 400).json({
        message: error.message, error,
        stack: process.env.MOOD==="DEV"?error.stack:undefined
    });
};


export const successResponse = ({ res, message = "Done", status = 200, data = {} } = {}) => {
    return res.status(status).json({ message, data });
};
