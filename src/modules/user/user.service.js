import { asyncHandler, successResponse } from "../../utils/response.js";
import * as DBService from "../../DB/db.service.js";
import { decryptEncryption } from "../../utils/security/encryption.security.js";
import { compareHash, generateHash } from "../../utils/security/hash.security.js";
import { generateLoginCredentials } from "../../utils/security/token.security.js";
import { UserModel } from "../../models/User.model.js";

export const profile = asyncHandler(async (req, res, next) => {
    
    req.user.phone = await decryptEncryption({
        cipherText: req.user.phone,
    });

    return successResponse({
        res, data: { user: req.user }
    });
    
    
});

export const updatePassword = asyncHandler(async (req, res, next) => {

    const { email, oldPassword, newPassword } = req.body;
    const user = await DBService.findOne({
        model: UserModel,
        filter: { email }
    });
    console.log({ oldPassword, newPassword });

    if (!user) {
        return next(new Error("In-Valid Email", { cause: 404 }));
    }
  
    if (!compareHash({plainText:oldPassword,hashValue:user.password})) {
        return next(new Error("The password is incorrect"));
    };

    const Password = await generateHash({
        plainText: newPassword
    });
    console.log({Password});
 
    const UpdateUser = await DBService.updateOne({
        model: UserModel,
        filter: { email },
        newData: { password: Password }
    });
    
    return successResponse({ res, status: 201, data: { UpdateUser }, message: "Your Password Has Been Updated" });
})

export const getNewLoginCredentials = asyncHandler(async (req, res, next) => {

    const credentials = await generateLoginCredentials({ user: req.user });


    return successResponse({ res, data: { credentials } });
});




