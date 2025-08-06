import { Types } from "mongoose";
import { asyncHandler } from "../utils/response.js"
import joi from 'joi';
import { genderEnum } from "../models/User.model.js";

export const generalFields = {
    email: joi.string().email({ minDomainSegments: 1, maxDomainSegments: 3, tlds: { allow: ['net', 'com', 'edu'] } }),
    password: joi.string().pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*()_.]).{8,16}$/)),
    fullName: joi.string().pattern(new RegExp(/^[A-Z][a-z]{1,19}\s{1}[A-Z][a-z]{1,19}$/)).min(2).max(20),
    phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125]\d{8}$/)),
    confirmPassword: joi.string().valid(joi.ref("password")),
    otp: joi.string().pattern(new RegExp(/^\d{6}$/)),
    id: joi.string().custom((value, helper) => {
        console.log(helper);
        console.log(value);
        console.log(Types.ObjectId.isValid(value));
        return Types.ObjectId.isValid(value) || helper.message("In-valid ObjectId");
    }),
    gender: joi.string().valid(...Object.values(genderEnum)),
    
                
};

export const validation = (schema) => {
    return asyncHandler(async (req, res, next) => {
        console.log(schema);
        console.log(Object.keys(schema));
     
        const validationError = [];

        for (const key of Object.keys(schema)) {
            console.log(key);
            console.log(schema[key]);
            console.log(req[key]);
            const validationResult = schema[key].validate(req[key], { abortEarly: false });
        if (validationResult.error) {
            validationError.push({
                key, details: validationResult.error.details.map(ele => {
                    return { message: ele.message, path: ele.path[0] }
                })
            });
        }}
        
        if (validationError.length) {
            return res.status(400).json({ err_message: "Validation Error", validationError });
        }

        return next();
    })
};