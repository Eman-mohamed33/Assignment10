import joi from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js';

export const login = {
    body: joi.object().keys({
  
        email: generalFields.email.required(),
        password: generalFields.password.required(),
    
    }).required().options({ allowUnknown: false })
};

export const signup = {
    body: login.body.append({
        // fullName: joi.string().empty().default("JON DOE"),
        fullName: generalFields.fullName.required(),
        phone: generalFields.phone.required(),
        confirmPassword: generalFields.confirmPassword.required(),
    
    }).required().options({ allowUnknown: false }),
    
    // query: joi.object().keys({
    //     lang: joi.string().valid('ar', 'en').required()
    // }).required().options({ allowUnknown: false })

};

export const confirmEmail = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        otp: generalFields.otp.required()
    }).required().options({ allowUnknown: false }),
  
};

export const loginWithGmail = {
    body: joi.object().keys({
        idToken: joi.string().required()
    }).required().options({ allowUnknown: false }),
};
