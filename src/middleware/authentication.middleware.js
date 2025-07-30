import { asyncHandler } from "../utils/response.js"
import { decodedToken, tokenTypeEnum } from "../utils/security/token.security.js";


export const authentication = ({ tokenType = tokenTypeEnum.access } = {}) => {
    return asyncHandler(async (req, res, next) => {
        req.user = await decodedToken({ authorization: req.headers.authorization, next, tokenType });
        return next();
    })

};

export const authorization = ({ accessRoles = [] } = {}) => {
    return asyncHandler(async (req, res, next) => {
        console.log({ accessRoles, currentRole: req.user.role, match: accessRoles.includes(req.user.role) });
        if (!accessRoles.includes(req.user.role)) {
            return next(new Error("Not Authorized Account", { cause: 403 }));
        }
        return next();
    })

};

export const auth = ({ accessRoles = [] } = {}) => {
    return asyncHandler(async (req, res, next) => {
        req.user = await decodedToken({ authorization: req.headers.authorization, next });
        console.log({ accessRoles, currentRole: req.user.role, match: accessRoles.includes(req.user.role) });
        if (!accessRoles.includes(req.user.role)) {
            return next(new Error("Not Authorized Account", { cause: 403 }));
        }
        return next();
    })

};