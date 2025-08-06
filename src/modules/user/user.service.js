import { asyncHandler, successResponse } from "../../utils/response.js";
import * as DBService from "../../DB/db.service.js";
import { decryptEncryption, generateEncryption } from "../../utils/security/encryption.security.js";
import { compareHash, generateHash } from "../../utils/security/hash.security.js";
import { createRevokeToken, generateLoginCredentials, logoutEnum } from "../../utils/security/token.security.js";
import { providerEnum, roleEnum, UserModel } from "../../models/User.model.js";
import { customAlphabet } from "nanoid";
import { emailEvent } from "../../utils/events/email.event.js";
import { TokenModel } from "../../models/Token.model.js";

export const logout = asyncHandler(async (req, res, next) => {
    const { flag } = req.body;
    let status = 200;
    switch (flag) {
        case logoutEnum.logoutFromAllDevices:
            await DBService.updateOne({
                model: UserModel,
                filter: {
                    _id: req.decoded._id
                },
                newData: {
                    changeCredentialsTime: new Date()
                }
            })
            break;
    
        default:
            await DBService.create({
                 
                model: TokenModel,
                data: [{
                    jti: req.decoded.jti,
                    expiresIn: req.decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                    userId: req.decoded._id
                }]
            })
            status = 201;
            break;
    }
    successResponse({ res, status, data: { decoded: req.decoded } });
});

export const profile = asyncHandler(async (req, res, next) => {
    
    req.user.phone = await decryptEncryption({
        cipherText: req.user.phone,
    });

    return successResponse({
        res, data: { user: req.user }
    });
    
    
});

export const shareProfile = asyncHandler(async (req, res, next) => {
  
    const { userId } = req.params;
    const user = await DBService.findOne({
        model: UserModel,
        filter: {
            _id: userId,
            confirmEmail: { $exists: true }
        }
    });

    return user ? successResponse({
        res, data: { user }
    }) : next(new Error("In-valid Account", { cause: 404 }));
    
    
});

export const updateBasicInfo = asyncHandler(async (req, res, next) => {
  
    if (req.body.phone) {
       
        req.body.phone = await generateEncryption({ plainText: req.body.phone });
    }
    
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: req.user._id
        },
        data: req.body
    });

    return user ? successResponse({
        res, status: 201, data: { user }
    }) : next(new Error("In-valid Account", { cause: 404 }));
    
    
});

export const freezeAccount = asyncHandler(async (req, res, next) => {
  
    const { userId } = req.params;
    if (userId && req.user.role !== roleEnum.admin) {
        return next(new Error("Not Authorized Account", { cause: 403 }));
    }

    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: userId || req.user._id,
            deletedAt: { $exists: false }
        },
        data: {
            $unset: {
                restoredAt: 1,
                restoredBy: 1
            },
            deletedAt: Date.now(),
            deletedBy: req.user._id,
            changeCredentialsTime: new Date()
        }
    });


    return user ? successResponse({
        res, data: { user }
    }) : next(new Error("In-valid Account", { cause: 404 }));
    
    
});

export const restoreAccount = asyncHandler(async (req, res, next) => {
  
    const { userId } = req.params;
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: userId,
            deletedAt: { $exists: true },
            deletedBy: { $ne: userId }
        },
        data: {
            $unset: {
                deletedAt: 1,
                deletedBy: 1
            },
            restoredAt: Date.now(),
            restoredBy: req.user._id
        }
    });


    return user ? successResponse({
        res, data: { user }
    }) : next(new Error("In-valid Account", { cause: 404 }));
    
    
});

export const deleteAccount = asyncHandler(async (req, res, next) => {
  
    const { userId } = req.params;
    const user = await DBService.deleteOne({
        model: UserModel,
        filter: {
            _id: userId,
            deletedAt: { $exists: true }
        }
    });
    return user.deletedCount ? successResponse({
        res, data: { user }
    }) : next(new Error("In-valid Account", { cause: 404 }));
    
    
});

