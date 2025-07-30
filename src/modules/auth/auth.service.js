import { providerEnum, roleEnum, UserModel } from "../../models/User.model.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import * as DBService from "../../DB/db.service.js";
import { compareHash, generateHash } from "../../utils/security/hash.security.js";
import { generateEncryption } from "../../utils/security/encryption.security.js";
import { generateLoginCredentials, generateToken, getSignature, signatureTypeEnum } from "../../utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { emailEvent } from "../../utils/events/email.event.js";
import { nanoid } from "nanoid";
import { customAlphabet } from "nanoid";



export const signup = asyncHandler(async (req, res, next) => {
   
    const { fullName, email, password, phone } = req.body;
    console.log({ fullName, email, password, phone });
        
    if (await DBService.findOne({ model: UserModel, filter: { email } })) {
        return next(new Error("Email Already Exist", { cause: 409 }));
    }

    const hashPassword = await generateHash({ plainText: password });
    const encPhone = await generateEncryption({ plainText: phone });
    const otp = customAlphabet('0123456789', 6)();
    const confirmEmailOtp = await generateHash({ plainText: otp });
    const [user] = await DBService.create({
        model: UserModel, data: [
            {
                fullName, email, password: hashPassword,
                phone: encPhone,
                confirmEmailOtp
            }
        ]
    });

    emailEvent.emit("confirmEmail", { to: email, otp: otp });
    console.log(new Date(user.createdAt));
    
    return successResponse({ res, status: 201, data: { user } });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    console.log({ email, otp });
    const user = await DBService.findOne({
        model: UserModel, filter: {
            email,
            confirmEmail: { $exists: false },
            confirmEmailOtp: { $exists: true }
        }
    });
    if (!user) {
        return next(new Error("In-valid Account Or Already Verified", { cause: 404 }));
    }

   if (!await compareHash({plainText:otp,hashValue:user.confirmEmailOtp})) {
       return next(new Error("In-valid Otp"));
    }
    
    const updatedUser = await DBService.updateOne({
        model: UserModel,
        filter: { email },
        newData: {
            confirmEmail: Date.now(),
            $unset: { confirmEmailOtp: true },
            $inc: { __v: 1 }
        }
    })
    return updatedUser.matchedCount ? successResponse({ res, status: 200, data: {} }) :
        next(new Error("Fail To Confirm User Email"));
})

export const login = asyncHandler(async (req, res, next) => {
  
    const { email, password } = req.body;
    
    const user = await DBService.findOne({
        model: UserModel, filter: {
            email,
            provider: providerEnum.system
        }
    });
   
    if (!user) {
        return next(new Error("In-Valid Login Data", { cause: 404 }));
    }
    if (!user.confirmEmail) {
        return next(new Error("Please verify Your Account First"));
    }
    const match = await compareHash({ plainText: password, hashValue: user.password });
    console.log({ plainText: password, hashValue: user.password, match });

    if (!match) {
        return next(new Error("In-Valid Login Data", { cause: 404 }));
    }

    const credentials = await generateLoginCredentials({ user });
    
    return successResponse({ res, data: { credentials } });
});

async function verifyGoogleAccount({ idToken } = {}) {
    
const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_IDS.split(","),
    });
  const payload = ticket.getPayload();
    return payload;
  
}

export const signupWithGmail = asyncHandler(async (req, res, next) => {
    const { idToken } = req.body;
    const { picture, name, email, email_verified, provider } = await verifyGoogleAccount({ idToken });

    if (!email_verified) {
        return next(new Error("Not Verified Account", { cause: 400 }));
    }

    const user = await DBService.findOne({
        model: UserModel,
        filter: { email }
    });
    if (user) {
        if (user.provider===providerEnum.google) {
            const signature = await getSignature({
                signatureLevel: user.role != roleEnum.user ? signatureTypeEnum.system : signatureTypeEnum.bearer
            });

            const access_token = await generateToken({
                payLoad: { _id: user._id },
                signature: signature.accessSignature
            });
    
            const refresh_token = await generateToken({

                payLoad: { _id: user._id },
                signature: signature.refreshSignature,
                options: {
                    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
                }
            });
     
            return successResponse({ res, data: { access_token, refresh_token } });
             // OR
          //  return loginWithGmail(req, res, next);
    
        }

        return next(new Error("Email Exist", { cause: 409 }));

    }

    const [newUser] = await DBService.create({
        model: UserModel,
        data: [
            {
                fullName: name,
                email,
                picture,
                confirmEmail: Date.now(),
                provider: providerEnum.google
                
            }
        ]
    })

    const signature = await getSignature({
        signatureLevel: user.role != roleEnum.user ? signatureTypeEnum.system : signatureTypeEnum.bearer
    });


    const access_token = await generateToken({
        payLoad: { _id: user._id },
        signature: signature.accessSignature
    });
    
    const refresh_token = await generateToken({

        payLoad: { _id: user._id },
        signature: signature.refreshSignature,
        options: {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
        }
    });
     
    return successResponse({ res, data: { access_token, refresh_token } });
    
   // return successResponse({ res, status: 201, data: { user:newUser._id } });
})

export const loginWithGmail = asyncHandler(async (req, res, next) => {
    const { idToken } = req.body;
    const { email, email_verified } = await verifyGoogleAccount({ idToken });

    if (!email_verified) {
        return next(new Error("Not Verified Account", { cause: 400 }));
    }

    const user = await DBService.findOne({
        model: UserModel,
        filter: { email, provider: providerEnum.google }
    });
    if (!user) {
        return next(new Error("In-valid Login Data Or In-valid Provider", { cause: 404 }));
    }

    const signature = await getSignature({
        signatureLevel: user.role != roleEnum.user ? signatureTypeEnum.system : signatureTypeEnum.bearer
    });

    const access_token = await generateToken({
        payLoad: { _id: user._id },
        signature: signature.accessSignature
    });
    
    const refresh_token = await generateToken({

        payLoad: { _id: user._id },
        signature: signature.refreshSignature,
        options: {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
        }
    });
     
    return successResponse({ res, data: { access_token, refresh_token } });
    
});

// export const verificationCode = asyncHandler(async (req, res, next) => {

//      const { email, otp } = req.body;
//     console.log({ email, otp });
//     const user = await DBService.findOne({
//         model: UserModel, filter: {
//             email,
//             confirmEmailOtp: { $exists: true }
//         }
//     });
//     if (!user) {
//         return next(new Error("In-valid Account Or Already Verified", { cause: 404 }));
//     }

//    if (!await compareHash({plainText:otp,hashValue:user.confirmEmailOtp})) {
//        return next(new Error("In-valid Otp"));
//     }
    
//     const newOtp = customAlphabet("012346789", 8)();
//     console.log(user.createdAt);
//     console.log(new Date(Date.now()));

//     console.log(Math.floor((new Date(Date.now()) - user.createdAt) / (60 * 1000)));
    
//     const checkMinutesExpiry = Math.floor((new Date(Date.now()) - user.createdAt) / (60 * 1000));
//     if (checkMinutesExpiry < 2) {
//         return next(new Error("Please Try After Some Time"));
//     }

//     emailEvent.emit("confirmEmail", { to: email, otp: newOtp });

//     successResponse({ res });
// });