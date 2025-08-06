import jwt from "jsonwebtoken";
import { CronJob } from "cron";
import { roleEnum } from "../../models/User.model.js";
import * as DBService from "../../DB/db.service.js";
import { UserModel } from "../../models/User.model.js";
import { nanoid } from "nanoid";
import { TokenModel } from "../../models/Token.model.js";
export const signatureTypeEnum = { system: "System", bearer: "Bearer" };
export const tokenTypeEnum = { access: "access", refresh: "refresh" };
export const logoutEnum = { logoutFromAllDevices: "logoutFromAllDevices", logout: "logout", stayLoggedIn: "stayLoggedIn" };
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

    if (decoded.jti && await DBService.findOne({ model: TokenModel, filter: { jti: decoded.jti } })) {
        return next(new Error("In-Valid Login Credentials", { cause: 401 }));
    }
    const user = await DBService.findById({
        model: UserModel,
        id: decoded._id
    });
    if (!user) {
        return next(new Error("Not Register Account", { cause: 404 }));
    }

    if (user.changeCredentialsTime?.getTime()>decoded.iat*1000) {
        return next(new Error("In-Valid Login Credentials", { cause: 401 }));
    }

    return { user, decoded };
};

export const generateLoginCredentials = async ({user } = {}) => {
       const signature = await getSignature({
         signatureLevel: user.role != roleEnum.user ? signatureTypeEnum.system : signatureTypeEnum.bearer
       });
    const jwtid = nanoid();
 
     const access_token = await generateToken({
         payLoad: { _id: user._id },
         signature: signature.accessSignature,
         options: {
             jwtid,
             expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
         }
     });
     
     const refresh_token = await generateToken({
 
         payLoad: { _id: user._id },
         signature: signature.refreshSignature,
         options: {
             jwtid,
             expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN)
         }
     });
      
    return { access_token, refresh_token };
}

export const createRevokeToken = async ({ req } = {}) => {
    await DBService.create({
        model: TokenModel,
        data: [{
            jti: req.decoded.jti,
            expiresIn: req.decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            userId: req.decoded._id
        }]
    });
    return true;
};