export const getNewLoginCredentials = asyncHandler(async (req, res, next) => {

    const credentials = await generateLoginCredentials({ user: req.user });


    return successResponse({ res, data: { credentials } });
});

export const updatePassword = asyncHandler(async (req, res, next) => {

    const { oldPassword, password, flag } = req.body;

    if (!compareHash({ plainText: oldPassword, hashValue: req.user.password })) {
        return next(new Error("The oldPassword is incorrect"));
    };

    if (req.user.oldPasswords?.length) {
        for (const historyPassword of req.user.oldPasswords) {
            if (await compareHash({ plainText: password, hashValue: historyPassword })) {
                return next(new Error("This Password is Used Before"));
            }
        }
    }

     

    let updated = {};
    switch (flag) {
        case logoutEnum.logoutFromAllDevices:
           
            updated.changeCredentialsTime = new Date();
            break;
    
        case logoutEnum.logout:
            
            await createRevokeToken({ req });
            break;
        default:
            break;
    }

    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: req.user._id
        },
        data: {
            password: await generateHash({ plainText: password }),
            ...updated,
            $push: { oldPasswords: req.user.password }
        }
    });                          

  
    console.log({ oldPassword, password });
    
    return user ? successResponse({ res, status: 201, data: { user }, message: "Your Password Has Been Updated" }) :
        next(new Error("In-Valid User Account", { cause: 404 }));
});

export const sendForgotPassword = asyncHandler(async (req, res, next) => {

    const { email } = req.body;
    const otp = customAlphabet("0123456789", 6)();
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            email,
            confirmEmail: { $exists: true },
            deletedAt: { $exists: false },
            provider: providerEnum.system
        },
        data: {
            forgotPasswordOtp: await generateHash({ plainText: otp })
        }
    });

    if (!user) {
        next(new Error("In-Valid User Account", { cause: 404 }));
    }

    emailEvent.emit("sendForgotPassword", { to: email, subject: "Forgot Password", title: "Reset Password", otp });

    return  successResponse({ res, status: 201, data: { user } }) ;
});

export const verifyForgotPassword = asyncHandler(async (req, res, next) => {

    const { email, otp } = req.body;
  
    const user = await DBService.findOne({
        model: UserModel,
        filter: {
            email,
            confirmEmail: { $exists: true },
            forgotPasswordOtp: { $exists: true },
            deletedAt: { $exists: false },
            provider: providerEnum.system
        },
    });

    if (!user) {
        return next(new Error("In-Valid User Account", { cause: 404 }));
    }

    if (!await compareHash({ plainText: otp, hashValue: user.forgotPasswordOtp })) {
        return next(new Error("In-valid Otp", { cause: 404 }));
    }
  
    return successResponse({ res, status: 200, data: {} });
});

export const resetPassword = asyncHandler(async (req, res, next) => {

    const { email, otp, password } = req.body;
  
    const user = await DBService.findOne({
        model: UserModel,
        filter: {
            email,
            confirmEmail: { $exists: true },
            forgotPasswordOtp: { $exists: true },
            deletedAt: { $exists: false },
            provider: providerEnum.system
        },
    });

    if (!user) {
        return next(new Error("In-Valid User Account", { cause: 404 }));
    }

    if (!await compareHash({ plainText: otp, hashValue: user.forgotPasswordOtp })) {
        return next(new Error("In-valid Otp", { cause: 404 }));
    }
    
    const updatedUser = await DBService.updateOne({
        model: UserModel,
        filter: {
            email
        },
        newData: {
            password: await generateHash({ plainText: password }),
            changeCredentialsTime: new Date(),
            $unset: {
                forgotPasswordOtp:1
            }
        }
    });
    

    return successResponse({ res, status: 201, data: {updatedUser} });
});

export const profileImage = asyncHandler(async (req, res, next) => {
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: req.user._id
        },
        data: {
            picture: req.file.finalPath
        }
    });
    successResponse({ res, data: { user } });
});

