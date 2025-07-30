import joi from 'joi';

export const login = joi.object().keys({
  
    email: joi.string().email({ minDomainSegments: 1, maxDomainSegments: 3, tlds: { allow: ['net', 'com', 'edu'] } }).required(),
    password: joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)).required(),
    
}).required().options({ allowUnknown: false });

export const signup = login.append({
    // fullName: joi.string().empty().default("JON DOE"),
    fullName: joi.string().min(2).max(20).required(),
    phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)).required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required(),
    
}).required().options({ allowUnknown: false });
