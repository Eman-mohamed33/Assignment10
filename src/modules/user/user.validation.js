import { generalFields } from "../../middleware/validation.middleware.js";
import joi from 'joi';
import { logoutEnum } from "../../utils/security/token.security.js";

export const shareProfile = {
    params: joi.object().keys({
        userId: generalFields.id.required()
    }).required()
};

export const logout = {
    body: joi.object().keys({
        flag: joi.string().valid(...Object.keys(logoutEnum)).default(logoutEnum.stayLoggedIn)
    }).required()
};

export const updateBasicInfo = {
    body: joi.object().keys({
        fullName: generalFields.fullName,
        phone: generalFields.phone,
        gender: generalFields.gender
    }).required(),

};

export const freezeAccount = {
    params: joi.object().keys({
        userId: generalFields.id
    }).required()
};

export const restoreAccount = {
    params: joi.object().keys({
        userId: generalFields.id.required()
    }).required()
};

export const deleteAccount = {
    params: joi.object().keys({
        userId: generalFields.id.required()
    }).required()
};

export const updatePassword = {
    body: logout.body.append({
        oldPassword: generalFields.password.required(),
        password: generalFields.password.not(joi.ref("oldPassword")).required(),
        confirmPassword: generalFields.confirmPassword.required()
    }).required()

};


export const sendForgotPassword = {
    body: joi.object().keys({
        email: generalFields.email.required()
    })
};

export const verifyForgotPassword = {
    body: sendForgotPassword.body.append({
        otp: generalFields.otp.required()
    }).required()
};

export const resetPassword = {
    body: verifyForgotPassword.body.append({
        password: generalFields.password.required(),
        confirmPassword: generalFields.confirmPassword.required()
    }).required()
};