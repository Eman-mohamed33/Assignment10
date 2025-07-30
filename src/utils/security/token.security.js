import jwt from "jsonwebtoken";
import { roleEnum } from "../../models/User.model.js";
import * as DBService from "../../DB/db.service.js";
import { UserModel } from "../../models/User.model.js";
export const signatureTypeEnum = { system: "System", bearer: "Bearer" };
export const tokenTypeEnum = { access: "access", refresh: "refresh" };

export const generateToken = async ({ payLoad = {}, signature = process.env.ACCESS_TOKEN_SIGNATURE,
    options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) } } = {}) => {
    return jwt.sign(payLoad, signature, options);
};

export const verifyToken = async ({ token = "", signature = process.env.ACCESS_TOKEN_SIGNATURE} = {}) => {
    return jwt.verify(token, signature);
};

export const getSignature = async ({ signatureLevel = signatureTypeEnum.bearer } = {}) => {
    const signatures = { accessSignature: undefined, refreshSignature: undefined };
    switch (signatureLevel) {
        case signatureTypeEnum.system:
            signatures.accessSignature = process.env.ACCESS_TOKEN_SYSTEM_SIGNATURE;
            signatures.refreshSignature = process.env.REFRESH_TOKEN_SYSTEM_SIGNATURE;
            break;
    
        default:
            signatures.accessSignature = process.env.ACCESS_TOKEN_USER_SIGNATURE;
            signatures.refreshSignature = process.env.REFRESH_TOKEN_USER_SIGNATURE;
            break;
    }
    return signatures;
}

export const decodedToken = async ({ authorization = " ", tokenType = tokenTypeEnum.access, next } = {}) => {
    console.log({ authorization });
    const [bearer, token] = authorization?.split(" ") || [];
    console.log({ bearer, token });
    if (!token || !bearer) {
        return next(new Error("Missing Token Parts"));
    }

    let signature = await getSignature({
        signatureLevel: bearer
    });
        
    const decoded = await verifyToken({
        token,
        signature: tokenType === tokenTypeEnum.access ? signature.accessSignature : signature.refreshSignature
    });
    console.log({ decoded });

    if (!decoded?._id) {
        return next(new Error("In-Valid Token", { cause: 400 }));
    }

    const user = await DBService.findById({
        model: UserModel,
        id: decoded._id
    });
    if (!user) {
        return next(new Error("Not Register Account", { cause: 404 }));
    }

    return user;
};

export const generateLoginCredentials = async ({user } = {}) => {
       const signature = await getSignature({
         signatureLevel: user.role != roleEnum.user ? signatureTypeEnum.system : signatureTypeEnum.bearer
     });
 
     const access_token = await generateToken({
         payLoad: { _id: user._id },
         signature:signature.accessSignature
     });
     
     const refresh_token = await generateToken({
 
         payLoad: { _id: user._id },
         signature: signature.refreshSignature,
         options: {
             expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
         }
     });
      
    return { access_token, refresh_token };
}